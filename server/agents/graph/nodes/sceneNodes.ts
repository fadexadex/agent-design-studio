import { GenerationService } from '../services/GenerationService.js';
import { RenderService } from '../services/RenderService.js';
import { EvaluationService } from '../services/EvaluationService.js';
import { EventBridge } from '../services/EventBridge.js';
import { SceneStateAnnotation, SceneState } from '../state/SceneState.js';

/**
 * Generate a unique agent ID for a scene
 */
const getAgentId = (sceneId: string, sceneIndex: number): string => {
  return `scene-agent-${sceneIndex}-${sceneId.slice(0, 8)}`;
};

/**
 * Get a human-readable scene name
 * Truncates at word boundaries to avoid cutting words mid-way
 */
const getSceneName = (sceneIndex: number, prompt: string): string => {
  if (!prompt?.trim()) {
    return `Scene ${sceneIndex + 1}`;
  }
  
  const maxLength = 40;
  const trimmedPrompt = prompt.trim();
  
  // If short enough, use as-is
  if (trimmedPrompt.length <= maxLength) {
    return `Scene ${sceneIndex + 1}: ${trimmedPrompt}`;
  }
  
  // Find last space before maxLength to avoid cutting words
  const truncated = trimmedPrompt.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // If we found a space, cut there; otherwise use full truncated text
  const shortPrompt = lastSpaceIndex > 10 
    ? truncated.slice(0, lastSpaceIndex) 
    : truncated;
  
  return `Scene ${sceneIndex + 1}: ${shortPrompt}...`;
};

export const generateSceneNode = async (state: typeof SceneStateAnnotation.State) => {
  console.log(`[Graph:Scene] Generating scene ${state.sceneIndex} v${state.version + 1} (Attempt ${state.attempts + 1})`);
  
  const startTime = Date.now();
  const agentId = getAgentId(state.sceneId, state.sceneIndex);
  const sceneName = getSceneName(state.sceneIndex, state.prompt);
  
  // Build scene state object for events
  const sceneForEvents: SceneState = {
    projectId: state.projectId,
    sceneId: state.sceneId,
    sceneIndex: state.sceneIndex,
    version: state.version + 1, // Next version
    prompt: state.prompt,
    brandContext: state.brandContext,
    durationFrames: state.durationFrames,
    status: 'generating',
    attempts: state.attempts + 1,
    code: state.code,
  };

  try {
    // Emit agent spawned event (only on first attempt)
    if (state.attempts === 0) {
      await EventBridge.agentSpawned(
        state.projectId,
        agentId,
        state.sceneIndex,
        sceneName,
        'director' // Parent is always the director
      );
    }

    // Emit agent thinking - analyzing the task
    await EventBridge.agentThinking(
      state.projectId,
      agentId,
      state.attempts === 0 
        ? `Analyzing scene requirements: "${state.prompt.slice(0, 100)}..."`
        : `Refining scene based on feedback: "${state.feedback?.slice(0, 80) || 'improving quality'}..."`,
      false
    );

    // Emit agent action - generating code
    await EventBridge.agentAction(
      state.projectId,
      agentId,
      'generating_code',
      `Creating Remotion composition v${state.version + 1}`,
      0
    );

    // Emit scene generating event (legacy event for compatibility)
    await EventBridge.sceneGenerating(sceneForEvents);

    const nextVersion = state.version + 1;
    const result = await GenerationService.generateScene(
      state.projectId,
      state.sceneId,
      state.sceneIndex,
      nextVersion,
      state.prompt,
      state.brandContext,
      state.code, // Pass previous code for context if refining
      state.feedback // Pass previous feedback if refining
    );

    const durationMs = Date.now() - startTime;

    // Update scene state for event
    sceneForEvents.code = result.code;
    
    // Emit agent action - validating code
    await EventBridge.agentAction(
      state.projectId,
      agentId,
      'validating_code',
      'Code generated, preparing for render',
      100
    );

    // Emit scene generated event (legacy event for compatibility)
    await EventBridge.sceneGenerated(sceneForEvents, durationMs);

    return {
      code: result.code,
      version: nextVersion,
      attempts: state.attempts + 1,
      status: 'generating' as const,
      // Clear previous error/decision if retrying
      failureReason: undefined,
      lastDecision: undefined,
    };
  } catch (error) {
    console.error(`[Graph:Scene] Generation failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Emit agent error
    await EventBridge.agentError(
      state.projectId,
      agentId,
      errorMessage,
      'generating_code',
      state.attempts < 2 // Recoverable if we haven't hit max attempts
    );

    // Emit scene error event (legacy)
    await EventBridge.sceneError(
      sceneForEvents,
      errorMessage,
      'generation'
    );

    // Emit agent completed with failure
    await EventBridge.agentCompleted(
      state.projectId,
      agentId,
      Date.now() - startTime,
      'failed',
      `Generation failed: ${errorMessage}`
    );

    return {
      status: 'failed' as const,
      failureReason: errorMessage,
      lastDecision: 'fail' as const,
    };
  }
};

export const renderSceneNode = async (state: typeof SceneStateAnnotation.State) => {
  console.log(`[Graph:Scene] Rendering scene ${state.sceneIndex} v${state.version}`);
  
  const startTime = Date.now();
  const agentId = getAgentId(state.sceneId, state.sceneIndex);

  // Build scene state object for events
  const sceneForEvents: SceneState = {
    projectId: state.projectId,
    sceneId: state.sceneId,
    sceneIndex: state.sceneIndex,
    version: state.version,
    prompt: state.prompt,
    brandContext: state.brandContext,
    durationFrames: state.durationFrames,
    status: 'rendering',
    attempts: state.attempts,
    code: state.code,
  };

  try {
    if (!state.code) throw new Error('No code to render');

    // Emit agent action - rendering
    await EventBridge.agentAction(
      state.projectId,
      agentId,
      'rendering_scene',
      `Rendering ${state.durationFrames || 150} frames`,
      0
    );

    // Emit scene rendering event (legacy)
    await EventBridge.sceneRendering(sceneForEvents);

    // Also emit render started for more detailed tracking
    await EventBridge.renderStarted(state.projectId, 'scene', state.sceneId);

    const result = await RenderService.renderScene(
      state.projectId,
      state.sceneId,
      state.sceneIndex,
      state.version,
      state.durationFrames || 150, // Default if missing
      '16:9' // TODO: Get from brand context or state
    );

    const durationMs = Date.now() - startTime;

    // Update scene state for event - use absolute path for backend storage
    sceneForEvents.videoPath = result.videoPath;

    // Emit agent action complete
    await EventBridge.agentAction(
      state.projectId,
      agentId,
      'rendering_scene',
      'Render complete',
      100
    );

    // Emit scene rendered event (legacy)
    await EventBridge.sceneRendered(sceneForEvents, durationMs);

    // Emit preview ready event for the cooking preview panel - use URL for frontend
    const durationSeconds = (state.durationFrames || 150) / 30; // Assuming 30fps
    await EventBridge.previewReady(
      state.projectId,
      state.sceneIndex,
      state.sceneId,
      result.videoUrl, // Use URL for frontend
      durationSeconds
    );

    return {
      videoPath: result.videoPath, // Store absolute path in state for ffmpeg
      status: 'rendering' as const,
    };
  } catch (error) {
    console.error(`[Graph:Scene] Render failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Emit agent error
    await EventBridge.agentError(
      state.projectId,
      agentId,
      errorMessage,
      'rendering_scene',
      false // Render errors usually not recoverable
    );

    // Emit scene error event (legacy)
    await EventBridge.sceneError(
      sceneForEvents,
      errorMessage,
      'rendering'
    );

    // Also emit render error (legacy)
    await EventBridge.renderError(
      state.projectId,
      'scene',
      errorMessage,
      state.sceneId
    );

    // Emit preview error
    await EventBridge.previewError(
      state.projectId,
      errorMessage,
      state.sceneIndex,
      state.sceneId
    );

    return {
      status: 'failed' as const,
      failureReason: errorMessage,
      lastDecision: 'fail' as const,
    };
  }
};

export const evaluateSceneNode = async (state: typeof SceneStateAnnotation.State) => {
  console.log(`[Graph:Scene] Evaluating scene ${state.sceneIndex} v${state.version}`);
  
  const startTime = Date.now();
  const agentId = getAgentId(state.sceneId, state.sceneIndex);

  // Build scene state object for events
  const sceneForEvents: SceneState = {
    projectId: state.projectId,
    sceneId: state.sceneId,
    sceneIndex: state.sceneIndex,
    version: state.version,
    prompt: state.prompt,
    brandContext: state.brandContext,
    durationFrames: state.durationFrames,
    status: 'evaluating',
    attempts: state.attempts,
    code: state.code,
    videoPath: state.videoPath,
  };

  try {
    if (!state.code) throw new Error('No code to evaluate');
    
    // Emit agent action - reviewing
    await EventBridge.agentAction(
      state.projectId,
      agentId,
      'reviewing',
      'Evaluating scene quality',
      0
    );

    // Emit evaluation started event (legacy)
    await EventBridge.evaluationStarted(sceneForEvents);

    const result = await EvaluationService.evaluateScene({
      projectId: state.projectId,
      sceneId: state.sceneId,
      sceneIndex: state.sceneIndex,
      version: state.version,
      code: state.code,
      videoPath: state.videoPath,
      brandContext: state.brandContext,
      sceneDescription: state.prompt,
      previousFeedback: state.feedback,
    });

    let decision: 'pass' | 'refine' | 'fail';
    const MAX_ATTEMPTS = 3;
    
    if (result.passed) {
      decision = 'pass';
    } else if (state.attempts < MAX_ATTEMPTS) {
      decision = 'refine';
    } else {
      decision = 'fail';
    }

    // Update scene for event
    sceneForEvents.score = result.score;
    sceneForEvents.feedback = result.feedback;

    // Emit agent thinking with evaluation result
    await EventBridge.agentThinking(
      state.projectId,
      agentId,
      decision === 'pass' 
        ? `Scene passed with score ${result.score}. Quality standards met.`
        : decision === 'refine'
        ? `Score ${result.score} below threshold. Will refine: ${result.feedback.slice(0, 60)}...`
        : `Max attempts reached. Final score: ${result.score}`,
      false
    );

    // Emit evaluation completed event (legacy)
    await EventBridge.evaluationCompleted(
      sceneForEvents,
      result.score,
      result.passed,
      result.feedback,
      result.details as unknown as Record<string, number>
    );

    // If escalated (max attempts and still failing), emit escalation event
    if (decision === 'fail' && !result.passed) {
      await EventBridge.evaluationEscalated(
        sceneForEvents,
        'max_attempts',
        result.score
      );
    }

    // If decision is final (pass or fail), emit agent completed
    if (decision === 'pass' || decision === 'fail') {
      await EventBridge.agentCompleted(
        state.projectId,
        agentId,
        Date.now() - startTime,
        decision === 'pass' ? 'success' : 'failed',
        decision === 'pass' 
          ? `Scene completed with score ${result.score}`
          : `Failed after ${state.attempts} attempts. Score: ${result.score}`
      );
    } else {
      // Refining - emit action
      await EventBridge.agentAction(
        state.projectId,
        agentId,
        'refining',
        `Preparing refinement iteration ${state.attempts + 1}`,
        0
      );
    }

    return {
      score: result.score,
      feedback: result.feedback,
      status: 'evaluating' as const,
      lastDecision: decision,
      failureReason: decision === 'fail' 
        ? `Failed after ${state.attempts} attempts. Final score: ${result.score}` 
        : undefined,
    };
  } catch (error) {
    console.error(`[Graph:Scene] Evaluation failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Emit agent error
    await EventBridge.agentError(
      state.projectId,
      agentId,
      errorMessage,
      'reviewing',
      false
    );

    // Emit system error for evaluation failure (legacy)
    await EventBridge.systemError(
      state.projectId,
      errorMessage,
      'evaluation_service',
      false
    );

    // Emit agent completed with failure
    await EventBridge.agentCompleted(
      state.projectId,
      agentId,
      Date.now() - startTime,
      'failed',
      `Evaluation failed: ${errorMessage}`
    );

    return {
      status: 'failed' as const,
      failureReason: errorMessage,
      lastDecision: 'fail' as const,
    };
  }
};
