import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  WorkflowState,
  WorkflowPhase,
  updateState,
  GeneratedFile,
  ImplementationRound,
  ValidationResult,
  SceneDescription,
  SceneRenderStatus
} from '../state';
import { errorTracker } from '../state';
import { BasePhase, PhaseContext, PhaseResult } from './BasePhase';
import { AI_MODELS } from '../../agent/models';
import { extractGeminiThoughts, getThinkingConfig } from '../../agent/geminiThoughts';

/**
 * ImplementationPhase (The "Code Generator") generates Remotion code
 * using a Modular Scene Architecture where each scene is a separate file.
 *
 * This phase:
 * 1. Generates individual scene files (Scene1.tsx, Scene2.tsx, etc.)
 * 2. Creates a MainComposition.tsx that imports and sequences scenes
 * 3. Validates each scene file compiles correctly
 * 4. Supports targeted regeneration of specific scenes during iteration
 */
export class ImplementationPhase extends BasePhase {
  readonly phase = WorkflowPhase.IMPLEMENTATION;
  readonly name = 'Implementation';

  private ai: GoogleGenAI | null = null;
  private outputDir: string;

  constructor() {
    super();
    this.outputDir = path.join(process.cwd(), 'remotion', 'src', 'generated', 'scenes');
  }

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
    if (!state.plan) {
      return this.failure(state, 'No implementation plan found. Planning phase must run first.');
    }

    // Determine which scenes need generation
    const scenesToGenerate = this.determineScenesForGeneration(state);
    const isFullGeneration = scenesToGenerate.length === state.plan.sceneBreakdown.length;

    // REASON: What's the implementation approach?
    let currentState = this.think(
      state,
      'reason',
      isFullGeneration
        ? `Full generation needed for ${scenesToGenerate.length} scenes. Will create modular scene files and MainComposition.`
        : `Targeted regeneration of ${scenesToGenerate.length} scene(s): ${scenesToGenerate.map(s => `Scene${s.sceneNumber}`).join(', ')}`,
      context
    );

    this.emitProgress(context, 'Starting code generation...');
    currentState = this.updateProgress(currentState, 5, 'Implementing', 'Preparing scene generation');

    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Start a new implementation round
    const roundNumber = currentState.currentRound + 1;
    const round: ImplementationRound = {
      roundNumber,
      files: [],
      validationResult: { valid: true, errors: [], warnings: [] },
      issues: [],
      thoughts: [...currentState.thoughts],
      startedAt: new Date()
    };

    currentState = updateState(currentState, {
      currentRound: roundNumber
    });

    // Initialize scene statuses for incremental UI updates
    const initialSceneStatuses: SceneRenderStatus[] = scenesToGenerate.map(scene => ({
      sceneNumber: scene.sceneNumber,
      sceneId: scene.id,
      status: 'pending' as const,
      progress: 0,
      message: 'Waiting to generate...'
    }));
    currentState = updateState(currentState, {
      sceneStatuses: initialSceneStatuses
    });

    // Emit initial scene statuses
    if (context.onSceneProgress) {
      for (const status of initialSceneStatuses) {
        context.onSceneProgress(status);
      }
    }

    try {
      // ACT: Generate scene files
      currentState = this.think(
        currentState,
        'act',
        `Generating ${scenesToGenerate.length} scene files using Gemini 2.5 Flash...`,
        context
      );

      const generatedFiles: GeneratedFile[] = [];
      const totalScenes = scenesToGenerate.length;

      for (let i = 0; i < scenesToGenerate.length; i++) {
        const scene = scenesToGenerate[i];
        const progressPercent = 10 + Math.round((i / totalScenes) * 60);

        // Emit scene "generating" status
        const generatingStatus: SceneRenderStatus = {
          sceneNumber: scene.sceneNumber,
          sceneId: scene.id,
          status: 'generating',
          progress: 10,
          message: `Generating Scene ${scene.sceneNumber}...`
        };
        if (context.onSceneProgress) {
          context.onSceneProgress(generatingStatus);
        }
        currentState = this.updateSceneStatus(currentState, generatingStatus);

        this.emitProgress(
          context,
          `Generating Scene ${scene.sceneNumber}...`,
          `${i + 1}/${totalScenes} scenes`
        );
        currentState = this.updateProgress(
          currentState,
          progressPercent,
          'Generating scenes',
          `Scene ${scene.sceneNumber}`
        );

        try {
          const { file: sceneFile, thoughtSummary } = await this.generateSceneFile(currentState, scene, context);
          generatedFiles.push(sceneFile);

          // Emit the model's thinking if available
          if (thoughtSummary) {
            currentState = this.thinkWithModelThinking(
              currentState,
              'observe',
              `Scene ${scene.sceneNumber} reasoning complete`,
              thoughtSummary,
              context
            );
          }

          // Validate the scene file
          const validation = this.validateSceneCode(sceneFile.content, scene.sceneNumber);
          if (!validation.valid) {
            round.issues.push(`Scene ${scene.sceneNumber}: ${validation.errors.join(', ')}`);
            round.validationResult.errors.push(...validation.errors);

            // Emit scene error status
            const errorStatus: SceneRenderStatus = {
              sceneNumber: scene.sceneNumber,
              sceneId: scene.id,
              status: 'error',
              progress: 100,
              message: `Validation failed`,
              error: validation.errors.join(', ')
            };
            if (context.onSceneProgress) {
              context.onSceneProgress(errorStatus);
            }
            currentState = this.updateSceneStatus(currentState, errorStatus);
          } else {
            // Emit scene complete status (code generated successfully)
            const completeStatus: SceneRenderStatus = {
              sceneNumber: scene.sceneNumber,
              sceneId: scene.id,
              status: 'complete',
              progress: 100,
              message: `Scene ${scene.sceneNumber} generated successfully`
            };
            if (context.onSceneProgress) {
              context.onSceneProgress(completeStatus);
            }
            currentState = this.updateSceneStatus(currentState, completeStatus);
          }
          round.validationResult.warnings.push(...validation.warnings);
        } catch (sceneError) {
          const errorMessage = sceneError instanceof Error ? sceneError.message : String(sceneError);

          // Emit scene error status
          const errorStatus: SceneRenderStatus = {
            sceneNumber: scene.sceneNumber,
            sceneId: scene.id,
            status: 'error',
            progress: 0,
            message: `Generation failed`,
            error: errorMessage
          };
          if (context.onSceneProgress) {
            context.onSceneProgress(errorStatus);
          }
          currentState = this.updateSceneStatus(currentState, errorStatus);

          round.issues.push(`Scene ${scene.sceneNumber}: ${errorMessage}`);
          round.validationResult.errors.push(errorMessage);
        }
      }

      // Generate the MainComposition that sequences all scenes
      this.emitProgress(context, 'Creating main composition...', 'Assembling scenes');
      currentState = this.updateProgress(currentState, 75, 'Creating composition', 'Assembling scenes');

      const mainComposition = await this.generateMainComposition(currentState, state.plan.sceneBreakdown);
      generatedFiles.push(mainComposition);

      // Validate main composition
      const mainValidation = this.validateMainComposition(mainComposition.content);
      if (!mainValidation.valid) {
        round.issues.push(`MainComposition: ${mainValidation.errors.join(', ')}`);
        round.validationResult.errors.push(...mainValidation.errors);
      }

      // Write all files to disk
      this.emitProgress(context, 'Writing files to disk...');
      currentState = this.updateProgress(currentState, 85, 'Saving files');

      for (const file of generatedFiles) {
        await fs.writeFile(file.filePath, file.content, 'utf-8');
      }

      // OBSERVE: Summarize the implementation result
      round.files = generatedFiles;
      round.completedAt = new Date();
      round.validationResult.valid = round.validationResult.errors.length === 0;

      currentState = this.think(
        currentState,
        'observe',
        round.validationResult.valid
          ? `Implementation complete: ${generatedFiles.length} files generated successfully.`
          : `Implementation has issues: ${round.issues.length} problems found. ${round.issues[0]}`,
        context
      );

      // Record errors if any
      if (!round.validationResult.valid) {
        for (const error of round.validationResult.errors) {
          currentState = errorTracker.recordError(currentState, 'validation', error);
        }
      }

      // Update state with the new round
      currentState = updateState(currentState, {
        rounds: [...currentState.rounds, round]
      });

      this.emitProgress(
        context,
        round.validationResult.valid ? 'Implementation complete' : 'Implementation needs fixes',
        `${generatedFiles.length} files generated`
      );
      currentState = this.updateProgress(currentState, 100, 'Implementation complete');

      return this.success(currentState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      currentState = this.think(
        currentState,
        'observe',
        `Implementation failed with error: ${errorMessage}`,
        context
      );

      currentState = errorTracker.recordError(currentState, 'generation', errorMessage);

      round.completedAt = new Date();
      round.issues.push(errorMessage);
      round.validationResult.valid = false;
      round.validationResult.errors.push(errorMessage);

      currentState = updateState(currentState, {
        rounds: [...currentState.rounds, round]
      });

      return this.failure(currentState, errorMessage);
    }
  }

  /**
   * Determine which scenes need to be (re)generated.
   * If this is the first round or no checkpoints, generate all.
   * Otherwise, only regenerate scenes with validation errors.
   */
  private determineScenesForGeneration(state: WorkflowState): SceneDescription[] {
    if (!state.plan) return [];

    // First round: generate all scenes
    if (state.currentRound === 0 || state.rounds.length === 0) {
      return state.plan.sceneBreakdown;
    }

    // Find scenes with issues from the last round
    const lastRound = state.rounds[state.rounds.length - 1];
    if (!lastRound || lastRound.validationResult.valid) {
      return state.plan.sceneBreakdown;
    }

    // Parse issues to find which scenes need regeneration
    const scenesWithIssues = new Set<number>();
    for (const issue of lastRound.issues) {
      const match = issue.match(/Scene (\d+):/);
      if (match) {
        scenesWithIssues.add(parseInt(match[1], 10));
      }
    }

    if (scenesWithIssues.size === 0) {
      // Can't determine specific scenes, regenerate all
      return state.plan.sceneBreakdown;
    }

    return state.plan.sceneBreakdown.filter(scene =>
      scenesWithIssues.has(scene.sceneNumber)
    );
  }

  /**
   * Generate a single scene file.
   */
  private async generateSceneFile(
    state: WorkflowState,
    scene: SceneDescription,
    context: PhaseContext
  ): Promise<{ file: GeneratedFile; thoughtSummary?: string; thoughtSignature?: string }> {
    const ai = this.getAI();
    const errorContext = errorTracker.getErrorContext(state);

    const prompt = this.buildScenePrompt(state, scene, errorContext);

    // Enable thinking to capture the model's reasoning process
    const thinkingConfig = getThinkingConfig({ includeThoughts: true });

    // Use rate-limited call to respect API quotas
    const response = await this.rateLimitedCall(() =>
      ai.models.generateContent({
        model: AI_MODELS.SMART,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.6,
          maxOutputTokens: 8192,
          ...thinkingConfig
        }
      })
    );

    // Extract thoughts and text from the response
    const { text: responseText, thoughtSummary, thoughtSignature } = extractGeminiThoughts(response);
    let code = this.extractCode(responseText);

    if (!code) {
      throw new Error(`No code generated for Scene ${scene.sceneNumber}`);
    }

    // Auto-fix common issues
    code = this.autoFixSceneCode(code, scene.sceneNumber);

    const fileName = `Scene${scene.sceneNumber}.tsx`;
    const filePath = path.join(this.outputDir, fileName);

    return {
      file: {
        filePath,
        content: code,
        sceneId: scene.id
      },
      thoughtSummary,
      thoughtSignature
    };
  }

  /**
   * Build the prompt for generating a scene file.
   */
  private buildScenePrompt(
    state: WorkflowState,
    scene: SceneDescription,
    errorContext: string
  ): string {
    const frameCount = scene.frameRange.end - scene.frameRange.start + 1;

    return `You are a senior React/Remotion developer. Generate a SINGLE scene component file.

FILE: Scene${scene.sceneNumber}.tsx
EXPORT: The component MUST be exported as "export const Scene${scene.sceneNumber}"

SCENE DETAILS:
- Scene Number: ${scene.sceneNumber}
- Description: ${scene.description}
- Frame Range: ${scene.frameRange.start} to ${scene.frameRange.end} (${frameCount} frames)
- Key Elements: ${scene.keyElements.join(', ')}

BRAND CONTEXT:
- Name: ${state.brand.name}
- Industry: ${state.brand.industry}
- Tagline: "${state.brand.tagline}"
- Colors: ${state.brand.colors.join(', ')}

STYLE: ${state.config.style}
ASPECT RATIO: ${state.config.aspectRatio}

TECHNICAL REQUIREMENTS:
1. Import React and Remotion primitives (AbsoluteFill, useCurrentFrame, interpolate, spring, etc.)
2. The component receives NO props - use the brand values directly
3. Use useCurrentFrame() to get current frame (0 to ${frameCount - 1} relative to scene)
4. Use interpolate() and spring() for smooth animations
5. All animations should be contained within the ${frameCount} frame duration
6. Use the brand colors: ${state.brand.colors.map(c => `"${c}"`).join(', ')}
7. Export as: export const Scene${scene.sceneNumber}: React.FC = () => { ... }

STYLE GUIDELINES (${state.config.style}):
${this.getStyleGuidelines(state.config.style)}

${errorContext ? `\n${errorContext}\n` : ''}

Return ONLY the TypeScript/React code. No explanations, no markdown code blocks.`;
  }

  /**
   * Generate the MainComposition that sequences all scenes.
   */
  private async generateMainComposition(
    state: WorkflowState,
    scenes: SceneDescription[]
  ): Promise<GeneratedFile> {
    // We build this deterministically rather than via AI for reliability
    const imports = scenes
      .map(s => `import { Scene${s.sceneNumber} } from './Scene${s.sceneNumber}';`)
      .join('\n');

    const seriesItems = scenes
      .map(s => {
        const duration = s.frameRange.end - s.frameRange.start + 1;
        return `      <Series.Sequence durationInFrames={${duration}}>
        <Scene${s.sceneNumber} />
      </Series.Sequence>`;
      })
      .join('\n');

    const code = `import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
${imports}

/**
 * MainComposition sequences all generated scenes.
 * Total duration: 150 frames (5 seconds at 30fps)
 * Brand: ${state.brand.name}
 * Style: ${state.config.style}
 */
export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '${state.brand.colors[0] || '#000000'}' }}>
      <Series>
${seriesItems}
      </Series>
    </AbsoluteFill>
  );
};

export default MainComposition;
`;

    const filePath = path.join(this.outputDir, 'MainComposition.tsx');

    return {
      filePath,
      content: code
    };
  }

  /**
   * Extract code from AI response.
   */
  private extractCode(response: string): string | null {
    // Try to extract from markdown code blocks
    const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript)?\s*([\s\S]*?)```/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = codeBlockRegex.exec(response)) !== null) {
      matches.push(match);
    }

    if (matches.length > 0) {
      // Return the longest code block
      let bestBlock = '';
      for (const m of matches) {
        const code = m[1].trim();
        if (code.length > bestBlock.length) {
          bestBlock = code;
        }
      }
      return bestBlock;
    }

    // If no code blocks, check if the response is raw code
    if (response.includes('import') && (response.includes('export') || response.includes('const'))) {
      return response.trim();
    }

    return null;
  }

  /**
   * Auto-fix common issues in scene code.
   */
  private autoFixSceneCode(code: string, sceneNumber: number): string {
    let fixedCode = code;

    // Ensure React import
    if (!fixedCode.includes("import React") && !fixedCode.includes("from 'react'")) {
      fixedCode = `import React from 'react';\n${fixedCode}`;
    }

    // Ensure Remotion imports
    if (!fixedCode.includes("from 'remotion'")) {
      fixedCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';\n${fixedCode}`;
    }

    // Ensure proper export
    const exportPattern = new RegExp(`export\\s+const\\s+Scene${sceneNumber}`);
    if (!exportPattern.test(fixedCode)) {
      // Try to find an existing component and rename/export it
      const componentMatch = fixedCode.match(/(?:const|function)\s+(\w+)\s*[:=]/);
      if (componentMatch && componentMatch[1] !== `Scene${sceneNumber}`) {
        // Add an export alias at the end
        fixedCode = fixedCode + `\n\nexport const Scene${sceneNumber} = ${componentMatch[1]};`;
      }
    }

    return fixedCode;
  }

  /**
   * Validate scene code.
   */
  private validateSceneCode(code: string, sceneNumber: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for Remotion import
    if (!code.includes("from 'remotion'") && !code.includes('from "remotion"')) {
      errors.push('Missing Remotion import');
    }

    // Check for component export
    const exportPattern = new RegExp(`export\\s+(const|function)\\s+Scene${sceneNumber}`);
    if (!exportPattern.test(code)) {
      errors.push(`Missing export for Scene${sceneNumber}`);
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /\brequire\s*\(/, name: 'require() calls' },
      { pattern: /\beval\s*\(/, name: 'eval() calls' },
      { pattern: /new\s+Function\s*\(/, name: 'Function constructor' }
    ];

    for (const danger of dangerousPatterns) {
      if (danger.pattern.test(code)) {
        errors.push(`Forbidden pattern: ${danger.name}`);
      }
    }

    // Warnings (non-fatal)
    if (!code.includes('useCurrentFrame')) {
      warnings.push('No animation frame usage detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate the main composition code.
   */
  private validateMainComposition(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!code.includes('Series')) {
      errors.push('MainComposition must use Series for scene sequencing');
    }

    if (!code.includes('export')) {
      errors.push('Missing export for MainComposition');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get style-specific guidelines.
   */
  private getStyleGuidelines(style: string): string {
    const guidelines: Record<string, string> = {
      minimalist: `
- Clean, simple animations with lots of whitespace
- Subtle fade and slide transitions
- Focus on typography and negative space
- Use thin lines and minimal shapes`,

      geometric: `
- Shape-based animations (circles, squares, triangles)
- Grid-based layouts with mathematical precision
- Rotation, scaling, and morphing effects
- Pattern-based backgrounds`,

      fluid: `
- Organic, flowing movements
- Bezier curve animations
- Gradient transitions and color morphing
- Smooth, continuous motion`,

      brutalist: `
- Bold, stark contrasts
- Glitch effects and sharp movements
- Raw typography with aggressive styling
- Asymmetrical layouts`,

      cinematic: `
- Dramatic reveals with depth
- Parallax and camera-like movements
- Atmospheric effects (particles, gradients)
- Smooth transitions with easing`
    };

    return guidelines[style] || guidelines.minimalist;
  }

  /**
   * Helper to update a scene status in the workflow state immutably.
   */
  private updateSceneStatus(state: WorkflowState, status: SceneRenderStatus): WorkflowState {
    const existingStatuses = state.sceneStatuses || [];
    const updatedStatuses = existingStatuses.map(s =>
      s.sceneNumber === status.sceneNumber ? status : s
    );

    // If the scene wasn't in the list, add it
    if (!existingStatuses.find(s => s.sceneNumber === status.sceneNumber)) {
      updatedStatuses.push(status);
    }

    return updateState(state, {
      sceneStatuses: updatedStatuses
    });
  }
}
