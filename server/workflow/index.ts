// Workflow Module - Complete distributed agent workflow infrastructure
//
// This module provides the full workflow system for the AI-powered video generator:
// - Phase 1: State management (WorkflowState, CheckpointManager, ErrorTracker)
// - Phase 2: Phase execution engine (PhaseManager, individual phases)
// - Phase 3: Iteration logic (SelfEvaluator, IterationController)
// - Phase 4: Workflow orchestration (WorkflowOrchestrator)

// State Management (Phase 1)
export {
  // Enums
  WorkflowPhase,

  // Interfaces
  type WorkflowState,
  type ImplementationPlan,
  type SceneDescription,
  type ImplementationRound,
  type Checkpoint,
  type ErrorRecord,
  type WorkflowProgress,
  type ValidationResult,
  type GeneratedFile,
  type EvaluationResultRef,
  type SceneScoreRef,

  // Functions
  createInitialState,
  updateState,
  transitionPhase,
  addThought,
  getCurrentRound,
  canIterate,
  storeEvaluation,
  setTargetScenes,
  clearTargetScenes,
  getTargetScenes,

  // Managers
  CheckpointManager,
  checkpointManager,
  type CheckpointDiff,
  ErrorTracker,
  errorTracker,
  type ErrorSummary
} from './state';

// Phase Execution Engine (Phase 2)
export {
  // Base class and types
  BasePhase,
  type PhaseResult,
  type PhaseContext,

  // Phase Manager
  PhaseManager,
  phaseManager,

  // Individual Phases
  QueryEnhancementPhase,
  PlanningPhase,
  ImplementationPhase,
  EvaluationPhase,
  getEvaluationFromState
} from './phases';

// Iteration & Decision Logic (Phase 3)
export {
  SelfEvaluator,
  selfEvaluator,
  type EvaluationResult,
  type SceneScore,
  EvaluationThresholds,
  IterationController,
  iterationController,
  type IterationDecision
} from './iteration';

// Workflow Orchestrator (Phase 4)
export {
  WorkflowOrchestrator,
  createOrchestrator,
  type UserFeedback,
  type WorkflowEvents,
  type OrchestratorConfig
} from './WorkflowOrchestrator';
