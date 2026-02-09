/**
 * EventBridge Service
 * 
 * A helper layer that wraps UIEventEmitter calls for use in LangGraph nodes.
 * Simplifies event emission by extracting common data from SceneState objects.
 */

import { uiEvents } from '../../../events/UIEventEmitter.js';
import { SceneState } from '../state/SceneState.js';

/**
 * EventBridge provides static methods for emitting UI events from LangGraph nodes.
 * It simplifies the interface by extracting necessary data from SceneState objects.
 */
export class EventBridge {
  // ============================================================================
  // Director Events
  // ============================================================================

  /**
   * Emit when director starts processing a project
   */
  static async directorStarted(
    projectId: string,
    totalScenes: number,
    config: Record<string, unknown> = {}
  ): Promise<void> {
    await uiEvents.directorStarted(projectId, {
      totalScenes,
      config,
    });
  }

  /**
   * Emit director thinking/reasoning updates
   */
  static async directorThinking(
    projectId: string,
    phase: 'planning' | 'coordinating' | 'evaluating' | 'deciding',
    thought: string
  ): Promise<void> {
    await uiEvents.directorThinking(projectId, {
      phase,
      thought,
    });
  }

  /**
   * Emit when director makes a decision about scenes
   */
  static async directorDecision(
    projectId: string,
    decision: string,
    reasoning: string,
    affectedScenes: string[] = []
  ): Promise<void> {
    await uiEvents.directorDecision(projectId, {
      decision,
      reasoning,
      affectedScenes,
    });
  }

  /**
   * Emit when director completes all processing
   */
  static async directorCompleted(
    projectId: string,
    success: boolean,
    totalDurationMs: number,
    finalScore: number,
    summary: string
  ): Promise<void> {
    await uiEvents.directorCompleted(projectId, {
      success,
      totalDurationMs,
      finalScore,
      summary,
    });
  }

  /**
   * Emit when director encounters an error
   */
  static async directorError(
    projectId: string,
    error: string,
    phase: string,
    recoverable: boolean = false
  ): Promise<void> {
    await uiEvents.directorError(projectId, {
      error,
      phase,
      recoverable,
    });
  }

  // ============================================================================
  // Scene Events - Using SceneState
  // ============================================================================

  /**
   * Emit when a scene is queued for processing
   */
  static async sceneQueued(scene: SceneState): Promise<void> {
    await uiEvents.sceneQueued(scene.projectId, {
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      version: scene.version,
    });
  }

  /**
   * Emit when scene code generation starts
   */
  static async sceneGenerating(scene: SceneState): Promise<void> {
    await uiEvents.sceneGenerating(scene.projectId, {
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      version: scene.version,
      attempt: scene.attempts,
    });
  }

  /**
   * Emit when scene code generation completes
   */
  static async sceneGenerated(
    scene: SceneState,
    durationMs: number
  ): Promise<void> {
    await uiEvents.sceneGenerated(scene.projectId, {
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      version: scene.version,
      durationMs,
      codeLength: scene.code?.length ?? 0,
    });
  }

  /**
   * Emit when scene rendering starts
   */
  static async sceneRendering(scene: SceneState): Promise<void> {
    await uiEvents.sceneRendering(scene.projectId, {
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      version: scene.version,
    });
  }

  /**
   * Emit when scene rendering completes
   */
  static async sceneRendered(
    scene: SceneState,
    durationMs: number
  ): Promise<void> {
    await uiEvents.sceneRendered(scene.projectId, {
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      version: scene.version,
      durationMs,
      videoPath: scene.videoPath ?? '',
    });
  }

  /**
   * Emit when scene processing encounters an error
   */
  static async sceneError(
    scene: SceneState,
    error: string,
    phase: 'generation' | 'rendering'
  ): Promise<void> {
    await uiEvents.sceneError(scene.projectId, {
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      version: scene.version,
      error,
      phase,
    });
  }

  // ============================================================================
  // Evaluation Events
  // ============================================================================

  /**
   * Emit when scene evaluation starts (tier 1)
   */
  static async evaluationStarted(scene: SceneState): Promise<void> {
    await uiEvents.evaluationStarted(scene.projectId, {
      tier: 1,
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      version: scene.version,
    });
  }

  /**
   * Emit when final/tier-2 evaluation starts
   */
  static async tier2EvaluationStarted(projectId: string): Promise<void> {
    await uiEvents.evaluationStarted(projectId, {
      tier: 2,
    });
  }

  /**
   * Emit evaluation progress updates
   */
  static async evaluationProgress(
    scene: SceneState,
    step: string,
    progress: number
  ): Promise<void> {
    await uiEvents.evaluationProgress(scene.projectId, {
      tier: 1,
      sceneId: scene.sceneId,
      step,
      progress,
    });
  }

  /**
   * Emit when scene evaluation completes
   */
  static async evaluationCompleted(
    scene: SceneState,
    score: number,
    passed: boolean,
    feedback: string,
    details?: Record<string, number>
  ): Promise<void> {
    await uiEvents.evaluationCompleted(scene.projectId, {
      tier: 1,
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      evaluatedVersion: scene.version,
      score,
      passed,
      feedback,
      details,
    });
  }

  /**
   * Emit when tier-2 final evaluation completes
   */
  static async tier2EvaluationCompleted(
    projectId: string,
    score: number,
    passed: boolean,
    feedback: string,
    details?: Record<string, number>
  ): Promise<void> {
    await uiEvents.evaluationCompleted(projectId, {
      tier: 2,
      score,
      passed,
      feedback,
      details,
    });
  }

  /**
   * Emit when a scene is escalated (max attempts reached)
   */
  static async evaluationEscalated(
    scene: SceneState,
    reason: 'max_attempts' | 'low_score' | 'diminishing_returns',
    lastScore: number
  ): Promise<void> {
    await uiEvents.evaluationEscalated(scene.projectId, {
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      sceneNumber: scene.sceneIndex + 1,
      reason,
      attempts: scene.attempts,
      lastScore,
    });
  }

  // ============================================================================
  // Render Events
  // ============================================================================

  /**
   * Emit when scene rendering starts (with render service details)
   */
  static async renderStarted(
    projectId: string,
    phase: 'scene' | 'final',
    sceneId?: string
  ): Promise<void> {
    await uiEvents.renderStarted(projectId, {
      phase,
      sceneId,
    });
  }

  /**
   * Emit render progress updates
   */
  static async renderProgress(
    projectId: string,
    phase: 'scene' | 'final',
    progress: number,
    framesRendered: number,
    totalFrames: number,
    sceneId?: string
  ): Promise<void> {
    await uiEvents.renderProgress(projectId, {
      phase,
      sceneId,
      progress,
      framesRendered,
      totalFrames,
    });
  }

  /**
   * Emit when rendering completes
   */
  static async renderCompleted(
    projectId: string,
    phase: 'scene' | 'final',
    durationMs: number,
    outputPath: string,
    fileSizeBytes: number,
    sceneId?: string
  ): Promise<void> {
    await uiEvents.renderCompleted(projectId, {
      phase,
      sceneId,
      durationMs,
      outputPath,
      fileSizeBytes,
    });
  }

  /**
   * Emit when rendering fails
   */
  static async renderError(
    projectId: string,
    phase: 'scene' | 'final',
    error: string,
    sceneId?: string
  ): Promise<void> {
    await uiEvents.renderError(projectId, {
      phase,
      sceneId,
      error,
    });
  }

  // ============================================================================
  // System Events
  // ============================================================================

  /**
   * Emit system health status
   */
  static async systemHealth(
    projectId: string,
    redis: 'connected' | 'disconnected',
    queues: Record<string, number>,
    workers: Record<string, boolean>
  ): Promise<void> {
    await uiEvents.systemHealth(projectId, {
      redis,
      queues,
      workers,
    });
  }

  /**
   * Emit system error
   */
  static async systemError(
    projectId: string,
    error: string,
    component: string,
    fatal: boolean = false
  ): Promise<void> {
    await uiEvents.systemError(projectId, {
      error,
      component,
      fatal,
    });
  }

  // ============================================================================
  // Agent Events (for agent hierarchy visualization)
  // ============================================================================

  /**
   * Emit when a new agent is spawned (e.g., scene agent spawned by director)
   */
  static async agentSpawned(
    projectId: string,
    agentId: string,
    sceneIndex: number,
    sceneName: string,
    parentAgentId?: string
  ): Promise<void> {
    await uiEvents.agentSpawned(projectId, {
      agentId,
      sceneIndex,
      sceneName,
      parentAgentId,
    });
  }

  /**
   * Emit agent thinking/reasoning (supports streaming)
   */
  static async agentThinking(
    projectId: string,
    agentId: string,
    thought: string,
    isStreaming: boolean = false,
    thoughtIndex?: number
  ): Promise<void> {
    await uiEvents.agentThinking(projectId, {
      agentId,
      thought,
      isStreaming,
      thoughtIndex,
    });
  }

  /**
   * Emit when agent is performing an action
   */
  static async agentAction(
    projectId: string,
    agentId: string,
    action: 'planning' | 'generating_code' | 'validating_code' | 'rendering_scene' | 'reviewing' | 'refining',
    details?: string,
    progress?: number
  ): Promise<void> {
    await uiEvents.agentAction(projectId, {
      agentId,
      action,
      details,
      progress,
    });
  }

  /**
   * Emit when agent completes its task
   */
  static async agentCompleted(
    projectId: string,
    agentId: string,
    durationMs: number,
    status: 'success' | 'failed' | 'cancelled',
    result?: string
  ): Promise<void> {
    await uiEvents.agentCompleted(projectId, {
      agentId,
      durationMs,
      status,
      result,
    });
  }

  /**
   * Emit when agent encounters an error
   */
  static async agentError(
    projectId: string,
    agentId: string,
    error: string,
    phase: 'planning' | 'generating_code' | 'validating_code' | 'rendering_scene' | 'reviewing' | 'refining',
    recoverable: boolean = false
  ): Promise<void> {
    await uiEvents.agentError(projectId, {
      agentId,
      error,
      phase,
      recoverable,
    });
  }

  // ============================================================================
  // Preview Events (for cooking preview visualization)
  // ============================================================================

  /**
   * Emit when a scene video is ready for preview
   */
  static async previewReady(
    projectId: string,
    sceneIndex: number,
    sceneId: string,
    videoPath: string,
    durationSeconds: number,
    thumbnailPath?: string
  ): Promise<void> {
    await uiEvents.previewReady(projectId, {
      sceneIndex,
      sceneId,
      videoPath,
      durationSeconds,
      thumbnailPath,
    });
  }

  /**
   * Emit when all scene previews are complete
   */
  static async previewAllComplete(
    projectId: string,
    totalScenes: number,
    scenePaths: Array<{ sceneIndex: number; sceneId: string; videoPath: string }>,
    finalVideoPath?: string
  ): Promise<void> {
    await uiEvents.previewAllComplete(projectId, {
      totalScenes,
      scenePaths,
      finalVideoPath,
    });
  }

  /**
   * Emit when preview generation fails
   */
  static async previewError(
    projectId: string,
    error: string,
    sceneIndex?: number,
    sceneId?: string
  ): Promise<void> {
    await uiEvents.previewError(projectId, {
      error,
      sceneIndex,
      sceneId,
    });
  }
}
