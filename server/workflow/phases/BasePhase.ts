import { WorkflowState, WorkflowPhase, updateState, addThought } from '../state';
import { AgentThought } from '../../agent/orchestrator';
import { rateLimitedCall } from '../../agent/rateLimiter';

/**
 * PhaseResult represents the outcome of executing a phase.
 * Phases can succeed, fail, or request user feedback.
 */
export interface PhaseResult {
  state: WorkflowState;
  success: boolean;
  error?: string;
  requiresFeedback?: boolean;
}

/**
 * PhaseContext provides dependencies and utilities to phases.
 * This allows phases to emit progress updates and access shared resources.
 */
export interface PhaseContext {
  /** Emit a progress update to the client */
  onProgress: (message: string, detail?: string) => void;
  /** Emit a thought to the cognitive trace */
  onThought: (thought: AgentThought) => void;
  /** Signal to abort the current operation */
  abortSignal?: AbortSignal;
}

/**
 * BasePhase is the abstract foundation for all workflow phases.
 *
 * Each phase follows the ReAct pattern:
 * - REASON: Analyze the current state and determine what to do
 * - ACT: Execute the phase's primary logic
 * - OBSERVE: Process results and update state
 */
export abstract class BasePhase {
  /** The workflow phase this handler represents */
  abstract readonly phase: WorkflowPhase;

  /** Human-readable name for logging/UI */
  abstract readonly name: string;

  /**
   * Execute the phase logic and return the updated state.
   *
   * @param state - Current workflow state
   * @param context - Phase context with callbacks and utilities
   * @returns PhaseResult with updated state and success indicator
   */
  abstract execute(state: WorkflowState, context: PhaseContext): Promise<PhaseResult>;

  /**
   * Helper to create a thought and add it to state.
   */
  protected think(
    state: WorkflowState,
    type: 'reason' | 'act' | 'observe',
    content: string,
    context: PhaseContext
  ): WorkflowState {
    const thought: AgentThought = {
      type,
      content,
      timestamp: new Date()
    };

    context.onThought(thought);
    return addThought(state, thought);
  }

  /**
   * Helper to create a thought that includes the model's actual thinking summary.
   * Use this when you have extracted thought summaries from Gemini API responses.
   */
  protected thinkWithModelThinking(
    state: WorkflowState,
    type: 'reason' | 'act' | 'observe',
    content: string,
    modelThinking: string,
    context: PhaseContext,
    thoughtSignature?: string
  ): WorkflowState {
    const thought: AgentThought = {
      type,
      content,
      timestamp: new Date(),
      modelThinking,
      thoughtSignature
    };

    context.onThought(thought);
    return addThought(state, thought);
  }

  /**
   * Helper to emit progress updates.
   */
  protected emitProgress(
    context: PhaseContext,
    message: string,
    detail?: string
  ): void {
    context.onProgress(message, detail);
  }

  /**
   * Helper to update progress percentage in state.
   */
  protected updateProgress(
    state: WorkflowState,
    phaseProgress: number,
    currentMessage: string,
    subStep?: string
  ): WorkflowState {
    return updateState(state, {
      progress: {
        ...state.progress,
        phaseProgress,
        currentMessage,
        subStep
      }
    });
  }

  /**
   * Creates a successful phase result.
   */
  protected success(state: WorkflowState): PhaseResult {
    return { state, success: true };
  }

  /**
   * Creates a failed phase result.
   */
  protected failure(state: WorkflowState, error: string): PhaseResult {
    return { state, success: false, error };
  }

  /**
   * Creates a result that requires user feedback before continuing.
   */
  protected awaitFeedback(state: WorkflowState): PhaseResult {
    return { state, success: true, requiresFeedback: true };
  }

  /**
   * Utility delay for pacing operations.
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a rate-limited API call with automatic retry on rate limit errors.
   * All phases should use this for Gemini API calls.
   */
  protected rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
    return rateLimitedCall(fn);
  }
}
