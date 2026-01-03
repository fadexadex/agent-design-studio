import { GoogleGenAI } from '@google/genai';
import { WorkflowState, WorkflowPhase, updateState } from '../state';
import { BasePhase, PhaseContext, PhaseResult } from './BasePhase';
import { AI_MODELS } from '../../agent/models';

/**
 * QueryEnhancementPhase enhances the user's creative prompt with
 * additional context and details based on the brand and style.
 *
 * This phase:
 * 1. Analyzes the user's prompt
 * 2. Enhances it with motion design terminology
 * 3. Adds style-specific suggestions
 */
export class QueryEnhancementPhase extends BasePhase {
  readonly phase = WorkflowPhase.QUERY_ENHANCEMENT;
  readonly name = 'Query Enhancement';

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
    // REASON: What needs to be enhanced?
    let currentState = this.think(
      state,
      'reason',
      `Analyzing user's creative prompt: "${state.config.prompt.substring(0, 100)}..." ` +
      `Need to enhance it with ${state.config.style} style terminology and motion design concepts.`,
      context
    );

    this.emitProgress(context, 'Analyzing creative brief...');
    currentState = this.updateProgress(currentState, 20, 'Analyzing prompt', 'Extracting key concepts');

    await this.delay(200);

    // ACT: Call Gemini to enhance the query
    currentState = this.think(
      currentState,
      'act',
      `Calling Gemini to enhance the prompt with motion design specifics for ${state.config.style} style.`,
      context
    );

    this.emitProgress(context, 'Enhancing creative direction...', 'Adding motion design concepts');
    currentState = this.updateProgress(currentState, 50, 'Enhancing prompt', 'Calling AI');

    try {
      const enhancedPrompt = await this.enhancePrompt(state);

      // OBSERVE: Review the enhanced prompt
      currentState = this.think(
        currentState,
        'observe',
        `Enhanced prompt created. Added ${state.config.style} style elements and motion design terminology.`,
        context
      );

      // Update the config with the enhanced prompt while keeping the original
      currentState = updateState(currentState, {
        config: {
          ...currentState.config,
          prompt: enhancedPrompt
        }
      });

      this.emitProgress(context, 'Creative brief enhanced', 'Ready for planning');
      currentState = this.updateProgress(currentState, 100, 'Query enhancement complete');

      return this.success(currentState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      currentState = this.think(
        currentState,
        'observe',
        `Query enhancement failed: ${errorMessage}. Will proceed with original prompt.`,
        context
      );

      // Non-fatal - we can proceed with the original prompt
      this.emitProgress(context, 'Using original prompt', 'Enhancement skipped');
      currentState = this.updateProgress(currentState, 100, 'Query enhancement complete (fallback)');

      return this.success(currentState);
    }
  }

  /**
   * Enhance the user's prompt using Gemini.
   */
  private async enhancePrompt(state: WorkflowState): Promise<string> {
    const ai = this.getAI();

    const systemPrompt = `You are a motion design expert. Your task is to enhance a user's creative brief
for a motion design video. Add relevant motion design terminology, animation concepts, and style-specific
elements while preserving the user's original intent.

STYLE: ${state.config.style}
BRAND: ${state.brand.name} (${state.brand.industry})
TAGLINE: ${state.brand.tagline}
COLORS: ${state.brand.colors.join(', ')}
ASPECT RATIO: ${state.config.aspectRatio}

Style Guidelines:
${this.getStyleGuidelines(state.config.style)}

USER'S ORIGINAL PROMPT:
${state.config.prompt}

INSTRUCTIONS:
1. Keep the core creative direction from the user's prompt
2. Add 2-3 specific animation techniques relevant to the style
3. Suggest timing/pacing appropriate for a 5-second video
4. Include specific motion design terminology
5. Keep it concise (max 3 paragraphs)

Return ONLY the enhanced prompt, no explanations.`;

    const response = await ai.models.generateContent({
      model: AI_MODELS.FAST,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    });

    const enhancedPrompt = response.text?.trim();

    if (!enhancedPrompt || enhancedPrompt.length < 10) {
      // Fall back to original if enhancement fails
      return state.config.prompt;
    }

    return enhancedPrompt;
  }

  /**
   * Get style-specific guidelines for prompt enhancement.
   */
  private getStyleGuidelines(style: string): string {
    const guidelines: Record<string, string> = {
      minimalist: `
        - Focus on negative space and clean transitions
        - Use subtle fade and slide animations
        - Emphasize typography with precise timing
        - Monochromatic or limited color palette animations`,

      geometric: `
        - Use shape-based transformations (circles, squares, triangles)
        - Grid-based layouts with mathematical precision
        - Rotation, scaling, and morphing of geometric elements
        - Pattern-based backgrounds with synchronized motion`,

      fluid: `
        - Organic, flowing movements with bezier curves
        - Liquid-like transitions and morphing shapes
        - Gradient animations and color bleeding effects
        - Smooth, continuous motion without hard stops`,

      brutalist: `
        - Bold, stark contrasts and sharp movements
        - Glitch effects and intentional imperfections
        - Raw typography with aggressive animations
        - Asymmetrical layouts with unexpected timing`,

      cinematic: `
        - Dramatic reveals with depth and parallax
        - Lens flare and lighting effects
        - Smooth camera-like movements (pan, zoom, dolly)
        - Atmospheric elements (particles, fog, gradients)`
    };

    return guidelines[style] || guidelines.minimalist;
  }
}
