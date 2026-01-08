import { GoogleGenAI } from '@google/genai';
import { BrandContext, VideoConfig } from './types';
import { buildPrompt, buildCorrectionPrompt } from './promptBuilder';
import { RemotionRenderer } from '../renderer/remotionRenderer';
import { rateLimitedCall } from './rateLimiter';
import path from 'path';
import fs from 'fs/promises';

/**
 * ReAct Cognitive Architecture
 * 
 * The agent follows a Reason → Act → Observe loop:
 * 1. REASON: Assess current state, form hypothesis about next step
 * 2. ACT: Execute the chosen action (tool/function)
 * 3. OBSERVE: Process results, integrate into context for next cycle
 */

// Agent thought/action trace for transparency
export interface AgentThought {
    type: 'reason' | 'act' | 'observe';
    content: string;
    timestamp: Date;
    /**
     * The model's actual thinking summary from Gemini (when includeThoughts is enabled).
     * This is the human-readable summary of the model's internal reasoning process.
     */
    modelThinking?: string;
    /**
     * Opaque thought signature from Gemini for maintaining reasoning context across turns.
     * This should be passed back to the API but not displayed to users.
     */
    thoughtSignature?: string;
}

export interface AgentProgress {
    stage: 'reasoning' | 'acting' | 'observing' | 'correcting' | 'rendering';
    message: string;
    detail?: string;
    thought?: AgentThought;
    codePreview?: string;
    attempt?: number;
    maxAttempts?: number;
    thoughts?: AgentThought[]; // Full trace of agent's cognitive process
}

const MAX_CORRECTION_ATTEMPTS = 3;

export class AgentOrchestrator {
    private ai: GoogleGenAI;
    private renderer: RemotionRenderer;
    private thoughts: AgentThought[] = [];

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.ai = new GoogleGenAI({ apiKey });
        this.renderer = new RemotionRenderer();
    }

    // Record a thought in the agent's cognitive trace
    private think(type: 'reason' | 'act' | 'observe', content: string): AgentThought {
        const thought: AgentThought = { type, content, timestamp: new Date() };
        this.thoughts.push(thought);
        console.log(`[${type.toUpperCase()}] ${content}`);
        return thought;
    }

    async generateVideo(
        brand: BrandContext,
        config: VideoConfig,
        onProgress: (message: string, status: 'generating' | 'rendering', detail?: AgentProgress) => void
    ): Promise<string> {
        this.thoughts = []; // Reset cognitive trace

        try {
            // ═══════════════════════════════════════════════════════════════════
            // CYCLE 1: Understand the creative brief
            // ═══════════════════════════════════════════════════════════════════

            // REASON: What do I need to do?
            let thought = this.think('reason',
                `User wants a ${config.style} motion design video for "${brand.name}" in the ${brand.industry} industry. ` +
                `I need to: 1) Analyze the brand context, 2) Generate Remotion code, 3) Validate it, 4) Render the video.`
            );

            onProgress('🧠 Reasoning about your creative brief...', 'generating', {
                stage: 'reasoning',
                message: 'Analyzing requirements',
                thought,
                detail: `Brand: ${brand.name} | Style: ${config.style} | Format: ${config.aspectRatio}`,
                thoughts: [...this.thoughts]
            });

            await this.delay(400);

            // ACT: Gather brand information
            thought = this.think('act',
                `Gathering brand context: name="${brand.name}", tagline="${brand.tagline}", ` +
                `colors=[${brand.colors.join(', ')}], industry="${brand.industry}"`
            );

            onProgress('� Collecting brand information...', 'generating', {
                stage: 'acting',
                message: 'Processing brand context',
                thought,
                thoughts: [...this.thoughts]
            });

            await this.delay(300);

            // OBSERVE: Brand context is complete
            thought = this.think('observe',
                `Brand context gathered successfully. Creative direction: "${config.prompt.substring(0, 100)}..."`
            );

            onProgress('✓ Brand context processed', 'generating', {
                stage: 'observing',
                message: 'Ready to generate code',
                thought,
                thoughts: [...this.thoughts]
            });

            await this.delay(200);

            // ═══════════════════════════════════════════════════════════════════
            // CYCLE 2: Generate Remotion composition code
            // ═══════════════════════════════════════════════════════════════════

            const prompt = buildPrompt(brand, config);
            let generatedCode: string | null = null;
            let lastError: string | null = null;
            let attempt = 0;

            while (attempt < MAX_CORRECTION_ATTEMPTS) {
                attempt++;

                // REASON: What's the next step for code generation?
                if (attempt === 1) {
                    thought = this.think('reason',
                        `I need to generate Remotion composition code. I'll use the Gemini API with a detailed prompt ` +
                        `describing the ${config.style} style, brand colors, and animation requirements.`
                    );
                } else {
                    thought = this.think('reason',
                        `Previous code failed validation: "${lastError}". I need to correct this by ` +
                        `providing the AI with the error context and asking for a fixed version.`
                    );
                }

                onProgress(
                    attempt === 1 ? '🧠 Planning code generation...' : `🧠 Diagnosing error (attempt ${attempt})...`,
                    'generating',
                    {
                        stage: 'reasoning',
                        message: attempt === 1 ? 'Preparing Remotion code generation' : 'Analyzing what went wrong',
                        thought,
                        detail: lastError || undefined,
                        attempt,
                        maxAttempts: MAX_CORRECTION_ATTEMPTS,
                        thoughts: [...this.thoughts]
                    }
                );

                await this.delay(300);

                // ACT: Call Gemini API to generate code
                thought = this.think('act',
                    attempt === 1
                        ? `Calling Gemini 2.5 Flash with prompt for ${config.style} style composition...`
                        : `Calling Gemini 2.5 Flash with correction prompt to fix: ${lastError}`
                );

                onProgress(
                    attempt === 1 ? '💻 Generating Remotion code...' : '🔧 Requesting code correction...',
                    'generating',
                    {
                        stage: 'acting',
                        message: attempt === 1 ? 'AI is writing code' : 'AI is fixing the code',
                        thought,
                        attempt,
                        maxAttempts: MAX_CORRECTION_ATTEMPTS,
                        thoughts: [...this.thoughts]
                    }
                );

                const currentPrompt = attempt === 1
                    ? prompt
                    : buildCorrectionPrompt(generatedCode || '', lastError || '', brand, config);

                // Use rate-limited call to respect API quotas
                const response = await rateLimitedCall(() =>
                    this.ai.models.generateContent({
                        model: 'gemini-3-flash',
                        contents: [{ role: 'user', parts: [{ text: currentPrompt }] }],
                        config: {
                            temperature: attempt === 1 ? 0.7 : 0.3,
                            maxOutputTokens: 16384,
                        }
                    })
                );

                const responseText = response.text || '';
                generatedCode = this.extractCode(responseText);

                // OBSERVE: Analyze the API response
                if (!generatedCode) {
                    thought = this.think('observe',
                        `API returned response but no valid code block was found. Response length: ${responseText.length} chars.`
                    );
                    lastError = 'No code block found in AI response';

                    onProgress('⚠️ No code extracted from response', 'generating', {
                        stage: 'observing',
                        message: 'AI response did not contain valid code',
                        thought,
                        thoughts: [...this.thoughts]
                    });
                    continue;
                }

                thought = this.think('observe',
                    `Received ${generatedCode.length} characters of code. Now validating structure...`
                );

                onProgress('🔍 Validating code structure...', 'generating', {
                    stage: 'observing',
                    message: 'Checking for required components',
                    thought,
                    codePreview: generatedCode.substring(0, 150) + '...',
                    thoughts: [...this.thoughts]
                });

                await this.delay(200);

                // ═══════════════════════════════════════════════════════════════════
                // CYCLE 3: Validate the generated code
                // ═══════════════════════════════════════════════════════════════════

                // REASON: What needs to be validated?
                thought = this.think('reason',
                    `Validating code for: 1) Remotion imports, 2) Component export, 3) No dangerous patterns`
                );

                const validation = this.validateCode(generatedCode);

                // OBSERVE: Validation results
                if (validation.valid) {
                    thought = this.think('observe', `✓ Code validation passed! All requirements met.`);

                    onProgress('✅ Code validated successfully!', 'generating', {
                        stage: 'observing',
                        message: `Passed on attempt ${attempt}`,
                        thought,
                        codePreview: generatedCode.substring(0, 200) + '...',
                        thoughts: [...this.thoughts]
                    });
                    break;
                } else {
                    thought = this.think('observe', `✗ Validation failed: ${validation.error}`);
                    lastError = validation.error || 'Unknown error';

                    onProgress(`⚠️ Validation issue: ${lastError}`, 'generating', {
                        stage: 'observing',
                        message: 'Code needs correction',
                        thought,
                        attempt,
                        maxAttempts: MAX_CORRECTION_ATTEMPTS,
                        thoughts: [...this.thoughts]
                    });

                    if (attempt >= MAX_CORRECTION_ATTEMPTS) {
                        // REASON: Final attempt - try auto-fix
                        thought = this.think('reason',
                            `All ${MAX_CORRECTION_ATTEMPTS} attempts exhausted. Applying automatic fixes as last resort.`
                        );

                        // ACT: Auto-fix the code
                        thought = this.think('act', `Applying auto-fix: adding missing imports and exports`);
                        generatedCode = this.autoFixCode(generatedCode);

                        // OBSERVE: Check if auto-fix worked
                        const revalidation = this.validateCode(generatedCode);
                        if (!revalidation.valid) {
                            thought = this.think('observe', `Auto-fix failed. Error: ${revalidation.error}`);
                            throw new Error(`Code validation failed after ${MAX_CORRECTION_ATTEMPTS} attempts: ${lastError}`);
                        }

                        thought = this.think('observe', `Auto-fix successful! Code now validates.`);
                        onProgress('🔧 Auto-fixed code structure', 'generating', {
                            stage: 'observing',
                            message: 'Applied automatic fixes',
                            thought,
                            thoughts: [...this.thoughts]
                        });
                    }
                }
            }

            if (!generatedCode) {
                throw new Error('Failed to generate valid code after all attempts');
            }

            await this.delay(200);

            // ═══════════════════════════════════════════════════════════════════
            // CYCLE 4: Save and render the composition
            // ═══════════════════════════════════════════════════════════════════

            // REASON: Ready to render
            thought = this.think('reason',
                `Code is valid. Now I need to: 1) Save the composition to disk, 2) Invoke Remotion renderer`
            );

            onProgress('💾 Saving composition...', 'rendering', {
                stage: 'acting',
                message: 'Writing composition file',
                thought,
                thoughts: [...this.thoughts]
            });

            // ACT: Save composition
            thought = this.think('act', `Saving composition to remotion/src/generated/`);
            const compositionPath = await this.saveComposition(generatedCode);

            // OBSERVE: File saved
            thought = this.think('observe', `Composition saved to: ${compositionPath}`);

            // REASON: Time to render
            thought = this.think('reason',
                `Composition saved. Now invoking Remotion renderer for ${config.resolution} ${config.aspectRatio} video.`
            );

            onProgress('🎬 Rendering video...', 'rendering', {
                stage: 'acting',
                message: 'Remotion is rendering frames',
                thought,
                detail: 'This may take 30-60 seconds',
                thoughts: [...this.thoughts]
            });

            // ACT: Render video
            thought = this.think('act', `Starting Remotion render process...`);

            const videoPath = await this.renderer.render(compositionPath, config, (progress) => {
                onProgress(`🎬 Rendering: ${Math.round(progress * 100)}%`, 'rendering', {
                    stage: 'acting',
                    message: `Frame rendering: ${Math.round(progress * 100)}%`,
                    thoughts: [...this.thoughts]
                });
            });

            // OBSERVE: Render complete
            thought = this.think('observe', `✓ Video rendered successfully to: ${videoPath}`);

            onProgress('✨ Video ready!', 'rendering', {
                stage: 'observing',
                message: 'Your motion design video is complete',
                thought,
                thoughts: [...this.thoughts]
            });

            return videoPath;
        } catch (error) {
            this.think('observe', `Error occurred: ${error}`);
            console.error('Orchestrator error:', error);
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private extractCode(response: string): string | null {
        const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript)?\s*([\s\S]*?)```/g;
        const matches = [...response.matchAll(codeBlockRegex)];

        if (matches.length === 0) {
            if (response.includes('export const') || response.includes('export default') || response.includes('import')) {
                return response.trim();
            }
            return null;
        }

        let bestBlock = '';
        for (const match of matches) {
            const code = match[1].trim();
            if (code.includes('remotion') || code.includes('React')) {
                if (code.length > bestBlock.length) {
                    bestBlock = code;
                }
            } else if (code.length > bestBlock.length && !bestBlock) {
                bestBlock = code;
            }
        }

        return bestBlock || null;
    }

    private validateCode(code: string): { valid: boolean; error?: string } {
        const hasRemotionImport = /import\s+.*from\s+['"]remotion['"]/.test(code) ||
            /from\s+['"]remotion['"]/.test(code);

        if (!hasRemotionImport) {
            return { valid: false, error: 'Missing Remotion import' };
        }

        const hasExport = /export\s+(default\s+)?(function|const|class)/.test(code);
        if (!hasExport) {
            return { valid: false, error: 'Missing component export' };
        }

        const dangerousPatterns = [
            { pattern: /\brequire\s*\(/, name: 'require() calls' },
            { pattern: /\beval\s*\(/, name: 'eval() calls' },
            { pattern: /new\s+Function\s*\(/, name: 'Function constructor' },
            { pattern: /child_process/, name: 'child_process access' },
        ];

        for (const danger of dangerousPatterns) {
            if (danger.pattern.test(code)) {
                return { valid: false, error: `Forbidden pattern: ${danger.name}` };
            }
        }

        return { valid: true };
    }

    private autoFixCode(code: string): string {
        let fixedCode = code;

        if (!fixedCode.includes("from 'remotion'") && !fixedCode.includes('from "remotion"')) {
            fixedCode = `import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

${fixedCode}`;
        }

        if (!fixedCode.includes("import React") && !fixedCode.includes("from 'react'")) {
            fixedCode = `import React from 'react';\n${fixedCode}`;
        }

        if (!fixedCode.includes('export default')) {
            const componentMatch = fixedCode.match(/(?:function|const)\s+(\w+)/);
            if (componentMatch) {
                const componentName = componentMatch[1];
                if (!fixedCode.includes(`export default ${componentName}`)) {
                    fixedCode += `\n\nexport default ${componentName};`;
                }
            }
        }

        return fixedCode;
    }

    private async saveComposition(code: string): Promise<string> {
        const outputDir = path.join(process.cwd(), 'remotion', 'src', 'compositions');
        await fs.mkdir(outputDir, { recursive: true });

        // We overwrite the same file so Root.tsx imports it consistently
        const fileName = 'GeneratedVideo.tsx';
        const filePath = path.join(outputDir, fileName);

        let finalCode = this.autoFixCode(code);

        await fs.writeFile(filePath, finalCode, 'utf-8');
        console.log(`Saved composition to: ${filePath}`);
        return filePath;
    }
}
