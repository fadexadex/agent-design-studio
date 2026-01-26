import { GoogleGenAI } from '@google/genai';
import {
  WorkflowState,
  ImplementationRound,
  SceneDescription,
  getCurrentRound
} from '../state';

/**
 * Per-scene evaluation score with detailed issues.
 */
export interface SceneScore {
  sceneId: string;
  sceneNumber: number;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
}

/**
 * Comprehensive evaluation result with global and per-scene analysis.
 * This enables targeted scene fixes rather than regenerating everything.
 */
export interface EvaluationResult {
  // Global scores
  score: number; // 0-100 overall score
  compilability: number;
  visualFidelity: number;
  animationSmoothness: number;
  brandConsistency: number;

  // Per-scene granular evaluation
  sceneScores: SceneScore[];

  // Feedback
  feedback: string;
  globalSuggestions: string[];

  // Decision helpers
  passesThreshold: boolean;
  needsUserFeedback: boolean;
}

/**
 * Thresholds for evaluation decisions.
 */
export const EvaluationThresholds = {
  PASSING: 70,          // Score >= 70 passes automatically
  SCENE_FAILING: 60,    // Scene score < 60 needs rework
  NEEDS_FEEDBACK: 50,   // Score < 50 with many issues needs user input
  CRITICAL_FAILURE: 30  // Score < 30 indicates fundamental problems
} as const;

/**
 * SelfEvaluator performs comprehensive code evaluation using AI.
 *
 * Key capabilities:
 * 1. Global quality assessment
 * 2. Per-scene granular scoring
 * 3. Identification of scenes needing rework
 * 4. Actionable suggestions for improvement
 */
export class SelfEvaluator {
  private ai: GoogleGenAI | null = null;

  private getAI(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  /**
   * Evaluate the current implementation comprehensively.
   */
  async evaluate(state: WorkflowState): Promise<EvaluationResult> {
    const currentRound = getCurrentRound(state);

    if (!currentRound || currentRound.files.length === 0) {
      return this.createFailedEvaluation('No implementation to evaluate');
    }

    // If validation already failed, return quick failure
    if (!currentRound.validationResult.valid) {
      return this.createValidationFailedEvaluation(currentRound);
    }

    try {
      // Call AI for comprehensive evaluation
      return await this.performAIEvaluation(state, currentRound);
    } catch (error) {
      console.error('AI evaluation failed:', error);
      // Return fallback evaluation based on validation status
      return this.createFallbackEvaluation(currentRound);
    }
  }

  /**
   * Perform AI-powered evaluation with per-scene analysis.
   */
  private async performAIEvaluation(
    state: WorkflowState,
    round: ImplementationRound
  ): Promise<EvaluationResult> {
    const ai = this.getAI();

    // Build evaluation prompt
    const prompt = this.buildEvaluationPrompt(state, round);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 2048
      }
    });

    const responseText = response.text?.trim() || '';
    return this.parseEvaluationResponse(responseText, state.plan?.sceneBreakdown || []);
  }

  /**
   * Build comprehensive evaluation prompt.
   */
  private buildEvaluationPrompt(state: WorkflowState, round: ImplementationRound): string {
    // Collect all code
    const codeReview = round.files
      .map(f => `// FILE: ${f.filePath}${f.sceneId ? ` (Scene: ${f.sceneId})` : ''}\n${f.content}`)
      .join('\n\n---\n\n');

    // Scene information
    const scenes = state.plan?.sceneBreakdown || [];
    const sceneList = scenes
      .map(s => `- Scene ${s.sceneNumber} (${s.id}): ${s.description} [frames ${s.frameRange.start}-${s.frameRange.end}]`)
      .join('\n');

    return `You are a senior React/Remotion developer reviewing motion design code.
Provide BOTH global and per-scene evaluation.

BRAND CONTEXT:
- Name: ${state.brand.name}
- Industry: ${state.brand.industry}
- Style: ${state.config.style}
- Colors: ${state.brand.colors.join(', ')}
- Tagline: ${state.brand.tagline || 'N/A'}

SCENES TO EVALUATE:
${sceneList || 'No scene breakdown available'}

CODE TO REVIEW:
${codeReview}

EVALUATION CRITERIA:

GLOBAL METRICS (0-100):
1. Compilability: Will this code compile? Correct imports, syntax, exports?
2. Visual Fidelity: Does it match the planned scenes and ${state.config.style} style?
3. Animation Smoothness: Quality of interpolate/spring usage, frame timing?
4. Brand Consistency: Are brand colors, fonts, and identity applied correctly?

PER-SCENE METRICS (0-100):
For each scene, evaluate how well the implementation matches the planned description.
Consider: element presence, timing, visual quality, transitions.

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "global": {
    "compilability": <0-100>,
    "visualFidelity": <0-100>,
    "animationSmoothness": <0-100>,
    "brandConsistency": <0-100>,
    "feedback": "<1-2 sentence overall summary>",
    "suggestions": ["<global suggestion 1>", "<global suggestion 2>"]
  },
  "scenes": [
    {
      "sceneId": "<scene id from list>",
      "sceneNumber": <number>,
      "score": <0-100>,
      "issues": ["<issue 1>", "<issue 2>"],
      "suggestions": ["<fix suggestion 1>"]
    }
  ]
}

Return ONLY the JSON, no markdown or explanations.`;
  }

  /**
   * Parse AI response into structured evaluation result.
   */
  private parseEvaluationResponse(
    text: string,
    scenes: SceneDescription[]
  ): EvaluationResult {
    // Extract JSON from markdown if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : text;

    try {
      const parsed = JSON.parse(jsonText);

      const global = parsed.global || {};
      const compilability = this.clampScore(global.compilability);
      const visualFidelity = this.clampScore(global.visualFidelity);
      const animationSmoothness = this.clampScore(global.animationSmoothness);
      const brandConsistency = this.clampScore(global.brandConsistency);

      // Calculate weighted overall score
      const score = Math.round(
        compilability * 0.35 +
        visualFidelity * 0.25 +
        animationSmoothness * 0.20 +
        brandConsistency * 0.20
      );

      // Parse scene scores
      const sceneScores: SceneScore[] = (parsed.scenes || []).map((s: Record<string, unknown>) => ({
        sceneId: String(s.sceneId || ''),
        sceneNumber: Number(s.sceneNumber) || 0,
        score: this.clampScore(s.score),
        issues: Array.isArray(s.issues) ? s.issues.map(String) : [],
        suggestions: Array.isArray(s.suggestions) ? s.suggestions.map(String) : []
      }));

      // Ensure we have scores for all scenes
      const scoredSceneIds = new Set(sceneScores.map(s => s.sceneId));
      for (const scene of scenes) {
        if (!scoredSceneIds.has(scene.id)) {
          sceneScores.push({
            sceneId: scene.id,
            sceneNumber: scene.sceneNumber,
            score: score, // Default to global score
            issues: [],
            suggestions: []
          });
        }
      }

      // Determine if user feedback is needed
      const failingScenes = sceneScores.filter(s => s.score < EvaluationThresholds.SCENE_FAILING);
      const needsUserFeedback = score < EvaluationThresholds.NEEDS_FEEDBACK ||
                                failingScenes.length > Math.ceil(scenes.length / 2);

      return {
        score,
        compilability,
        visualFidelity,
        animationSmoothness,
        brandConsistency,
        sceneScores,
        feedback: String(global.feedback || 'Evaluation complete'),
        globalSuggestions: Array.isArray(global.suggestions)
          ? global.suggestions.map(String).slice(0, 5)
          : [],
        passesThreshold: score >= EvaluationThresholds.PASSING,
        needsUserFeedback
      };
    } catch {
      return this.createFallbackEvaluation();
    }
  }

  /**
   * Create evaluation for code with validation errors.
   */
  private createValidationFailedEvaluation(round: ImplementationRound): EvaluationResult {
    return {
      score: 0,
      compilability: 0,
      visualFidelity: 50,
      animationSmoothness: 50,
      brandConsistency: 50,
      sceneScores: [],
      feedback: `Code has validation errors: ${round.validationResult.errors.slice(0, 3).join(', ')}`,
      globalSuggestions: round.validationResult.errors.map(e => `Fix: ${e}`),
      passesThreshold: false,
      needsUserFeedback: false
    };
  }

  /**
   * Create evaluation when no implementation exists.
   */
  private createFailedEvaluation(reason: string): EvaluationResult {
    return {
      score: 0,
      compilability: 0,
      visualFidelity: 0,
      animationSmoothness: 0,
      brandConsistency: 0,
      sceneScores: [],
      feedback: reason,
      globalSuggestions: [],
      passesThreshold: false,
      needsUserFeedback: false
    };
  }

  /**
   * Create fallback evaluation when AI fails.
   */
  private createFallbackEvaluation(round?: ImplementationRound): EvaluationResult {
    const validCode = round?.validationResult.valid ?? false;
    const baseScore = validCode ? 75 : 30;

    return {
      score: baseScore,
      compilability: validCode ? 100 : 0,
      visualFidelity: 70,
      animationSmoothness: 70,
      brandConsistency: 70,
      sceneScores: [],
      feedback: 'Automated evaluation unavailable. Using validation status as proxy.',
      globalSuggestions: ['Manual review recommended'],
      passesThreshold: validCode,
      needsUserFeedback: !validCode
    };
  }

  /**
   * Get scenes that need rework based on evaluation.
   */
  getFailingScenes(evaluation: EvaluationResult): SceneScore[] {
    return evaluation.sceneScores.filter(s => s.score < EvaluationThresholds.SCENE_FAILING);
  }

  /**
   * Clamp a value to 0-100.
   */
  private clampScore(value: unknown): number {
    const num = Number(value);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, Math.round(num)));
  }
}

// Export singleton instance
export const selfEvaluator = new SelfEvaluator();
