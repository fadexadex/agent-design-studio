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
import {
  StoryScript,
  Scene as StoryScene,
  Moment,
  TextElement,
  TextChoreography,
  TextAnimationType
} from '../../types/script.types';

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

            // Render the scene preview with self-correction loop
            const MAX_RENDER_CORRECTION_ATTEMPTS = 3;
            let renderAttempt = 0;
            let lastRenderError: string | null = null;
            let previewResult: { sceneNumber: number; videoPath: string; durationInFrames: number } | null = null;
            const sceneDuration = scene.frameRange.end - scene.frameRange.start + 1;

            while (renderAttempt < MAX_RENDER_CORRECTION_ATTEMPTS) {
              try {
                previewResult = await this.renderer.renderScenePreview(
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
                // Success - break out of retry loop
                break;
              } catch (renderError) {
                renderAttempt++;
                lastRenderError = renderError instanceof Error ? renderError.message : String(renderError);
                
                console.warn(`[ImplementationPhase] Scene ${scene.sceneNumber} render attempt ${renderAttempt} failed: ${lastRenderError}`);
                
                if (renderAttempt < MAX_RENDER_CORRECTION_ATTEMPTS) {
                  // Emit "correcting" status
                  const correctingStatus: SceneRenderStatus = {
                    sceneNumber: scene.sceneNumber,
                    sceneId: scene.id,
                    status: 'generating',
                    progress: 50,
                    message: `Fixing Scene ${scene.sceneNumber} (attempt ${renderAttempt + 1}/${MAX_RENDER_CORRECTION_ATTEMPTS})...`
                  };
                  if (context.onSceneProgress) {
                    context.onSceneProgress(correctingStatus);
                  }
                  currentState = this.updateSceneStatus(currentState, correctingStatus);
                  
                  // Attempt correction
                  const correction = await this.attemptRenderErrorCorrection(
                    currentState,
                    scene,
                    sceneFile.filePath,
                    lastRenderError,
                    renderAttempt,
                    context
                  );
                  
                  if (correction.corrected && correction.code) {
                    // Save corrected code and retry
                    await fs.writeFile(sceneFile.filePath, correction.code, 'utf-8');
                    
                    // Regenerate preview wrapper too (in case imports changed)
                    const updatedPreviewWrapper = this.generateScenePreviewWrapper(scene, state);
                    await fs.writeFile(updatedPreviewWrapper.filePath, updatedPreviewWrapper.content, 'utf-8');
                    
                    console.log(`[ImplementationPhase] Scene ${scene.sceneNumber} corrected, retrying render...`);
                  } else {
                    // Correction failed - try fallback template on last attempt
                    if (renderAttempt === MAX_RENDER_CORRECTION_ATTEMPTS - 1) {
                      console.warn(`[ImplementationPhase] Using fallback template for Scene ${scene.sceneNumber}`);
                      const fallbackCode = this.generateFallbackScene(currentState, scene);
                      await fs.writeFile(sceneFile.filePath, fallbackCode, 'utf-8');
                      
                      const fallbackPreviewWrapper = this.generateScenePreviewWrapper(scene, state);
                      await fs.writeFile(fallbackPreviewWrapper.filePath, fallbackPreviewWrapper.content, 'utf-8');
                    }
                  }
                }
              }
            }

            // Handle final result
            if (previewResult) {
              // Success - update status with preview URL
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
            } else {
              // All attempts failed - mark complete without preview
              console.error(`[ImplementationPhase] Scene ${scene.sceneNumber} failed after ${MAX_RENDER_CORRECTION_ATTEMPTS} attempts: ${lastRenderError}`);
              const completeStatus: SceneRenderStatus = {
                sceneNumber: scene.sceneNumber,
                sceneId: scene.id,
                status: 'complete',
                progress: 100,
                message: `Scene ${scene.sceneNumber} generated (preview failed after ${MAX_RENDER_CORRECTION_ATTEMPTS} attempts)`
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
   * Includes pre-built component library documentation to encourage reuse.
   */
  private buildScenePrompt(
    state: WorkflowState,
    scene: SceneDescription,
    errorContext: string
  ): string {
    const frameCount = scene.frameRange.end - scene.frameRange.start + 1;
    const fps = 30;
    const durationSeconds = Math.round(frameCount / fps * 10) / 10;

    // Provide a working example - include logo if available
    const hasLogo = !!state.brand.logoPath;
    
    // Component library documentation - teach the AI about pre-built components
    const componentLibraryDocs = this.getComponentLibraryDocs();
    
    // Example using components (preferred approach)
    const componentExampleCode = hasLogo 
      ? `import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';

export const Scene1: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Animated background - use variant and meshColors, NOT colors array */}
      <Background type="gradient-mesh" variant="dark" meshColors={{ primary: '#000000', secondary: '#1a1a2e' }} />
      
      <LayoutGrid anchor="center" direction="column" gap={30}>
        {/* Brand Logo */}
        <Img 
          src={staticFile("${state.brand.logoPath}")}
          style={{ width: 150, height: 'auto' }}
        />
        
        {/* Brand Name - animated text with preset */}
        <AnimatedText 
          text="Brand Name"
          preset="fadeBlurIn"
          fontSize={72}
          fontWeight={700}
          color="#FFFFFF"
        />
        
        {/* Tagline - staggered entrance */}
        <AnimatedText 
          text="Your tagline here"
          preset="slideInUp"
          delay={20}
          fontSize={28}
          color="#CCCCCC"
        />
      </LayoutGrid>
    </AbsoluteFill>
  );
};`
      : `import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';

export const Scene1: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Animated background - use variant and meshColors, NOT colors array */}
      <Background type="gradient-mesh" variant="dark" meshColors={{ primary: '#000000', secondary: '#1a1a2e' }} />
      
      <LayoutGrid anchor="center" direction="column" gap={30}>
        {/* Brand Name - animated text with preset */}
        <AnimatedText 
          text="Brand Name"
          preset="fadeBlurIn"
          fontSize={72}
          fontWeight={700}
          color="#FFFFFF"
        />
        
        {/* Tagline - staggered entrance */}
        <AnimatedText 
          text="Your tagline here"
          preset="slideInUp"
          delay={20}
          fontSize={28}
          color="#CCCCCC"
        />
      </LayoutGrid>
    </AbsoluteFill>
  );
};`;

    // Alternative raw Remotion example (for custom effects)
    const rawExampleCode = `import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity, transform: \`scale(\${scale})\`, color: '#FFFFFF', fontSize: 64 }}>
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

## SCENE PACING METADATA (Timeline Architecture)
- **Visual Style**: ${scene.visualStyle || 'abstract_shape'} - ${this.getVisualStyleHint(scene.visualStyle)}
- **Energy Level**: ${scene.energyLevel || 'medium'} - ${this.getEnergyLevelHint(scene.energyLevel)}
- **Duration Context**: ${this.getDurationHint(durationSeconds)}
${scene.textOverlay && scene.textOverlay.length > 0 ? `- **Text Overlay**: ${scene.textOverlay.map(t => `"${t}"`).join(', ')}` : ''}
${scene.cameraMovement ? `- **Camera Movement**: ${scene.cameraMovement}` : ''}
${scene.assets && scene.assets.length > 0 ? `- **Referenced Assets**: ${scene.assets.join(', ')}` : ''}

## BRAND
- **Name**: "${state.brand.name}"
- **Industry**: ${state.brand.industry}
- **Tagline**: "${state.brand.tagline || ''}"
- **Primary Color**: ${state.brand.colors[0] || '#000000'}
- **Secondary Color**: ${state.brand.colors[1] || '#FFFFFF'}
${state.brand.logoPath ? `- **Logo**: Available at "${state.brand.logoPath}" - USE staticFile("${state.brand.logoPath}") with <Img> component from 'remotion'` : '- **Logo**: Not provided'}

## STYLE: ${state.config.style.toUpperCase()}
${this.getStyleGuidelines(state.config.style)}

${this.getSceneChoreographyData(state.storyScript, scene.sceneNumber)}

${componentLibraryDocs}

## EXAMPLE: USING COMPONENT LIBRARY (PREFERRED)
\`\`\`tsx
${componentExampleCode}
\`\`\`

## EXAMPLE: RAW REMOTION CODE (for custom effects only)
\`\`\`tsx
${rawExampleCode}
\`\`\`

## REQUIREMENTS (MUST FOLLOW)
1. Start with: import React from 'react';
2. **Component library imports** (when using components):
   - \`import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';\`
   - \`import { Background } from '@/components/Global';\`
   - \`import { MotionContainer } from '@/components/Layout';\`
   - \`import { CameraRig } from '@/components/Camera';\`
   - \`import { MockupFrame } from '@/components/MockupFrame';\`
3. Use raw Remotion (interpolate, spring) for custom effects not covered by components
4. Export as: export const Scene${scene.sceneNumber}: React.FC = () => { ... }
5. For frame-based custom animations, use useCurrentFrame() (0 to ${frameCount - 1})
6. Always use extrapolateRight: 'clamp' with interpolate()
7. AbsoluteFill as root element
8. Use brand colors: primary="${state.brand.colors[0] || '#000000'}", secondary="${state.brand.colors[1] || '#FFFFFF'}"${state.brand.logoPath ? `
9. LOGO: Use <Img src={staticFile("${state.brand.logoPath}")} /> from 'remotion'` : ''}
${state.storyScript ? `
## CRITICAL: IMPLEMENT THE CHOREOGRAPHY DATA
If TEXT CHOREOGRAPHY section is provided above, you MUST:
- Display the EXACT text content specified (not improvised text)
- Use the EXACT animation types specified (entrance.type, exit.type)
- Use the EXACT timing durations (converted to frames: ms / 1000 * 30)
- Position text at the specified coordinates (x%, y%)
- Apply the typography specs (size, weight, color)
- Follow the energy level and emotional tone
- Implement any text interactions (makes-space-for, replaces, etc.)
DO NOT improvise or change the script content - implement it faithfully!
` : ''}

## CRITICAL TEXT POSITIONING RULES (PREVENT OVERLAPPING TEXT)
1. **NEVER animate multiple text elements simultaneously without staggered delays**
   - First text: delay={0} or startFrame={5}
   - Second text: delay={15} or startFrame={20} (minimum 15 frames between)
   - Third text: delay={30} or startFrame={35}, etc.
2. **Each text element MUST have unique vertical position**
   - Use LayoutGrid with gap: \`<LayoutGrid direction="column" gap={32}>\`
   - OR explicit positions at least 60px apart vertically
3. **REQUIRED for 2+ text elements - Use LayoutGrid**:
   \`\`\`tsx
   <LayoutGrid anchor="center" direction="column" gap={32}>
     <AnimatedText text="Title" preset="fadeBlurIn" delay={0} fontSize={64} />
     <AnimatedText text="Subtitle" preset="slideInUp" delay={15} fontSize={32} />
   </LayoutGrid>
   \`\`\`
4. **For raw Remotion code, use flex column with gap**:
   \`\`\`tsx
   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
     <div style={{ opacity: opacity1 }}>Title</div>
     <div style={{ opacity: opacity2 }}>Subtitle</div>
   </div>
   \`\`\`

## VIEWPORT SAFE ZONE RULES (PREVENT ELEMENTS FROM BEING CUT OFF)
1. **Keep all important content within 90% safe zone**:
   - Leave 5% margin on all sides (horizontal: ~96px, vertical: ~54px on 1080p)
   - NEVER place text or critical elements at the absolute edges
2. **CameraRig constraints** (when using CameraRig):
   - Keep zoom between 0.9 and 1.5 (max 150% zoom)
   - Keep x/y pan within ±15% of dimensions
   - Higher zoom + pan = content WILL be cut off
3. **Animation safe zones**:
   - Slide-in animations: start 100-150px off-screen, end within safe zone
   - NEVER animate elements to rest at extreme edges
4. **MockupFrame and scaling**:
   - Center mockups with at least 10% padding
   - Rotated elements need extra space (rotation increases bounding box)
   - Scaling above 1.0 requires proportionally more margin

## CRITICAL MISTAKES TO AVOID (WILL CAUSE ERRORS)

1. **CSS must use camelCase** - NEVER use kebab-case in style objects:
   - ❌ WRONG: \`style={{ z-index: 10, background-color: '#000' }}\`
   - ✅ CORRECT: \`style={{ zIndex: 10, backgroundColor: '#000' }}\`

2. **spring() does NOT have a delay parameter**:
   - ❌ WRONG: \`spring({ frame, fps, delay: 10 })\`
   - ✅ CORRECT: \`spring({ frame: frame - 10, fps })\`

3. **Background does NOT have colors, opacity, or speed props**:
   - ❌ WRONG: \`<Background colors={['#000']} opacity={0.5} speed={1} />\`
   - ✅ CORRECT: \`<Background variant="dark" meshColors={{ primary: '#000' }} animationSpeed={1} />\`

4. **AnimatedText does NOT have exitPreset or exitStartFrame props**:
   - ❌ WRONG: \`<AnimatedText exitPreset="fadeOut" exitStartFrame={90} />\`
   - ✅ CORRECT: \`<AnimatedText exit={{ startFrame: 90, opacity: { from: 1, to: 0 } }} />\`

5. **MotionContainer does NOT have animate or transition props** (those are Framer Motion):
   - ❌ WRONG: \`<MotionContainer animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>\`
   - ✅ CORRECT: \`<MotionContainer initial="hidden" delay={15} duration={30}>\`

6. **MotionContainer initial states use full names**:
   - ❌ WRONG: \`initial="below"\` or \`initial="above"\`
   - ✅ CORRECT: \`initial="offscreen-bottom"\` or \`initial="offscreen-top"\`
${errorContext ? `\n## PREVIOUS ERRORS TO AVOID\n${errorContext}` : ''}

## OUTPUT
Return ONLY valid TypeScript/React code. No markdown, no explanations, no code fences.
The code must compile without errors.`;
  }

  /**
   * Get component library documentation for the AI prompt.
   * Provides the full catalog so the AI can evaluate and select components
   * that fit its creative vision.
   */
  private getComponentLibraryDocs(): string {
    return `## COMPONENT LIBRARY

You have access to a pre-built component library. **Review these components and use the ones that help achieve your creative vision.** Use raw Remotion code when you need effects not covered here.

### Available Components & Import Paths

| Component | Import | What It Does |
|-----------|--------|--------------|
| **AnimatedText** | \`@/components/AnimatedText\` | Text with 9 animation presets, word/character stagger, positioning |
| **LayoutGrid** | \`@/components/AnimatedText\` | Flexbox layout for grouping/centering elements |
| **TextSequence** | \`@/components/AnimatedText\` | Sequential text animations (chain mode) |
| **CatchUpText** | \`@/components/TextChoreography\` | Words animate sequentially, later words move faster to "catch up" |
| **TextCycle** | \`@/components/TextChoreography\` | Words replace each other at the same position |
| **BounceReveal** | \`@/components/TextChoreography\` | Words appear on rhythmic bounces |
| **TextMakesSpace** | \`@/components/TextChoreography\` | Text slides aside to reveal other elements |
| **MorphText** | \`@/components/TextChoreography\` | Text transforms/morphs into another element |
| **Background** | \`@/components/Global\` | Animated backgrounds: gradient-mesh, grid-lines, blobs, presets |
| **MotionContainer** | \`@/components/Layout\` | Animation wrapper with entrance/exit states |
| **BentoGrid** | \`@/components/Layout\` | Animated CSS grid with stagger |
| **CameraRig** | \`@/components/Camera\` | Virtual camera: zoom, pan, rotate |
| **MockupFrame** | \`@/components/MockupFrame\` | Device mockups: browser, iphone15, card |
| **DynamicCursor** | \`@/components/DynamicCursor\` | Animated cursor for UI demos |
| **IrisTransition** | \`@/components/Transitions\` | Circular wipe transition |

### AnimatedText - Text Animations
\`\`\`tsx
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';

// Simple headline with blur-fade
<AnimatedText text="Welcome" preset="fadeBlurIn" fontSize={72} anchor="center" />

// Word-by-word animation
<AnimatedText 
  text="Each word animates" 
  preset="slideInUp" 
  animationUnit="word" 
  stagger={5} 
/>

// Typewriter effect
<AnimatedText text="Typing..." preset="typewriter" />

// Grouped text with layout
<LayoutGrid anchor="center" direction="column" gap={20}>
  <AnimatedText text="Title" preset="fadeBlurIn" fontSize={64} />
  <AnimatedText text="Subtitle" preset="fadeBlurIn" delay={15} fontSize={32} />
</LayoutGrid>
\`\`\`

**Presets:** fadeBlurIn, fadeBlurOut, scaleIn, springIn, slideInUp, slideInDown, slideInLeft, slideInRight, maskSlideUp, maskSlideDown, maskSlideLeft, maskSlideRight, glitchReveal, typewriter, none

**Key Props:** text, preset, delay, fontSize, fontWeight, color, anchor, animationUnit (full/word/character), stagger, exit (object with startFrame, opacity, blur, scale)

### TextChoreography - Advanced Text Patterns
\`\`\`tsx
import { CatchUpText, TextCycle, BounceReveal, TextMakesSpace, MorphText } from '@/components/TextChoreography';

// CatchUpText: Words animate sequentially, later words catch up
// Great for: Headlines that build momentum
<CatchUpText 
  text="Build faster with AI"
  startFrame={0}
  convergenceFrame={30}  // All words land by frame 30
  direction="up"
  fontSize={64}
  color="#FFFFFF"
/>

// TextCycle: Words replace each other in place
// Great for: Feature lists, changing options
<TextCycle 
  items={["Simple", "Fast", "Powerful"]}
  holdDuration={30}
  transitionDuration={15}
  enterFrom="up"
  exitTo="up"
  fontSize={72}
/>

// BounceReveal: Words bounce in with spring physics
// Great for: Playful, energetic reveals
<BounceReveal 
  text="Hello World"
  startFrame={0}
  staggerFrames={8}
  bounceHeight={60}
  springConfig={{ damping: 10, stiffness: 180 }}
  fontSize={64}
/>

// TextMakesSpace: Text slides aside to reveal content
// Great for: "Introducing" → Product reveal
<TextMakesSpace 
  text="Introducing"
  slideDirection="left"
  slideDistance="40%"
  textHoldDuration={30}
>
  <YourProductUI />
</TextMakesSpace>

// MorphText: Text morphs into another element
// Great for: Text → Icon or Text → Logo transitions
<MorphText 
  text="Your Brand"
  morphTo={<img src="/logo.png" />}
  holdDuration={30}
  morphDuration={20}
  morphType="all"  // fade + scale + blur
/>
\`\`\`

**When to use TextChoreography:**
- "catch-up" animation type → CatchUpText
- "replacement cycle" or word cycling → TextCycle
- "bounce" animation type → BounceReveal
- "makes-space-for" interaction → TextMakesSpace
- "morph" or "morphs-into" interaction → MorphText

### Background - Animated Backgrounds
\`\`\`tsx
import { Background } from '@/components/Global';

// Gradient mesh with brand colors - use meshColors object, NOT colors array
<Background type="gradient-mesh" variant="dark" meshColors={{ primary: '#1a1a2e', secondary: '#16213e' }} animationSpeed={0.5} />

// Grid lines
<Background type="grid-lines" variant="dark" />

// Organic blobs
<Background type="blobs" variant="light" meshColors={{ primary: '#ff6b6b', secondary: '#4ecdc4' }} />

// Using a preset (recommended for consistent styling)
<Background preset="deepPurpleAurora" />
<Background preset="midnightOcean" />
<Background preset="neonDream" />
\`\`\`

**Types:** gradient-mesh, grid-lines, blobs, solid
**Key Props:** type, variant (dark/light/brand), meshColors ({ primary, secondary }), animationSpeed, animated, preset

### MotionContainer - Animation Wrapper
\`\`\`tsx
import { MotionContainer } from '@/components/Layout';

// Slide up entrance - use full state names like "offscreen-bottom"
<MotionContainer initial="offscreen-bottom" delay={10} duration={25}>
  <YourContent />
</MotionContainer>

// With exit animation
<MotionContainer initial="scale-zero" exit="fade-out" exitStartFrame={120}>
  <Card />
</MotionContainer>
\`\`\`

**Initial States:** hidden, offscreen-bottom, offscreen-top, offscreen-left, offscreen-right, scale-zero, blur
**Exit States:** fade-out, slide-down, slide-up, slide-left, slide-right, scale-down, blur-out

### CameraRig - Virtual Camera
\`\`\`tsx
import { CameraRig } from '@/components/Camera';

const zoom = interpolate(frame, [0, 60], [1, 1.5], { extrapolateRight: 'clamp' });
<CameraRig zoom={zoom}>
  <YourScene />
</CameraRig>
\`\`\`

**Key Props:** zoom, x, y, rotation, focusPoint

### MockupFrame - Device Mockups
\`\`\`tsx
import { MockupFrame } from '@/components/MockupFrame';

// Browser window
<MockupFrame type="browser" src="/screenshot.png" preset="springIn" glass />

// iPhone
<MockupFrame type="iphone15" src="/app.png" rotate={{ startAngle: { y: -20 }, endAngle: { y: 0 } }} />
\`\`\`

**Types:** browser, iphone15, iphone-notch, card, plain
**Key Props:** type, src, preset, glass, glare, rotate, theme

### Decision Guide
- **Text animations**: AnimatedText handles most text needs with presets
- **Advanced choreography**: Use TextChoreography components for catch-up, cycling, bounce, make-space, morph patterns
- **Backgrounds**: Background for gradient/pattern backgrounds (use presets for best results)
- **Layout/centering**: LayoutGrid for positioning, MotionContainer for entrance/exit
- **Camera effects**: CameraRig for zoom/pan on any content
- **Device frames**: MockupFrame for showing screenshots/apps
- **Custom effects**: Use raw interpolate()/spring() when components don't cover your need`;
  }

  /**
   * Generate a fallback scene when AI generation fails.
   * This ensures the workflow can continue even if the AI doesn't cooperate.
   * Uses the component library for consistent, polished output.
   */
  private generateFallbackScene(state: WorkflowState, scene: SceneDescription): string {
    const frameCount = scene.frameRange.end - scene.frameRange.start + 1;
    const primaryColor = state.brand.colors[0] || '#000000';
    const secondaryColor = state.brand.colors[1] || '#FFFFFF';
    const brandName = state.brand.name || 'Brand';
    const tagline = state.brand.tagline || '';

    // Choose background variant based on scene number for variety
    const bgVariants = ['gradient-mesh', 'grid-lines', 'blobs'] as const;
    const bgVariant = bgVariants[(scene.sceneNumber - 1) % bgVariants.length];

    // Choose text animation preset based on scene number for variety
    const textPresets = ['fade-up', 'scale-in', 'blur-in', 'slide-right'] as const;
    const textPreset = textPresets[(scene.sceneNumber - 1) % textPresets.length];

    return `import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { Background } from '@/components/Global';

export const Scene${scene.sceneNumber}: React.FC = () => {
  const frame = useCurrentFrame();
  const totalFrames = ${frameCount};

  // Fade out at the end of the scene
  const fadeOut = interpolate(
    frame,
    [totalFrames - 30, totalFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Animated background using component library */}
      <Background
        type="${bgVariant}"
        variant="dark"
        meshColors={{ primary: '${primaryColor}', secondary: '${secondaryColor}' }}
        animationSpeed={0.5}
      />

      {/* Centered content layout */}
      <LayoutGrid
        columns={1}
        rows={${tagline ? 2 : 1}}
        gap={24}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        }}
      >
        {/* Brand name with animation */}
        <AnimatedText
          text="${brandName}"
          preset="${textPreset}"
          startFrame={5}
          style={{
            color: '${secondaryColor}',
            fontSize: 72,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        />${tagline ? `

        {/* Tagline with staggered animation */}
        <AnimatedText
          text="${tagline}"
          preset="fade-up"
          startFrame={20}
          style={{
            color: '${secondaryColor}',
            fontSize: 28,
            opacity: 0.85,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        />` : ''}
      </LayoutGrid>
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

    // Calculate total duration for audio
    const totalDuration = scenes.reduce((sum, s) => sum + (s.frameRange.end - s.frameRange.start + 1), 0);

    // Select background music based on video style
    const musicMap: Record<string, string> = {
      'modern': 'tunetank-inspiring-cinematic-music-409347.mp3',
      'cinematic': 'tunetank-inspiring-cinematic-music-409347.mp3',
      'epic': 'kornevmusic-epic-478847.mp3',
      'bold': 'kornevmusic-epic-478847.mp3',
      'calm': 'sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3',
      'chill': 'sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3',
      'lofi': 'sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3',
    };
    const defaultMusic = 'tunetank-inspiring-cinematic-music-409347.mp3';
    const styleKey = (state.config.style || '').toLowerCase();
    const musicFile = musicMap[styleKey] || defaultMusic;

    const code = `import React from 'react';
import { AbsoluteFill, Series, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
${imports}

/**
 * MainComposition sequences all generated scenes with background music.
 * Total duration: ${totalDuration} frames (${(totalDuration / 30).toFixed(1)} seconds at 30fps)
 * Brand: ${state.brand.name}
 * Style: ${state.config.style}
 */
export const MainComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Audio fade in/out for smooth transitions
  const fadeInDuration = 0.5 * fps; // 0.5 second fade in
  const fadeOutDuration = 1 * fps; // 1 second fade out
  const fadeOutStart = durationInFrames - fadeOutDuration;

  return (
    <AbsoluteFill style={{ backgroundColor: '${state.brand.colors[0] || '#000000'}' }}>
      {/* Background Music */}
      <Audio
        src={staticFile('audio/${musicFile}')}
        volume={(f) => {
          // Fade in
          if (f < fadeInDuration) {
            return interpolate(f, [0, fadeInDuration], [0, 0.3], { extrapolateRight: 'clamp' });
          }
          // Fade out
          if (f >= fadeOutStart) {
            return interpolate(f, [fadeOutStart, durationInFrames], [0.3, 0], { extrapolateRight: 'clamp' });
          }
          // Normal volume
          return 0.3;
        }}
        loop
      />
      
      {/* Scene Sequence */}
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

    // Fix CSS kebab-case properties to camelCase
    fixedCode = this.fixKebabCaseCSSProperties(fixedCode);

    // Fix invalid component props
    fixedCode = this.fixInvalidComponentProps(fixedCode);

    // Fix spring() delay parameter misuse
    fixedCode = this.fixSpringDelayParameter(fixedCode);

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
   * CSS property map: kebab-case to camelCase
   */
  private static readonly CSS_PROPERTY_MAP: Record<string, string> = {
    'z-index': 'zIndex',
    'background-color': 'backgroundColor',
    'background-image': 'backgroundImage',
    'background-size': 'backgroundSize',
    'background-position': 'backgroundPosition',
    'background-repeat': 'backgroundRepeat',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
    'font-family': 'fontFamily',
    'font-style': 'fontStyle',
    'line-height': 'lineHeight',
    'letter-spacing': 'letterSpacing',
    'text-align': 'textAlign',
    'text-decoration': 'textDecoration',
    'text-transform': 'textTransform',
    'white-space': 'whiteSpace',
    'word-break': 'wordBreak',
    'overflow-wrap': 'overflowWrap',
    'border-radius': 'borderRadius',
    'border-width': 'borderWidth',
    'border-color': 'borderColor',
    'border-style': 'borderStyle',
    'border-top': 'borderTop',
    'border-bottom': 'borderBottom',
    'border-left': 'borderLeft',
    'border-right': 'borderRight',
    'box-shadow': 'boxShadow',
    'box-sizing': 'boxSizing',
    'flex-direction': 'flexDirection',
    'flex-wrap': 'flexWrap',
    'flex-grow': 'flexGrow',
    'flex-shrink': 'flexShrink',
    'align-items': 'alignItems',
    'align-content': 'alignContent',
    'align-self': 'alignSelf',
    'justify-content': 'justifyContent',
    'justify-items': 'justifyItems',
    'justify-self': 'justifySelf',
    'grid-template': 'gridTemplate',
    'grid-template-columns': 'gridTemplateColumns',
    'grid-template-rows': 'gridTemplateRows',
    'grid-column': 'gridColumn',
    'grid-row': 'gridRow',
    'grid-gap': 'gridGap',
    'column-gap': 'columnGap',
    'row-gap': 'rowGap',
    'max-width': 'maxWidth',
    'max-height': 'maxHeight',
    'min-width': 'minWidth',
    'min-height': 'minHeight',
    'object-fit': 'objectFit',
    'object-position': 'objectPosition',
    'pointer-events': 'pointerEvents',
    'user-select': 'userSelect',
    'transform-origin': 'transformOrigin',
    'transition-duration': 'transitionDuration',
    'animation-duration': 'animationDuration',
    'animation-delay': 'animationDelay',
    'animation-timing-function': 'animationTimingFunction',
    'backdrop-filter': 'backdropFilter',
    'mix-blend-mode': 'mixBlendMode',
    'clip-path': 'clipPath',
    'stroke-width': 'strokeWidth',
    'stroke-dasharray': 'strokeDasharray',
    'stroke-dashoffset': 'strokeDashoffset',
    'fill-opacity': 'fillOpacity',
    'stroke-opacity': 'strokeOpacity',
  };

  /**
   * Fix CSS kebab-case properties to camelCase in style objects.
   * Silently converts without failing validation.
   */
  private fixKebabCaseCSSProperties(code: string): string {
    let fixedCode = code;
    let fixCount = 0;

    for (const [kebab, camel] of Object.entries(ImplementationPhase.CSS_PROPERTY_MAP)) {
      // Match the kebab-case property in style objects (e.g., `z-index:` or `z-index :`)
      const regex = new RegExp(`(\\s|{|,)${kebab}(\\s*):`, 'g');
      if (regex.test(fixedCode)) {
        fixedCode = fixedCode.replace(regex, `$1${camel}$2:`);
        fixCount++;
      }
    }

    if (fixCount > 0) {
      console.warn(`[AutoFix] Converted ${fixCount} CSS kebab-case properties to camelCase`);
    }

    return fixedCode;
  }

  /**
   * Fix invalid component props that the AI commonly generates.
   * Converts patterns to the correct API.
   */
  private fixInvalidComponentProps(code: string): string {
    let fixedCode = code;

    // Fix BackgroundRig: colors={[...]} -> meshColors={{ primary: ..., secondary: ... }}
    const bgColorsRegex = /<BackgroundRig([^>]*)\scolors=\{\s*\[\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?\s*\]\s*\}([^>]*)\/?>/g;
    fixedCode = fixedCode.replace(bgColorsRegex, (match, before, primary, secondary, after) => {
      const meshColors = secondary 
        ? `meshColors={{ primary: '${primary}', secondary: '${secondary}' }}`
        : `meshColors={{ primary: '${primary}' }}`;
      console.warn(`[AutoFix] Converted BackgroundRig colors prop to meshColors`);
      return `<BackgroundRig${before} ${meshColors}${after}/>`;
    });

    // Fix BackgroundRig: speed={...} -> animationSpeed={...}
    const bgSpeedRegex = /(<BackgroundRig[^>]*)\sspeed=/g;
    if (bgSpeedRegex.test(fixedCode)) {
      fixedCode = fixedCode.replace(/(<BackgroundRig[^>]*)\sspeed=/g, '$1 animationSpeed=');
      console.warn(`[AutoFix] Converted BackgroundRig speed prop to animationSpeed`);
    }

    // Fix BackgroundRig: opacity={...} -> remove (not a valid prop)
    const bgOpacityRegex = /(<BackgroundRig[^>]*)\s+opacity=\{[^}]+\}/g;
    if (bgOpacityRegex.test(fixedCode)) {
      fixedCode = fixedCode.replace(bgOpacityRegex, '$1');
      console.warn(`[AutoFix] Removed invalid BackgroundRig opacity prop`);
    }

    // Fix MotionContainer: initial="below" -> initial="offscreen-bottom"
    fixedCode = fixedCode.replace(/initial="below"/g, 'initial="offscreen-bottom"');
    fixedCode = fixedCode.replace(/initial="above"/g, 'initial="offscreen-top"');
    fixedCode = fixedCode.replace(/initial="left"/g, 'initial="offscreen-left"');
    fixedCode = fixedCode.replace(/initial="right"/g, 'initial="offscreen-right"');

    // Fix MotionContainer: Remove Framer Motion props (animate, transition)
    const motionAnimateRegex = /(<MotionContainer[^>]*)\s+animate=\{[^}]+\}/g;
    if (motionAnimateRegex.test(fixedCode)) {
      fixedCode = fixedCode.replace(motionAnimateRegex, '$1');
      console.warn(`[AutoFix] Removed invalid MotionContainer animate prop`);
    }

    const motionTransitionRegex = /(<MotionContainer[^>]*)\s+transition=\{[^}]+\}/g;
    if (motionTransitionRegex.test(fixedCode)) {
      fixedCode = fixedCode.replace(motionTransitionRegex, '$1');
      console.warn(`[AutoFix] Removed invalid MotionContainer transition prop`);
    }

    return fixedCode;
  }

  /**
   * Fix spring() delay parameter misuse.
   * spring({ frame, fps, delay: X }) -> spring({ frame: frame - X, fps })
   */
  private fixSpringDelayParameter(code: string): string {
    // Pattern: spring({ frame, fps, delay: NUMBER, ... })
    // or: spring({ frame, fps, delay: VARIABLE, ... })
    const springDelayRegex = /spring\(\s*\{\s*frame\s*,\s*fps\s*,\s*delay\s*:\s*(\d+|\w+)\s*,?/g;
    
    let fixedCode = code;
    const matches = [...code.matchAll(springDelayRegex)];
    
    if (matches.length > 0) {
      for (const match of matches) {
        const delayValue = match[1];
        const original = match[0];
        // Replace with frame: frame - delayValue
        const fixed = original
          .replace(/frame\s*,/, `frame: frame - ${delayValue},`)
          .replace(/,\s*delay\s*:\s*(\d+|\w+)\s*,?/, ',');
        fixedCode = fixedCode.replace(original, fixed);
      }
      console.warn(`[AutoFix] Fixed ${matches.length} spring() delay parameter(s)`);
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
    
    // Check 6: Detect malformed/empty return statements (common AI truncation pattern)
    // These patterns indicate the AI stopped mid-generation of the return JSX
    const malformedReturnPatterns = [
      { pattern: /return\s*\(\s*;\s*\)/, reason: 'Malformed return statement: return (;)' },
      { pattern: /return\s*\(\s*\)/, reason: 'Empty return statement: return ()' },
      { pattern: /return\s*\(\s*\n\s*\)/, reason: 'Empty return statement with newline' },
      { pattern: /return\s*;?\s*}[^}]*$/, reason: 'Return without JSX body' },
      { pattern: /return\s*\(\s*[^<\s]?\s*\)/, reason: 'Return with no JSX content' },
    ];
    
    for (const { pattern, reason } of malformedReturnPatterns) {
      if (pattern.test(code)) {
        return { truncated: true, reason };
      }
    }
    
    // Check 7: Return statement must contain actual JSX (at least one < character inside)
    const returnMatch = code.match(/return\s*\(([\s\S]*?)\);?\s*}/);
    if (returnMatch) {
      const returnBody = returnMatch[1];
      // Must have at least one JSX element (starts with <)
      if (!returnBody.includes('<')) {
        return { 
          truncated: true, 
          reason: 'Return statement contains no JSX elements' 
        };
      }
    }
    
    // Check 8: Minimum code length (a valid Remotion scene is at least ~200 chars)
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

  /**
   * Get visual style guidance for the AI prompt based on Timeline architecture.
   */
  private getVisualStyleHint(style?: string): string {
    const hints: Record<string, string> = {
      'kinetic_typography': 'Focus on animated text, word reveals, typewriter effects. Use AnimatedText with presets like "fadeBlurIn", "slideInUp", "typewriter". Keep layout minimal to let text shine.',
      'app_demo': 'Use MockupFrame for device frames (browser, iphone15). Include DynamicCursor for UI interactions. Show screen content with realistic mockups.',
      'abstract_shape': 'Create geometric patterns, morphing shapes, particle effects. Use raw interpolate() and spring() for custom shape animations. Leverage CSS transforms.',
      'logo_reveal': 'Clean, elegant brand reveal. Center the logo, add subtle animations. Use Background with soft gradient. Keep focus on the brand mark.',
      '3d_product_showcase': 'Simulate 3D with transforms (rotateY, rotateX, perspective). Use CameraRig for zoom/pan. Create depth with layered elements.',
      'abstract_ui': 'Futuristic interface design. Grid layouts, glowing elements, holographic effects. Use Background with grid-lines or gradient-mesh.',
      '3d_grid_view': 'Create floating grid of elements in 3D perspective. Use CSS grid with transform: perspective(). Add parallax scrolling effect.'
    };
    return hints[style || 'abstract_shape'] || hints['abstract_shape'];
  }

  /**
   * Get energy level guidance for spring configs and animation timing.
   */
  private getEnergyLevelHint(energy?: string): string {
    const hints: Record<string, string> = {
      'high': 'Fast, punchy animations. Use spring({ config: { damping: 80, stiffness: 200 } }). Quick cuts, rapid transitions. Animation durations 10-20 frames.',
      'medium': 'Balanced, smooth animations. Use spring({ config: { damping: 120, stiffness: 100 } }). Standard easing. Animation durations 20-40 frames.',
      'low': 'Slow, cinematic reveals. Use spring({ config: { damping: 180, stiffness: 50 } }). Long easing curves. Animation durations 40-60 frames.'
    };
    return hints[energy || 'medium'] || hints['medium'];
  }

  /**
   * Get complexity guidance based on scene duration.
   */
  private getDurationHint(durationSeconds: number): string {
    if (durationSeconds <= 2) {
      return 'VERY SHORT scene - Keep it simple! One main animation, minimal elements. Perfect for a quick title or transition.';
    } else if (durationSeconds <= 4) {
      return 'SHORT scene - Focus on 1-2 key animations. Don\'t overcomplicate. Good for hooks and reveals.';
    } else if (durationSeconds <= 6) {
      return 'MEDIUM scene - Room for 2-3 sequential animations. Can include entrance, main content, and exit.';
    } else {
      return 'LONGER scene - Can support complex sequences. Consider multiple phases: intro, main content, outro. Use Sequence for timing.';
    }
  }

  /**
   * Get choreography data from StoryScript for a specific scene.
   * This extracts the rich text animation data from the script.
   */
  private getSceneChoreographyData(storyScript: StoryScript | undefined, sceneNumber: number): string {
    if (!storyScript || !storyScript.scenes) {
      return '';
    }

    const storyScene = storyScript.scenes.find(s => s.sceneNumber === sceneNumber);
    if (!storyScene) {
      return '';
    }

    const sections: string[] = [];

    // Scene-level info
    sections.push(`## STORY CONTEXT`);
    sections.push(`- **Story Phase**: ${storyScene.storyPhase} - ${this.getStoryPhaseDescription(storyScene.storyPhase)}`);
    sections.push(`- **Scene Purpose**: ${storyScene.purpose}`);
    sections.push(`- **Visual Theme**: ${storyScene.visualTheme}`);
    sections.push(`- **Text Theme**: ${storyScene.textTheme}`);
    if (storyScene.dominantColor) {
      sections.push(`- **Dominant Color**: ${storyScene.dominantColor}`);
    }
    sections.push('');

    // Moments and text choreography
    sections.push(`## TEXT CHOREOGRAPHY (${storyScene.moments.length} moments)`);
    sections.push('');
    sections.push('IMPORTANT: Implement these text elements with the EXACT choreography specified below.');
    sections.push('Each text element has entrance, hold, and exit animations that MUST be followed.');
    sections.push('');

    for (const moment of storyScene.moments) {
      const momentStartFrame = moment.timing.startFrame;
      const momentEndFrame = moment.timing.endFrame;
      
      sections.push(`### Moment ${moment.sequence}: "${moment.narrative}" (frames ${momentStartFrame}-${momentEndFrame})`);
      sections.push(`- **Visual Action**: ${moment.visualAction}`);
      sections.push(`- **Purpose**: ${moment.storyPurpose}`);
      sections.push(`- **Energy**: ${moment.energyLevel} | **Tone**: ${moment.emotionalTone}`);
      
      if (moment.camera) {
        sections.push(`- **Camera**: ${moment.camera.type} (${moment.camera.intensity})`);
      }
      sections.push('');

      // Text elements with full choreography
      for (const textEl of moment.textElements) {
        sections.push(`#### Text: "${textEl.content}"`);
        sections.push(`  - **Purpose**: ${textEl.purpose} | **Personality**: ${textEl.personality}`);
        sections.push(`  - **Position**: x=${textEl.position.x}%, y=${textEl.position.y}%, align=${textEl.position.align || 'center'}`);
        sections.push(`  - **Typography**: size=${textEl.typography.size}px, weight=${textEl.typography.weight}, color=${textEl.typography.color}`);
        
        // Entrance animation
        const entrance = textEl.choreography.entrance;
        sections.push(`  - **ENTRANCE** (${entrance.type}): ${entrance.duration}ms, easing=${entrance.easing || 'ease-out'}`);
        sections.push(`    ${this.getEntranceCodeHint(entrance)}`);
        
        // Hold animation
        if (textEl.choreography.hold) {
          const hold = textEl.choreography.hold;
          sections.push(`  - **HOLD**: ${hold.duration}ms${hold.animation ? `, animation=${hold.animation}` : ''}`);
        }
        
        // Exit animation
        if (textEl.choreography.exit) {
          const exit = textEl.choreography.exit;
          sections.push(`  - **EXIT** (${exit.type}): ${exit.duration}ms, easing=${exit.easing || 'ease-in'}`);
          sections.push(`    ${this.getExitCodeHint(exit)}`);
        }

        // Interactions with other elements
        if (textEl.interactions && textEl.interactions.length > 0) {
          for (const interaction of textEl.interactions) {
            sections.push(`  - **INTERACTS**: ${interaction.relationship} "${interaction.with}" (${interaction.timing || 'simultaneous'})`);
          }
        }
        sections.push('');
      }

      // Visual elements
      if (moment.visualElements.length > 0) {
        sections.push(`  **Visual Elements**: ${moment.visualElements.map(v => `${v.name} (${v.type})`).join(', ')}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Get story phase description for context.
   */
  private getStoryPhaseDescription(phase: string): string {
    const descriptions: Record<string, string> = {
      'problem': 'Set up the challenge or pain point. Create tension. Use darker tones, slower reveals.',
      'solution': 'Introduce the product/solution. Shift energy upward. Brighter colors, faster animations.',
      'magic': 'Show the key differentiator. Peak energy. Bold animations, impactful reveals.',
      'result': 'Demonstrate the outcome/benefit. Satisfying resolution. Smooth, confident animations.',
      'brand-reveal': 'Final brand moment. Logo and tagline. Elegant, memorable. Leave lasting impression.'
    };
    return descriptions[phase] || 'Continue the narrative arc.';
  }

  /**
   * Get code hint for entrance animation type.
   */
  private getEntranceCodeHint(entrance: { type: TextAnimationType; duration: number; startPosition?: { x: number; y: number }; startScale?: number; startOpacity?: number }): string {
    const durationFrames = Math.round((entrance.duration / 1000) * 30);
    
    const hints: Record<string, string> = {
      'slide-up': `Use AnimatedText preset="slideInUp" or interpolate translateY from 50 to 0 over ${durationFrames} frames`,
      'slide-down': `Use AnimatedText preset="slideInDown" or interpolate translateY from -50 to 0 over ${durationFrames} frames`,
      'slide-left': `Use AnimatedText preset="slideInLeft" or interpolate translateX from -100 to 0 over ${durationFrames} frames`,
      'slide-right': `Use AnimatedText preset="slideInRight" or interpolate translateX from 100 to 0 over ${durationFrames} frames`,
      'catch-up': `Use <CatchUpText text="..." convergenceFrame={${durationFrames}} /> from @/components/TextChoreography - words animate sequentially, later words catch up`,
      'bounce': `Use <BounceReveal text="..." staggerFrames={8} /> from @/components/TextChoreography - words bounce in with spring physics`,
      'word-by-word': `Use AnimatedText animationUnit="word" stagger=${Math.round(durationFrames / 3)} for word reveals`,
      'letter-by-letter': `Use AnimatedText animationUnit="character" stagger=2 for typewriter effect`,
      'fade': `Use AnimatedText preset="fadeBlurIn" or interpolate opacity from 0 to 1 over ${durationFrames} frames`,
      'fade-scale': `Use AnimatedText preset="scaleUp" or combine opacity and scale interpolation`,
      'scale-up': `Use AnimatedText preset="scaleUp" or interpolate scale from 0.8 to 1 with spring`,
      'scale-down': `Interpolate scale from 1.2 to 1 over ${durationFrames} frames`,
      'pop': `Use spring({ config: { damping: 8, stiffness: 200 } }) with scale overshoot to 1.1 then settle to 1`,
      'morph': `Use <MorphText text="..." morphTo={...} /> from @/components/TextChoreography for text-to-element morphing`
    };
    
    return hints[entrance.type] || `Animate with ${entrance.type} effect over ${durationFrames} frames`;
  }

  /**
   * Get code hint for exit animation type.
   */
  private getExitCodeHint(exit: { type: TextAnimationType; duration: number; endPosition?: { x: number; y: number }; endScale?: number; endOpacity?: number }): string {
    const durationFrames = Math.round((exit.duration / 1000) * 30);
    
    const hints: Record<string, string> = {
      'slide-up': `Use exit={{ startFrame: X, translateY: { from: 0, to: -50 } }} over ${durationFrames} frames`,
      'slide-down': `Use exit={{ startFrame: X, translateY: { from: 0, to: 50 } }} over ${durationFrames} frames`,
      'slide-left': `Use exit={{ startFrame: X, translateX: { from: 0, to: -100 } }} over ${durationFrames} frames`,
      'slide-right': `Use exit={{ startFrame: X, translateX: { from: 0, to: 100 } }} over ${durationFrames} frames`,
      'fade': `Use exit={{ startFrame: X, opacity: { from: 1, to: 0 } }} over ${durationFrames} frames`,
      'fade-scale': `Combine exit opacity and scale: exit={{ startFrame: X, opacity: { from: 1, to: 0 }, scale: { from: 1, to: 0.8 } }}`,
      'scale-down': `Use exit={{ startFrame: X, scale: { from: 1, to: 0 } }} over ${durationFrames} frames`,
      'scale-up': `Use exit={{ startFrame: X, scale: { from: 1, to: 1.5 }, opacity: { from: 1, to: 0 } }}`,
      'pop': `Quick scale to 0 with spring damping`,
      'morph': `Crossfade to next element`
    };
    
    return hints[exit.type] || `Animate exit with ${exit.type} effect over ${durationFrames} frames`;
  }

  // ============================================
  // Render Error Self-Correction System
  // ============================================

  /**
   * Auto-fix common issues that cause bundler/render failures.
   * These are syntax errors that can be fixed without AI.
   */
  private autoFixRenderErrors(code: string, errorMessage: string): string {
    let fixedCode = code;
    
    // Fix 1: Remove trailing markdown code fences (common AI output artifact)
    // Matches ``` or ```tsx or ```typescript at the end of the file
    const trailingFencesBefore = fixedCode;
    fixedCode = fixedCode.replace(/\n*```(?:tsx?|javascript|typescript)?\s*$/g, '');
    if (fixedCode !== trailingFencesBefore) {
      console.log('[AutoFixRender] Removed trailing markdown code fences');
    }
    
    // Also remove leading code fences if present
    const leadingFencesBefore = fixedCode;
    fixedCode = fixedCode.replace(/^```(?:tsx?|javascript|typescript)?\n*/g, '');
    if (fixedCode !== leadingFencesBefore) {
      console.log('[AutoFixRender] Removed leading markdown code fences');
    }
    
    // Fix 2: Remove any stray backticks that might cause "Unterminated string literal"
    // Only remove isolated backticks at line starts/ends, not template literals
    const strayBackticksBefore = fixedCode;
    fixedCode = fixedCode.replace(/^`{1,3}\s*$/gm, '');
    if (fixedCode !== strayBackticksBefore) {
      console.log('[AutoFixRender] Removed stray backticks');
    }
    
    // Fix 3: If error mentions specific line, try to fix that line
    const lineMatch = errorMessage.match(/:(\d+):\d+:\s*ERROR:/);
    if (lineMatch) {
      const errorLine = parseInt(lineMatch[1], 10);
      const lines = fixedCode.split('\n');
      
      if (errorLine > 0 && errorLine <= lines.length) {
        const problematicLine = lines[errorLine - 1];
        
        // Check for common issues on this specific line
        // Unterminated string: might have unmatched quotes or backticks
        if (errorMessage.includes('Unterminated string')) {
          // Remove the problematic line if it's just garbage (like ```)
          if (/^[`'"]+$/.test(problematicLine.trim())) {
            console.log(`[AutoFixRender] Removing garbage line ${errorLine}: "${problematicLine.trim()}"`);
            lines.splice(errorLine - 1, 1);
            fixedCode = lines.join('\n');
          }
        }
      }
    }
    
    // Fix 4: Apply all existing auto-fixes (CSS properties, component props, etc.)
    // Extract scene number from the code if possible, otherwise use 0
    const sceneMatch = fixedCode.match(/export\s+const\s+Scene(\d+)/);
    const sceneNumber = sceneMatch ? parseInt(sceneMatch[1], 10) : 0;
    fixedCode = this.autoFixSceneCode(fixedCode, sceneNumber);
    
    return fixedCode;
  }

  /**
   * Attempt to correct scene code that failed during bundling/rendering.
   * First tries auto-fixes, then calls AI if needed.
   */
  private async attemptRenderErrorCorrection(
    state: WorkflowState,
    scene: SceneDescription,
    sceneFilePath: string,
    errorMessage: string,
    attempt: number,
    context: PhaseContext
  ): Promise<{ corrected: boolean; code?: string }> {
    const { buildRenderErrorCorrectionPrompt } = await import('../../agent/promptBuilder');
    
    try {
      // 1. Read the broken scene file
      const brokenCode = await fs.readFile(sceneFilePath, 'utf-8');
      
      console.log(`[ImplementationPhase] Attempting render error correction for Scene ${scene.sceneNumber} (attempt ${attempt})`);
      console.log(`[ImplementationPhase] Error: ${errorMessage.substring(0, 200)}...`);
      
      // 2. Try auto-fixes first (cheap, no API call)
      const fixedCode = this.autoFixRenderErrors(brokenCode, errorMessage);
      
      // 3. Validate the auto-fixed code
      const validation = this.validateSceneCode(fixedCode, scene.sceneNumber);
      if (validation.valid) {
        console.log(`[ImplementationPhase] Auto-fix succeeded for Scene ${scene.sceneNumber}`);
        return { corrected: true, code: fixedCode };
      }
      
      console.log(`[ImplementationPhase] Auto-fix validation failed: ${validation.errors.join(', ')}`);
      
      // 4. Auto-fix wasn't enough - call AI for correction
      console.log(`[ImplementationPhase] Calling AI for Scene ${scene.sceneNumber} correction...`);
      
      const correctionPrompt = await buildRenderErrorCorrectionPrompt(
        brokenCode,
        errorMessage,
        state.brand,
        state.config,
        { sceneNumber: scene.sceneNumber, description: scene.description }
      );
      
      const ai = this.getAI();
      const response = await this.rateLimitedCall(() =>
        ai.models.generateContent({
          model: AI_MODELS.SMART,
          contents: [{ role: 'user', parts: [{ text: correctionPrompt }] }],
          config: {
            temperature: 0.2, // Low temperature for precise fixes
            maxOutputTokens: 8192,
          }
        })
      );
      
      const responseText = response.text || '';
      let correctedCode = this.extractCode(responseText);
      
      if (!correctedCode) {
        console.warn(`[ImplementationPhase] AI returned no code for Scene ${scene.sceneNumber} correction`);
        return { corrected: false };
      }
      
      // Apply auto-fixes to AI output too (belt and suspenders)
      correctedCode = this.autoFixSceneCode(correctedCode, scene.sceneNumber);
      correctedCode = this.autoFixRenderErrors(correctedCode, errorMessage);
      
      // Validate
      const finalValidation = this.validateSceneCode(correctedCode, scene.sceneNumber);
      if (finalValidation.valid) {
        console.log(`[ImplementationPhase] AI correction succeeded for Scene ${scene.sceneNumber}`);
        return { corrected: true, code: correctedCode };
      }
      
      console.warn(`[ImplementationPhase] AI correction failed validation: ${finalValidation.errors.join(', ')}`);
      return { corrected: false };
      
    } catch (error) {
      console.error(`[ImplementationPhase] Error during render correction for Scene ${scene.sceneNumber}:`, error);
      return { corrected: false };
    }
  }
}
