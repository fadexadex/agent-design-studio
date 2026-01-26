import { WorkflowState, WorkflowPhase, transitionPhase } from '../state';
import { BasePhase, PhaseContext, PhaseResult } from './BasePhase';
import { QueryEnhancementPhase } from './QueryEnhancementPhase';
import { PlanningPhase } from './PlanningPhase';
import { ImplementationPhase } from './ImplementationPhase';
import { EvaluationPhase } from './EvaluationPhase';

/**
 * PhaseManager acts as the router/switch for workflow phases.
 * It maintains a registry of phase handlers and executes the appropriate
 * phase based on the current workflow state.
 */
export class PhaseManager {
  private handlers: Map<WorkflowPhase, BasePhase> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Register the default phase handlers.
   */
  private registerDefaultHandlers(): void {
    this.register(new QueryEnhancementPhase());
    this.register(new PlanningPhase());
    this.register(new ImplementationPhase());
    this.register(new EvaluationPhase());
  }

  /**
   * Register a phase handler.
   */
  register(handler: BasePhase): void {
    this.handlers.set(handler.phase, handler);
  }

  /**
   * Get a phase handler by phase type.
   */
  getHandler(phase: WorkflowPhase): BasePhase | undefined {
    return this.handlers.get(phase);
  }

  /**
   * Check if a handler exists for a phase.
   */
  hasHandler(phase: WorkflowPhase): boolean {
    return this.handlers.has(phase);
  }

  /**
   * Execute a specific phase with the given state.
   *
   * This method:
   * 1. Transitions the state to the target phase
   * 2. Gets the appropriate handler
   * 3. Executes the handler
   * 4. Returns the updated state
   */
  async executePhase(
    phase: WorkflowPhase,
    state: WorkflowState,
    context: PhaseContext
  ): Promise<PhaseResult> {
    const handler = this.getHandler(phase);

    if (!handler) {
      // If no handler exists, some phases are handled externally (e.g., RENDERING)
      console.warn(`No handler registered for phase: ${phase}`);
      return {
        state: transitionPhase(state, phase),
        success: true
      };
    }

    // Transition to the target phase
    const transitionedState = transitionPhase(
      state,
      phase,
      `Starting ${handler.name}...`
    );

    try {
      // Execute the phase handler
      const result = await handler.execute(transitionedState, context);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Phase ${phase} failed:`, errorMessage);

      return {
        state: transitionPhase(state, WorkflowPhase.ERROR, errorMessage),
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Determine the next phase based on current state and result.
   *
   * This implements the workflow state machine transitions.
   */
  getNextPhase(currentPhase: WorkflowPhase, result: PhaseResult): WorkflowPhase {
    // If the phase requires feedback, go to awaiting feedback
    if (result.requiresFeedback) {
      return WorkflowPhase.AWAITING_FEEDBACK;
    }

    // If the phase failed, go to error
    if (!result.success) {
      return WorkflowPhase.ERROR;
    }

    // Standard phase transitions
    switch (currentPhase) {
      case WorkflowPhase.INITIALIZATION:
        return WorkflowPhase.QUERY_ENHANCEMENT;

      case WorkflowPhase.QUERY_ENHANCEMENT:
        return WorkflowPhase.PLANNING;

      case WorkflowPhase.PLANNING:
        return WorkflowPhase.IMPLEMENTATION;

      case WorkflowPhase.IMPLEMENTATION:
        return WorkflowPhase.CHECKPOINT;

      case WorkflowPhase.CHECKPOINT:
        return WorkflowPhase.EVALUATION;

      case WorkflowPhase.EVALUATION:
        return WorkflowPhase.ITERATION_DECISION;

      case WorkflowPhase.ITERATION_DECISION:
        // The iteration decision phase will set the next phase explicitly
        // based on evaluation results (either back to IMPLEMENTATION or to RENDERING)
        return WorkflowPhase.RENDERING;

      case WorkflowPhase.AWAITING_FEEDBACK:
        // After user feedback, return to the phase that requested it
        // The orchestrator handles this logic based on user response
        return WorkflowPhase.PLANNING;

      case WorkflowPhase.RENDERING:
        return WorkflowPhase.COMPLETE;

      case WorkflowPhase.COMPLETE:
      case WorkflowPhase.ERROR:
        // Terminal states - no next phase
        return currentPhase;

      default:
        console.warn(`Unknown phase transition from: ${currentPhase}`);
        return WorkflowPhase.ERROR;
    }
  }

  /**
   * Get all registered phase handlers.
   */
  getAllHandlers(): BasePhase[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Get phases that can be executed (have handlers).
   */
  getExecutablePhases(): WorkflowPhase[] {
    return Array.from(this.handlers.keys());
  }
}

// Export singleton instance for convenience
export const phaseManager = new PhaseManager();
