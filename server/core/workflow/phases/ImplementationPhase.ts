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
import { RemotionRenderer } from '../../renderer/remotionRenderer';

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
  private previewsDir: string;
  private renderer: RemotionRenderer;

  constructor() {
    super();
    this.outputDir = path.join(process.cwd(), 'remotion', 'src', 'generated', 'scenes');
    this.previewsDir = path.join(this.outputDir, 'previews');
    this.renderer = new RemotionRenderer();
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
    await fs.mkdir(this.previewsDir, { recursive: true });

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
            // Scene code generated and validated successfully - now render preview
            // First, save the scene file so the preview can import it
            await fs.writeFile(sceneFile.filePath, sceneFile.content, 'utf-8');

            // Generate and save the preview wrapper
            const previewWrapper = this.generateScenePreviewWrapper(scene, state);
            await fs.writeFile(previewWrapper.filePath, previewWrapper.content, 'utf-8');

            // Update status to rendering
            const renderingStatus: SceneRenderStatus = {
              sceneNumber: scene.sceneNumber,
              sceneId: scene.id,
              status: 'rendering',
              progress: 0,
              message: `Rendering Scene ${scene.sceneNumber} preview...`
            };
            if (context.onSceneProgress) {
              context.onSceneProgress(renderingStatus);
            }
            currentState = this.updateSceneStatus(currentState, renderingStatus);

            // Render the scene preview
            try {
              const sceneDuration = scene.frameRange.end - scene.frameRange.start + 1;
              const previewResult = await this.renderer.renderScenePreview(
                scene.sceneNumber,
                sceneDuration,
                currentState.config,
                (progress) => {
                  const updatedProgress: SceneRenderStatus = {
                    ...renderingStatus,
                    progress: Math.round(progress * 100),
                    message: `Rendering Scene ${scene.sceneNumber}: ${Math.round(progress * 100)}%`
                  };
                  if (context.onSceneProgress) {
                    context.onSceneProgress(updatedProgress);
                  }
                }
              );

              // Get preview URL and update status to complete
              const previewUrl = this.renderer.getScenePreviewUrl(previewResult.videoPath);
              const completeStatus: SceneRenderStatus = {
                sceneNumber: scene.sceneNumber,
                sceneId: scene.id,
                status: 'complete',
                progress: 100,
                message: `Scene ${scene.sceneNumber} ready`,
                previewUrl: previewUrl || undefined
              };
              if (context.onSceneProgress) {
                context.onSceneProgress(completeStatus);
              }
              currentState = this.updateSceneStatus(currentState, completeStatus);
            } catch (renderError) {
              // Preview rendering failed, but scene code is valid - mark complete without preview
              console.warn(`[ImplementationPhase] Scene ${scene.sceneNumber} preview rendering failed:`, renderError);
              const completeStatus: SceneRenderStatus = {
                sceneNumber: scene.sceneNumber,
                sceneId: scene.id,
                status: 'complete',
                progress: 100,
                message: `Scene ${scene.sceneNumber} generated (preview unavailable)`
              };
              if (context.onSceneProgress) {
                context.onSceneProgress(completeStatus);
              }
              currentState = this.updateSceneStatus(currentState, completeStatus);
            }
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

      // Write remaining files to disk
      // Scene files that passed validation were already saved during preview rendering
      // Scene files that failed validation still need to be saved for debugging
      this.emitProgress(context, 'Writing files to disk...');
      currentState = this.updateProgress(currentState, 85, 'Saving files');

      for (const file of generatedFiles) {
        // Check if file already exists (was saved during preview rendering)
        try {
          await fs.access(file.filePath);
          // File exists, skip writing
        } catch {
          // File doesn't exist, write it
          await fs.writeFile(file.filePath, file.content, 'utf-8');
        }
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
    const maxRetries = 2;
    let lastError: Error | null = null;

    // Retry loop for robustness
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this.buildScenePrompt(state, scene, errorContext);

        // Enable thinking to capture the model's reasoning process
        const thinkingConfig = getThinkingConfig({ includeThoughts: true });

        // Use rate-limited call to respect API quotas
        const response = await this.rateLimitedCall(() =>
          ai.models.generateContent({
            model: AI_MODELS.SMART,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: attempt === 0 ? 0.4 : 0.2, // Lower temperature on retry for consistency
              maxOutputTokens: 8192,
              ...thinkingConfig
            }
          })
        );

        // Extract thoughts and text from the response
        const { text: responseText, thoughtSummary, thoughtSignature } = extractGeminiThoughts(response);
        
        // Debug: Log raw response details
        console.log(`[ImplementationPhase] Scene ${scene.sceneNumber} - Raw response:`, {
          hasResponse: !!response,
          hasCandidates: !!response?.candidates?.length,
          candidateCount: response?.candidates?.length || 0,
          responseTextLength: responseText?.length || 0,
          responseTextPreview: responseText?.substring(0, 200) || '(empty)',
          hasThoughtSummary: !!thoughtSummary,
          thoughtSummaryPreview: thoughtSummary?.substring(0, 100) || '(none)',
        });
        
        let code = this.extractCode(responseText);

        // Debug: Log extraction result
        console.log(`[ImplementationPhase] Scene ${scene.sceneNumber} - Code extraction:`, {
          extractedCodeLength: code?.length || 0,
          extractedCodePreview: code?.substring(0, 200) || '(null)',
        });

        if (!code) {
          // Additional debug: check what the full response looks like
          console.error(`[ImplementationPhase] Scene ${scene.sceneNumber} - Full responseText:`, responseText || '(undefined)');
          throw new Error(`No code generated for Scene ${scene.sceneNumber}`);
        }

        // Auto-fix common issues
        code = this.autoFixSceneCode(code, scene.sceneNumber);

        // Validate before returning
        const validation = this.validateSceneCode(code, scene.sceneNumber);
        if (!validation.valid && attempt < maxRetries) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

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
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[ImplementationPhase] Scene ${scene.sceneNumber} attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // All retries failed - use fallback template
    console.warn(`[ImplementationPhase] Using fallback template for Scene ${scene.sceneNumber}`);
    const fallbackCode = this.generateFallbackScene(state, scene);
    const fileName = `Scene${scene.sceneNumber}.tsx`;
    const filePath = path.join(this.outputDir, fileName);

    return {
      file: {
        filePath,
        content: fallbackCode,
        sceneId: scene.id
      },
      thoughtSummary: `Used fallback template after ${maxRetries + 1} failed attempts: ${lastError?.message}`
    };
  }

  /**
   * Build the prompt for generating a scene file.
   * Uses a proven template structure with explicit examples for high success rate.
   */
  private buildScenePrompt(
    state: WorkflowState,
    scene: SceneDescription,
    errorContext: string
  ): string {
    const frameCount = scene.frameRange.end - scene.frameRange.start + 1;
    const fps = 30;
    const durationSeconds = Math.round(frameCount / fps * 10) / 10;

    // Provide a working example to ensure consistent output
    const exampleCode = `import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation values
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        opacity,
        transform: \`scale(\${scale})\`,
        color: '#FFFFFF',
        fontSize: 64,
        fontWeight: 'bold',
      }}>
        Brand Name
      </div>
    </AbsoluteFill>
  );
};`;

    return `You are an expert React/Remotion developer. Generate a complete, working scene component.

## TASK
Create Scene${scene.sceneNumber}.tsx - a self-contained Remotion scene component.

## SCENE SPECIFICATION
- **Description**: ${scene.description}
- **Duration**: ${frameCount} frames (${durationSeconds} seconds at ${fps}fps)
- **Key Elements**: ${scene.keyElements.join(', ')}

## BRAND
- **Name**: "${state.brand.name}"
- **Industry**: ${state.brand.industry}
- **Tagline**: "${state.brand.tagline || ''}"
- **Primary Color**: ${state.brand.colors[0] || '#000000'}
- **Secondary Color**: ${state.brand.colors[1] || '#FFFFFF'}

## STYLE: ${state.config.style.toUpperCase()}
${this.getStyleGuidelines(state.config.style)}

## WORKING EXAMPLE (follow this structure exactly)
\`\`\`tsx
${exampleCode}
\`\`\`

## REQUIREMENTS (MUST FOLLOW)
1. Start with: import React from 'react';
2. Import from 'remotion': AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring
3. Export as: export const Scene${scene.sceneNumber}: React.FC = () => { ... }
4. Use useCurrentFrame() for frame-based animations (0 to ${frameCount - 1})
5. Use interpolate() with extrapolateRight: 'clamp' for smooth animations
6. Use spring() for physics-based motion
7. AbsoluteFill as root with backgroundColor set
8. Hardcode brand colors: primary="${state.brand.colors[0] || '#000000'}", secondary="${state.brand.colors[1] || '#FFFFFF'}"
${errorContext ? `\n## PREVIOUS ERRORS TO AVOID\n${errorContext}` : ''}

## OUTPUT
Return ONLY valid TypeScript/React code. No markdown, no explanations, no code fences.
The code must compile without errors.`;
  }

  /**
   * Generate a fallback scene when AI generation fails.
   * This ensures the workflow can continue even if the AI doesn't cooperate.
   */
  private generateFallbackScene(state: WorkflowState, scene: SceneDescription): string {
    const frameCount = scene.frameRange.end - scene.frameRange.start + 1;
    const primaryColor = state.brand.colors[0] || '#000000';
    const secondaryColor = state.brand.colors[1] || '#FFFFFF';

    return `import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene${scene.sceneNumber}: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Smooth fade in
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Scale animation with spring physics
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Slide in from bottom
  const translateY = interpolate(
    frame,
    [0, 30],
    [50, 0],
    { extrapolateRight: 'clamp' }
  );

  // Fade out at the end
  const fadeOut = interpolate(
    frame,
    [${frameCount - 30}, ${frameCount}],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '${primaryColor}',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: opacity * fadeOut,
      }}
    >
      <div
        style={{
          transform: \`scale(\${scale}) translateY(\${translateY}px)\`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: '${secondaryColor}',
            fontSize: Math.min(width, height) * 0.08,
            fontWeight: 'bold',
            marginBottom: 20,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          ${state.brand.name}
        </div>
        <div
          style={{
            color: '${secondaryColor}',
            fontSize: Math.min(width, height) * 0.03,
            opacity: 0.8,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Scene ${scene.sceneNumber}
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;
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
   * Generate a preview wrapper for a single scene.
   * This creates a standalone Remotion entry point for rendering just that scene.
   */
  private generateScenePreviewWrapper(scene: SceneDescription, state: WorkflowState): GeneratedFile {
    const sceneDuration = scene.frameRange.end - scene.frameRange.start + 1;
    const width = state.config.aspectRatio === '16:9' ? 1920 : 1080;
    const height = state.config.aspectRatio === '16:9' ? 1080 : 1920;

    const code = `import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Scene${scene.sceneNumber} } from '../Scene${scene.sceneNumber}';

/**
 * Scene Preview Wrapper for Scene ${scene.sceneNumber}
 * Auto-generated for independent scene rendering
 */
export const ScenePreview${scene.sceneNumber}: React.FC = () => <Scene${scene.sceneNumber} />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ScenePreview"
      component={ScenePreview${scene.sceneNumber}}
      durationInFrames={${sceneDuration}}
      fps={30}
      width={${width}}
      height={${height}}
    />
  </>
);

registerRoot(RemotionRoot);
`;

    return {
      filePath: path.join(this.previewsDir, `ScenePreview${scene.sceneNumber}.tsx`),
      content: code,
      sceneId: scene.id
    };
  }

  /**
   * Extract code from AI response.
   */
  private extractCode(response: string): string | null {
    console.log('[extractCode] Input length:', response?.length || 0);
    console.log('[extractCode] Input preview:', response?.substring(0, 300) || '(empty/null)');
    
    if (!response || response.trim().length === 0) {
      console.log('[extractCode] Response is empty or null');
      return null;
    }
    
    // Try to extract from markdown code blocks
    const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript)?\s*([\s\S]*?)```/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = codeBlockRegex.exec(response)) !== null) {
      matches.push(match);
    }

    console.log('[extractCode] Found code blocks:', matches.length);

    if (matches.length > 0) {
      // Return the longest code block
      let bestBlock = '';
      for (const m of matches) {
        const code = m[1].trim();
        console.log('[extractCode] Code block length:', code.length);
        if (code.length > bestBlock.length) {
          bestBlock = code;
        }
      }
      console.log('[extractCode] Best block length:', bestBlock.length);
      return bestBlock;
    }

    // If no code blocks, check if the response is raw code
    const hasImport = response.includes('import');
    const hasExport = response.includes('export');
    const hasConst = response.includes('const');
    console.log('[extractCode] Raw code check:', { hasImport, hasExport, hasConst });
    
    if (hasImport && (hasExport || hasConst)) {
      console.log('[extractCode] Using raw response as code');
      return response.trim();
    }

    console.log('[extractCode] No code found in response');
    return null;
  }

  /**
   * Auto-fix common issues in scene code.
   */
  private autoFixSceneCode(code: string, sceneNumber: number): string {
    let fixedCode = code;

    // Fix truncated code by attempting to close unbalanced braces/brackets/parens
    fixedCode = this.attemptToCloseTruncatedCode(fixedCode);

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
   * Attempt to close truncated code by balancing braces, brackets, and parentheses.
   * This is a best-effort fix for LLM output that got cut off.
   */
  private attemptToCloseTruncatedCode(code: string): string {
    let fixedCode = code.trim();
    
    // Remove trailing incomplete statements that can't be salvaged
    const incompletePatterns = [
      /,\s*$/,           // trailing comma
      /=\s*$/,           // incomplete assignment
      /:\s*$/,           // incomplete ternary or object
      /\+\s*$/,          // incomplete addition
      /-\s*$/,           // incomplete subtraction
      /\*\s*$/,          // incomplete multiplication
      /&&\s*$/,          // incomplete logical AND
      /\|\|\s*$/,        // incomplete logical OR
      /\?\s*$/,          // incomplete ternary
      /=>\s*$/,          // incomplete arrow function
      /const\s+\w+\s*$/, // incomplete const declaration
      /let\s+\w+\s*$/,   // incomplete let declaration
    ];
    
    for (const pattern of incompletePatterns) {
      if (pattern.test(fixedCode)) {
        // Find the last complete line and trim there
        const lines = fixedCode.split('\n');
        while (lines.length > 0) {
          const lastLine = lines[lines.length - 1].trim();
          let isIncomplete = false;
          for (const p of incompletePatterns) {
            if (p.test(lastLine)) {
              isIncomplete = true;
              break;
            }
          }
          if (isIncomplete) {
            lines.pop();
          } else {
            break;
          }
        }
        fixedCode = lines.join('\n');
        console.warn('[AutoFix] Removed incomplete trailing statements');
      }
    }
    
    // Now balance the delimiters
    const openBraces = (fixedCode.match(/{/g) || []).length;
    const closeBraces = (fixedCode.match(/}/g) || []).length;
    const missingBraces = openBraces - closeBraces;
    
    const openParens = (fixedCode.match(/\(/g) || []).length;
    const closeParens = (fixedCode.match(/\)/g) || []).length;
    const missingParens = openParens - closeParens;
    
    const openBrackets = (fixedCode.match(/\[/g) || []).length;
    const closeBrackets = (fixedCode.match(/\]/g) || []).length;
    const missingBrackets = openBrackets - closeBrackets;
    
    // Build closing sequence
    let closingSequence = '';
    
    if (missingParens > 0) {
      closingSequence += ')'.repeat(missingParens);
      console.warn(`[AutoFix] Adding ${missingParens} closing parentheses`);
    }
    
    if (missingBrackets > 0) {
      closingSequence += ']'.repeat(missingBrackets);
      console.warn(`[AutoFix] Adding ${missingBrackets} closing brackets`);
    }
    
    if (missingBraces > 0) {
      if (!/[;{}]\s*$/.test(fixedCode)) {
        closingSequence = ';' + closingSequence;
      }
      closingSequence += '\n' + '}'.repeat(missingBraces);
      console.warn(`[AutoFix] Adding ${missingBraces} closing braces`);
    }
    
    if (closingSequence) {
      fixedCode = fixedCode + closingSequence;
    }
    
    return fixedCode;
  }

  /**
   * Check if code appears to be truncated or incomplete.
   * This catches cases where AI output was cut off mid-generation.
   */
  private isCodeTruncated(code: string): { truncated: boolean; reason?: string } {
    const trimmed = code.trim();
    
    // Check 1: Count braces - must be balanced
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { 
        truncated: true, 
        reason: `Unbalanced braces: ${openBraces} opening, ${closeBraces} closing` 
      };
    }
    
    // Check 2: Count parentheses - must be balanced
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return { 
        truncated: true, 
        reason: `Unbalanced parentheses: ${openParens} opening, ${closeParens} closing` 
      };
    }
    
    // Check 3: Count brackets - must be balanced
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { 
        truncated: true, 
        reason: `Unbalanced brackets: ${openBrackets} opening, ${closeBrackets} closing` 
      };
    }
    
    // Check 4: Code ends mid-statement (common truncation patterns)
    const truncationPatterns = [
      { pattern: /,\s*$/, reason: 'Code ends with trailing comma' },
      { pattern: /\(\s*$/, reason: 'Code ends with unclosed parenthesis' },
      { pattern: /{\s*$/, reason: 'Code ends with unclosed brace' },
      { pattern: /\[\s*$/, reason: 'Code ends with unclosed bracket' },
      { pattern: /=\s*$/, reason: 'Code ends mid-assignment' },
      { pattern: /:\s*$/, reason: 'Code ends after colon' },
      { pattern: /\+\s*$/, reason: 'Code ends mid-expression' },
      { pattern: /-\s*$/, reason: 'Code ends mid-expression' },
      { pattern: /\*\s*$/, reason: 'Code ends mid-expression' },
      { pattern: /&&\s*$/, reason: 'Code ends mid-expression' },
      { pattern: /\|\|\s*$/, reason: 'Code ends mid-expression' },
      { pattern: /\?\s*$/, reason: 'Code ends mid-ternary' },
      { pattern: /=>\s*$/, reason: 'Code ends after arrow' },
      { pattern: /const\s+\w+\s*$/, reason: 'Code ends with incomplete declaration' },
      { pattern: /let\s+\w+\s*$/, reason: 'Code ends with incomplete declaration' },
      { pattern: /import\s+[^;]*$/, reason: 'Code ends with incomplete import' },
    ];
    
    for (const { pattern, reason } of truncationPatterns) {
      if (pattern.test(trimmed)) {
        return { truncated: true, reason };
      }
    }
    
    // Check 5: Must have a return statement in the component (React requirement)
    if (!code.includes('return')) {
      return { 
        truncated: true, 
        reason: 'No return statement found - component is incomplete' 
      };
    }
    
    // Check 6: Minimum code length (a valid Remotion scene is at least ~200 chars)
    if (code.length < 200) {
      return { 
        truncated: true, 
        reason: `Code too short (${code.length} chars) - likely truncated` 
      };
    }
    
    return { truncated: false };
  }

  /**
   * Validate scene code.
   */
  private validateSceneCode(code: string, sceneNumber: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for truncated/incomplete code FIRST
    const truncationCheck = this.isCodeTruncated(code);
    if (truncationCheck.truncated) {
      errors.push(`Code appears truncated: ${truncationCheck.reason}`);
    }

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
