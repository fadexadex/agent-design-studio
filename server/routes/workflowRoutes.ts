import { Router } from 'express';
import { WorkflowOrchestrator, createOrchestrator } from '../workflow/WorkflowOrchestrator';
import { WorkflowState } from '../workflow/state';

const router = Router();

// Export the orchestrator map so the editor can access workflow states
export const orchestratorMap = new Map<string, WorkflowOrchestrator>();

// === 1. Start Workflow ===
router.post('/start', async (req, res) => {
    try {
        const { jobId, brand, config, script } = req.body;

        if (!jobId || !brand || !config) {
            return res.status(400).json({ error: 'Missing required fields: jobId, brand, config' });
        }

        // Script with scenes is REQUIRED - the workflow uses the provided scenes
        if (!script || !script.scenes || !Array.isArray(script.scenes) || script.scenes.length === 0) {
            return res.status(400).json({
                error: 'Missing required field: script. You must provide a script with scenes from /api/generate-script first.'
            });
        }

        if (orchestratorMap.has(jobId)) {
            return res.status(409).json({ error: 'Job ID already exists' });
        }

        const orchestrator = createOrchestrator();
        orchestratorMap.set(jobId, orchestrator);

        // Start the workflow asynchronously with the provided script
        orchestrator.start(jobId, brand, config, script).catch(err => {
            console.error(`[Workflow Route] Unhandled error in workflow ${jobId}:`, err);
        });

        res.json({ jobId, status: 'started' });
    } catch (error: any) {
        console.error('Error starting workflow:', error);
        res.status(500).json({ error: error.message });
    }
});

// === 2. SSE Stream ===
router.get('/:jobId/stream', (req, res) => {
    const { jobId } = req.params;
    const orchestrator = orchestratorMap.get(jobId);

    if (!orchestrator) {
        return res.status(404).json({ error: 'Workflow not found' });
    }

    // Set SSE Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Event Handlers
    const onStateUpdate = (state: WorkflowState) => sendEvent('stateUpdate', state);
    const onPhaseStart = (phase: string, state: WorkflowState) => sendEvent('phaseStart', { phase, state });
    const onPhaseComplete = (phase: string, result: any) => sendEvent('phaseComplete', { phase, result });
    const onThought = (thought: any) => sendEvent('thought', thought);
    const onProgress = (message: string, detail?: string) => sendEvent('progress', { message, detail });
    const onSceneProgress = (status: any) => sendEvent('sceneProgress', status);
    const onRenderProgress = (data: { progress: number }) => sendEvent('renderProgress', data);
    const onError = (error: Error) => sendEvent('error', { message: error.message });
    const onComplete = (state: WorkflowState) => {
        sendEvent('complete', state);
        res.end();
    };

    // Attach Listeners
    orchestrator.on('stateUpdate', onStateUpdate);
    orchestrator.on('phaseStart', onPhaseStart);
    orchestrator.on('phaseComplete', onPhaseComplete);
    orchestrator.on('thought', onThought);
    orchestrator.on('progress', onProgress);
    orchestrator.on('sceneProgress', onSceneProgress);
    orchestrator.on('renderProgress', onRenderProgress);
    orchestrator.on('error', onError);
    orchestrator.on('complete', onComplete);

    // Send initial state immediately if available
    const currentState = orchestrator.getState();
    if (currentState) {
        onStateUpdate(currentState);
    }

    // Cleanup on close
    req.on('close', () => {
        orchestrator.off('stateUpdate', onStateUpdate);
        orchestrator.off('phaseStart', onPhaseStart);
        orchestrator.off('phaseComplete', onPhaseComplete);
        orchestrator.off('thought', onThought);
        orchestrator.off('progress', onProgress);
        orchestrator.off('sceneProgress', onSceneProgress);
        orchestrator.off('renderProgress', onRenderProgress);
        orchestrator.off('error', onError);
        orchestrator.off('complete', onComplete);
    });
});

// === 3. User Feedback ===
router.post('/:jobId/feedback', async (req, res) => {
    const { jobId } = req.params;
    const { action, message, targetPhase, modifications } = req.body;

    const orchestrator = orchestratorMap.get(jobId);

    if (!orchestrator) {
        return res.status(404).json({ error: 'Workflow not found' });
    }

    if (!orchestrator.getIsPaused()) {
        return res.status(400).json({ error: 'Workflow is not paused or awaiting feedback' });
    }

    try {
        // This will resume the workflow loop
        await orchestrator.handleUserFeedback({
            action,
            message,
            targetPhase,
            modifications
        });

        res.json({ success: true, message: 'Feedback received, workflow resuming' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// === 4. Continue (General Resume) ===
/**
 * Generic continue endpoint if we pause for other reasons later.
 * For now, mostly alias to feedback with 'approve' if awaiting feedback.
 */
router.post('/:jobId/continue', async (req, res) => {
    const { jobId } = req.params;
    const orchestrator = orchestratorMap.get(jobId);

    if (!orchestrator) {
        return res.status(404).json({ error: 'Workflow not found' });
    }

    if (orchestrator.getIsPaused()) {
        try {
            // Default to approve if just "continue" is called
            await orchestrator.handleUserFeedback({ action: 'approve' });
            return res.json({ success: true, message: 'Workflow resumed' });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    res.status(400).json({ error: 'Workflow is not paused' });
});

// === 5. List Checkpoints ===
router.get('/:jobId/checkpoints', (req, res) => {
    const { jobId } = req.params;
    const orchestrator = orchestratorMap.get(jobId);

    if (!orchestrator) {
        return res.status(404).json({ error: 'Workflow not found' });
    }

    const state = orchestrator.getState();
    if (!state) {
        return res.status(400).json({ error: 'Workflow has no state' });
    }

    // Return the history array as checkpoints
    // In a real DB scenario, we might query a "checkpoints" table
    res.json({ checkpoints: state.checkpoints });
});

// === 6. Restore Checkpoint ===
router.post('/:jobId/checkpoint/:checkpointId/restore', (req, res) => {
    // TODO: Implement actual restore logic. 
    // Currently the state history tracks past states, so we could theoretically rollback.
    // This would likely involve:
    // 1. Finding the state in state.history matching the ID
    // 2. Setting orchestrator.state to that state
    // 3. Ensuring the orchestrator resumes correctly from that phase

    res.status(501).json({ error: 'Not implemented' });
});

export default router;
