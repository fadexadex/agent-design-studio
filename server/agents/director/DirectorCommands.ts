/**
 * Director Commands
 * 
 * Defines all commands that can be sent to/from the Director agent.
 * Commands flow through BullMQ queues for distributed processing.
 */

import { BrandContext, SceneDefinition, VideoPlan } from '../types.js';

// ============================================================================
// Command Types
// ============================================================================

export type DirectorCommandType =
  // Lifecycle commands
  | 'START_PROJECT'
  | 'RESUME_PROJECT'
  | 'CANCEL_PROJECT'
  
  // Planning commands
  | 'CREATE_VIDEO_PLAN'
  | 'UPDATE_VIDEO_PLAN'
  
  // Scene management commands
  | 'QUEUE_SCENE_GENERATION'
  | 'QUEUE_ALL_SCENES'
  | 'REGENERATE_SCENE'
  | 'ESCALATE_SCENE'
  
  // Evaluation commands
  | 'SCENE_GENERATED'
  | 'SCENE_RENDERED'
  | 'SCENE_EVALUATION_COMPLETE'
  | 'GLOBAL_EVALUATION_COMPLETE'
  
  // Iteration commands
  | 'START_GLOBAL_ITERATION'
  | 'APPLY_GLOBAL_FEEDBACK'
  
  // Completion commands
  | 'RENDER_FINAL_VIDEO'
  | 'COMPLETE_PROJECT'
  | 'FAIL_PROJECT';

// ============================================================================
// Base Command Interface
// ============================================================================

export interface BaseDirectorCommand {
  /** Command type */
  type: DirectorCommandType;
  
  /** Project ID */
  projectId: string;
  
  /** Timestamp when command was created */
  timestamp: number;
  
  /** Optional correlation ID for tracking */
  correlationId?: string;
}

// ============================================================================
// Lifecycle Commands
// ============================================================================

export interface StartProjectCommand extends BaseDirectorCommand {
  type: 'START_PROJECT';
  payload: {
    brandContext: BrandContext;
    options?: {
      maxGlobalIterations?: number;
      targetScore?: number;
    };
  };
}

export interface ResumeProjectCommand extends BaseDirectorCommand {
  type: 'RESUME_PROJECT';
  payload: {
    /** Phase to resume from (optional, defaults to current phase) */
    fromPhase?: string;
  };
}

export interface CancelProjectCommand extends BaseDirectorCommand {
  type: 'CANCEL_PROJECT';
  payload: {
    reason: string;
  };
}

// ============================================================================
// Planning Commands
// ============================================================================

export interface CreateVideoPlanCommand extends BaseDirectorCommand {
  type: 'CREATE_VIDEO_PLAN';
  payload: {
    brandContext: BrandContext;
  };
}

export interface UpdateVideoPlanCommand extends BaseDirectorCommand {
  type: 'UPDATE_VIDEO_PLAN';
  payload: {
    videoPlan: VideoPlan;
    feedback?: string;
  };
}

// ============================================================================
// Scene Management Commands
// ============================================================================

export interface QueueSceneGenerationCommand extends BaseDirectorCommand {
  type: 'QUEUE_SCENE_GENERATION';
  payload: {
    sceneId: string;
    sceneIndex: number;
    version: number;
    prompt: string;
    feedback?: string;
    previousCode?: string;
  };
}

export interface QueueAllScenesCommand extends BaseDirectorCommand {
  type: 'QUEUE_ALL_SCENES';
  payload: {
    scenes: SceneDefinition[];
  };
}

export interface RegenerateSceneCommand extends BaseDirectorCommand {
  type: 'REGENERATE_SCENE';
  payload: {
    sceneId: string;
    feedback: string;
    forceNewApproach?: boolean;
  };
}

export interface EscalateSceneCommand extends BaseDirectorCommand {
  type: 'ESCALATE_SCENE';
  payload: {
    sceneId: string;
    reason: 'max_attempts' | 'low_score' | 'diminishing_returns';
    attempts: number;
    lastScore: number;
    scoreHistory: number[];
  };
}

// ============================================================================
// Evaluation Result Commands
// ============================================================================

export interface SceneGeneratedCommand extends BaseDirectorCommand {
  type: 'SCENE_GENERATED';
  payload: {
    sceneId: string;
    version: number;
    code: string;
    generationTimeMs: number;
  };
}

export interface SceneRenderedCommand extends BaseDirectorCommand {
  type: 'SCENE_RENDERED';
  payload: {
    sceneId: string;
    version: number;
    videoPath: string;
    renderTimeMs: number;
  };
}

export interface SceneEvaluationCompleteCommand extends BaseDirectorCommand {
  type: 'SCENE_EVALUATION_COMPLETE';
  payload: {
    sceneId: string;
    evaluatedVersion: number;
    score: number;
    passed: boolean;
    feedback: string;
    details: {
      codeQuality: number;
      visualAppeal: number;
      brandAlignment: number;
      technicalCorrectness: number;
    };
  };
}

export interface GlobalEvaluationCompleteCommand extends BaseDirectorCommand {
  type: 'GLOBAL_EVALUATION_COMPLETE';
  payload: {
    globalScore: number;
    passed: boolean;
    narrativeCohesion: number;
    brandConsistency: number;
    feedback: string;
    sceneVersionSnapshot: Record<string, number>;
    sceneSpecificFeedback?: Record<string, string>;
  };
}

// ============================================================================
// Iteration Commands
// ============================================================================

export interface StartGlobalIterationCommand extends BaseDirectorCommand {
  type: 'START_GLOBAL_ITERATION';
  payload: {
    iterationNumber: number;
    globalFeedback: string;
    scenesToRegenerate: string[];
  };
}

export interface ApplyGlobalFeedbackCommand extends BaseDirectorCommand {
  type: 'APPLY_GLOBAL_FEEDBACK';
  payload: {
    feedback: string;
    targetScenes: string[];
    adjustments: Record<string, {
      newPrompt?: string;
      styleHints?: string[];
      constraints?: string[];
    }>;
  };
}

// ============================================================================
// Completion Commands
// ============================================================================

export interface RenderFinalVideoCommand extends BaseDirectorCommand {
  type: 'RENDER_FINAL_VIDEO';
  payload: {
    scenePaths: Record<string, string>;
    outputPath: string;
  };
}

export interface CompleteProjectCommand extends BaseDirectorCommand {
  type: 'COMPLETE_PROJECT';
  payload: {
    outputPath: string;
    finalScore: number;
    summary: string;
  };
}

export interface FailProjectCommand extends BaseDirectorCommand {
  type: 'FAIL_PROJECT';
  payload: {
    error: string;
    code: string;
    phase: string;
    recoverable: boolean;
  };
}

// ============================================================================
// Union Type
// ============================================================================

export type DirectorCommand =
  | StartProjectCommand
  | ResumeProjectCommand
  | CancelProjectCommand
  | CreateVideoPlanCommand
  | UpdateVideoPlanCommand
  | QueueSceneGenerationCommand
  | QueueAllScenesCommand
  | RegenerateSceneCommand
  | EscalateSceneCommand
  | SceneGeneratedCommand
  | SceneRenderedCommand
  | SceneEvaluationCompleteCommand
  | GlobalEvaluationCompleteCommand
  | StartGlobalIterationCommand
  | ApplyGlobalFeedbackCommand
  | RenderFinalVideoCommand
  | CompleteProjectCommand
  | FailProjectCommand;

// ============================================================================
// Command Factory
// ============================================================================

/**
 * Create a new Director command
 */
export function createCommand<T extends DirectorCommand>(
  type: T['type'],
  projectId: string,
  payload: T['payload'],
  correlationId?: string
): T {
  return {
    type,
    projectId,
    payload,
    timestamp: Date.now(),
    correlationId,
  } as T;
}

// ============================================================================
// Command Type Guards
// ============================================================================

export function isLifecycleCommand(cmd: DirectorCommand): boolean {
  return ['START_PROJECT', 'RESUME_PROJECT', 'CANCEL_PROJECT'].includes(cmd.type);
}

export function isPlanningCommand(cmd: DirectorCommand): boolean {
  return ['CREATE_VIDEO_PLAN', 'UPDATE_VIDEO_PLAN'].includes(cmd.type);
}

export function isSceneCommand(cmd: DirectorCommand): boolean {
  return [
    'QUEUE_SCENE_GENERATION',
    'QUEUE_ALL_SCENES',
    'REGENERATE_SCENE',
    'ESCALATE_SCENE',
    'SCENE_GENERATED',
    'SCENE_RENDERED',
    'SCENE_EVALUATION_COMPLETE',
  ].includes(cmd.type);
}

export function isEvaluationCommand(cmd: DirectorCommand): boolean {
  return [
    'SCENE_EVALUATION_COMPLETE',
    'GLOBAL_EVALUATION_COMPLETE',
  ].includes(cmd.type);
}

export function isCompletionCommand(cmd: DirectorCommand): boolean {
  return [
    'RENDER_FINAL_VIDEO',
    'COMPLETE_PROJECT',
    'FAIL_PROJECT',
  ].includes(cmd.type);
}
