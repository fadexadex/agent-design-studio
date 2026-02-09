/**
 * Director Routes - API endpoints for the Director-Agent architecture
 * 
 * Provides endpoints for:
 * - Starting video generation projects via the Director queue
 * - Getting project status from Redis state
 * - Retrieving completed videos
 * 
 * Real-time updates are streamed via SSE at /api/events/:projectId
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

import { getRedisConnection } from '../../queues/redisConnection.js';
import { queueStartProject } from '../../agents/director/DirectorWorker.js';
import { 
  getStateRedisKey, 
  deserializeState,
  getScenesInOrder,
} from '../../agents/director/DirectorState.js';
import { BrandContext } from '../../agents/types.js';

const router = Router();

// ============================================================================
// Types
// ============================================================================

interface StartProjectRequest {
  /** Brand context for video generation */
  brand: {
    name: string;
    industry?: string;
    tagline?: string;
    colors: {
      primary: string;
      secondary?: string;
      accent?: string;
      background?: string;
    };
    logo?: string;
    style?: 'minimal' | 'bold' | 'elegant' | 'playful' | 'corporate' | 'dynamic';
    aspectRatio: '16:9' | '9:16';
    prompt: string;
  };
  /** Optional configuration */
  config?: {
    maxGlobalIterations?: number;
    targetScore?: number;
  };
}

interface ProjectStatus {
  projectId: string;
  phase: string;
  progress: {
    currentPhase: string;
    scenesTotal: number;
    scenesCompleted: number;
    globalIteration: number;
    maxGlobalIterations: number;
  };
  scenes: Array<{
    id: string;
    title: string;
    status: string;
    version: number;
    score: number | null;
  }>;
  globalEvaluation: {
    score: number;
    narrativeCohesion: number;
    brandConsistency: number;
  } | null;
  error: {
    message: string;
    code: string;
    recoverable: boolean;
  } | null;
  output: {
    videoPath: string | null;
    completedAt: number | null;
  };
  timestamps: {
    createdAt: number;
    updatedAt: number;
  };
}

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/director/start
 * 
 * Start a new video generation project using the Director-Agent architecture.
 * Returns immediately with a projectId. Use SSE at /api/events/:projectId for real-time updates.
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const body = req.body as StartProjectRequest;
    
    // Validate request
    if (!body.brand) {
      res.status(400).json({ error: 'Missing required field: brand' });
      return;
    }

    if (!body.brand.name || !body.brand.colors?.primary || !body.brand.prompt) {
      res.status(400).json({ 
        error: 'Missing required brand fields: name, colors.primary, and prompt are required' 
      });
      return;
    }

    if (!body.brand.aspectRatio || !['16:9', '9:16'].includes(body.brand.aspectRatio)) {
      res.status(400).json({ error: 'Invalid aspectRatio: must be "16:9" or "9:16"' });
      return;
    }

    // Generate project ID
    const projectId = uuidv4();

    // Build brand context
    const brandContext: BrandContext = {
      name: body.brand.name,
      industry: body.brand.industry,
      tagline: body.brand.tagline,
      colors: body.brand.colors,
      logo: body.brand.logo,
      style: body.brand.style || 'dynamic',
      aspectRatio: body.brand.aspectRatio,
      prompt: body.brand.prompt,
    };

    // Queue the START_PROJECT command
    const jobId = await queueStartProject(
      projectId,
      brandContext as unknown as Record<string, unknown>,
      body.config
    );

    console.log(`[Director API] Started project ${projectId} (job: ${jobId})`);

    res.status(201).json({
      projectId,
      jobId,
      message: 'Project started. Use /api/events/:projectId for real-time updates.',
      links: {
        status: `/api/director/${projectId}/status`,
        events: `/api/events/${projectId}`,
        video: `/api/director/${projectId}/video`,
      },
    });
  } catch (error) {
    console.error('[Director API] Error starting project:', error);
    res.status(500).json({ 
      error: 'Failed to start project',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/director/:projectId/status
 * 
 * Get the current status of a project from Redis state.
 */
router.get('/:projectId/status', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      res.status(400).json({ error: 'Missing projectId' });
      return;
    }

    const redis = getRedisConnection();
    const key = getStateRedisKey(projectId);
    const data = await redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const state = deserializeState(data);
    const scenes = getScenesInOrder(state);

    // Count completed scenes
    const completedStatuses = ['passed', 'rendered'];
    const scenesCompleted = scenes.filter(s => 
      completedStatuses.includes(s.status)
    ).length;

    const status: ProjectStatus = {
      projectId: state.projectId,
      phase: state.phase,
      progress: {
        currentPhase: state.phase,
        scenesTotal: scenes.length,
        scenesCompleted,
        globalIteration: state.globalIteration,
        maxGlobalIterations: state.maxGlobalIterations,
      },
      scenes: scenes.map(scene => ({
        id: scene.definition.id,
        index: scene.definition.index,
        sceneNumber: scene.definition.index + 1,
        title: scene.definition.title,
        status: scene.status,
        version: scene.version,
        score: scene.scoreHistory.length > 0
          ? scene.scoreHistory[scene.scoreHistory.length - 1]
          : null,
      })),
      globalEvaluation: state.globalEvaluation ? {
        score: state.globalEvaluation.score,
        narrativeCohesion: state.globalEvaluation.narrativeCohesion,
        brandConsistency: state.globalEvaluation.brandConsistency,
      } : null,
      error: state.error ? {
        message: state.error.message,
        code: state.error.code,
        recoverable: state.error.recoverable,
      } : null,
      output: {
        videoPath: state.outputPath || null,
        completedAt: state.completedAt || null,
      },
      timestamps: {
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      },
    };

    res.json(status);
  } catch (error) {
    console.error('[Director API] Error getting status:', error);
    res.status(500).json({ 
      error: 'Failed to get project status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/director/:projectId/video
 * 
 * Get the rendered video for a completed project.
 * Returns 404 if not ready, streams the video file if complete.
 */
router.get('/:projectId/video', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      res.status(400).json({ error: 'Missing projectId' });
      return;
    }

    const redis = getRedisConnection();
    const key = getStateRedisKey(projectId);
    const data = await redis.hgetall(key);

    // Try to get video path from Redis state first
    let videoPath: string | null = null;

    if (data && Object.keys(data).length > 0) {
      const state = deserializeState(data);

      if (state.phase !== 'completed') {
        res.status(404).json({ 
          error: 'Video not ready',
          phase: state.phase,
          message: state.phase === 'failed' 
            ? 'Project failed: ' + (state.error?.message || 'Unknown error')
            : 'Project is still in progress',
        });
        return;
      }

      videoPath = state.outputPath || null;
    }

    // Fallback: check if video file exists on disk (for when Redis state expires)
    if (!videoPath) {
      const fallbackPath = path.join(process.cwd(), 'output', 'final', projectId, 'video.mp4');
      if (fs.existsSync(fallbackPath)) {
        videoPath = fallbackPath;
      }
    }

    if (!videoPath) {
      res.status(404).json({ 
        error: 'Video not found',
        message: 'Video file does not exist for this project',
      });
      return;
    }
    
    if (!fs.existsSync(videoPath)) {
      res.status(404).json({ 
        error: 'Video file not found',
        message: 'Video file does not exist at expected path',
      });
      return;
    }

    // Get file stats
    const stats = fs.statSync(videoPath);
    const fileSize = stats.size;
    const fileName = path.basename(videoPath);

    // Set headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Accept-Ranges', 'bytes');

    // Handle range requests for video seeking
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);

      const stream = fs.createReadStream(videoPath, { start, end });
      stream.pipe(res);
    } else {
      // Stream full file
      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('[Director API] Error streaming video:', error);
    res.status(500).json({ 
      error: 'Failed to stream video',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/director/:projectId
 * 
 * Cancel and clean up a project.
 */
router.delete('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      res.status(400).json({ error: 'Missing projectId' });
      return;
    }

    const redis = getRedisConnection();
    const key = getStateRedisKey(projectId);

    // Check if project exists
    const exists = await redis.exists(key);
    
    if (!exists) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Delete the state
    await redis.del(key);

    // Also delete the event stream
    const { STREAM_KEYS } = await import('../../events/types.js');
    const streamKey = STREAM_KEYS.projectEvents(projectId);
    await redis.del(streamKey);

    console.log(`[Director API] Deleted project ${projectId}`);

    res.json({ 
      success: true, 
      message: 'Project deleted',
      projectId,
    });
  } catch (error) {
    console.error('[Director API] Error deleting project:', error);
    res.status(500).json({ 
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/director/health
 * 
 * Health check for the Director-Agent system.
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const { getWorkersHealth } = await import('../../workers/startWorkers.js');
    const { getConnectionStatus } = await import('../../queues/redisConnection.js');

    const workersHealth = getWorkersHealth();
    const redisStatus = getConnectionStatus();

    const isHealthy = 
      workersHealth.started && 
      !workersHealth.shuttingDown &&
      redisStatus.main !== 'disconnected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      workers: workersHealth,
      redis: redisStatus,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    });
  }
});

export default router;
