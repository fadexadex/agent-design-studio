// Workflow State Management - Phase 1 Foundation
// This module provides the core state infrastructure for the distributed agent workflow.

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

  // Functions
  createInitialState,
  updateState,
  transitionPhase,
  addThought,
  getCurrentRound,
  canIterate
} from './WorkflowState';

export {
  CheckpointManager,
  checkpointManager,
  type CheckpointDiff
} from './CheckpointManager';

export {
  ErrorTracker,
  errorTracker,
  type ErrorSummary
} from './ErrorTracker';
