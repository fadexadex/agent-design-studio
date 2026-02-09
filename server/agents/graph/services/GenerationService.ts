import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { rateLimitedCall } from '../../../core/agent/rateLimiter.js';
import { BrandContext } from '../../types.js';
import { validateAndCorrect } from '../../scene/CodeValidator.js';
import { buildScenePrompt, buildSceneCorrectionPrompt } from '../../scene/ScenePromptBuilder.js';
import { extractCodeFromResponse } from '../../scene/SceneTask.js';
import { EventBridge } from './EventBridge.js';

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

export interface GenerationResult {
  code: string;
  generationTimeMs: number;
}

/**
 * Get the agent ID for a scene
 */
const getAgentId = (sceneId: string, sceneIndex: number): string => {
  return `scene-agent-${sceneIndex}-${sceneId.slice(0, 8)}`;
};

export class GenerationService {
  /**
   * Generate scene code with streaming thought support
   */
  static async generateScene(
    projectId: string,
    sceneId: string,
    sceneIndex: number,
    version: number,
    prompt: string,
    brandContext: BrandContext,
    previousCode?: string,
    feedback?: string
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let attempt = 0;
    const MAX_ATTEMPTS = 3;
    let lastError: string | null = null;
    let generatedCode: string | null = null;

    const ai = getAIClient();
    const agentId = getAgentId(sceneId, sceneIndex);

    while (attempt < MAX_ATTEMPTS) {
      attempt++;

      try {
        // Build prompt
        const scenePrompt = attempt === 1 && !previousCode
          ? await buildScenePrompt({ projectId, sceneId, sceneIndex, version, prompt, brandContext })
          : await buildSceneCorrectionPrompt(
              { projectId, sceneId, sceneIndex, version, prompt, brandContext, previousCode: generatedCode || previousCode },
              generatedCode || previousCode || '',
              lastError || 'Unknown error'
            );

        // Use streaming to get thoughts in real-time
        const responseGenerator = await rateLimitedCall(() =>
          ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: scenePrompt,
            config: {
              temperature: 1.0,
              maxOutputTokens: 8192,
              thinkingConfig: {
                thinkingLevel: 'high' as any,
                includeThoughts: true,
              },
            },
          })
        );

        // Process streaming response
        let fullText = '';
        let thoughtIndex = 0;
        let currentThought = '';

        for await (const chunk of responseGenerator) {
          // Check for thought content in the chunk
          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              // Handle thought parts
              if ((part as any).thought === true && (part as any).text) {
                const thoughtText = (part as any).text;
                currentThought += thoughtText;
                
                // Emit streaming thought event
                await EventBridge.agentThinking(
                  projectId,
                  agentId,
                  thoughtText,
                  true, // isStreaming
                  thoughtIndex
                );
              }
              // Handle regular text parts
              else if ((part as any).text && !(part as any).thought) {
                fullText += (part as any).text;
              }
            }
          }

          // If we accumulated a complete thought (ends with period/newline), increment index
          if (currentThought.endsWith('.') || currentThought.endsWith('\n')) {
            thoughtIndex++;
            currentThought = '';
          }
        }

        // Emit final non-streaming thought if there's accumulated content
        if (currentThought.trim()) {
          await EventBridge.agentThinking(
            projectId,
            agentId,
            currentThought.trim(),
            false // final thought, not streaming
          );
        }

        const responseText = fullText;
        generatedCode = extractCodeFromResponse(responseText);

        if (!generatedCode) {
          lastError = 'No code block found in AI response';
          console.warn(`[GenerationService] ${lastError}`);
          
          // Emit thinking about the error
          await EventBridge.agentThinking(
            projectId,
            agentId,
            `No valid code found in response. Retrying attempt ${attempt + 1}...`,
            false
          );
          continue;
        }

        // Apply basic auto-fixes
        generatedCode = this.autoFixCode(generatedCode, sceneIndex);

        // Basic validation
        const basicValidation = this.validateGeneratedCode(generatedCode);
        if (!basicValidation.valid) {
          lastError = basicValidation.error || 'Unknown validation error';
          console.warn(`[GenerationService] Basic validation failed: ${lastError}`);
          
          await EventBridge.agentThinking(
            projectId,
            agentId,
            `Code validation failed: ${lastError}. Attempting correction...`,
            false
          );
          continue;
        }

        // Full validation & correction
        await EventBridge.agentAction(
          projectId,
          agentId,
          'validating_code',
          'Running full code validation',
          50
        );

        const fullValidation = await validateAndCorrect(generatedCode, {
          sceneIndex,
          maxCorrections: 2,
          enableAICorrection: true,
        });

        if (!fullValidation.valid) {
          lastError = fullValidation.errors.join('; ');
          console.warn(`[GenerationService] Full validation failed: ${lastError}`);
          
          await EventBridge.agentThinking(
            projectId,
            agentId,
            `Validation errors found: ${fullValidation.errors[0]}. Refining code...`,
            false
          );
          
          generatedCode = fullValidation.code; // Use partially corrected code for next retry
          continue;
        }

        generatedCode = fullValidation.code;
        
        await EventBridge.agentThinking(
          projectId,
          agentId,
          'Code validated successfully. Ready for rendering.',
          false
        );
        
        break;

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`[GenerationService] Generation error attempt ${attempt}:`, error);
        
        await EventBridge.agentThinking(
          projectId,
          agentId,
          `Generation error: ${lastError}. ${attempt < MAX_ATTEMPTS ? 'Retrying...' : 'Max attempts reached.'}`,
          false
        );
      }
    }

    if (!generatedCode) {
      throw new Error(`Failed to generate valid code after ${MAX_ATTEMPTS} attempts: ${lastError}`);
    }

    // Save code
    await this.saveSceneCode(projectId, sceneId, sceneIndex, version, generatedCode);

    // Create preview wrapper for RenderService
    await this.createPreviewWrapper(projectId, sceneIndex, sceneId, version);

    return {
      code: generatedCode,
      generationTimeMs: Date.now() - startTime,
    };
  }

  // --- Helpers from Worker ---

  private static autoFixCode(code: string, sceneIndex: number): string {
    let fixed = code;

    if (!fixed.includes("import React") && !fixed.includes("from 'react'")) {
      fixed = `import React from 'react';\n${fixed}`;
    }

    if (!fixed.includes("from 'remotion'") && !fixed.includes('from "remotion"')) {
      fixed = `import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

${fixed}`;
    }

    if (!fixed.includes('export default')) {
      const componentMatch = fixed.match(/(?:function|const)\s+(\w+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        if (!fixed.includes(`export default ${componentName}`)) {
          fixed += `\n\nexport default ${componentName};`;
        }
      } else {
        fixed = `${fixed}\n\nexport default function Scene${sceneIndex}() {\n  return null; // Auto-generated placeholder\n}`;
      }
    }

    const cssPropertyMap: Record<string, string> = {
      'z-index': 'zIndex',
      'background-color': 'backgroundColor',
      'font-size': 'fontSize',
      'font-weight': 'fontWeight',
      'font-family': 'fontFamily',
      'text-align': 'textAlign',
      'border-radius': 'borderRadius',
      'flex-direction': 'flexDirection',
      'align-items': 'alignItems',
      'justify-content': 'justifyContent',
      'box-shadow': 'boxShadow',
      'max-width': 'maxWidth',
      'max-height': 'maxHeight',
      'min-width': 'minWidth',
      'min-height': 'minHeight',
    };

    for (const [kebab, camel] of Object.entries(cssPropertyMap)) {
      const regex = new RegExp(`(\\s|{|,)${kebab}(\\s*):`, 'g');
      fixed = fixed.replace(regex, `$1${camel}$2:`);
    }

    fixed = fixed.replace(/from\s+['"]@\/component\//g, "from '@/components/");

    return fixed;
  }

  private static validateGeneratedCode(code: string): { valid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];
    
    const hasRemotionImport = /import\s+.*from\s+['"]remotion['"]/.test(code) ||
      /from\s+['"]remotion['"]/.test(code);
    const hasComponentImport = /from\s+['"]@\/components/.test(code);

    if (!hasRemotionImport && !hasComponentImport) {
      return { valid: false, error: 'Missing Remotion or component library import' };
    }

    // Check brace balance
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { valid: false, error: `Unbalanced braces: ${openBraces} open, ${closeBraces} close` };
    }

    // Check parentheses balance
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return { valid: false, error: `Unbalanced parentheses: ${openParens} open, ${closeParens} close` };
    }

    // Check bracket balance
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: `Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close` };
    }

    // Check for unterminated strings (basic check)
    const singleQuotes = (code.match(/'/g) || []).length;
    const doubleQuotes = (code.match(/"/g) || []).length;
    const backticks = (code.match(/`/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      return { valid: false, error: 'Unterminated single-quote string' };
    }
    if (doubleQuotes % 2 !== 0) {
      return { valid: false, error: 'Unterminated double-quote string' };
    }
    if (backticks % 2 !== 0) {
      return { valid: false, error: 'Unterminated template literal' };
    }

    if (!code.includes('return')) {
      return { valid: false, error: 'No return statement found' };
    }

    // Check for common API misuse patterns
    if (code.includes('Move.y(') || code.includes('Move.x(') || code.includes('Scale.in(') || code.includes('Fade.in(')) {
      return { valid: false, error: 'Invalid @remotion/animated API: Use Move({y: ...}) not Move.y(), Scale({by: ...}) not Scale.in()' };
    }

    // Check for invalid CSS kebab-case in style objects (common error)
    const kebabCaseInStyle = code.match(/style\s*=\s*\{\{[^}]*[a-z]+-[a-z]+\s*:/);
    if (kebabCaseInStyle) {
      return { valid: false, error: 'CSS kebab-case in style object (use camelCase: backgroundColor not background-color)' };
    }

    // Check for spring delay parameter misuse
    if (code.match(/spring\s*\(\s*\{[^}]*delay\s*:/)) {
      return { valid: false, error: 'spring() does not have a delay parameter - use spring({ frame: frame - delay, fps })' };
    }

    // Warn about potential text overlap issues
    const animatedTextMatches = code.match(/<AnimatedText[^>]*>/g) || [];
    if (animatedTextMatches.length > 1) {
      // Check if they use LayoutGrid or have different delays
      const hasLayoutGrid = code.includes('LayoutGrid');
      const hasFlexColumn = code.includes("flexDirection: 'column'") || code.includes('flexDirection: "column"');
      const delays = animatedTextMatches.map(m => {
        const delayMatch = m.match(/delay\s*=\s*\{?\s*(\d+)/);
        return delayMatch ? parseInt(delayMatch[1], 10) : 0;
      });
      
      const uniqueDelays = new Set(delays);
      if (!hasLayoutGrid && !hasFlexColumn && uniqueDelays.size < animatedTextMatches.length) {
        warnings.push('Multiple AnimatedText without LayoutGrid or flex column - may cause overlapping text');
      }
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  private static async saveSceneCode(
    projectId: string,
    sceneId: string,
    sceneIndex: number,
    version: number,
    code: string
  ): Promise<string> {
    // Use sceneIndex directly for consistent file naming
    // Path: remotion/src/generated/scenes/{projectId}/scene-{index}_v{version}.tsx
    const relativePath = `remotion/src/generated/scenes/${projectId}/scene-${sceneIndex}_v${version}.tsx`;
    const absolutePath = path.join(process.cwd(), relativePath);
    
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, code, 'utf-8');
    
    return relativePath;
  }

  /**
   * Create a preview wrapper for RenderService.
   * The wrapper registers a Remotion composition that imports and renders the scene.
   * IMPORTANT: Uses sceneIndex directly to match RenderService expectations.
   */
  private static async createPreviewWrapper(
    projectId: string,
    sceneIndex: number,
    sceneId: string,
    version: number
  ): Promise<void> {
    // Use sceneIndex directly for consistent file naming with RenderService
    // RenderService looks for: ScenePreview${sceneIndex}.tsx
    
    // The scene code is at: remotion/src/generated/scenes/{projectId}/scene-{index}_v{version}.tsx
    // The preview wrapper will be at: remotion/src/generated/scenes/{projectId}/previews/ScenePreview{index}.tsx
    
    const previewDir = path.join(
      process.cwd(),
      'remotion',
      'src',
      'generated',
      'scenes',
      projectId,
      'previews'
    );
    
    const previewPath = path.join(previewDir, `ScenePreview${sceneIndex}.tsx`);
    
    // Relative import path from preview to scene (go up one level)
    const sceneImportPath = `../scene-${sceneIndex}_v${version}`;
    
    const wrapperCode = `/**
 * Auto-generated preview wrapper for Scene ${sceneIndex}
 * Project: ${projectId}
 * Version: ${version}
 * Generated: ${new Date().toISOString()}
 */

import React from 'react';
import { Composition, registerRoot } from 'remotion';
import SceneComponent from '${sceneImportPath}';

// Default configuration for scene preview
const PREVIEW_FPS = 30;
const PREVIEW_DURATION_FRAMES = 150; // 5 seconds at 30fps
const PREVIEW_WIDTH = 1920;
const PREVIEW_HEIGHT = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ScenePreview"
        component={SceneComponent}
        durationInFrames={PREVIEW_DURATION_FRAMES}
        fps={PREVIEW_FPS}
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
      />
    </>
  );
};

// Register the root component for Remotion bundler
registerRoot(RemotionRoot);
`;

    await fs.mkdir(previewDir, { recursive: true });
    await fs.writeFile(previewPath, wrapperCode, 'utf-8');
    
    console.log(`[GenerationService] Created preview wrapper at ${previewPath}`);
  }
}
