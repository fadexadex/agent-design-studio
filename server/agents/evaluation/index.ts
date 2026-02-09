/**
 * Evaluation Module
 * 
 * Exports evaluation-related functionality including:
 * - Score aggregation and calculations
 * - Scene evaluator (Tier 1)
 * - Global evaluator (Tier 2)
 * - Evaluation workers
 */

// Score Aggregator exports
export {
  // Configuration
  SCORE_WEIGHTS,
  
  // Scene scoring
  type SceneEvaluationDetails,
  calculateSceneScore,
  calculateWeightedMeanSceneScore,
  calculateWeightedMeanFromState,
  
  // Global scoring
  type GlobalEvaluationDetails,
  calculateGlobalScore,
  calculateGlobalScoreFromState,
  
  // Score analysis
  type ScoreBreakdown,
  getScoreBreakdown,
  identifyWeakComponents,
  estimateRequiredImprovement,
  
  // Trend analysis
  type ScoreTrend,
  analyzeScoreTrend,
} from './ScoreAggregator.js';

// Scene Evaluator exports
export {
  type SceneEvaluationInput,
  type SceneEvaluationResult,
  SceneEvaluator,
  createSceneEvaluator,
} from './SceneEvaluator.js';

// Scene Evaluation Worker exports
export {
  type SceneEvaluationWorkerOptions,
  createSceneEvaluationWorker,
  queueSceneEvaluation,
} from './SceneEvaluationWorker.js';

// Global Evaluator exports
export {
  type GlobalEvaluationInput,
  type GlobalEvaluationResult,
  type SceneInfo,
  type WeaknessAnalysis,
  type GlobalRecommendation,
  GlobalEvaluator,
  createGlobalEvaluator,
} from './GlobalEvaluator.js';

// Global Evaluation Worker exports
export {
  type GlobalEvaluationWorkerOptions,
  type ExtendedGlobalEvaluationJobData,
  createGlobalEvaluationWorker,
  queueGlobalEvaluation,
} from './GlobalEvaluationWorker.js';
