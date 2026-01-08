import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowState,
  WorkflowPhase,
  updateState,
  ImplementationPlan,
  SceneDescription
} from '../state';
import { BasePhase, PhaseContext, PhaseResult } from './BasePhase';
import { AI_MODELS } from '../../agent/models';
import { extractGeminiThoughts, getThinkingConfig } from '../../agent/geminiThoughts';

/**
 * PlanningPhase (The "Script Builder") converts the user's request into
 * a structured scene breakdown that can be visualized and edited in the UI.
 *
 * This phase:
 * 1. Analyzes the enhanced prompt
 * 2. Breaks the video into logical scenes
 * 3. Estimates frame ranges for each scene
 * 4. Returns a structured ImplementationPlan
 */
export class PlanningPhase extends BasePhase {
  readonly phase = WorkflowPhase.PLANNING;
  readonly name = 'Planning';

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
    // REASON: What's the planning approach?
    let currentState = this.think(
      state,
      'reason',
      `Need to break down the video into discrete scenes for "${state.brand.name}". ` +
      `Will create a scene structure with frame ranges for a 150-frame (5-second) video ` +
      `using the ${state.config.style} style.`,
      context
    );

    this.emitProgress(context, 'Analyzing video structure...');
    currentState = this.updateProgress(currentState, 10, 'Planning video', 'Analyzing prompt');

    await this.delay(200);

    // ACT: Call Gemini to generate the scene breakdown
    currentState = this.think(
      currentState,
      'act',
      `Calling Gemini to generate scene breakdown with frame timings and key elements.`,
      context
    );

    this.emitProgress(context, 'Creating scene breakdown...', 'Designing video structure');
    currentState = this.updateProgress(currentState, 40, 'Generating plan', 'Creating scenes');

    try {
      const { plan, thoughtSummary } = await this.generatePlan(currentState);

      // Emit the model's thinking if available
      if (thoughtSummary) {
        currentState = this.thinkWithModelThinking(
          currentState,
          'observe',
          'Planning reasoning complete',
          thoughtSummary,
          context
        );
      }

      // OBSERVE: Validate the generated plan
      currentState = this.think(
        currentState,
        'observe',
        `Generated ${plan.sceneBreakdown.length} scenes. ` +
        `Complexity: ${plan.estimatedComplexity}. Approach: ${plan.approach.substring(0, 100)}...`,
        context
      );

      // Update state with the plan
      currentState = updateState(currentState, { plan });

      this.emitProgress(context, 'Scene breakdown complete', `${plan.sceneBreakdown.length} scenes planned`);
      currentState = this.updateProgress(currentState, 100, 'Planning complete');

      // The planning phase may optionally await user feedback before continuing
      // For now, we continue automatically
      return this.success(currentState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      currentState = this.think(
        currentState,
        'observe',
        `Planning failed: ${errorMessage}. Creating fallback single-scene plan.`,
        context
      );

      // Create a fallback single-scene plan
      const fallbackPlan = this.createFallbackPlan(currentState);
      currentState = updateState(currentState, { plan: fallbackPlan });

      this.emitProgress(context, 'Using simplified plan', 'Single scene structure');
      currentState = this.updateProgress(currentState, 100, 'Planning complete (fallback)');

      return this.success(currentState);
    }
  }

  /**
   * Generate the implementation plan using Gemini.
   */
  private async generatePlan(state: WorkflowState): Promise<{ plan: ImplementationPlan; thoughtSummary?: string }> {
    const ai = this.getAI();

    const systemPrompt = `You are a motion design director creating a video storyboard.
Break down a 5-second motion design video (150 frames at 30fps) into logical scenes.

BRAND: ${state.brand.name}
INDUSTRY: ${state.brand.industry}
TAGLINE: "${state.brand.tagline}"
COLORS: ${state.brand.colors.join(', ')}
STYLE: ${state.config.style}
ASPECT RATIO: ${state.config.aspectRatio}

CREATIVE DIRECTION:
${state.config.prompt}

REQUIREMENTS:
1. Create 3-5 distinct scenes that flow naturally
2. Each scene must have a clear purpose (intro, main content, outro, etc.)
3. Frame ranges must be consecutive and cover all 150 frames (0-149)
4. Include specific visual elements for each scene
5. Consider the ${state.config.style} style in your scene descriptions

OUTPUT FORMAT - Return ONLY valid JSON matching this exact structure:
{
  "approach": "Brief description of the overall animation approach",
  "sceneBreakdown": [
    {
      "sceneNumber": 1,
      "description": "What happens in this scene",
      "frameRange": { "start": 0, "end": 49 },
      "keyElements": ["element1", "element2"]
    }
  ],
  "estimatedComplexity": "low" | "medium" | "high"
}

IMPORTANT:
- Frame ranges must start at 0 and end at 149
- Each scene's start must equal the previous scene's end + 1
- Include at least 3 keyElements per scene
- Return ONLY the JSON, no markdown code blocks or explanations`;

    // Enable thinking to capture the model's reasoning process
    const thinkingConfig = getThinkingConfig({ includeThoughts: true });

    // Use rate-limited call to respect API quotas
    const response = await this.rateLimitedCall(() =>
      ai.models.generateContent({
        model: AI_MODELS.SMART,
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        config: {
          temperature: 0.5,
          maxOutputTokens: 2048,
          ...thinkingConfig
        }
      })
    );

    // Extract thoughts and text from the response
    const { text: responseText, thoughtSummary } = extractGeminiThoughts(response);

    // Parse the JSON response
    const plan = this.parseJsonResponse(responseText.trim());

    // Validate and normalize the plan
    return {
      plan: this.normalizePlan(plan),
      thoughtSummary
    };
  }

  /**
   * Parse JSON from the response, handling potential markdown wrapping.
   */
  /**
   * Parse JSON from the response, handling potential markdown wrapping.
   */
  private parseJsonResponse(text: string): unknown {
    // 1. Remove markdown code blocks (```json ... ``` or just ``` ... ```)
    let cleanerText = text.replace(/```(?:json)?/g, '').replace(/```/g, '');

    // 2. Find the JSON object (first { to last })
    const startIndex = cleanerText.indexOf('{');
    const endIndex = cleanerText.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleanerText = cleanerText.substring(startIndex, endIndex + 1);
    }

    try {
      return JSON.parse(cleanerText);
    } catch {
      throw new Error(`Failed to parse plan JSON. Raw text fragment: ${cleanerText.substring(0, 100)}...`);
    }
  }

  /**
   * Normalize and validate the plan structure.
   */
  private normalizePlan(rawPlan: unknown): ImplementationPlan {
    const plan = rawPlan as Record<string, unknown>;

    if (!plan || typeof plan !== 'object') {
      throw new Error('Invalid plan format: expected object');
    }

    const sceneBreakdown = plan.sceneBreakdown as Record<string, unknown>[];
    if (!Array.isArray(sceneBreakdown) || sceneBreakdown.length === 0) {
      throw new Error('Invalid plan: missing or empty sceneBreakdown');
    }

    // Normalize scenes
    const normalizedScenes: SceneDescription[] = sceneBreakdown.map((scene, index) => {
      const rawFrameRange = scene.frameRange as { start?: number; end?: number } | undefined;
      const frameStart = rawFrameRange?.start;
      const frameEnd = rawFrameRange?.end;

      return {
        id: uuidv4(),
        sceneNumber: (scene.sceneNumber as number) || index + 1,
        description: (scene.description as string) || `Scene ${index + 1}`,
        frameRange: {
          start: typeof frameStart === 'number' ? frameStart : index * 50,
          end: typeof frameEnd === 'number' ? frameEnd : (index + 1) * 50 - 1
        },
        keyElements: Array.isArray(scene.keyElements)
          ? (scene.keyElements as string[])
          : ['animation', 'brand element']
      };
    });

    // Ensure frame ranges are valid and consecutive
    this.validateFrameRanges(normalizedScenes);

    return {
      approach: (plan.approach as string) || 'Standard motion design approach',
      sceneBreakdown: normalizedScenes,
      estimatedComplexity: this.normalizeComplexity(plan.estimatedComplexity as string),
      createdAt: new Date()
    };
  }

  /**
   * Validate that frame ranges are consecutive and cover 0-149.
   */
  private validateFrameRanges(scenes: SceneDescription[]): void {
    // Sort by start frame
    scenes.sort((a, b) => a.frameRange.start - b.frameRange.start);

    // Adjust to ensure continuous coverage
    let expectedStart = 0;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      scene.frameRange.start = expectedStart;

      if (i === scenes.length - 1) {
        // Last scene must end at 149
        scene.frameRange.end = 149;
      } else {
        // Ensure end is before next scene's start
        const duration = Math.max(
          20, // Minimum 20 frames per scene
          scene.frameRange.end - scene.frameRange.start + 1
        );
        scene.frameRange.end = Math.min(148, expectedStart + duration - 1);
      }

      expectedStart = scene.frameRange.end + 1;
      scene.sceneNumber = i + 1;
    }
  }

  /**
   * Normalize complexity value.
   */
  private normalizeComplexity(value: string): 'low' | 'medium' | 'high' {
    const normalized = String(value).toLowerCase();
    if (normalized === 'low' || normalized === 'medium' || normalized === 'high') {
      return normalized;
    }
    return 'medium';
  }

  /**
   * Create a fallback single-scene plan when generation fails.
   */
  private createFallbackPlan(state: WorkflowState): ImplementationPlan {
    return {
      approach: `Single-scene ${state.config.style} animation featuring brand elements`,
      sceneBreakdown: [
        {
          id: uuidv4(),
          sceneNumber: 1,
          description: `Full 5-second ${state.config.style} motion design featuring ${state.brand.name}`,
          frameRange: { start: 0, end: 149 },
          keyElements: [
            'Brand name animation',
            'Tagline reveal',
            'Color scheme showcase',
            'Logo treatment'
          ]
        }
      ],
      estimatedComplexity: 'low',
      createdAt: new Date()
    };
  }
}
