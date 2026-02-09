/**
 * Agents Module
 * 
 * Root exports for all agent functionality in the Director-Agent architecture.
 */

// Core types
export {
  // Agent reflection
  type AgentReflection,
  createReflection,
  
  // Score thresholds
  SCORE_THRESHOLDS,
  
  // Brand context
  type BrandContext,
  
  // Scene types
  type SceneDefinition,
  type SceneStatus,
  type SceneState,
  createSceneState,
  
  // Video plan
  type VideoPlan,
  
  // Agent communication
  type AgentMessage,
  
  // Errors
  AgentError,
  SceneGenerationError,
  EvaluationError,
  DirectorError,
} from './types.js';

// Director agent
export {
  // State
  type DirectorPhase,
  type DirectorState,
  createDirectorState,
  serializeState,
  deserializeState,
  getScenesInOrder,
  allScenesPassedLocal,
  getStateRedisKey,
  
  // Commands
  type DirectorCommand,
  type DirectorCommandType,
  createCommand,
  
  // Decisions
  type DecisionType,
  type Decision,
  detectDiminishingReturns,
  decideAfterSceneEvaluation,
  decideAfterGlobalEvaluation,
  shouldStartGlobalEvaluation,
  checkDirectorSatisfaction,
  
  // Agent
  DirectorAgent,
  getDirectorAgent,
  startProject,
  
  // Worker
  type DirectorWorkerOptions,
  createDirectorWorker,
  sendDirectorCommand,
  queueStartProject,
} from './director/index.js';

// Evaluation
export {
  SCORE_WEIGHTS,
  type SceneEvaluationDetails,
  type GlobalEvaluationDetails,
  type ScoreBreakdown,
  type ScoreTrend,
  calculateSceneScore,
  calculateGlobalScore,
  getScoreBreakdown,
  identifyWeakComponents,
  analyzeScoreTrend,
  
  // Scene Evaluator
  type SceneEvaluationInput,
  type SceneEvaluationResult,
  SceneEvaluator,
  createSceneEvaluator,
  
  // Scene Evaluation Worker
  type SceneEvaluationWorkerOptions,
  createSceneEvaluationWorker,
  queueSceneEvaluation,
  
  // Global Evaluator
  type GlobalEvaluationInput,
  type GlobalEvaluationResult,
  type SceneInfo,
  GlobalEvaluator,
  createGlobalEvaluator,
  
  // Global Evaluation Worker
  type GlobalEvaluationWorkerOptions,
  createGlobalEvaluationWorker,
  queueGlobalEvaluation,
} from './evaluation/index.js';

// Scene agent (re-export key items)
export {
  createSceneGeneratorWorker,
  createSceneRenderWorker,
} from './scene/index.js';
