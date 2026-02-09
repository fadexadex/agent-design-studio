/**
 * Director Agent Module
 * 
 * Exports all Director-related functionality.
 */

// State management
export {
  type DirectorPhase,
  type DirectorState,
  type CreateDirectorStateOptions,
  createDirectorState,
  serializeState,
  deserializeState,
  getScenesInOrder,
  getScenesByStatus,
  allScenesPassedLocal,
  hasActiveScenes,
  getLatestSceneScores,
  calculateWeightedMeanSceneScore,
  getStateRedisKey,
  STATE_TTL_SECONDS,
} from './DirectorState.js';

// Commands
export {
  type DirectorCommandType,
  type BaseDirectorCommand,
  type DirectorCommand,
  type StartProjectCommand,
  type ResumeProjectCommand,
  type CancelProjectCommand,
  type CreateVideoPlanCommand,
  type UpdateVideoPlanCommand,
  type QueueSceneGenerationCommand,
  type QueueAllScenesCommand,
  type RegenerateSceneCommand,
  type EscalateSceneCommand,
  type SceneGeneratedCommand,
  type SceneRenderedCommand,
  type SceneEvaluationCompleteCommand,
  type GlobalEvaluationCompleteCommand,
  type StartGlobalIterationCommand,
  type ApplyGlobalFeedbackCommand,
  type RenderFinalVideoCommand,
  type CompleteProjectCommand,
  type FailProjectCommand,
  createCommand,
  isLifecycleCommand,
  isPlanningCommand,
  isSceneCommand,
  isEvaluationCommand,
  isCompletionCommand,
} from './DirectorCommands.js';

// Decisions
export {
  type DecisionType,
  type Decision,
  detectDiminishingReturns,
  decideAfterSceneEvaluation,
  decideAfterGlobalEvaluation,
  shouldStartGlobalEvaluation,
  checkDirectorSatisfaction,
} from './DirectorDecisions.js';

// Agent
export {
  DirectorAgent,
  getDirectorAgent,
  startProject,
} from './DirectorAgent.js';

// Worker
export {
  type DirectorWorkerOptions,
  createDirectorWorker,
  sendDirectorCommand,
  queueStartProject,
} from './DirectorWorker.js';
