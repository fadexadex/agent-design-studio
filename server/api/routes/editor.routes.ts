/**
 * Editor Routes
 * 
 * API endpoints for the scene editor functionality.
 */

import { Router, Request, Response } from 'express';
import {
  getEditorOrchestrator,
  removeEditorOrchestrator,
  EditorState,
  EditRequest,
  AddSceneRequest,
  ReorderRequest,
  TrimRequest,
  RevertRequest,
} from '../../core/editor';
import { WorkflowOrchestrator } from '../../core/workflow/WorkflowOrchestrator';

const router = Router();

// Store reference to workflow orchestrators (passed from main server)
let workflowOrchestratorMap: Map<string, WorkflowOrchestrator>;

/**
 * Initialize the editor routes with access to workflow orchestrators.
 */
export function initEditorRoutes(orchestratorMap: Map<string, WorkflowOrchestrator>): Router {
  workflowOrchestratorMap = orchestratorMap;
  return router;
}

// ============================================================================
// GET /api/editor/:jobId/state - Load or initialize editor state
// ============================================================================
router.get('/:jobId/state', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const orchestrator = getEditorOrchestrator(jobId);

    // Try to load existing state first
    let state: EditorState;
    try {
      state = await orchestrator.loadState();
    } catch {
      // No persisted state - need workflow state to initialize
      const workflowOrchestrator = workflowOrchestratorMap?.get(jobId);
      const workflowState = workflowOrchestrator?.getState();

      if (!workflowState) {
        return res.status(404).json({
          error: 'No editor state or workflow found for this job ID'
        });
      }

      if (workflowState.currentPhase !== 'complete') {
        return res.status(400).json({
          error: 'Workflow is not complete. Editor can only be opened for completed videos.'
        });
      }

      state = await orchestrator.loadState(workflowState);
    }

    res.json(state);
  } catch (error) {
    console.error('Error loading editor state:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// GET /api/editor/:jobId/stream - SSE stream for real-time updates
// ============================================================================
router.get('/:jobId/stream', (req: Request, res: Response) => {
  const { jobId } = req.params;

  const orchestrator = getEditorOrchestrator(jobId);

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Add client to orchestrator
  orchestrator.addSSEClient(res);

  // Send initial state if available
  const state = orchestrator.getState();
  if (state) {
    res.write(`data: ${JSON.stringify({ type: 'stateSync', state })}\n\n`);
  }

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
    orchestrator.removeSSEClient(res);
  });
});

// ============================================================================
// POST /api/editor/:jobId/edit - Edit selected scene(s)
// ============================================================================
router.post('/:jobId/edit', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { sceneIds, prompt } = req.body as EditRequest;

    if (!sceneIds || !Array.isArray(sceneIds) || sceneIds.length === 0) {
      return res.status(400).json({ error: 'sceneIds array is required' });
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'prompt string is required' });
    }

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    // Start edit process (runs async, progress via SSE)
    orchestrator.processEdit(sceneIds, prompt.trim()).catch(err => {
      console.error('Edit process error:', err);
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error starting edit:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/editor/:jobId/scenes - Add a new scene
// ============================================================================
router.post('/:jobId/scenes', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { afterSceneId, prompt } = req.body as AddSceneRequest;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'prompt string is required' });
    }

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    // Start add scene process (runs async, progress via SSE)
    orchestrator.addScene(afterSceneId, prompt.trim()).catch(err => {
      console.error('Add scene error:', err);
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding scene:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// DELETE /api/editor/:jobId/scenes/:sceneId - Delete a scene
// ============================================================================
router.delete('/:jobId/scenes/:sceneId', async (req: Request, res: Response) => {
  try {
    const { jobId, sceneId } = req.params;

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    await orchestrator.deleteScene(sceneId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scene:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/editor/:jobId/reorder - Reorder scenes
// ============================================================================
router.post('/:jobId/reorder', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { sceneOrder } = req.body as ReorderRequest;

    if (!sceneOrder || !Array.isArray(sceneOrder) || sceneOrder.length === 0) {
      return res.status(400).json({ error: 'sceneOrder array is required' });
    }

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    await orchestrator.reorderScenes(sceneOrder);

    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering scenes:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/editor/:jobId/trim - Trim a scene's duration
// ============================================================================
router.post('/:jobId/trim', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { sceneId, frameRange } = req.body as TrimRequest;

    if (!sceneId) {
      return res.status(400).json({ error: 'sceneId is required' });
    }

    if (!frameRange || typeof frameRange.start !== 'number' || typeof frameRange.end !== 'number') {
      return res.status(400).json({ error: 'frameRange with start and end is required' });
    }

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    await orchestrator.trimScene(sceneId, frameRange);

    res.json({ success: true });
  } catch (error) {
    console.error('Error trimming scene:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/editor/:jobId/revert - Revert a scene to a previous version
// ============================================================================
router.post('/:jobId/revert', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { sceneId, versionId } = req.body as RevertRequest;

    if (!sceneId || !versionId) {
      return res.status(400).json({ error: 'sceneId and versionId are required' });
    }

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    await orchestrator.revertScene(sceneId, versionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error reverting scene:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/editor/:jobId/undo - Undo the last operation
// ============================================================================
router.post('/:jobId/undo', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    const operation = await orchestrator.undo();

    if (!operation) {
      return res.status(400).json({ error: 'Nothing to undo' });
    }

    res.json({ success: true, operation });
  } catch (error) {
    console.error('Error undoing:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/editor/:jobId/redo - Redo the last undone operation
// ============================================================================
router.post('/:jobId/redo', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    const operation = await orchestrator.redo();

    if (!operation) {
      return res.status(400).json({ error: 'Nothing to redo' });
    }

    res.json({ success: true, operation });
  } catch (error) {
    console.error('Error redoing:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// POST /api/editor/:jobId/export - Start final video export
// ============================================================================
router.post('/:jobId/export', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const orchestrator = getEditorOrchestrator(jobId);

    if (!orchestrator.getState()) {
      return res.status(400).json({ error: 'Editor not initialized. Call GET /state first.' });
    }

    // Start export process (runs async, progress via SSE)
    orchestrator.exportVideo().catch(err => {
      console.error('Export error:', err);
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error starting export:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ============================================================================
// GET /api/editor/:jobId/export/status - Get export progress
// ============================================================================
router.get('/:jobId/export/status', (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const orchestrator = getEditorOrchestrator(jobId);
    const state = orchestrator.getState();

    if (!state) {
      return res.status(400).json({ error: 'Editor not initialized' });
    }

    res.json({
      status: state.exportStatus,
      progress: state.exportProgress,
      videoPath: state.exportedVideoPath,
    });
  } catch (error) {
    console.error('Error getting export status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
