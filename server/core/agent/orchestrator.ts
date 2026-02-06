import { GoogleGenAI } from '@google/genai';
import { BrandContext, VideoConfig } from './types';
import { buildPrompt, buildCorrectionPrompt } from './promptBuilder';
import { RemotionRenderer } from '../renderer/remotionRenderer';
import { ComponentPipeline } from './componentPipeline';
import { rateLimitedCall } from './rateLimiter';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

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
    private componentPipeline: ComponentPipeline;
    private thoughts: AgentThought[] = [];
    private validComponentModules: Set<string>;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.ai = new GoogleGenAI({ apiKey });
        this.renderer = new RemotionRenderer();
        this.componentPipeline = new ComponentPipeline(this.ai);
        this.validComponentModules = this.scanComponentModules();
    }

    /**
     * Scan the remotion/src/components/ directory for valid module names.
     * Returns directory names that can be used in @/components/<name> imports.
     */
    private scanComponentModules(): Set<string> {
        const componentsDir = path.join(process.cwd(), 'remotion', 'src', 'components');
        const modules = new Set<string>();

        try {
            const entries = fsSync.readdirSync(componentsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    modules.add(entry.name);
                }
            }
            // Also allow importing shared utilities (it's a directory)
            // and the barrel index.ts (import from '@/components' without subpath)
            console.log(`[Orchestrator] Scanned ${modules.size} component modules: ${[...modules].join(', ')}`);
        } catch {
            // Fallback to hardcoded list if scan fails
            console.warn('[Orchestrator] Could not scan components directory, using fallback list');
            ['AnimatedText', 'MockupFrame', 'Camera', 'Layout',
             'DynamicCursor', 'Global', 'Transitions', 'Generated', 'shared'].forEach(m => modules.add(m));
        }

        return modules;
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

            // Build prompt with dynamically selected skills context
            const prompt = await buildPrompt(brand, config);
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
                    : await buildCorrectionPrompt(generatedCode || '', lastError || '', brand, config);

                // Use rate-limited call to respect API quotas
                const response = await rateLimitedCall(() =>
                    this.ai.models.generateContent({
                        model: 'gemini-3-flash',
                        contents: currentPrompt,
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

            // ═══════════════════════════════════════════════════════════════════
            // CYCLE 5: Component extraction (fire-and-forget)
            // ═══════════════════════════════════════════════════════════════════
            // Run the component creation pipeline in the background.
            // This analyzes the generated code for reusable patterns and,
            // if found, extracts them into the component library for future use.
            // Failures here do NOT affect the user's video output.
            if (generatedCode) {
                this.componentPipeline.run(generatedCode).then(result => {
                    if (result.created) {
                        this.think('observe',
                            `📦 New component extracted: ${result.componentName} → ${result.componentPath}`
                        );
                    }
                }).catch(err => {
                    console.warn('[Orchestrator] Component pipeline failed (non-critical):', err);
                });
            }

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
        
        // Check 6: Minimum code length (a valid Remotion component is at least ~200 chars)
        if (code.length < 200) {
            return { 
                truncated: true, 
                reason: `Code too short (${code.length} chars) - likely truncated` 
            };
        }
        
        return { truncated: false };
    }

    private validateCode(code: string): { valid: boolean; error?: string } {
        // Check for truncated/incomplete code FIRST
        const truncationCheck = this.isCodeTruncated(code);
        if (truncationCheck.truncated) {
            return { valid: false, error: `Code appears truncated: ${truncationCheck.reason}` };
        }

        // Must import from remotion OR use component library (which internally uses remotion)
        const hasRemotionImport = /import\s+.*from\s+['"]remotion['"]/.test(code) ||
            /from\s+['"]remotion['"]/.test(code);

        const hasComponentImport = /from\s+['"]@\/components/.test(code);

        if (!hasRemotionImport && !hasComponentImport) {
            return { valid: false, error: 'Missing Remotion or component library import' };
        }

        const hasExport = /export\s+(default\s+)?(function|const|class)/.test(code);
        if (!hasExport) {
            return { valid: false, error: 'Missing component export' };
        }

        // Validate @/components imports reference known modules
        const componentImports = code.matchAll(/from\s+['"]@\/components\/(\w+)['"]/g);
        for (const match of componentImports) {
            if (!this.validComponentModules.has(match[1])) {
                return { valid: false, error: `Unknown component module: @/components/${match[1]}. Valid modules: ${[...this.validComponentModules].join(', ')}` };
            }
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

        // Fix truncated code by attempting to close unbalanced braces/brackets/parens
        fixedCode = this.attemptToCloseTruncatedCode(fixedCode);

        // Fix missing Remotion import
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

        // Fix missing React import
        if (!fixedCode.includes("import React") && !fixedCode.includes("from 'react'")) {
            fixedCode = `import React from 'react';\n${fixedCode}`;
        }

        // Fix missing default export
        if (!fixedCode.includes('export default')) {
            const componentMatch = fixedCode.match(/(?:function|const)\s+(\w+)/);
            if (componentMatch) {
                const componentName = componentMatch[1];
                if (!fixedCode.includes(`export default ${componentName}`)) {
                    fixedCode += `\n\nexport default ${componentName};`;
                }
            }
        }

        // Fix invalid @/components imports by removing unknown module imports
        const invalidImportRegex = /import\s+.*from\s+['"]@\/components\/(\w+)['"];\n?/g;
        fixedCode = fixedCode.replace(invalidImportRegex, (match, moduleName) => {
            if (this.validComponentModules.has(moduleName)) {
                return match; // Keep valid imports
            }
            console.warn(`[AutoFix] Removing invalid component import: @/components/${moduleName}`);
            return ''; // Remove invalid imports
        });

        // Fix common import path typos (e.g., @/component/ instead of @/components/)
        fixedCode = fixedCode.replace(
            /from\s+['"]@\/component\//g,
            "from '@/components/"
        );

        return fixedCode;
    }

    /**
     * Attempt to close truncated code by balancing braces, brackets, and parentheses.
     * This is a best-effort fix for LLM output that got cut off.
     */
    private attemptToCloseTruncatedCode(code: string): string {
        let fixedCode = code.trim();
        
        // Remove trailing incomplete statements that can't be salvaged
        // These patterns indicate the code was cut off mid-expression
        const incompletePatterns = [
            /,\s*$/,           // trailing comma
            /=\s*$/,           // incomplete assignment
            /:\s*$/,           // incomplete ternary or object
            /\+\s*$/,          // incomplete addition
            /-\s*$/,           // incomplete subtraction (but careful with negative numbers)
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
                    // Check if last line looks incomplete
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
        
        // Build closing sequence (order matters: ) ] } typically)
        let closingSequence = '';
        
        // Close parentheses first (innermost usually)
        if (missingParens > 0) {
            closingSequence += ')'.repeat(missingParens);
            console.warn(`[AutoFix] Adding ${missingParens} closing parentheses`);
        }
        
        // Close brackets
        if (missingBrackets > 0) {
            closingSequence += ']'.repeat(missingBrackets);
            console.warn(`[AutoFix] Adding ${missingBrackets} closing brackets`);
        }
        
        // Close braces last (outermost: component body, function body)
        if (missingBraces > 0) {
            // Add semicolon before closing braces if code ends without one
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
