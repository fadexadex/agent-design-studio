// Phase Execution Engine - Phase 2
// This module provides the phase management infrastructure for the workflow.

// Base class and types
export {
  BasePhase,
  type PhaseResult,
  type PhaseContext
} from './BasePhase';

// Phase Manager
export {
  PhaseManager,
  phaseManager
} from './PhaseManager';

// Individual Phases
export { QueryEnhancementPhase } from './QueryEnhancementPhase';
export { PlanningPhase } from './PlanningPhase';
export { ImplementationPhase } from './ImplementationPhase';
export {
  EvaluationPhase,
  getEvaluationFromState,
  type EvaluationResult
} from './EvaluationPhase';
