/**
 * Score Aggregator
 * 
 * Implements the scoring formulas for the Director-Agent architecture.
 * 
 * Global Score Formula:
 *   globalScore = (0.5 × weightedMeanSceneScores) + (0.25 × narrativeCohesion) + (0.25 × brandConsistency)
 * 
 * Weighted Mean Scene Scores:
 *   weightedMean = (mean × 0.7) + (min × 0.3)  // Worst-scene penalty
 */

import { SceneState } from '../types.js';
import { DirectorState, getLatestSceneScores } from '../director/DirectorState.js';

// ============================================================================
// Score Weights Configuration
// ============================================================================

export const SCORE_WEIGHTS = {
  // Global score components
  SCENE_SCORES_WEIGHT: 0.5,
  NARRATIVE_COHESION_WEIGHT: 0.25,
  BRAND_CONSISTENCY_WEIGHT: 0.25,
  
  // Weighted mean components (worst-scene penalty)
  MEAN_WEIGHT: 0.7,
  MIN_WEIGHT: 0.3,
  
  // Scene evaluation components
  CODE_QUALITY_WEIGHT: 0.2,
  VISUAL_APPEAL_WEIGHT: 0.35,
  BRAND_ALIGNMENT_WEIGHT: 0.25,
  TECHNICAL_CORRECTNESS_WEIGHT: 0.2,
} as const;

// ============================================================================
// Scene Score Calculation
// ============================================================================

export interface SceneEvaluationDetails {
  codeQuality: number;
  visualAppeal: number;
  brandAlignment: number;
  technicalCorrectness: number;
}

/**
 * Calculate scene score from evaluation details
 */
export function calculateSceneScore(details: SceneEvaluationDetails): number {
  const {
    codeQuality,
    visualAppeal,
    brandAlignment,
    technicalCorrectness,
  } = details;

  const score = 
    (codeQuality * SCORE_WEIGHTS.CODE_QUALITY_WEIGHT) +
    (visualAppeal * SCORE_WEIGHTS.VISUAL_APPEAL_WEIGHT) +
    (brandAlignment * SCORE_WEIGHTS.BRAND_ALIGNMENT_WEIGHT) +
    (technicalCorrectness * SCORE_WEIGHTS.TECHNICAL_CORRECTNESS_WEIGHT);

  return clamp(score, 0, 1);
}

/**
 * Calculate weighted mean of scene scores with worst-scene penalty
 */
export function calculateWeightedMeanSceneScore(scores: number[]): number {
  if (scores.length === 0) return 0;

  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const min = Math.min(...scores);

  // Weighted: 70% mean, 30% min (worst-scene penalty)
  const weightedMean = 
    (mean * SCORE_WEIGHTS.MEAN_WEIGHT) + 
    (min * SCORE_WEIGHTS.MIN_WEIGHT);

  return clamp(weightedMean, 0, 1);
}

/**
 * Calculate weighted mean from Director state
 */
export function calculateWeightedMeanFromState(state: DirectorState): number {
  const scores = Object.values(getLatestSceneScores(state));
  return calculateWeightedMeanSceneScore(scores);
}

// ============================================================================
// Global Score Calculation
// ============================================================================

export interface GlobalEvaluationDetails {
  narrativeCohesion: number;
  brandConsistency: number;
  sceneScores: number[];
}

/**
 * Calculate global score from evaluation details
 */
export function calculateGlobalScore(details: GlobalEvaluationDetails): number {
  const { narrativeCohesion, brandConsistency, sceneScores } = details;

  const weightedMeanSceneScore = calculateWeightedMeanSceneScore(sceneScores);

  const globalScore = 
    (weightedMeanSceneScore * SCORE_WEIGHTS.SCENE_SCORES_WEIGHT) +
    (narrativeCohesion * SCORE_WEIGHTS.NARRATIVE_COHESION_WEIGHT) +
    (brandConsistency * SCORE_WEIGHTS.BRAND_CONSISTENCY_WEIGHT);

  return clamp(globalScore, 0, 1);
}

/**
 * Calculate global score from Director state
 */
export function calculateGlobalScoreFromState(
  state: DirectorState,
  narrativeCohesion: number,
  brandConsistency: number
): number {
  const sceneScores = Object.values(getLatestSceneScores(state));
  
  return calculateGlobalScore({
    narrativeCohesion,
    brandConsistency,
    sceneScores,
  });
}

// ============================================================================
// Score Analysis Utilities
// ============================================================================

export interface ScoreBreakdown {
  globalScore: number;
  weightedMeanSceneScore: number;
  meanSceneScore: number;
  minSceneScore: number;
  maxSceneScore: number;
  narrativeCohesion: number;
  brandConsistency: number;
  sceneCount: number;
  passedSceneCount: number;
  components: {
    sceneContribution: number;
    narrativeContribution: number;
    brandContribution: number;
  };
}

/**
 * Get detailed score breakdown
 */
export function getScoreBreakdown(
  state: DirectorState,
  narrativeCohesion: number,
  brandConsistency: number
): ScoreBreakdown {
  const sceneScores = Object.values(getLatestSceneScores(state));
  const scenes = Object.values(state.scenes);
  
  if (sceneScores.length === 0) {
    return {
      globalScore: 0,
      weightedMeanSceneScore: 0,
      meanSceneScore: 0,
      minSceneScore: 0,
      maxSceneScore: 0,
      narrativeCohesion,
      brandConsistency,
      sceneCount: scenes.length,
      passedSceneCount: 0,
      components: {
        sceneContribution: 0,
        narrativeContribution: 0,
        brandContribution: 0,
      },
    };
  }

  const mean = sceneScores.reduce((sum, s) => sum + s, 0) / sceneScores.length;
  const min = Math.min(...sceneScores);
  const max = Math.max(...sceneScores);
  const weightedMean = calculateWeightedMeanSceneScore(sceneScores);
  
  const sceneContribution = weightedMean * SCORE_WEIGHTS.SCENE_SCORES_WEIGHT;
  const narrativeContribution = narrativeCohesion * SCORE_WEIGHTS.NARRATIVE_COHESION_WEIGHT;
  const brandContribution = brandConsistency * SCORE_WEIGHTS.BRAND_CONSISTENCY_WEIGHT;
  
  const globalScore = sceneContribution + narrativeContribution + brandContribution;
  const passedScenes = scenes.filter(s => s.status === 'passed');

  return {
    globalScore: clamp(globalScore, 0, 1),
    weightedMeanSceneScore: weightedMean,
    meanSceneScore: mean,
    minSceneScore: min,
    maxSceneScore: max,
    narrativeCohesion,
    brandConsistency,
    sceneCount: scenes.length,
    passedSceneCount: passedScenes.length,
    components: {
      sceneContribution,
      narrativeContribution,
      brandContribution,
    },
  };
}

/**
 * Identify weakest components for improvement targeting
 */
export function identifyWeakComponents(breakdown: ScoreBreakdown): {
  component: 'scenes' | 'narrative' | 'brand';
  score: number;
  potential: number;
}[] {
  const components: {
    component: 'scenes' | 'narrative' | 'brand';
    score: number;
    weight: number;
    potential: number;
  }[] = [
    {
      component: 'scenes',
      score: breakdown.weightedMeanSceneScore,
      weight: SCORE_WEIGHTS.SCENE_SCORES_WEIGHT,
      potential: (1 - breakdown.weightedMeanSceneScore) * SCORE_WEIGHTS.SCENE_SCORES_WEIGHT,
    },
    {
      component: 'narrative',
      score: breakdown.narrativeCohesion,
      weight: SCORE_WEIGHTS.NARRATIVE_COHESION_WEIGHT,
      potential: (1 - breakdown.narrativeCohesion) * SCORE_WEIGHTS.NARRATIVE_COHESION_WEIGHT,
    },
    {
      component: 'brand',
      score: breakdown.brandConsistency,
      weight: SCORE_WEIGHTS.BRAND_CONSISTENCY_WEIGHT,
      potential: (1 - breakdown.brandConsistency) * SCORE_WEIGHTS.BRAND_CONSISTENCY_WEIGHT,
    },
  ];

  // Sort by potential improvement (highest first)
  return components
    .sort((a, b) => b.potential - a.potential)
    .map(({ component, score, potential }) => ({ component, score, potential }));
}

/**
 * Estimate required improvement to reach target score
 */
export function estimateRequiredImprovement(
  currentScore: number,
  targetScore: number
): { 
  gap: number; 
  achievable: boolean; 
  message: string 
} {
  const gap = targetScore - currentScore;

  if (gap <= 0) {
    return {
      gap: 0,
      achievable: true,
      message: 'Target already achieved',
    };
  }

  if (gap > 0.3) {
    return {
      gap,
      achievable: false,
      message: `Large gap of ${(gap * 100).toFixed(1)}% - may require significant changes`,
    };
  }

  if (gap > 0.15) {
    return {
      gap,
      achievable: true,
      message: `Moderate gap of ${(gap * 100).toFixed(1)}% - achievable with focused iteration`,
    };
  }

  return {
    gap,
    achievable: true,
    message: `Small gap of ${(gap * 100).toFixed(1)}% - achievable with minor adjustments`,
  };
}

// ============================================================================
// Trend Analysis
// ============================================================================

export interface ScoreTrend {
  direction: 'improving' | 'stable' | 'declining';
  averageChange: number;
  volatility: number;
}

/**
 * Analyze score trend from history
 */
export function analyzeScoreTrend(scoreHistory: number[]): ScoreTrend {
  if (scoreHistory.length < 2) {
    return {
      direction: 'stable',
      averageChange: 0,
      volatility: 0,
    };
  }

  // Calculate changes between consecutive scores
  const changes: number[] = [];
  for (let i = 1; i < scoreHistory.length; i++) {
    changes.push(scoreHistory[i] - scoreHistory[i - 1]);
  }

  const averageChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  
  // Calculate volatility (standard deviation of changes)
  const variance = changes.reduce((sum, c) => sum + Math.pow(c - averageChange, 2), 0) / changes.length;
  const volatility = Math.sqrt(variance);

  let direction: 'improving' | 'stable' | 'declining';
  if (averageChange > 0.02) {
    direction = 'improving';
  } else if (averageChange < -0.02) {
    direction = 'declining';
  } else {
    direction = 'stable';
  }

  return {
    direction,
    averageChange,
    volatility,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
