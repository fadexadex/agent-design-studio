/**
 * LangGraphExecutor Service
 * 
 * Bridge between WorkflowOrchestrator and the LangGraph-based Director-Agent system.
 * This service wraps the directorGraph.invoke() call and transforms the results
 * to match the format expected by WorkflowOrchestrator.
 */

import { directorGraph } from '../workflows/directorGraph.js';
import { DirectorState } from '../state/DirectorState.js';
import { SceneState } from '../state/SceneState.js';
import { BrandContext, VideoPlan, SceneDefinition } from '../../types.js';
import { EventBridge } from './EventBridge.js';

/**
 * Input format for LangGraph execution.
 * Matches what WorkflowOrchestrator provides.
 */
export interface LangGraphExecutorInput {
  projectId: string;
  brandContext: BrandContext;
  /** If provided, skip planning and use this plan directly */
  existingPlan?: {
    scenes: Array<{
      id: string;
      sceneNumber: number;
      description: string;
      frameRange: { start: number; end: number };
      keyElements?: string[];
    }>;
    approach?: string;
  };
}

/**
 * Output format from LangGraph execution.
 * Matches what WorkflowOrchestrator expects.
 */
export interface LangGraphExecutorOutput {
  success: boolean;
  /** Path to the final concatenated video */
  finalVideoPath?: string;
  /** Generated scenes with their states */
  scenes: Array<{
    sceneId: string;
    sceneIndex: number;
    version: number;
    code?: string;
    videoPath?: string;
    score?: number;
    passed: boolean;
    error?: string;
  }>;
  /** Overall statistics */
  stats: {
    totalDurationMs: number;
    averageScore: number;
    passedScenes: number;
    failedScenes: number;
  };
  /** Error message if failed */
  error?: string;
}

/**
 * LangGraphExecutor wraps the LangGraph director workflow
 * and provides an interface compatible with WorkflowOrchestrator.
 */
export class LangGraphExecutor {
  /**
   * Execute the LangGraph director workflow.
   * 
   * @param input - Project ID, brand context, and optional existing plan
   * @returns Execution results in a format WorkflowOrchestrator can use
   */
  static async execute(input: LangGraphExecutorInput): Promise<LangGraphExecutorOutput> {
    const startTime = Date.now();
    
    console.log(`[LangGraphExecutor] Starting execution for project ${input.projectId}`);

    try {
      // Build initial state for the director graph
      const initialState: Partial<DirectorState> = {
        projectId: input.projectId,
        brandContext: input.brandContext,
        scenes: [],
        status: 'planning',
      };

      // If we have an existing plan from WorkflowOrchestrator, convert it to VideoPlan
      // and pre-create scene states so planner can be skipped
      if (input.existingPlan && input.existingPlan.scenes.length > 0) {
        const videoPlan = this.convertToVideoPlan(input.existingPlan, input.brandContext);
        const scenes = this.createInitialSceneStates(
          videoPlan.scenes,
          input.projectId,
          input.brandContext
        );

        initialState.videoPlan = videoPlan;
        initialState.scenes = scenes;
        initialState.status = 'generating';

        // Emit events for the pre-loaded plan
        await EventBridge.directorStarted(input.projectId, scenes.length, {
          aspectRatio: input.brandContext.aspectRatio,
          style: input.brandContext.style,
          source: 'existing_plan',
        });

        for (const scene of scenes) {
          await EventBridge.sceneQueued(scene);
        }
      }

      // Invoke the LangGraph director workflow
      const result = await directorGraph.invoke(initialState);

      const totalDurationMs = Date.now() - startTime;

      // Transform the LangGraph result to our output format
      return this.transformResult(result, totalDurationMs);

    } catch (error) {
      const totalDurationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`[LangGraphExecutor] Execution failed:`, error);

      // Emit error event
      await EventBridge.directorError(
        input.projectId,
        errorMessage,
        'execution',
        false
      );

      return {
        success: false,
        scenes: [],
        stats: {
          totalDurationMs,
          averageScore: 0,
          passedScenes: 0,
          failedScenes: 0,
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Convert WorkflowOrchestrator plan format to LangGraph VideoPlan format.
   */
  private static convertToVideoPlan(
    existingPlan: NonNullable<LangGraphExecutorInput['existingPlan']>,
    brandContext: BrandContext
  ): VideoPlan {
    // Calculate dimensions based on aspect ratio
    const [widthRatio, heightRatio] = (brandContext.aspectRatio || '16:9')
      .split(':')
      .map(Number);
    
    const width = widthRatio > heightRatio ? 1920 : 1080;
    const height = widthRatio > heightRatio ? 1080 : 1920;

    // Convert scenes to SceneDefinition format
    const scenes: SceneDefinition[] = existingPlan.scenes.map((scene, idx) => ({
      id: scene.id,
      index: idx,
      title: `Scene ${scene.sceneNumber}`,
      description: scene.description,
      durationFrames: scene.frameRange.end - scene.frameRange.start + 1,
      startFrame: scene.frameRange.start,
      elements: {
        text: scene.keyElements?.filter(k => k.toLowerCase().includes('text')) || [],
        animations: scene.keyElements?.filter(k => !k.toLowerCase().includes('text')) || [],
      },
    }));

    // Calculate total frames
    const totalFrames = scenes.reduce((max, s) => 
      Math.max(max, s.startFrame + s.durationFrames), 0
    );

    return {
      totalFrames,
      fps: 30,
      width,
      height,
      aspectRatio: brandContext.aspectRatio,
      scenes,
      styleNotes: existingPlan.approach,
    };
  }

  /**
   * Create initial SceneState objects from SceneDefinitions.
   */
  private static createInitialSceneStates(
    definitions: SceneDefinition[],
    projectId: string,
    brandContext: BrandContext
  ): SceneState[] {
    return definitions.map(def => ({
      projectId,
      sceneId: def.id,
      sceneIndex: def.index,
      version: 0,
      prompt: def.description,
      brandContext,
      durationFrames: def.durationFrames,
      status: 'pending' as const,
      attempts: 0,
    }));
  }

  /**
   * Transform LangGraph DirectorState result to our output format.
   */
  private static transformResult(
    result: typeof directorGraph extends { invoke: (input: any) => Promise<infer R> } ? R : never,
    totalDurationMs: number
  ): LangGraphExecutorOutput {
    const state = result as DirectorState;
    
    // Determine success
    const success = state.status === 'completed' && !!state.finalOutput;
    
    // Transform scenes
    const scenes = state.scenes.map(scene => ({
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      version: scene.version,
      code: scene.code,
      videoPath: scene.videoPath,
      score: scene.score,
      passed: scene.status === 'passed' || scene.lastDecision === 'pass',
      error: scene.failureReason,
    }));

    // Calculate statistics
    const passedScenes = scenes.filter(s => s.passed).length;
    const failedScenes = scenes.filter(s => !s.passed && s.error).length;
    const scoresWithValues = scenes.filter(s => s.score !== undefined);
    const averageScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, s) => sum + (s.score ?? 0), 0) / scoresWithValues.length
      : 0;

    return {
      success,
      finalVideoPath: state.finalOutput,
      scenes,
      stats: {
        totalDurationMs,
        averageScore: Math.round(averageScore * 100) / 100,
        passedScenes,
        failedScenes,
      },
      error: state.error,
    };
  }

  /**
   * Check if LangGraph system is ready (Redis connection, etc.)
   */
  static async isReady(): Promise<boolean> {
    try {
      // Could add Redis health check here if needed
      // For now, just return true as the graph should be importable
      return true;
    } catch {
      return false;
    }
  }
}
