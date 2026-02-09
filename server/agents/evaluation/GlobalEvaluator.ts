/**
 * Global Evaluator
 * 
 * Tier 2 evaluation: Analyzes the entire video holistically for narrative cohesion,
 * brand consistency across scenes, and overall quality. Uses Gemini for intelligent evaluation.
 */

import { GoogleGenAI } from '@google/genai';
import { BrandContext, SceneState, SCORE_THRESHOLDS } from '../types.js';
import { 
  GlobalEvaluationDetails, 
  calculateGlobalScore,
  getScoreBreakdown,
  identifyWeakComponents,
  ScoreBreakdown,
} from './ScoreAggregator.js';
import { DirectorState, getLatestSceneScores } from '../director/DirectorState.js';
import { rateLimitedCall } from '../../core/agent/rateLimiter.js';

// ============================================================================
// Types
// ============================================================================

export interface GlobalEvaluationInput {
  /** Project ID */
  projectId: string;
  
  /** All scene states */
  scenes: SceneInfo[];
  
  /** Brand context */
  brandContext: BrandContext;
  
  /** Global iteration number */
  iterationNumber: number;
  
  /** Previous global score (for trend detection) */
  previousGlobalScore?: number;
}

export interface SceneInfo {
  sceneId: string;
  sceneIndex: number;
  version: number;
  code: string;
  score: number;
  videoPath?: string;
}

export interface GlobalEvaluationResult {
  /** Project ID */
  projectId: string;
  
  /** Global score (0-1) */
  globalScore: number;
  
  /** Whether the video passes global threshold */
  passed: boolean;
  
  /** Narrative cohesion score (0-1) */
  narrativeCohesion: number;
  
  /** Brand consistency score (0-1) */
  brandConsistency: number;
  
  /** Human-readable feedback */
  feedback: string;
  
  /** Snapshot of scene versions evaluated */
  sceneVersionSnapshot: Record<string, number>;
  
  /** Scene-specific feedback for targeted improvements */
  sceneSpecificFeedback: Record<string, string>;
  
  /** Identified weaknesses */
  weaknesses: WeaknessAnalysis[];
  
  /** Recommended actions */
  recommendations: GlobalRecommendation[];
  
  /** Whether diminishing returns detected */
  diminishingReturns: boolean;
  
  /** Evaluation time in ms */
  evaluationTimeMs: number;
}

export interface WeaknessAnalysis {
  component: 'scenes' | 'narrative' | 'brand';
  score: number;
  potential: number;
  description: string;
}

export interface GlobalRecommendation {
  type: 'regenerate_scene' | 'adjust_style' | 'improve_transitions' | 'strengthen_brand' | 'accept';
  sceneId?: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

// ============================================================================
// AI Client
// ============================================================================

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// ============================================================================
// Global Evaluator Class
// ============================================================================

export class GlobalEvaluator {
  private ai: GoogleGenAI;

  constructor(ai?: GoogleGenAI) {
    this.ai = ai || getAIClient();
  }

  /**
   * Evaluate the entire video holistically
   */
  async evaluate(input: GlobalEvaluationInput): Promise<GlobalEvaluationResult> {
    const startTime = Date.now();
    const { projectId, scenes, brandContext, iterationNumber, previousGlobalScore } = input;

    console.log(`[GlobalEvaluator] Evaluating ${scenes.length} scenes for project ${projectId} (iteration ${iterationNumber})`);

    // Build evaluation prompt
    const prompt = this.buildEvaluationPrompt(input);

    // Call Gemini for evaluation
    const response = await rateLimitedCall(() =>
      this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          // Gemini 3 best practice: use default temperature of 1.0
          temperature: 1.0,
          maxOutputTokens: 8192,
          // Use medium thinking for balanced global evaluation
          thinkingConfig: {
            thinkingLevel: 'medium',
          },
        },
      })
    );

    const responseText = response.text || '';
    
    // Parse the evaluation response
    const evaluation = this.parseEvaluationResponse(responseText, input);
    
    // Get scene scores for global calculation
    const sceneScores = scenes.map(s => s.score);
    
    // Calculate global score
    const globalScore = calculateGlobalScore({
      narrativeCohesion: evaluation.narrativeCohesion,
      brandConsistency: evaluation.brandConsistency,
      sceneScores,
    });
    
    // Determine if passed
    const passed = globalScore >= SCORE_THRESHOLDS.GLOBAL_SATISFACTION;
    
    // Check for diminishing returns
    const diminishingReturns = this.checkDiminishingReturns(
      globalScore,
      previousGlobalScore
    );
    
    // Build scene version snapshot
    const sceneVersionSnapshot: Record<string, number> = {};
    scenes.forEach(s => {
      sceneVersionSnapshot[s.sceneId] = s.version;
    });
    
    // Identify weaknesses
    const weaknesses = this.analyzeWeaknesses(
      sceneScores,
      evaluation.narrativeCohesion,
      evaluation.brandConsistency
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      scenes,
      weaknesses,
      passed,
      diminishingReturns
    );

    const evaluationTimeMs = Date.now() - startTime;

    console.log(
      `[GlobalEvaluator] Global score: ${(globalScore * 100).toFixed(1)}% ` +
      `(${passed ? 'PASSED' : 'FAILED'})` +
      `${diminishingReturns ? ' [Diminishing Returns]' : ''}`
    );

    return {
      projectId,
      globalScore,
      passed,
      narrativeCohesion: evaluation.narrativeCohesion,
      brandConsistency: evaluation.brandConsistency,
      feedback: evaluation.feedback,
      sceneVersionSnapshot,
      sceneSpecificFeedback: evaluation.sceneSpecificFeedback,
      weaknesses,
      recommendations,
      diminishingReturns,
      evaluationTimeMs,
    };
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(input: GlobalEvaluationInput): string {
    const { scenes, brandContext, iterationNumber } = input;

    // Build scene code summaries
    const sceneSummaries = scenes.map((scene, idx) => {
      // Truncate code for context efficiency
      const code = scene.code || '';
      const codePreview = code.length > 1500
        ? code.substring(0, 1500) + '\n// ... (truncated)'
        : code;
      
      return `### Scene ${idx + 1} (Score: ${(scene.score * 100).toFixed(0)}%)
\`\`\`tsx
${codePreview}
\`\`\``;
    }).join('\n\n');

    return `You are an expert motion graphics director evaluating an entire brand video for quality and coherence.

## VIDEO CONTEXT
- Brand: "${brandContext.name}"
- Industry: ${brandContext.industry || 'Technology'}
- Tagline: "${brandContext.tagline || ''}"
- Style: ${brandContext.style || 'dynamic'}
- Iteration: ${iterationNumber}
- Total Scenes: ${scenes.length}

## SCENE CODE
${sceneSummaries}

## EVALUATION CRITERIA

### 1. Narrative Cohesion (0-100)
- Do scenes flow logically from one to the next?
- Is there a clear story arc (hook → development → payoff)?
- Are transitions between scenes smooth and intentional?
- Does the pacing feel natural and engaging?

### 2. Brand Consistency (0-100)
- Are brand colors used consistently across all scenes?
- Is the typography consistent throughout?
- Does the visual style match the requested brand style?
- Is the brand name/logo presented appropriately?

### 3. Scene-Specific Issues
For each scene, identify any issues that harm the overall video.

## RESPONSE FORMAT
Respond with ONLY a JSON object (no markdown code blocks):

{
  "narrativeCohesion": <0-100>,
  "brandConsistency": <0-100>,
  "feedback": "<2-3 sentences summarizing the overall video quality>",
  "sceneSpecificFeedback": {
    "<sceneId>": "<specific feedback for this scene>",
    ...
  },
  "transitionIssues": [
    {
      "fromScene": <index>,
      "toScene": <index>,
      "issue": "<description>"
    }
  ],
  "brandIssues": [
    "<specific brand consistency issue>"
  ],
  "strengths": [
    "<what's working well>"
  ]
}`;
  }

  /**
   * Parse evaluation response from Gemini
   */
  private parseEvaluationResponse(
    responseText: string,
    input: GlobalEvaluationInput
  ): {
    narrativeCohesion: number;
    brandConsistency: number;
    feedback: string;
    sceneSpecificFeedback: Record<string, string>;
  } {
    try {
      // Try to extract JSON from response
      let jsonStr = responseText.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      // Parse JSON
      const parsed = JSON.parse(jsonStr);
      
      // Normalize scores to 0-1 range
      const normalize = (score: number): number => {
        const clamped = Math.max(0, Math.min(100, score));
        return clamped / 100;
      };

      // Map scene IDs to feedback
      const sceneSpecificFeedback: Record<string, string> = {};
      if (parsed.sceneSpecificFeedback) {
        for (const [key, value] of Object.entries(parsed.sceneSpecificFeedback)) {
          // Key might be sceneId or scene index
          const scene = input.scenes.find(s => 
            s.sceneId === key || s.sceneIndex.toString() === key
          );
          if (scene) {
            sceneSpecificFeedback[scene.sceneId] = value as string;
          }
        }
      }

      return {
        narrativeCohesion: normalize(parsed.narrativeCohesion || 50),
        brandConsistency: normalize(parsed.brandConsistency || 50),
        feedback: parsed.feedback || 'No feedback provided',
        sceneSpecificFeedback,
      };
    } catch (error) {
      console.warn('[GlobalEvaluator] Failed to parse evaluation response:', error);
      
      // Return default scores if parsing fails
      return {
        narrativeCohesion: 0.5,
        brandConsistency: 0.5,
        feedback: 'Evaluation parsing failed. Please review the video manually.',
        sceneSpecificFeedback: {},
      };
    }
  }

  /**
   * Check for diminishing returns
   */
  private checkDiminishingReturns(
    currentScore: number,
    previousScore?: number
  ): boolean {
    if (previousScore === undefined) {
      return false;
    }

    const improvement = currentScore - previousScore;
    return improvement < SCORE_THRESHOLDS.DIMINISHING_RETURNS_DELTA;
  }

  /**
   * Analyze weaknesses
   */
  private analyzeWeaknesses(
    sceneScores: number[],
    narrativeCohesion: number,
    brandConsistency: number
  ): WeaknessAnalysis[] {
    const weaknesses: WeaknessAnalysis[] = [];

    // Check scene scores
    const meanSceneScore = sceneScores.reduce((a, b) => a + b, 0) / sceneScores.length;
    const minSceneScore = Math.min(...sceneScores);
    
    if (meanSceneScore < 0.7) {
      weaknesses.push({
        component: 'scenes',
        score: meanSceneScore,
        potential: (1 - meanSceneScore) * 0.5, // 50% weight for scenes
        description: 'Average scene quality is below target',
      });
    }

    // Check narrative cohesion
    if (narrativeCohesion < 0.7) {
      weaknesses.push({
        component: 'narrative',
        score: narrativeCohesion,
        potential: (1 - narrativeCohesion) * 0.25,
        description: 'Narrative flow between scenes needs improvement',
      });
    }

    // Check brand consistency
    if (brandConsistency < 0.7) {
      weaknesses.push({
        component: 'brand',
        score: brandConsistency,
        potential: (1 - brandConsistency) * 0.25,
        description: 'Brand elements are not consistent across scenes',
      });
    }

    // Sort by potential improvement
    return weaknesses.sort((a, b) => b.potential - a.potential);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    scenes: SceneInfo[],
    weaknesses: WeaknessAnalysis[],
    passed: boolean,
    diminishingReturns: boolean
  ): GlobalRecommendation[] {
    const recommendations: GlobalRecommendation[] = [];

    // If passed, recommend acceptance
    if (passed) {
      recommendations.push({
        type: 'accept',
        priority: 'high',
        description: 'Video meets quality threshold. Ready for final render.',
      });
      return recommendations;
    }

    // If diminishing returns, recommend accepting current state
    if (diminishingReturns) {
      recommendations.push({
        type: 'accept',
        priority: 'medium',
        description: 'Diminishing returns detected. Consider accepting current quality.',
      });
    }

    // Find weakest scenes
    const sortedScenes = [...scenes].sort((a, b) => a.score - b.score);
    const weakestScenes = sortedScenes.slice(0, Math.min(2, scenes.length));

    for (const scene of weakestScenes) {
      if (scene.score < SCORE_THRESHOLDS.SCENE_LOCAL_PASS) {
        recommendations.push({
          type: 'regenerate_scene',
          sceneId: scene.sceneId,
          priority: 'high',
          description: `Scene ${scene.sceneIndex + 1} scored ${(scene.score * 100).toFixed(0)}% - regeneration recommended`,
        });
      }
    }

    // Address weaknesses
    for (const weakness of weaknesses) {
      if (weakness.component === 'narrative') {
        recommendations.push({
          type: 'improve_transitions',
          priority: 'medium',
          description: weakness.description,
        });
      } else if (weakness.component === 'brand') {
        recommendations.push({
          type: 'strengthen_brand',
          priority: 'medium',
          description: weakness.description,
        });
      }
    }

    return recommendations;
  }

  /**
   * Evaluate from Director state
   */
  async evaluateFromState(
    state: DirectorState,
    brandContext: BrandContext
  ): Promise<GlobalEvaluationResult> {
    // Build scene info from state
    const scenes: SceneInfo[] = Object.values(state.scenes).map(sceneState => ({
      sceneId: sceneState.definition.id,
      sceneIndex: sceneState.definition.index,
      version: sceneState.version,
      code: sceneState.code || '',
      score: sceneState.scoreHistory[sceneState.scoreHistory.length - 1] || 0,
      videoPath: sceneState.videoPath,
    }));

    // Get previous global score from the last evaluation
    const previousGlobalScore = state.globalEvaluation?.score;

    return this.evaluate({
      projectId: state.projectId,
      scenes,
      brandContext,
      iterationNumber: state.globalIteration,
      previousGlobalScore,
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

export function createGlobalEvaluator(ai?: GoogleGenAI): GlobalEvaluator {
  return new GlobalEvaluator(ai);
}
