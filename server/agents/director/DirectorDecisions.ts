/**
 * Director Decisions
 * 
 * Decision engine for the Director agent.
 * Implements logic for:
 * - Diminishing returns detection
 * - Escalation decisions
 * - Global iteration decisions
 * - Satisfaction evaluation
 */

import {
  SCORE_THRESHOLDS,
  SceneState,
  AgentReflection,
  createReflection,
} from '../types.js';
import {
  DirectorState,
  getScenesInOrder,
  getLatestSceneScores,
  calculateWeightedMeanSceneScore,
} from './DirectorState.js';
import {
  DirectorCommand,
  RegenerateSceneCommand,
  EscalateSceneCommand,
  StartGlobalIterationCommand,
  createCommand,
} from './DirectorCommands.js';

// ============================================================================
// Decision Types
// ============================================================================

export type DecisionType =
  | 'continue_local'      // Continue with local scene iterations
  | 'escalate_scene'      // Escalate scene to Director
  | 'start_global'        // Start global evaluation
  | 'global_iterate'      // Run another global iteration
  | 'accept_output'       // Accept current output as final
  | 'fail_project';       // Give up on the project

export interface Decision {
  type: DecisionType;
  reasoning: string;
  confidence: number;
  commands: DirectorCommand[];
  reflection: AgentReflection;
}

// ============================================================================
// Diminishing Returns Detection
// ============================================================================

/**
 * Check if a scene is showing diminishing returns
 */
export function detectDiminishingReturns(
  scoreHistory: number[],
  windowSize: number = SCORE_THRESHOLDS.DIMINISHING_RETURNS_WINDOW,
  minDelta: number = SCORE_THRESHOLDS.DIMINISHING_RETURNS_DELTA
): { detected: boolean; reason: string } {
  if (scoreHistory.length < windowSize) {
    return { detected: false, reason: 'Not enough history' };
  }

  const recent = scoreHistory.slice(-windowSize);
  
  // Check if scores are plateauing (all within minDelta of each other)
  const max = Math.max(...recent);
  const min = Math.min(...recent);
  const range = max - min;
  
  if (range < minDelta) {
    return {
      detected: true,
      reason: `Scores plateaued: range ${range.toFixed(3)} < threshold ${minDelta}`,
    };
  }

  // Check for declining trend
  let declineCount = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] < recent[i - 1]) {
      declineCount++;
    }
  }
  
  if (declineCount >= windowSize - 1) {
    return {
      detected: true,
      reason: 'Scores declining consistently',
    };
  }

  return { detected: false, reason: 'Scores still improving' };
}

// ============================================================================
// Scene-Level Decisions
// ============================================================================

/**
 * Decide what to do after a scene evaluation
 */
export function decideAfterSceneEvaluation(
  state: DirectorState,
  sceneId: string,
  evaluatedVersion: number,
  score: number,
  feedback: string
): Decision {
  const scene = state.scenes[sceneId];
  
  if (!scene) {
    return {
      type: 'fail_project',
      reasoning: `Scene ${sceneId} not found in state`,
      confidence: 1.0,
      commands: [
        createCommand('FAIL_PROJECT', state.projectId, {
          error: `Scene ${sceneId} not found`,
          code: 'SCENE_NOT_FOUND',
          phase: state.phase,
          recoverable: false,
        }),
      ],
      reflection: createReflection(
        `Scene ${sceneId} not found in state`,
        'Cannot proceed without scene state',
        'Failing project',
        1.0
      ),
    };
  }

  // Check version mismatch (race condition prevention)
  if (evaluatedVersion !== scene.version) {
    return {
      type: 'continue_local',
      reasoning: `Version mismatch: evaluated v${evaluatedVersion}, current v${scene.version}. Ignoring stale result.`,
      confidence: 0.9,
      commands: [],
      reflection: createReflection(
        `Received evaluation for outdated version ${evaluatedVersion}`,
        `Current scene version is ${scene.version}, this evaluation is stale`,
        'Ignoring stale evaluation result',
        0.9
      ),
    };
  }

  // Check if passed
  if (score >= SCORE_THRESHOLDS.SCENE_LOCAL_PASS) {
    return {
      type: 'continue_local',
      reasoning: `Scene passed with score ${score.toFixed(2)} >= ${SCORE_THRESHOLDS.SCENE_LOCAL_PASS}`,
      confidence: 0.95,
      commands: [],
      reflection: createReflection(
        `Scene ${sceneId} scored ${score.toFixed(2)}`,
        `Score exceeds local pass threshold of ${SCORE_THRESHOLDS.SCENE_LOCAL_PASS}`,
        'Mark scene as passed, check if all scenes complete',
        0.95
      ),
    };
  }

  // Check for escalation conditions
  const shouldEscalate = checkEscalationConditions(scene, score);
  
  if (shouldEscalate.escalate) {
    return {
      type: 'escalate_scene',
      reasoning: shouldEscalate.reason,
      confidence: 0.85,
      commands: [
        createCommand<EscalateSceneCommand>('ESCALATE_SCENE', state.projectId, {
          sceneId,
          reason: shouldEscalate.escalationReason,
          attempts: scene.localAttempts,
          lastScore: score,
          scoreHistory: scene.scoreHistory,
        }),
      ],
      reflection: createReflection(
        `Scene ${sceneId} needs escalation`,
        shouldEscalate.reason,
        'Escalating to Director for strategic intervention',
        0.85
      ),
    };
  }

  // Continue with local iteration
  return {
    type: 'continue_local',
    reasoning: `Scene scored ${score.toFixed(2)}, regenerating with feedback`,
    confidence: 0.8,
    commands: [
      createCommand<RegenerateSceneCommand>('REGENERATE_SCENE', state.projectId, {
        sceneId,
        feedback,
        forceNewApproach: scene.localAttempts >= 2,
      }),
    ],
    reflection: createReflection(
      `Scene ${sceneId} scored ${score.toFixed(2)}, below threshold`,
      `Attempt ${scene.localAttempts + 1}/${SCORE_THRESHOLDS.SCENE_MAX_LOCAL_ATTEMPTS}, trying again with feedback`,
      'Regenerating scene with evaluator feedback',
      0.8
    ),
  };
}

/**
 * Check if scene should be escalated
 */
function checkEscalationConditions(
  scene: SceneState,
  currentScore: number
): {
  escalate: boolean;
  reason: string;
  escalationReason: 'max_attempts' | 'low_score' | 'diminishing_returns';
} {
  // Check max attempts
  if (scene.localAttempts >= SCORE_THRESHOLDS.SCENE_MAX_LOCAL_ATTEMPTS) {
    return {
      escalate: true,
      reason: `Max local attempts (${SCORE_THRESHOLDS.SCENE_MAX_LOCAL_ATTEMPTS}) reached`,
      escalationReason: 'max_attempts',
    };
  }

  // Check very low score
  if (currentScore < SCORE_THRESHOLDS.SCENE_ESCALATION_SCORE) {
    return {
      escalate: true,
      reason: `Score ${currentScore.toFixed(2)} below escalation threshold ${SCORE_THRESHOLDS.SCENE_ESCALATION_SCORE}`,
      escalationReason: 'low_score',
    };
  }

  // Check diminishing returns
  const diminishing = detectDiminishingReturns(scene.scoreHistory);
  if (diminishing.detected) {
    return {
      escalate: true,
      reason: diminishing.reason,
      escalationReason: 'diminishing_returns',
    };
  }

  return {
    escalate: false,
    reason: 'No escalation needed',
    escalationReason: 'max_attempts',
  };
}

// ============================================================================
// Global-Level Decisions
// ============================================================================

/**
 * Decide if ready for global evaluation
 */
export function shouldStartGlobalEvaluation(state: DirectorState): {
  ready: boolean;
  reason: string;
} {
  const scenes = getScenesInOrder(state);
  
  if (scenes.length === 0) {
    return { ready: false, reason: 'No scenes defined' };
  }

  const passedScenes = scenes.filter(s => s.status === 'passed');
  const pendingScenes = scenes.filter(s => 
    ['pending', 'generating', 'rendering', 'evaluating'].includes(s.status)
  );

  if (pendingScenes.length > 0) {
    return {
      ready: false,
      reason: `${pendingScenes.length} scenes still being processed`,
    };
  }

  if (passedScenes.length !== scenes.length) {
    const failedScenes = scenes.filter(s => s.status === 'failed' || s.status === 'escalated');
    return {
      ready: false,
      reason: `${failedScenes.length} scenes not passed (status: ${failedScenes.map(s => s.status).join(', ')})`,
    };
  }

  return { ready: true, reason: 'All scenes passed local evaluation' };
}

/**
 * Decide what to do after global evaluation
 */
export function decideAfterGlobalEvaluation(
  state: DirectorState,
  globalScore: number,
  narrativeCohesion: number,
  brandConsistency: number,
  feedback: string,
  sceneSpecificFeedback?: Record<string, string>
): Decision {
  // Check if satisfied
  if (globalScore >= SCORE_THRESHOLDS.GLOBAL_SATISFACTION) {
    return {
      type: 'accept_output',
      reasoning: `Global score ${globalScore.toFixed(2)} >= satisfaction threshold ${SCORE_THRESHOLDS.GLOBAL_SATISFACTION}`,
      confidence: 0.95,
      commands: [],
      reflection: createReflection(
        `Global evaluation passed with score ${globalScore.toFixed(2)}`,
        `Score exceeds satisfaction threshold. Narrative cohesion: ${narrativeCohesion.toFixed(2)}, Brand consistency: ${brandConsistency.toFixed(2)}`,
        'Proceeding to final render',
        0.95
      ),
    };
  }

  // Check max iterations
  if (state.globalIteration >= state.maxGlobalIterations) {
    // Accept best effort if score is reasonable
    if (globalScore >= 0.5) {
      return {
        type: 'accept_output',
        reasoning: `Max iterations reached (${state.maxGlobalIterations}), accepting score ${globalScore.toFixed(2)}`,
        confidence: 0.7,
        commands: [],
        reflection: createReflection(
          `Max global iterations (${state.maxGlobalIterations}) reached`,
          `Score ${globalScore.toFixed(2)} is acceptable. Further iteration unlikely to significantly improve.`,
          'Accepting current output as final',
          0.7
        ),
      };
    }

    // Fail if score too low
    return {
      type: 'fail_project',
      reasoning: `Max iterations reached with unacceptable score ${globalScore.toFixed(2)}`,
      confidence: 0.8,
      commands: [
        createCommand('FAIL_PROJECT', state.projectId, {
          error: `Unable to achieve satisfactory quality after ${state.maxGlobalIterations} global iterations`,
          code: 'MAX_ITERATIONS_EXCEEDED',
          phase: 'evaluating_global',
          recoverable: false,
        }),
      ],
      reflection: createReflection(
        `Max iterations reached with low score ${globalScore.toFixed(2)}`,
        'Quality threshold not met and no more iterations allowed',
        'Failing project due to quality issues',
        0.8
      ),
    };
  }

  // Determine which scenes to regenerate
  const scenesToRegenerate = identifyScenesForRegeneration(
    state,
    narrativeCohesion,
    brandConsistency,
    sceneSpecificFeedback
  );

  return {
    type: 'global_iterate',
    reasoning: `Global score ${globalScore.toFixed(2)} < ${SCORE_THRESHOLDS.GLOBAL_SATISFACTION}, iterating on ${scenesToRegenerate.length} scenes`,
    confidence: 0.8,
    commands: [
      createCommand<StartGlobalIterationCommand>('START_GLOBAL_ITERATION', state.projectId, {
        iterationNumber: state.globalIteration + 1,
        globalFeedback: feedback,
        scenesToRegenerate,
      }),
    ],
    reflection: createReflection(
      `Global evaluation: ${globalScore.toFixed(2)} (cohesion: ${narrativeCohesion.toFixed(2)}, brand: ${brandConsistency.toFixed(2)})`,
      `Targeting ${scenesToRegenerate.length} scenes for improvement based on feedback`,
      'Starting global iteration with focused regeneration',
      0.8
    ),
  };
}

/**
 * Identify which scenes should be regenerated based on global feedback
 */
function identifyScenesForRegeneration(
  state: DirectorState,
  narrativeCohesion: number,
  brandConsistency: number,
  sceneSpecificFeedback?: Record<string, string>
): string[] {
  const scenes = getScenesInOrder(state);
  const scores = getLatestSceneScores(state);
  const scenesToRegenerate: string[] = [];

  // If we have specific feedback, use it
  if (sceneSpecificFeedback) {
    scenesToRegenerate.push(...Object.keys(sceneSpecificFeedback));
  }

  // If narrative cohesion is low, regenerate transition scenes (first and last)
  if (narrativeCohesion < 0.6) {
    const firstScene = scenes[0];
    const lastScene = scenes[scenes.length - 1];
    
    if (firstScene && !scenesToRegenerate.includes(firstScene.definition.id)) {
      scenesToRegenerate.push(firstScene.definition.id);
    }
    if (lastScene && !scenesToRegenerate.includes(lastScene.definition.id)) {
      scenesToRegenerate.push(lastScene.definition.id);
    }
  }

  // Add lowest scoring scenes if we haven't identified enough
  if (scenesToRegenerate.length === 0) {
    const sortedByScore = Object.entries(scores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, Math.ceil(scenes.length / 2)); // Bottom half

    scenesToRegenerate.push(...sortedByScore.map(([id]) => id));
  }

  // Limit to avoid regenerating everything
  const maxToRegenerate = Math.max(1, Math.ceil(scenes.length * 0.6));
  return [...new Set(scenesToRegenerate)].slice(0, maxToRegenerate);
}

// ============================================================================
// Director Satisfaction Check
// ============================================================================

/**
 * Check if Director should be satisfied with current state
 */
export function checkDirectorSatisfaction(state: DirectorState): {
  satisfied: boolean;
  reason: string;
  score: number;
} {
  const scenes = getScenesInOrder(state);
  
  if (scenes.length === 0) {
    return { satisfied: false, reason: 'No scenes', score: 0 };
  }

  const allPassed = scenes.every(s => s.status === 'passed');
  if (!allPassed) {
    return { satisfied: false, reason: 'Not all scenes passed', score: 0 };
  }

  const weightedScore = calculateWeightedMeanSceneScore(state);
  
  if (state.globalEvaluation) {
    const { score, narrativeCohesion, brandConsistency } = state.globalEvaluation;
    
    if (score >= SCORE_THRESHOLDS.GLOBAL_SATISFACTION) {
      return {
        satisfied: true,
        reason: `Global score ${score.toFixed(2)} meets threshold`,
        score,
      };
    }

    return {
      satisfied: false,
      reason: `Global score ${score.toFixed(2)} below threshold ${SCORE_THRESHOLDS.GLOBAL_SATISFACTION}`,
      score,
    };
  }

  // No global evaluation yet
  return {
    satisfied: false,
    reason: 'Awaiting global evaluation',
    score: weightedScore,
  };
}
