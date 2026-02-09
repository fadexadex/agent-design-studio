import { EventEmitter } from 'events';
import * as path from 'path';
import {
  WorkflowState,
  WorkflowPhase,
  createInitialState,
  updateState,
  transitionPhase,
  addThought,
  setTargetScenes,
  clearTargetScenes,
  storeEvaluation,
  SceneRenderStatus,
  ImplementationPlan,
  SceneDescription
} from './state';
import { PhaseManager, PhaseContext, PhaseResult } from './phases';
import { IterationController, IterationDecision, EvaluationResult } from './iteration';
import { BrandContext, VideoConfig } from '../agent/types';
import { AgentThought } from '../agent/orchestrator';
import { RemotionRenderer } from '../renderer/remotionRenderer';
import { StoryScript, Scene as StoryScene } from '../types/script.types';
import { LangGraphExecutor } from '../../agents/graph/services/LangGraphExecutor.js';

/**
 * Script data provided from the script generation endpoint.
 * Contains the narrative script and scene breakdown.
 * Can be either legacy format or full StoryScript.
 */
export interface ProvidedScript {
  script: string;
  scenes: Array<{
    id: string;
    sceneNumber: number;
    description: string;
    frameRange: { start: number; end: number };
    keyElements: string[];
    storyPhase?: string;
    textContent?: string[];
  }>;
  // Full StoryScript if available (provides text choreography data)
  storyScript?: StoryScript;
}

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
  sceneProgress: (status: SceneRenderStatus) => void;
  renderProgress: (data: { progress: number }) => void;
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
   * Start a new workflow with the given brand, config, and pre-generated script.
   *
   * @param jobId - Unique identifier for this workflow run
   * @param brand - Brand context for video generation
   * @param videoConfig - Video configuration (style, aspect ratio, etc.)
   * @param script - Pre-generated script with scenes (REQUIRED)
   */
  async start(
    jobId: string,
    brand: BrandContext,
    videoConfig: VideoConfig,
    script: ProvidedScript
  ): Promise<WorkflowState> {
    if (this.isRunning) {
      throw new Error('Workflow is already running. Call stop() first.');
    }

    // Validate that script is provided
    if (!script || !script.scenes || script.scenes.length === 0) {
      throw new Error('Script with scenes is required. Generate a script using /api/generate-script first.');
    }

    // Initialize state - skip INITIALIZATION phase since we have a pre-generated script
    this.state = createInitialState(jobId, brand, videoConfig);
    this.state.maxRounds = this.config.maxRounds!;
    this.isRunning = true;
    this.isPaused = false;

    // Convert the provided script scenes to SceneDescription format
    const sceneBreakdown: SceneDescription[] = this.convertToSceneDescriptions(script);

    // Create the implementation plan from the provided script
    const plan: ImplementationPlan = {
      approach: script.script, // The narrative script
      sceneBreakdown,
      estimatedComplexity: sceneBreakdown.length > 4 ? 'high' : sceneBreakdown.length > 2 ? 'medium' : 'low',
      createdAt: new Date()
    };

    // Set the plan, storyScript (if available), AND transition to AWAITING_FEEDBACK
    // This ensures the state is complete before any emissions
    this.state = updateState(this.state, {
      plan,
      storyScript: script.storyScript, // Store full StoryScript for choreography data
      currentPhase: WorkflowPhase.AWAITING_FEEDBACK,
      progress: {
        currentPhase: WorkflowPhase.AWAITING_FEEDBACK,
        phaseProgress: 100,
        currentMessage: 'Script loaded. Review and edit scenes, then approve to start implementation.'
      }
    });

    // Now emit state update - state is fully ready with plan and correct phase
    this.emitStateUpdate();
    this.emitThought('reason', 'Loading pre-generated script for review.');
    this.emitThought('observe', `Loaded ${sceneBreakdown.length} scenes from provided script${script.storyScript ? ' with full choreography data' : ''}. Ready for review.`);

    // Start the main loop (will immediately pause at AWAITING_FEEDBACK)
    await this.runLoop();

    return this.state;
  }

  /**
   * Convert ProvidedScript scenes to SceneDescription format.
   * If StoryScript is available, extract richer data from it.
   */
  private convertToSceneDescriptions(script: ProvidedScript): SceneDescription[] {
    // If we have a full StoryScript, use it for richer scene data
    if (script.storyScript && script.storyScript.scenes.length > 0) {
      return script.storyScript.scenes.map((storyScene, idx) => {
        // Extract text content from moments
        const textContent = storyScene.moments.flatMap(m => 
          m.textElements.map(t => t.content)
        );

        // Extract key elements from visual elements
        const keyElements = [
          ...storyScene.moments.flatMap(m => m.visualElements.map(v => v.name)),
          ...storyScene.moments.flatMap(m => m.textElements.map(t => `${t.purpose}: ${t.content}`))
        ].filter((v, i, a) => a.indexOf(v) === i);

        // Build description from moment narratives
        const description = storyScene.moments.map(m => m.visualAction).join(' ');

        // Map energy level
        const avgEnergy = storyScene.moments.reduce((acc, m) => {
          const energyMap: Record<string, number> = {
            intro: 1, building: 2, peak: 3, sustain: 2, resolution: 1, outro: 1
          };
          return acc + (energyMap[m.energyLevel] || 2);
        }, 0) / storyScene.moments.length;

        const energyLevel: 'high' | 'medium' | 'low' =
          avgEnergy > 2.5 ? 'high' : avgEnergy > 1.5 ? 'medium' : 'low';

        return {
          id: storyScene.id,
          sceneNumber: storyScene.sceneNumber,
          description,
          frameRange: storyScene.frameRange,
          keyElements,
          storyPhase: storyScene.storyPhase,
          textContent,
          visualStyle: 'kinetic_typography' as const,
          energyLevel,
          suggestedDuration: (storyScene.frameRange.end - storyScene.frameRange.start + 1) / 30
        };
      });
    }

    // Fall back to legacy scene format
    return script.scenes.map((scene, idx) => ({
      id: scene.id || `scene-${idx + 1}`,
      sceneNumber: scene.sceneNumber || idx + 1,
      description: scene.description,
      frameRange: scene.frameRange,
      keyElements: scene.keyElements || [],
      storyPhase: scene.storyPhase as SceneDescription['storyPhase'],
      textContent: scene.textContent,
      visualStyle: (scene as any).visualStyle || 'abstract_shape',
      energyLevel: (scene as any).energyLevel || 'medium',
      suggestedDuration: (scene as any).suggestedDuration || 5,
      textOverlay: (scene as any).textOverlay,
      cameraMovement: (scene as any).cameraMovement,
      assets: (scene as any).assets
    }));
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

    if (currentPhase === WorkflowPhase.IMPLEMENTATION) {
      // Implementation phase - use LangGraph Director-Agent system
      return this.handleImplementationPhase(context);
    }

    // Execute via PhaseManager for standard phases
    return await this.phaseManager.executePhase(currentPhase, this.state, context);
  }

  /**
   * Handle the implementation phase using LangGraph Director-Agent system.
   * This replaces the old scene-by-scene generation with the full LangGraph workflow.
   */
  private async handleImplementationPhase(context: PhaseContext): Promise<PhaseResult> {
    if (!this.state) {
      return { state: this.state!, success: false, error: 'No state available' };
    }

    if (!this.state.plan) {
      return { state: this.state, success: false, error: 'No plan available for implementation' };
    }

    context.onProgress('Starting LangGraph implementation...', 'Director-Agent system initializing');
    this.emitThought('act', 'Handing off to LangGraph Director-Agent system for scene generation.');

    try {
      // Convert brand colors from array to object format for agent
      const colorsArray = this.state.brand.colors;
      const colorsObject = {
        primary: colorsArray[0] || '#000000',
        secondary: colorsArray[1],
        accent: colorsArray[2],
        background: colorsArray[3],
      };

      // Convert brand context from workflow format to agent format
      const agentBrandContext = {
        name: this.state.brand.name,
        industry: this.state.brand.industry,
        tagline: this.state.brand.tagline,
        colors: colorsObject,
        logo: this.state.brand.logoPath || this.state.brand.logoBase64,
        style: this.state.config.style as 'minimal' | 'bold' | 'elegant' | 'playful' | 'corporate' | 'dynamic' | undefined,
        aspectRatio: this.state.config.aspectRatio,
        prompt: this.state.config.prompt || '',
      };

      // Execute LangGraph workflow
      const result = await LangGraphExecutor.execute({
        projectId: this.state.jobId,
        brandContext: agentBrandContext,
        existingPlan: {
          scenes: this.state.plan.sceneBreakdown.map(scene => ({
            id: scene.id,
            sceneNumber: scene.sceneNumber,
            description: scene.description,
            frameRange: scene.frameRange,
            keyElements: scene.keyElements,
          })),
          approach: this.state.plan.approach,
        },
      });

      if (!result.success) {
        this.emitThought('observe', `LangGraph execution failed: ${result.error}`);
        context.onProgress('Implementation failed', result.error || 'Unknown error');
        
        const errorState = transitionPhase(
          this.state,
          WorkflowPhase.ERROR,
          `LangGraph execution failed: ${result.error}`
        );
        
        return { state: errorState, success: false, error: result.error };
      }

      // Update state with results
      this.emitThought('observe', `LangGraph completed: ${result.stats.passedScenes}/${result.scenes.length} scenes passed with avg score ${result.stats.averageScore}`);
      context.onProgress('Implementation complete', `Generated ${result.scenes.length} scenes`);

      // Store scene results in state
      const sceneStatuses: SceneRenderStatus[] = result.scenes.map(scene => ({
        sceneNumber: scene.sceneIndex + 1,
        sceneId: scene.sceneId,
        status: scene.passed ? 'complete' as const : 'error' as const,
        progress: 100,
        message: scene.passed ? 'Scene completed' : (scene.error || 'Scene failed'),
        error: scene.error,
      }));

      // If we have a final video, skip RENDERING and go straight to COMPLETE
      let nextPhase = WorkflowPhase.RENDERING;
      let updatedState = updateState(this.state, {
        sceneStatuses,
        outputVideoPath: result.finalVideoPath,
      });

      if (result.finalVideoPath) {
        // LangGraph produced the final video, skip to COMPLETE
        nextPhase = WorkflowPhase.COMPLETE;
        updatedState = transitionPhase(updatedState, nextPhase, 'Video generation complete via LangGraph');
        this.emitThought('observe', `Final video ready at: ${result.finalVideoPath}`);
      } else {
        // Need to render the final video
        updatedState = transitionPhase(updatedState, nextPhase, 'Proceeding to rendering phase');
      }

      return { state: updatedState, success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitThought('observe', `Implementation error: ${errorMessage}`);
      context.onProgress('Implementation error', errorMessage);

      const errorState = transitionPhase(
        this.state,
        WorkflowPhase.ERROR,
        `Implementation failed: ${errorMessage}`
      );

      return { state: errorState, success: false, error: errorMessage };
    }
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
   * Actually invokes the RemotionRenderer to render the final video.
   */
  private async handleRenderingPhase(context: PhaseContext): Promise<PhaseResult> {
    if (!this.state) {
      return { state: this.state!, success: false, error: 'No state available' };
    }

    context.onProgress('Starting video render...', 'Preparing Remotion renderer');
    this.emitThought('act', 'Initiating video rendering process.');

    try {
      // Find the MainComposition file from the generated scenes
      const generatedScenesDir = path.join(process.cwd(), 'remotion', 'src', 'generated', 'scenes');
      const mainCompositionPath = path.join(generatedScenesDir, 'MainComposition.tsx');

      // Check if we have implementation rounds with files
      if (this.state.rounds.length === 0) {
        throw new Error('No implementation rounds found - cannot render without generated code');
      }

      const lastRound = this.state.rounds[this.state.rounds.length - 1];
      if (!lastRound.files || lastRound.files.length === 0) {
        throw new Error('No generated files found in the last implementation round');
      }

      // Create renderer and render the video
      const renderer = new RemotionRenderer();

      this.emitThought('observe', 'Bundling Remotion project and rendering frames...');

      const videoPath = await renderer.render(
        mainCompositionPath,
        this.state.config,
        (progress: number) => {
          const progressPercent = Math.round(progress * 100);
          context.onProgress(`Rendering video: ${progressPercent}%`, 'Encoding video frames');

          // Emit a render progress event
          this.emit('renderProgress', { progress: progressPercent });

          // Update state with render progress
          if (this.state) {
            this.state = updateState(this.state, {
              progress: {
                ...this.state.progress,
                phaseProgress: progressPercent,
                currentMessage: `Rendering: ${progressPercent}%`,
                subStep: 'Encoding frames'
              }
            });
          }
        }
      );

      this.emitThought('observe', `Video rendered successfully: ${videoPath}`);
      context.onProgress('Video render complete!', 'Video ready for playback');

      // Update state with the output video path
      const updatedState = updateState(
        transitionPhase(this.state, WorkflowPhase.COMPLETE, 'Video generation complete'),
        { outputVideoPath: videoPath }
      );

      return { state: updatedState, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitThought('observe', `Rendering failed: ${errorMessage}`);
      context.onProgress('Rendering failed', errorMessage);

      // Transition to error state
      const errorState = transitionPhase(
        this.state,
        WorkflowPhase.ERROR,
        `Rendering failed: ${errorMessage}`
      );

      return { state: errorState, success: false, error: errorMessage };
    }
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
        // Apply any modifications if provided (user may have edited scenes before approving)
        if (feedback.modifications?.plan && this.state.plan) {
          let updatedSceneBreakdown = this.state.plan.sceneBreakdown;

          if (feedback.modifications.plan.sceneBreakdown) {
            const originalScenes = this.state.plan.sceneBreakdown;
            const modifiedScenes = feedback.modifications.plan.sceneBreakdown;

            updatedSceneBreakdown = modifiedScenes.map((modifiedScene, idx) => {
              const originalScene = originalScenes.find(os => os.id === modifiedScene.id);

              if (originalScene) {
                return {
                  ...originalScene,
                  ...modifiedScene,
                  frameRange: modifiedScene.frameRange || originalScene.frameRange,
                  keyElements: modifiedScene.keyElements || originalScene.keyElements
                };
              } else {
                return {
                  id: modifiedScene.id,
                  sceneNumber: modifiedScene.sceneNumber || idx + 1,
                  description: modifiedScene.description || 'New scene',
                  frameRange: modifiedScene.frameRange || { start: idx * 270, end: (idx + 1) * 270 },
                  keyElements: modifiedScene.keyElements || ['animated element', 'brand colors']
                };
              }
            });
          }

          const updatedPlan = {
            ...this.state.plan,
            ...feedback.modifications.plan,
            sceneBreakdown: updatedSceneBreakdown
          };
          this.state = updateState(this.state, { plan: updatedPlan });
          this.emitThought('act', 'Applied user scene edits before proceeding.');
        }

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
        // User rejected - since we use pre-generated scripts, go to error state
        // The user should generate a new script via /api/generate-script and start a new workflow
        this.state = transitionPhase(
          this.state,
          WorkflowPhase.ERROR,
          feedback.message || 'Workflow rejected. Please generate a new script and start a new workflow.'
        );
        break;

      case 'modify':
        // User wants specific modifications

        // 1. Apply plan updates if provided - do DEEP merge to preserve scene data
        if (feedback.modifications?.plan && this.state.plan) {
          let updatedSceneBreakdown = this.state.plan.sceneBreakdown;

          // If sceneBreakdown is being modified, do a deep merge per-scene
          if (feedback.modifications.plan.sceneBreakdown) {
            const originalScenes = this.state.plan.sceneBreakdown;
            const modifiedScenes = feedback.modifications.plan.sceneBreakdown;

            updatedSceneBreakdown = modifiedScenes.map((modifiedScene, idx) => {
              // Find the original scene by ID to preserve unchanged fields
              const originalScene = originalScenes.find(os => os.id === modifiedScene.id);

              if (originalScene) {
                // Merge: modified fields override original, but keep original for anything not specified
                return {
                  ...originalScene,
                  ...modifiedScene,
                  // Ensure critical fields are always present
                  frameRange: modifiedScene.frameRange || originalScene.frameRange,
                  keyElements: modifiedScene.keyElements || originalScene.keyElements
                };
              } else {
                // New scene - ensure all required fields are present
                return {
                  id: modifiedScene.id,
                  sceneNumber: modifiedScene.sceneNumber || idx + 1,
                  description: modifiedScene.description || 'New scene',
                  frameRange: modifiedScene.frameRange || { start: idx * 270, end: (idx + 1) * 270 },
                  keyElements: modifiedScene.keyElements || ['animated element', 'brand colors']
                };
              }
            });
          }

          const updatedPlan = {
            ...this.state.plan,
            ...feedback.modifications.plan,
            sceneBreakdown: updatedSceneBreakdown
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
      },
      onSceneProgress: (status: SceneRenderStatus) => {
        this.emit('sceneProgress', status);
        // Also update state with the scene status
        if (this.state) {
          const existingStatuses = this.state.sceneStatuses || [];
          const updatedStatuses = existingStatuses.map(s =>
            s.sceneNumber === status.sceneNumber ? status : s
          );
          // If the scene wasn't in the list, add it
          if (!existingStatuses.find(s => s.sceneNumber === status.sceneNumber)) {
            updatedStatuses.push(status);
          }
          this.state = updateState(this.state, {
            sceneStatuses: updatedStatuses
          });
        }
        // Emit a state update so the frontend gets the new scene status
        this.emitStateUpdate();
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
