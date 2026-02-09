import { PlanningService } from '../services/PlanningService.js';
import { ConcatenationService } from '../services/ConcatenationService.js';
import { DirectorStateAnnotation, DirectorState } from '../state/DirectorState.js';
import { SceneState } from '../state/SceneState.js';
import { EventBridge } from '../services/EventBridge.js';
import { createSceneState } from '../../types.js'; // Need to ensure this import works or copy it
import path from 'path';
import fs from 'fs/promises';

/**
 * Convert an absolute video path to an API URL for frontend consumption
 */
const toVideoUrl = (absolutePath: string, projectId: string): string => {
  // Extract filename from absolute path
  const filename = path.basename(absolutePath);
  return `/api/preview/${projectId}/${filename}`;
};

// Helper to create initial SceneState from definition
const initSceneState = (def: any, projectId: string, brandContext: any): SceneState => ({
  projectId,
  sceneId: def.id,
  sceneIndex: def.index,
  version: 0,
  prompt: def.description,
  brandContext,
  durationFrames: def.durationFrames,
  status: 'pending',
  attempts: 0,
});

export const plannerNode = async (state: typeof DirectorStateAnnotation.State) => {
  console.log(`[Graph:Director] Planning video for project ${state.projectId}`);
  
  try {
    // Emit thinking event
    await EventBridge.directorThinking(
      state.projectId,
      'planning',
      'Analyzing brand context and creating scene breakdown...'
    );

    const videoPlan = await PlanningService.createVideoPlan(state.brandContext);
    
    // Initialize scenes
    const scenes = videoPlan.scenes.map(def => 
      initSceneState(def, state.projectId, state.brandContext)
    );

    // Emit director started with total scene count
    await EventBridge.directorStarted(state.projectId, scenes.length, {
      aspectRatio: state.brandContext.aspectRatio,
      style: state.brandContext.style,
    });

    // Emit decision event
    await EventBridge.directorDecision(
      state.projectId,
      `Created ${scenes.length}-scene video plan`,
      `Breaking down the brand video into ${scenes.length} distinct scenes based on brand context and creative goals.`,
      scenes.map(s => s.sceneId)
    );

    // Queue all scenes
    for (const scene of scenes) {
      await EventBridge.sceneQueued(scene);
    }

    return {
      videoPlan,
      scenes,
      status: 'generating' as const,
    };
  } catch (error) {
    console.error(`[Graph:Director] Planning failed:`, error);
    await EventBridge.directorError(
      state.projectId,
      error instanceof Error ? error.message : String(error),
      'planning',
      false
    );
    return {
      status: 'failed' as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Global Review Node
 * 
 * The Director reviews all completed scenes together to assess overall quality.
 * This replaces per-scene evaluation with a holistic review at the end.
 * 
 * The Director can:
 * - Accept all scenes and proceed to final production
 * - Flag scenes that need improvement (for future iterations)
 * - Provide overall feedback on the video composition
 */
export const globalReviewNode = async (state: typeof DirectorStateAnnotation.State) => {
  console.log(`[Graph:Director] Global review for project ${state.projectId}`);
  
  try {
    // Emit thinking event - evaluating phase
    await EventBridge.directorThinking(
      state.projectId,
      'evaluating',
      'Reviewing all completed scenes for overall quality and coherence...'
    );

    // Gather scene statistics
    const passedScenes = state.scenes.filter(s => 
      s.status === 'passed' || s.lastDecision === 'pass'
    );
    const failedScenes = state.scenes.filter(s => 
      s.status === 'failed' || s.lastDecision === 'fail'
    );

    // Log scene summary
    console.log(`[Graph:Director] Review: ${passedScenes.length} passed, ${failedScenes.length} failed`);

    // Emit tier-2 evaluation started
    await EventBridge.tier2EvaluationStarted(state.projectId);

    // For now, we do a simple review:
    // - If we have at least 1 passed scene, we consider the project viable
    // - In the future, this could call an AI to review the scenes holistically
    
    const hasViableScenes = passedScenes.length > 0;
    
    // Calculate overall score (average of passed scenes, or 0 if none)
    const overallScore = passedScenes.length > 0
      ? passedScenes.reduce((sum, s) => sum + (s.score ?? 80), 0) / passedScenes.length
      : 0;

    // Build review feedback
    let feedback: string;
    if (failedScenes.length === 0) {
      feedback = `All ${passedScenes.length} scenes completed successfully. Ready for final production.`;
    } else if (hasViableScenes) {
      feedback = `${passedScenes.length} of ${state.scenes.length} scenes ready. ${failedScenes.length} scene(s) failed but video can still be produced.`;
    } else {
      feedback = `All scenes failed. Unable to produce final video.`;
    }

    // Emit tier-2 evaluation completed
    await EventBridge.tier2EvaluationCompleted(
      state.projectId,
      overallScore,
      hasViableScenes,
      feedback,
      {
        passedScenes: passedScenes.length,
        failedScenes: failedScenes.length,
        totalScenes: state.scenes.length,
      }
    );

    // Emit thinking with decision
    await EventBridge.directorThinking(
      state.projectId,
      'deciding',
      hasViableScenes 
        ? `Global review passed. Proceeding with ${passedScenes.length} scene(s) to final production.`
        : 'Global review failed. No viable scenes available.'
    );

    // Emit decision event
    await EventBridge.directorDecision(
      state.projectId,
      hasViableScenes ? 'Approved for final production' : 'Rejected - no viable scenes',
      feedback,
      passedScenes.map(s => s.sceneId)
    );

    return {
      // Update overall score in state
      // The status remains 'generating' until finalProducerNode completes
    };
  } catch (error) {
    console.error(`[Graph:Director] Global review failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await EventBridge.directorError(
      state.projectId,
      errorMessage,
      'global_review',
      true // Recoverable - can still try to produce with available scenes
    );

    // Don't fail the workflow - let finalProducerNode handle what we have
    return {};
  }
};

export const finalProducerNode = async (state: typeof DirectorStateAnnotation.State) => {
  console.log(`[Graph:Director] Producing final video for project ${state.projectId}`);
  
  const startTime = Date.now();

  if (state.status === 'completed' || state.finalOutput) {
    console.log(`[Graph:Director] Project already completed, skipping production.`);
    return {};
  }

  try {
    // Collect only PASSED scenes for final video (failed scenes won't have video paths)
    const sortedScenes = [...state.scenes].sort((a, b) => a.sceneIndex - b.sceneIndex);
    const passedScenes = sortedScenes.filter(s => 
      s.status === 'passed' || s.lastDecision === 'pass'
    );
    const failedCount = sortedScenes.length - passedScenes.length;

    // If no scenes passed, fail gracefully
    if (passedScenes.length === 0) {
      throw new Error('No scenes passed evaluation. Cannot produce final video.');
    }

    // Log if some scenes failed
    if (failedCount > 0) {
      console.warn(`[Graph:Director] ${failedCount} scene(s) failed, proceeding with ${passedScenes.length} passed scene(s)`);
      
      await EventBridge.directorThinking(
        state.projectId,
        'coordinating',
        `${failedCount} scene(s) failed. Concatenating ${passedScenes.length} successful scene(s)...`
      );
    } else {
      // Emit thinking event
      await EventBridge.directorThinking(
        state.projectId,
        'coordinating',
        'All scenes complete. Concatenating into final video...'
      );
    }

    // Collect video paths from passed scenes only
    const videoPaths = passedScenes.map(s => s.videoPath).filter((p): p is string => !!p);
    
    // Verify all passed scenes have video paths
    if (videoPaths.length !== passedScenes.length) {
      const missingScenes = passedScenes
        .filter(s => !s.videoPath)
        .map(s => `Scene ${s.sceneIndex}`)
        .join(', ');
      throw new Error(`Missing video paths for passed scenes: ${missingScenes}`);
    }

    const outputDir = `output/final/${state.projectId}`;
    const outputPath = `${outputDir}/video.mp4`;
    
    // Ensure absolute path for service
    const absOutputPath = path.join(process.cwd(), outputPath);
    await fs.mkdir(path.dirname(absOutputPath), { recursive: true });

    // Emit render started for final concatenation
    await EventBridge.renderStarted(state.projectId, 'final');

    // Use absolute paths for ffmpeg
    const absVideoPaths = videoPaths.map(p => path.isAbsolute(p) ? p : path.join(process.cwd(), p));

    await ConcatenationService.concatenateVideos(state.projectId, absVideoPaths, absOutputPath);

    const totalDurationMs = Date.now() - startTime;

    // Calculate average score from passed scenes
    const avgScore = passedScenes.length > 0
      ? passedScenes.reduce((sum, s) => sum + (s.score ?? 0), 0) / passedScenes.length
      : 0;

    // Get file size for render completed event
    const stats = await fs.stat(absOutputPath);

    // Emit render completed
    await EventBridge.renderCompleted(
      state.projectId,
      'final',
      totalDurationMs,
      outputPath,
      stats.size
    );

    // Emit preview:all_complete event with all scene paths (as URLs for frontend)
    const scenePaths = passedScenes.map(s => ({
      sceneIndex: s.sceneIndex,
      sceneId: s.sceneId,
      videoPath: toVideoUrl(s.videoPath!, state.projectId),
    }));
    
    // Convert final output to URL as well
    const finalVideoUrl = `/api/video/${state.projectId}`;
    
    await EventBridge.previewAllComplete(
      state.projectId,
      passedScenes.length,
      scenePaths,
      finalVideoUrl
    );

    // Emit director completed
    const summaryMessage = failedCount > 0
      ? `Generated ${passedScenes.length}-scene video (${failedCount} scene(s) failed). Average quality score: ${Math.round(avgScore * 100) / 100}.`
      : `Successfully generated ${passedScenes.length}-scene video with average quality score of ${Math.round(avgScore * 100) / 100}.`;
    
    await EventBridge.directorCompleted(
      state.projectId,
      true,
      totalDurationMs,
      Math.round(avgScore * 100) / 100,
      summaryMessage
    );

    return {
      finalOutput: outputPath,
      status: 'completed' as const,
    };
  } catch (error) {
    console.error(`[Graph:Director] Final production failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Emit render error
    await EventBridge.renderError(
      state.projectId,
      'final',
      errorMessage
    );

    // Emit preview error for the final video
    await EventBridge.previewError(
      state.projectId,
      `Final video production failed: ${errorMessage}`
    );

    // Emit director error
    await EventBridge.directorError(
      state.projectId,
      errorMessage,
      'final_production',
      false
    );

    return {
      status: 'failed' as const,
      error: errorMessage,
    };
  }
};
