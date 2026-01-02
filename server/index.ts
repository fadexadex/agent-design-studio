import { config } from 'dotenv';

// Load environment variables from .env.local FIRST
config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import { AgentOrchestrator, AgentProgress, AgentThought } from './agent/orchestrator';

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Check if API key is loaded
console.log('🔑 GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'Yes (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'No');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Job storage with detailed progress
interface JobData {
  status: 'pending' | 'generating' | 'rendering' | 'complete' | 'error';
  progress: string;
  agentProgress?: AgentProgress;
  videoPath?: string;
  error?: string;
  createdAt: Date;
}

const jobs = new Map<string, JobData>();

// Generate unique job ID
const generateJobId = () => `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// API Routes

/**
 * POST /api/generate
 * Start video generation with brand context and video config
 */
app.post('/api/generate', async (req, res) => {
  const { brand, config } = req.body;

  if (!brand || !config) {
    return res.status(400).json({ error: 'Missing brand or config data' });
  }

  const jobId = generateJobId();
  jobs.set(jobId, {
    status: 'pending',
    progress: '🚀 Initializing AI agent...',
    agentProgress: {
      stage: 'reasoning',
      message: 'Starting up',
      thought: { type: 'reason', content: 'Initializing agent orchestration...', timestamp: new Date() }
    },
    createdAt: new Date()
  });

  // Start async generation
  (async () => {
    try {
      const orchestrator = new AgentOrchestrator();

      // Update progress callback with detailed agent progress including thoughts
      const onProgress = (message: string, status: 'generating' | 'rendering', detail?: AgentProgress) => {
        const job = jobs.get(jobId);
        if (job) {
          job.status = status;
          job.progress = message;
          if (detail) {
            job.agentProgress = detail;
          }
        }
      };

      const videoPath = await orchestrator.generateVideo(brand, config, onProgress);

      const job = jobs.get(jobId);
      if (job) {
        job.status = 'complete';
        job.progress = '✨ Video ready!';
        job.videoPath = videoPath;
        job.agentProgress = {
          stage: 'observing',
          message: 'Your motion design video is complete',
          thought: { type: 'observe', content: 'Video generation completed successfully!', timestamp: new Date() }
        };
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.error = error.message || 'Unknown error occurred';
        job.agentProgress = {
          stage: 'observing',
          message: 'Error occurred',
          detail: error.message,
          thought: { type: 'observe', content: `Error: ${error.message}`, timestamp: new Date() }
        };
      }
    }
  })();

  res.json({ jobId });
});

/**
 * GET /api/status/:jobId
 * Check the status of a generation job
 */
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Convert Date objects to ISO strings for JSON serialization
  const agentProgress = job.agentProgress ? {
    ...job.agentProgress,
    thought: job.agentProgress.thought ? {
      ...job.agentProgress.thought,
      timestamp: job.agentProgress.thought.timestamp instanceof Date
        ? job.agentProgress.thought.timestamp.toISOString()
        : job.agentProgress.thought.timestamp
    } : undefined,
    thoughts: job.agentProgress.thoughts?.map(t => ({
      ...t,
      timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp
    }))
  } : undefined;

  res.json({
    status: job.status,
    progress: job.progress,
    agentProgress,
    error: job.error,
    videoUrl: job.videoPath ? `/api/video/${jobId}` : undefined
  });
});

/**
 * GET /api/video/:jobId
 * Stream the rendered video file
 */
app.get('/api/video/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job || !job.videoPath) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.sendFile(job.videoPath);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Agent Design Studio Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});

export default app;
