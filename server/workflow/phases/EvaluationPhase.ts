import { GoogleGenAI } from '@google/genai';
import {
  WorkflowState,
  WorkflowPhase,
  updateState,
  getCurrentRound
} from '../state';
import { BasePhase, PhaseContext, PhaseResult } from './BasePhase';
import { AI_MODELS } from '../../agent/models';
import { extractGeminiThoughts, getThinkingConfig } from '../../agent/geminiThoughts';

/**
 * Evaluation result from the AI critic.
 */
export interface EvaluationResult {
  overallScore: number; // 0-100
  compilability: number; // 0-100
  visualFidelity: number; // 0-100
  animationSmoothness: number; // 0-100
  feedback: string;
  suggestions: string[];
  passesThreshold: boolean;
}

/**
 * Evaluation threshold - scores above this pass automatically.
 */
const PASSING_THRESHOLD = 70;

/**
 * EvaluationPhase (The "Critic") reviews the generated code and provides
 * a quality assessment that determines if iteration is needed.
 *
 * This phase:
 * 1. Analyzes the generated code for quality
 * 2. Compares implementation to the plan
 * 3. Rates the code on multiple dimensions
 * 4. Provides actionable feedback for improvement
 */
export class EvaluationPhase extends BasePhase {
  readonly phase = WorkflowPhase.EVALUATION;
  readonly name = 'Evaluation';

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

  async execute(state: WorkflowState, context: PhaseContext): Promise<PhaseResult> {
    const currentRound = getCurrentRound(state);

    if (!currentRound || currentRound.files.length === 0) {
      return this.failure(state, 'No implementation to evaluate. Implementation phase must run first.');
    }

    // REASON: What needs evaluation?
    let currentState = this.think(
      state,
      'reason',
      `Evaluating implementation round ${currentRound.roundNumber}. ` +
      `${currentRound.files.length} files to review. ` +
      `Checking compilability, visual fidelity to plan, and animation quality.`,
      context
    );

    this.emitProgress(context, 'Analyzing generated code...');
    currentState = this.updateProgress(currentState, 10, 'Evaluating', 'Preparing code review');

    await this.delay(200);

    // Check if there are already validation errors from implementation
    if (!currentRound.validationResult.valid) {
      currentState = this.think(
        currentState,
        'observe',
        `Implementation has ${currentRound.validationResult.errors.length} validation errors. ` +
        `Skipping AI evaluation - requires fixes first.`,
        context
      );

      const quickEvaluation: EvaluationResult = {
        overallScore: 0,
        compilability: 0,
        visualFidelity: 50,
        animationSmoothness: 50,
        feedback: `Code has validation errors that must be fixed: ${currentRound.validationResult.errors.join(', ')}`,
        suggestions: currentRound.validationResult.errors.map(e => `Fix: ${e}`),
        passesThreshold: false
      };

      currentState = this.storeEvaluation(currentState, quickEvaluation);

      this.emitProgress(context, 'Evaluation complete', 'Code needs fixes');
      currentState = this.updateProgress(currentState, 100, 'Evaluation complete');

      return this.success(currentState);
    }

    // ACT: Call Gemini to evaluate the code
    currentState = this.think(
      currentState,
      'act',
      `Calling Gemini to perform detailed code review as a senior React developer.`,
      context
    );

    this.emitProgress(context, 'AI reviewing code quality...');
    currentState = this.updateProgress(currentState, 40, 'AI Review', 'Analyzing code');

    try {
      const { evaluation, thoughtSummary } = await this.evaluateCode(currentState, currentRound);

      // Emit the model's thinking if available
      if (thoughtSummary) {
        currentState = this.thinkWithModelThinking(
          currentState,
          'observe',
          'Evaluation reasoning complete',
          thoughtSummary,
          context
        );
      }

      // OBSERVE: Process evaluation results
      currentState = this.think(
        currentState,
        'observe',
        `Evaluation complete. Overall score: ${evaluation.overallScore}/100. ` +
        `${evaluation.passesThreshold ? 'Passes threshold - ready for rendering.' : 'Below threshold - needs iteration.'}`,
        context
      );

      currentState = this.storeEvaluation(currentState, evaluation);

      this.emitProgress(
        context,
        `Score: ${evaluation.overallScore}/100`,
        evaluation.passesThreshold ? 'Ready for rendering' : 'Needs improvement'
      );
      currentState = this.updateProgress(currentState, 100, 'Evaluation complete');

      return this.success(currentState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      currentState = this.think(
        currentState,
        'observe',
        `Evaluation failed: ${errorMessage}. Using fallback evaluation.`,
        context
      );

      // Fallback: If validation passed, assume reasonable quality
      const fallbackEvaluation: EvaluationResult = {
        overallScore: currentRound.validationResult.valid ? 75 : 30,
        compilability: currentRound.validationResult.valid ? 100 : 0,
        visualFidelity: 70,
        animationSmoothness: 70,
        feedback: 'Automated evaluation unavailable. Using validation status as proxy.',
        suggestions: [],
        passesThreshold: currentRound.validationResult.valid
      };

      currentState = this.storeEvaluation(currentState, fallbackEvaluation);

      this.emitProgress(context, 'Evaluation complete (fallback)');
      currentState = this.updateProgress(currentState, 100, 'Evaluation complete');

      return this.success(currentState);
    }
  }

  /**
   * Evaluate the generated code using Gemini.
   */
  private async evaluateCode(
    state: WorkflowState,
    round: NonNullable<ReturnType<typeof getCurrentRound>>
  ): Promise<{ evaluation: EvaluationResult; thoughtSummary?: string }> {
    const ai = this.getAI();

    // Collect all code for review
    const codeReview = round.files
      .map(f => `// FILE: ${f.filePath}\n${f.content}`)
      .join('\n\n---\n\n');

    const planSummary = state.plan
      ? `ORIGINAL PLAN:\n${state.plan.approach}\n\nSCENES:\n${state.plan.sceneBreakdown.map(s => `- Scene ${s.sceneNumber}: ${s.description}`).join('\n')}`
      : 'No plan available';

    const prompt = `You are a senior React/Remotion developer reviewing motion design code.
Rate this code on a 0-100 scale for each category.

BRAND CONTEXT:
- Name: ${state.brand.name}
- Style: ${state.config.style}
- Colors: ${state.brand.colors.join(', ')}

${planSummary}

CODE TO REVIEW:
${codeReview}

EVALUATION CRITERIA:
1. Compilability (0-100): Will this code compile without errors?
   - Check imports are correct
   - Check React/TypeScript syntax
   - Check component exports

2. Visual Fidelity (0-100): Does the code match the planned scenes?
   - Are all planned elements present?
   - Does it follow the ${state.config.style} style?
   - Are brand colors used correctly?

3. Animation Smoothness (0-100): Quality of the animations
   - Uses interpolate/spring correctly?
   - Proper frame timing?
   - Smooth transitions?

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "compilability": <number 0-100>,
  "visualFidelity": <number 0-100>,
  "animationSmoothness": <number 0-100>,
  "feedback": "<1-2 sentence summary>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}

Return ONLY the JSON, no markdown or explanations.`;

    // Enable thinking to capture the model's reasoning process
    const thinkingConfig = getThinkingConfig({ includeThoughts: true });

    // Use rate-limited call to respect API quotas
    const response = await this.rateLimitedCall(() =>
      ai.models.generateContent({
        model: AI_MODELS.SMART,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          ...thinkingConfig
        }
      })
    );

    // Extract thoughts and text from the response
    const { text: responseText, thoughtSummary } = extractGeminiThoughts(response);

    return {
      evaluation: this.parseEvaluationResponse(responseText.trim()),
      thoughtSummary
    };
  }

  /**
   * Parse the evaluation response from Gemini.
   */
  private parseEvaluationResponse(text: string): EvaluationResult {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : text;

    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;

      const compilability = this.clampScore(parsed.compilability);
      const visualFidelity = this.clampScore(parsed.visualFidelity);
      const animationSmoothness = this.clampScore(parsed.animationSmoothness);

      // Weighted average: compilability is most important
      const overallScore = Math.round(
        compilability * 0.4 +
        visualFidelity * 0.35 +
        animationSmoothness * 0.25
      );

      return {
        overallScore,
        compilability,
        visualFidelity,
        animationSmoothness,
        feedback: String(parsed.feedback || 'Evaluation complete'),
        suggestions: Array.isArray(parsed.suggestions)
          ? (parsed.suggestions as string[]).slice(0, 5)
          : [],
        passesThreshold: overallScore >= PASSING_THRESHOLD
      };
    } catch {
      // If parsing fails, return a default evaluation
      return {
        overallScore: 50,
        compilability: 50,
        visualFidelity: 50,
        animationSmoothness: 50,
        feedback: 'Could not parse AI evaluation response',
        suggestions: ['Manual review recommended'],
        passesThreshold: false
      };
    }
  }

  /**
   * Clamp a score to 0-100.
   */
  private clampScore(value: unknown): number {
    const num = Number(value);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, Math.round(num)));
  }

  /**
   * Store the evaluation result in the workflow state.
   * We add it to the progress for now; a dedicated field could be added later.
   */
  private storeEvaluation(state: WorkflowState, evaluation: EvaluationResult): WorkflowState {
    // Store evaluation in progress subStep for now
    // In a full implementation, we'd add an `evaluation` field to WorkflowState
    return updateState(state, {
      progress: {
        ...state.progress,
        subStep: JSON.stringify(evaluation)
      }
    });
  }
}

/**
 * Helper to extract evaluation from state.
 * Returns undefined if no evaluation is stored.
 */
export function getEvaluationFromState(state: WorkflowState): EvaluationResult | undefined {
  try {
    if (state.progress.subStep) {
      const parsed = JSON.parse(state.progress.subStep);
      if (typeof parsed.overallScore === 'number') {
        return parsed as EvaluationResult;
      }
    }
  } catch {
    // Not a valid evaluation JSON
  }
  return undefined;
}
