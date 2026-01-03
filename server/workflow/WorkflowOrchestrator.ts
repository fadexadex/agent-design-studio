import { EventEmitter } from 'events';
import {
  WorkflowState,
  WorkflowPhase,
  createInitialState,
  updateState,
  transitionPhase,
  addThought,
  setTargetScenes,
  clearTargetScenes,
  storeEvaluation
} from './state';
import { PhaseManager, PhaseContext, PhaseResult } from './phases';
import { IterationController, IterationDecision, EvaluationResult } from './iteration';
import { BrandContext, VideoConfig } from '../agent/types';
import { AgentThought } from '../agent/orchestrator';

/**
 * User feedback provided during AWAITING_FEEDBACK phase.
 */
export interface UserFeedback {
  action: 'approve' | 'reject' | 'modify';
  message?: string;
  targetPhase?: WorkflowPhase; // Phase to resume from
  modifications?: {
    plan?: Partial<WorkflowState['plan']>;
    scenes?: string[]; // Specific scenes to regenerate
  };
}

/**
 * Event types emitted by the WorkflowOrchestrator.
 */
export interface WorkflowEvents {
  stateUpdate: (state: WorkflowState) => void;
  phaseStart: (phase: WorkflowPhase, state: WorkflowState) => void;
  phaseComplete: (phase: WorkflowPhase, result: PhaseResult) => void;
  thought: (thought: AgentThought) => void;
  progress: (message: string, detail?: string) => void;
  error: (error: Error) => void;
  complete: (state: WorkflowState) => void;
}

/**
 * Orchestrator configuration options.
 */
export interface OrchestratorConfig {
  maxRounds?: number;
  autoRender?: boolean; // Whether to automatically trigger rendering
}

/**
 * WorkflowOrchestrator is the main engine that ties all phases together.
 *
 * It manages the complete video generation workflow by:
 * 1. Maintaining the WorkflowState in memory
 * 2. Looping through phases until COMPLETE or AWAITING_FEEDBACK
 * 3. Emitting events for real-time streaming (Phase 5)
 * 4. Handling user feedback to resume the workflow
 *
 * The orchestrator follows the architecture from the system diagram:
 * - Receives requests from API layer
 * - Coordinates with PhaseManager for phase execution
 * - Uses IterationController for decision logic
 * - Emits events for SSE/WebSocket streaming
 */
export class WorkflowOrchestrator extends EventEmitter {
  private state: WorkflowState | null = null;
  private phaseManager: PhaseManager;
  private iterationController: IterationController;
  private config: OrchestratorConfig;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  constructor(
    phaseManager?: PhaseManager,
    iterationController?: IterationController,
    config: OrchestratorConfig = {}
  ) {
    super();
    this.phaseManager = phaseManager || new PhaseManager();
    this.iterationController = iterationController || new IterationController();
    this.config = {
      maxRounds: config.maxRounds ?? 3,
      autoRender: config.autoRender ?? true
    };
  }

  /**
   * Get the current workflow state.
   */
  getState(): WorkflowState | null {
    return this.state;
  }

  /**
   * Check if the orchestrator is currently running.
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if the workflow is paused (awaiting feedback).
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Start a new workflow with the given brand and config.
   *
   * @param jobId - Unique identifier for this workflow run
   * @param brand - Brand context for video generation
   * @param videoConfig - Video configuration (style, aspect ratio, etc.)
   */
  async start(
    jobId: string,
    brand: BrandContext,
    videoConfig: VideoConfig
  ): Promise<WorkflowState> {
    if (this.isRunning) {
      throw new Error('Workflow is already running. Call stop() first.');
    }

    // Initialize state
    this.state = createInitialState(jobId, brand, videoConfig);
    this.state.maxRounds = this.config.maxRounds!;
    this.isRunning = true;
    this.isPaused = false;

    // Emit initial state
    this.emitStateUpdate();
    this.emitThought('reason', 'Starting new workflow. Analyzing brand context and video requirements.');

    // Transition to first phase
    this.state = transitionPhase(this.state, WorkflowPhase.QUERY_ENHANCEMENT);
    this.emitStateUpdate();

    // Start the main loop
    await this.runLoop();

    return this.state;
  }

  /**
   * Stop the currently running workflow.
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.state) {
      this.state = transitionPhase(this.state, WorkflowPhase.ERROR, 'Workflow stopped by user');
      this.emitStateUpdate();
    }
  }

  /**
   * The main workflow loop.
   *
   * This loop:
   * 1. Checks if we're in a terminal or paused state
   * 2. Executes the current phase via PhaseManager
   * 3. Determines the next phase via IterationController or PhaseManager
   * 4. Emits events for streaming
   * 5. Repeats until terminal state or pause
   */
  private async runLoop(): Promise<void> {
    while (this.isRunning && this.state && !this.isTerminal(this.state.currentPhase)) {
      // 1. Emit state update for streaming
      this.emitStateUpdate();

      // 2. Check if we need to pause for user feedback
      if (this.state.currentPhase === WorkflowPhase.AWAITING_FEEDBACK) {
        this.isPaused = true;
        this.emitThought('observe', 'Workflow paused. Awaiting user feedback before continuing.');
        break; // Stop loop, wait for handleUserFeedback() call
      }

      // 3. Create phase context for callbacks
      const context = this.createPhaseContext();

      // 4. Emit phase start event
      this.emit('phaseStart', this.state.currentPhase, this.state);
      this.emitThought('act', `Executing ${this.state.currentPhase} phase...`);

      try {
        // 5. Execute the current phase
        const result = await this.executeCurrentPhase(context);

        // 6. Emit phase complete event
        this.emit('phaseComplete', this.state.currentPhase, result);

        // 7. Update state from phase result
        this.state = result.state;

        // 8. Determine and transition to next phase
        const nextPhase = this.determineNextPhase(result);

        if (nextPhase !== this.state.currentPhase) {
          this.state = transitionPhase(
            this.state,
            nextPhase,
            this.getPhaseTransitionMessage(nextPhase)
          );
          this.emitThought('observe', `Transitioning to ${nextPhase} phase.`);
        }

      } catch (error) {
        this.handleError(error as Error);
        break;
      }
    }

    // Emit final state
    this.emitStateUpdate();

    // If we reached a terminal state, emit complete
    if (this.state && this.isTerminal(this.state.currentPhase)) {
      this.isRunning = false;
      this.emit('complete', this.state);
    }
  }

  /**
   * Execute the current phase using the PhaseManager.
   */
  private async executeCurrentPhase(context: PhaseContext): Promise<PhaseResult> {
    if (!this.state) {
      throw new Error('No workflow state available');
    }

    const currentPhase = this.state.currentPhase;

    // Handle special phases that don't have handlers
    if (currentPhase === WorkflowPhase.CHECKPOINT) {
      // Checkpoint phase - save current state
      return this.handleCheckpointPhase(context);
    }

    if (currentPhase === WorkflowPhase.ITERATION_DECISION) {
      // Iteration decision - use IterationController
      return this.handleIterationDecision(context);
    }

    if (currentPhase === WorkflowPhase.RENDERING) {
      // Rendering phase - external process
      return this.handleRenderingPhase(context);
    }

    // Execute via PhaseManager for standard phases
    return await this.phaseManager.executePhase(currentPhase, this.state, context);
  }

  /**
   * Handle the checkpoint phase - save current implementation state.
   */
  private handleCheckpointPhase(context: PhaseContext): PhaseResult {
    if (!this.state) {
      return { state: this.state!, success: false, error: 'No state available' };
    }

    context.onProgress('Saving checkpoint...', 'Recording current implementation state');
    this.emitThought('act', 'Creating checkpoint of current implementation.');

    // Checkpoint saving is handled by CheckpointManager in state
    // Here we just transition through
    return { state: this.state, success: true };
  }

  /**
   * Handle the iteration decision phase using IterationController.
   */
  private handleIterationDecision(context: PhaseContext): PhaseResult {
    if (!this.state || !this.state.lastEvaluation) {
      return {
        state: this.state!,
        success: false,
        error: 'No evaluation available for iteration decision'
      };
    }

    context.onProgress('Analyzing evaluation results...', 'Deciding next action');

    // Use iteration controller to determine next phase
    const decision = this.iterationController.determineNextPhase(
      this.state,
      this.state.lastEvaluation as EvaluationResult
    );

    this.emitThought('reason', `Iteration decision: ${decision.reason}`);

    // Apply targeted scene updates if needed
    let updatedState = this.state;
    if (decision.targetScenes && decision.targetScenes.length > 0) {
      updatedState = setTargetScenes(this.state, decision.targetScenes);
      this.emitThought('act', `Targeting specific scenes for improvement: ${decision.targetScenes.join(', ')}`);
    } else {
      updatedState = clearTargetScenes(this.state);
    }

    // Increment round counter if going back to implementation
    if (decision.nextPhase === WorkflowPhase.IMPLEMENTATION) {
      updatedState = updateState(updatedState, {
        currentRound: updatedState.currentRound + 1
      });
    }

    // Store the decision for the next phase
    updatedState = transitionPhase(updatedState, decision.nextPhase, decision.reason);

    return { state: updatedState, success: true };
  }

  /**
   * Handle the rendering phase.
   * This is a placeholder - actual rendering is handled externally.
   */
  private handleRenderingPhase(context: PhaseContext): PhaseResult {
    if (!this.state) {
      return { state: this.state!, success: false, error: 'No state available' };
    }

    context.onProgress('Starting video render...', 'Invoking Remotion renderer');
    this.emitThought('act', 'Initiating video rendering process.');

    // Rendering is handled externally by RemotionRenderer
    // The API layer will call this and then invoke the renderer
    // For now, we transition to complete after rendering
    const updatedState = transitionPhase(
      this.state,
      WorkflowPhase.COMPLETE,
      'Video generation complete'
    );

    return { state: updatedState, success: true };
  }

  /**
   * Determine the next phase based on current phase and result.
   */
  private determineNextPhase(result: PhaseResult): WorkflowPhase {
    if (!this.state) {
      return WorkflowPhase.ERROR;
    }

    // Check if phase requires feedback
    if (result.requiresFeedback) {
      return WorkflowPhase.AWAITING_FEEDBACK;
    }

    // Force pause after PLANNING to allow user to review the script
    if (this.state.currentPhase === WorkflowPhase.PLANNING && result.success) {
      this.emitThought('observe', 'Plan generated. Pausing for user feedback.');
      return WorkflowPhase.AWAITING_FEEDBACK;
    }

    // Check if phase failed
    if (!result.success) {
      return WorkflowPhase.ERROR;
    }

    // Use PhaseManager's state machine for standard transitions
    return this.phaseManager.getNextPhase(this.state.currentPhase, result);
  }

  /**
   * Handle user feedback and resume the workflow.
   *
   * @param feedback - User feedback indicating how to proceed
   */
  async handleUserFeedback(feedback: UserFeedback): Promise<WorkflowState> {
    if (!this.state) {
      throw new Error('No workflow state available');
    }

    if (!this.isPaused) {
      throw new Error('Workflow is not paused. Cannot handle feedback.');
    }

    this.emitThought('observe', `Received user feedback: ${feedback.action}`);

    switch (feedback.action) {
      case 'approve':
        // Determine the next step based on where we are
        let nextPhase = WorkflowPhase.RENDERING;
        let msg = 'User approved. Proceeding to render.';

        // If we just finished planning (no rounds yet), go to IMPLEMENTATION
        if (this.state.plan && (!this.state.rounds || this.state.rounds.length === 0)) {
          nextPhase = WorkflowPhase.IMPLEMENTATION;
          msg = 'Plan approved. Starting implementation.';
        }

        this.state = transitionPhase(
          this.state,
          nextPhase,
          msg
        );
        break;

      case 'reject':
        // User rejected, go back to planning
        this.state = transitionPhase(
          this.state,
          WorkflowPhase.PLANNING,
          feedback.message || 'User requested changes. Restarting planning phase.'
        );
        // Reset round counter for fresh attempt
        this.state = updateState(this.state, { currentRound: 0 });
        break;

      case 'modify':
        // User wants specific modifications

        // 1. Apply plan updates if provided
        if (feedback.modifications?.plan && this.state.plan) {
          const updatedPlan = {
            ...this.state.plan,
            ...feedback.modifications.plan
          };
          this.state = updateState(this.state, { plan: updatedPlan });
          this.emitThought('act', 'Applied user modifications to the plan.');
        }

        const targetPhase = feedback.targetPhase || WorkflowPhase.IMPLEMENTATION;
        this.state = transitionPhase(
          this.state,
          targetPhase,
          feedback.message || 'Applying user modifications and proceeding.'
        );

        // Apply scene targeting if specified
        if (feedback.modifications?.scenes) {
          this.state = setTargetScenes(this.state, feedback.modifications.scenes);
        }
        break;

      default:
        throw new Error(`Unknown feedback action: ${feedback.action}`);
    }

    // Resume the loop
    this.isPaused = false;
    this.emitStateUpdate();
    await this.runLoop();

    return this.state;
  }

  /**
   * Check if a phase is a terminal state (workflow should stop).
   */
  private isTerminal(phase: WorkflowPhase): boolean {
    return phase === WorkflowPhase.COMPLETE || phase === WorkflowPhase.ERROR;
  }

  /**
   * Create phase context with callbacks for progress and thought emissions.
   */
  private createPhaseContext(): PhaseContext {
    return {
      onProgress: (message: string, detail?: string) => {
        this.emit('progress', message, detail);
        if (this.state) {
          this.state = updateState(this.state, {
            progress: {
              ...this.state.progress,
              currentMessage: message,
              subStep: detail
            }
          });
        }
      },
      onThought: (thought: AgentThought) => {
        this.emit('thought', thought);
        if (this.state) {
          this.state = addThought(this.state, thought);
        }
      }
    };
  }

  /**
   * Emit a thought to the cognitive trace.
   */
  private emitThought(type: 'reason' | 'act' | 'observe', content: string): void {
    const thought: AgentThought = {
      type,
      content,
      timestamp: new Date()
    };

    this.emit('thought', thought);

    if (this.state) {
      this.state = addThought(this.state, thought);
    }
  }

  /**
   * Emit current state update to listeners.
   */
  private emitStateUpdate(): void {
    if (this.state) {
      this.emit('stateUpdate', this.state);
    }
  }

  /**
   * Handle errors during workflow execution.
   */
  private handleError(error: Error): void {
    console.error('[WorkflowOrchestrator] Error:', error);

    if (this.state) {
      this.state = transitionPhase(
        this.state,
        WorkflowPhase.ERROR,
        error.message
      );
      this.emitStateUpdate();
    }

    this.emit('error', error);
    this.isRunning = false;
  }

  /**
   * Get a human-readable message for phase transitions.
   */
  private getPhaseTransitionMessage(phase: WorkflowPhase): string {
    const messages: Record<WorkflowPhase, string> = {
      [WorkflowPhase.INITIALIZATION]: 'Initializing workflow...',
      [WorkflowPhase.QUERY_ENHANCEMENT]: 'Enhancing query with context...',
      [WorkflowPhase.PLANNING]: 'Creating scene-by-scene plan...',
      [WorkflowPhase.IMPLEMENTATION]: 'Generating Remotion code...',
      [WorkflowPhase.CHECKPOINT]: 'Saving implementation checkpoint...',
      [WorkflowPhase.EVALUATION]: 'Evaluating generated code...',
      [WorkflowPhase.ITERATION_DECISION]: 'Analyzing results and deciding next step...',
      [WorkflowPhase.AWAITING_FEEDBACK]: 'Waiting for user feedback...',
      [WorkflowPhase.RENDERING]: 'Rendering final video...',
      [WorkflowPhase.COMPLETE]: 'Workflow complete!',
      [WorkflowPhase.ERROR]: 'An error occurred.'
    };

    return messages[phase] || `Entering ${phase} phase...`;
  }
}

// Export a factory function for creating orchestrators
export function createOrchestrator(config?: OrchestratorConfig): WorkflowOrchestrator {
  return new WorkflowOrchestrator(undefined, undefined, config);
}
