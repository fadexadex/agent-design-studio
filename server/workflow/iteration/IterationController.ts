import {
  WorkflowState,
  WorkflowPhase,
  canIterate
} from '../state';
import { EvaluationResult, EvaluationThresholds, SceneScore } from './SelfEvaluator';

/**
 * Decision result from the iteration controller.
 */
export interface IterationDecision {
  nextPhase: WorkflowPhase;
  reason: string;
  targetScenes?: string[]; // Scene IDs to focus on in next round
  shouldNotify?: boolean; // Whether to emit an agent thought
}

/**
 * IterationController is the "Brain" of the workflow.
 *
 * It analyzes evaluation results and makes intelligent decisions about:
 * 1. Whether to iterate (loop back to implementation)
 * 2. Whether to request user feedback
 * 3. Whether to proceed to rendering
 * 4. Which specific scenes need rework (targeted iteration)
 *
 * This enables efficient iteration by only regenerating failing scenes
 * rather than the entire composition.
 */
export class IterationController {
  /**
   * Determine the next workflow phase based on evaluation results.
   *
   * Decision logic:
   * 1. Score >= 70 → RENDERING (success)
   * 2. Score < 60, has failing scenes, can iterate → IMPLEMENTATION (target specific scenes)
   * 3. Score < 50 OR >50% scenes failing → AWAITING_FEEDBACK (needs human help)
   * 4. Score < 70, can iterate → IMPLEMENTATION (full retry)
   * 5. Cannot iterate → AWAITING_FEEDBACK (out of retries)
   */
  determineNextPhase(state: WorkflowState, evaluation: EvaluationResult): IterationDecision {
    const { score, sceneScores, passesThreshold, needsUserFeedback } = evaluation;

    // 1. High score - proceed to rendering
    if (passesThreshold) {
      return {
        nextPhase: WorkflowPhase.RENDERING,
        reason: `Evaluation score ${score}/100 passes threshold. Ready for rendering.`,
        shouldNotify: true
      };
    }

    // Check if we can still iterate
    const canStillIterate = canIterate(state);

    // 2. Check for per-scene failures (targeted iteration)
    const failingScenes = sceneScores.filter(s => s.score < EvaluationThresholds.SCENE_FAILING);
    const totalScenes = sceneScores.length;

    if (failingScenes.length > 0 && failingScenes.length < totalScenes && canStillIterate) {
      // Only some scenes failed - do targeted iteration
      return {
        nextPhase: WorkflowPhase.IMPLEMENTATION,
        reason: `${failingScenes.length}/${totalScenes} scenes need improvement. Targeting specific scene fixes.`,
        targetScenes: failingScenes.map(s => s.sceneId),
        shouldNotify: true
      };
    }

    // 3. Critical failure or too many issues - need user feedback
    if (needsUserFeedback || score < EvaluationThresholds.NEEDS_FEEDBACK) {
      return {
        nextPhase: WorkflowPhase.AWAITING_FEEDBACK,
        reason: `Score ${score}/100 indicates fundamental issues. User guidance needed.`,
        shouldNotify: true
      };
    }

    // 4. Can iterate - do a full retry
    if (canStillIterate) {
      return {
        nextPhase: WorkflowPhase.IMPLEMENTATION,
        reason: `Score ${score}/100 below threshold. Starting implementation round ${state.currentRound + 1}/${state.maxRounds}.`,
        shouldNotify: true
      };
    }

    // 5. Out of retries - request user feedback
    return {
      nextPhase: WorkflowPhase.AWAITING_FEEDBACK,
      reason: `Maximum iterations (${state.maxRounds}) reached with score ${score}/100. User guidance required.`,
      shouldNotify: true
    };
  }

  /**
   * Check if the workflow should stop immediately.
   * This is used for early termination conditions.
   */
  shouldHalt(state: WorkflowState, evaluation: EvaluationResult): boolean {
    // Halt if:
    // 1. Score is critically low and we're out of retries
    // 2. There's a fundamental error that can't be fixed automatically
    const criticallyLow = evaluation.score < EvaluationThresholds.CRITICAL_FAILURE;
    const outOfRetries = !canIterate(state);

    return criticallyLow && outOfRetries;
  }

  /**
   * Prepare state for targeted iteration.
   * Sets up the state to only regenerate specific scenes.
   */
  prepareTargetedIteration(
    state: WorkflowState,
    targetScenes: string[]
  ): Partial<WorkflowState> {
    return {
      // Store target scenes for the next implementation round
      // The ImplementationPhase will read this to know which scenes to regenerate
    };
  }

  /**
   * Get a summary of the iteration decision for logging/UI.
   */
  summarizeDecision(decision: IterationDecision, evaluation: EvaluationResult): string {
    const parts: string[] = [
      `Decision: ${decision.nextPhase}`,
      `Reason: ${decision.reason}`
    ];

    if (decision.targetScenes?.length) {
      parts.push(`Target scenes: ${decision.targetScenes.join(', ')}`);
    }

    parts.push(`Global score: ${evaluation.score}/100`);
    parts.push(`Compilability: ${evaluation.compilability}/100`);
    parts.push(`Visual fidelity: ${evaluation.visualFidelity}/100`);

    const failingScenes = evaluation.sceneScores.filter(
      s => s.score < EvaluationThresholds.SCENE_FAILING
    );
    if (failingScenes.length > 0) {
      parts.push(`Failing scenes: ${failingScenes.map(s => `Scene ${s.sceneNumber} (${s.score}/100)`).join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Generate improvement suggestions based on evaluation.
   */
  generateImprovementPlan(
    evaluation: EvaluationResult,
    targetScenes?: string[]
  ): string[] {
    const suggestions: string[] = [];

    // Add global suggestions
    suggestions.push(...evaluation.globalSuggestions);

    // Add scene-specific suggestions if targeting specific scenes
    if (targetScenes?.length) {
      const targetSet = new Set(targetScenes);
      for (const scene of evaluation.sceneScores) {
        if (targetSet.has(scene.sceneId) && scene.suggestions.length > 0) {
          suggestions.push(`Scene ${scene.sceneNumber}: ${scene.suggestions.join(', ')}`);
        }
      }
    }

    // Add metric-based suggestions
    if (evaluation.compilability < 70) {
      suggestions.push('Fix compilation errors before focusing on visual quality');
    }
    if (evaluation.visualFidelity < 70) {
      suggestions.push('Ensure all planned visual elements are implemented');
    }
    if (evaluation.animationSmoothness < 70) {
      suggestions.push('Review animation timing and easing functions');
    }
    if (evaluation.brandConsistency < 70) {
      suggestions.push('Ensure brand colors and typography are applied correctly');
    }

    // Deduplicate
    return Array.from(new Set(suggestions));
  }
}

// Export singleton instance
export const iterationController = new IterationController();
