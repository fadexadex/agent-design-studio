/**
 * Scene Generator Worker
 * 
 * BullMQ worker that processes scene generation tasks.
 * Generates Remotion code using Gemini and validates/saves it.
 */

import { Worker, Job } from 'bullmq';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

import { getRedisConnection } from '../../queues/redisConnection.js';
import { QUEUE_NAMES, QUEUE_CONCURRENCY, SceneAgentJobData, SceneAgentJobResult } from '../../queues/definitions.js';
import { getDirectorQueue } from '../../queues/definitions.js';
import { uiEvents } from '../../events/UIEventEmitter.js';
import { BrandContext } from '../types.js';
import {
  SceneGenerationTask,
  SceneGenerationResult,
  validateSceneCode,
  extractCodeFromResponse,
  getSceneCodePath,
} from './SceneTask.js';
import {
  buildScenePrompt,
  buildSceneCorrectionPrompt,
} from './ScenePromptBuilder.js';
import { rateLimitedCall } from '../../core/agent/rateLimiter.js';
import { validateAndCorrect, ValidationResult } from './CodeValidator.js';

// ============================================================================
// Constants
// ============================================================================

const MAX_GENERATION_ATTEMPTS = 3;
const GENERATED_SCENES_DIR = 'remotion/src/generated/scenes';

// Valid component modules (scanned at startup)
let validComponentModules: Set<string> | null = null;

function scanComponentModules(): Set<string> {
  if (validComponentModules) return validComponentModules;
  
  const componentsDir = path.join(process.cwd(), 'remotion', 'src', 'components');
  const modules = new Set<string>();

  try {
    const entries = fsSync.readdirSync(componentsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        modules.add(entry.name);
      }
    }
    console.log(`[SceneGenerator] Component modules: ${[...modules].join(', ')}`);
  } catch {
    // Fallback
    ['AnimatedText', 'MockupFrame', 'Camera', 'Layout',
     'DynamicCursor', 'Global', 'Transitions', 'Generated', 'shared'].forEach(m => modules.add(m));
  }

  validComponentModules = modules;
  return modules;
}

// ============================================================================
// AI Client
// ============================================================================

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

// ============================================================================
// Code Validation & Fixing
// ============================================================================

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Enhanced validation that checks for known issues
 */
function validateGeneratedCode(code: string): ValidationResult {
  // Use the SceneTask validator first
  const baseValidation = validateSceneCode(code);
  if (!baseValidation.valid) {
    return { valid: false, error: baseValidation.errors.join('; ') };
  }

  // Check for valid imports
  const hasRemotionImport = /import\s+.*from\s+['"]remotion['"]/.test(code) ||
    /from\s+['"]remotion['"]/.test(code);
  const hasComponentImport = /from\s+['"]@\/components/.test(code);

  if (!hasRemotionImport && !hasComponentImport) {
    return { valid: false, error: 'Missing Remotion or component library import' };
  }

  // Validate @/components imports
  const componentModules = scanComponentModules();
  const componentImports = code.matchAll(/from\s+['"]@\/components\/(\w+)['"]/g);
  for (const match of componentImports) {
    if (!componentModules.has(match[1])) {
      return { 
        valid: false, 
        error: `Unknown component module: @/components/${match[1]}. Valid: ${[...componentModules].join(', ')}` 
      };
    }
  }

  // Check for truncated code
  const truncationResult = checkTruncation(code);
  if (truncationResult.truncated) {
    return { valid: false, error: `Code truncated: ${truncationResult.reason}` };
  }

  return { valid: true };
}

function checkTruncation(code: string): { truncated: boolean; reason?: string } {
  // Check brace balance
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    return { truncated: true, reason: `Unbalanced braces: ${openBraces} open, ${closeBraces} close` };
  }

  // Check parentheses balance
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { truncated: true, reason: `Unbalanced parentheses` };
  }

  // Check for return statement
  if (!code.includes('return')) {
    return { truncated: true, reason: 'No return statement found' };
  }

  // Minimum length check
  if (code.length < 200) {
    return { truncated: true, reason: `Code too short (${code.length} chars)` };
  }

  return { truncated: false };
}

/**
 * Auto-fix common code issues
 */
function autoFixCode(code: string, sceneIndex: number): string {
  let fixed = code;

  // Fix missing React import
  if (!fixed.includes("import React") && !fixed.includes("from 'react'")) {
    fixed = `import React from 'react';\n${fixed}`;
  }

  // Fix missing Remotion import
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

  // Fix missing default export
  if (!fixed.includes('export default')) {
    const componentMatch = fixed.match(/(?:function|const)\s+(\w+)/);
    if (componentMatch) {
      const componentName = componentMatch[1];
      if (!fixed.includes(`export default ${componentName}`)) {
        fixed += `\n\nexport default ${componentName};`;
      }
    } else {
      // Create a wrapper component
      fixed = `${fixed}\n\nexport default function Scene${sceneIndex}() {\n  return null; // Auto-generated placeholder\n}`;
    }
  }

  // Fix CSS kebab-case properties
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

  // Fix common component path typos
  fixed = fixed.replace(/from\s+['"]@\/component\//g, "from '@/components/");

  return fixed;
}

// ============================================================================
// Processor Logic
// ============================================================================

export async function processSceneGenerationJob(job: Job<SceneAgentJobData, SceneAgentJobResult>): Promise<SceneAgentJobResult> {
  // Skip render jobs - those would be handled by SceneRenderWorker if enabled
  if (job.name === 'RENDER_SCENE') {
    console.log(`[SceneGenerator] Skipping render job ${job.id} - render worker not enabled`);
    return { projectId: '', sceneId: '', version: 0, code: '', generationTimeMs: 0 };
  }

  const { projectId, sceneId, sceneIndex, version, prompt, brandContext, previousCode, feedback } = job.data;
  const startTime = Date.now();

  console.log(`[SceneGenerator] Processing scene ${sceneIndex} v${version} for project ${projectId}`);

  // Emit generating event
  await uiEvents.sceneGenerating(projectId, {
    sceneId,
    sceneIndex,
    sceneNumber: sceneIndex + 1,
    version,
    attempt: 1,
  });

  // Build task
  const task: SceneGenerationTask = {
    projectId,
    sceneId,
    sceneIndex,
    version,
    prompt,
    brandContext: brandContext as unknown as BrandContext,
    previousCode,
    feedback,
  };

  let generatedCode: string | null = null;
  let lastError: string | null = null;
  let attempt = 0;

  const ai = getAIClient();

  // Generation loop with retries
  while (attempt < MAX_GENERATION_ATTEMPTS) {
    attempt++;

    try {
      // Build prompt
      const scenePrompt = attempt === 1 && !previousCode
        ? await buildScenePrompt(task)
        : await buildSceneCorrectionPrompt(
            { ...task, previousCode: generatedCode || previousCode },
            generatedCode || previousCode || '',
            lastError || 'Unknown error'
          );

      console.log(`[SceneGenerator] Attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} for scene ${sceneIndex} - calling AI...`);

      // Update UI with attempt info
      if (attempt > 1) {
        await uiEvents.sceneGenerating(projectId, {
          sceneId,
          sceneIndex,
          sceneNumber: sceneIndex + 1,
          version,
          attempt,
        });
      }

      // Call Gemini with rate limiting
      const response = await rateLimitedCall(() => {
        console.log(`[SceneGenerator] Executing AI call for scene ${sceneIndex}...`);
        return ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: scenePrompt,
          config: {
            // Gemini 3 best practice: use default temperature of 1.0
            temperature: 1.0,
            maxOutputTokens: 8192,
            // Use high thinking for complex code generation
            thinkingConfig: {
              thinkingLevel: 'high',
            },
          },
        });
      });

      console.log(`[SceneGenerator] AI response received for scene ${sceneIndex}`);
      const responseText = response.text || '';
      generatedCode = extractCodeFromResponse(responseText);

      if (!generatedCode) {
        lastError = 'No code block found in AI response';
        console.warn(`[SceneGenerator] ${lastError}`);
        continue;
      }

      // Apply basic auto-fixes first
      generatedCode = autoFixCode(generatedCode, sceneIndex);

      // Basic structure validation (imports, exports, etc.)
      const basicValidation = validateGeneratedCode(generatedCode);
      if (!basicValidation.valid) {
        lastError = basicValidation.error || 'Unknown validation error';
        console.warn(`[SceneGenerator] Basic validation failed: ${lastError}`);
        continue;
      }

      // Full validation with TypeScript check, static analysis, and AI autocorrect
      console.log(`[SceneGenerator] Running full validation for scene ${sceneIndex}...`);
      const fullValidation = await validateAndCorrect(generatedCode, {
        sceneIndex,
        maxCorrections: 2,
        enableAICorrection: true,
      });

      if (!fullValidation.valid) {
        lastError = fullValidation.errors.join('; ');
        console.warn(`[SceneGenerator] Full validation failed: ${lastError}`);
        // Use the partially corrected code for next attempt
        generatedCode = fullValidation.code;
        continue;
      }

      // Use the validated (possibly corrected) code
      generatedCode = fullValidation.code;

      // Log corrections if any were made
      if (fullValidation.correctionsMade.length > 0) {
        console.log(`[SceneGenerator] Scene ${sceneIndex} had ${fullValidation.correctionsMade.length} auto-corrections:`);
        fullValidation.correctionsMade.forEach(c => console.log(`  - ${c}`));
      }

      // Success!
      console.log(`[SceneGenerator] Scene ${sceneIndex} validated successfully (${fullValidation.validationTimeMs}ms)`);
      break;

    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`[SceneGenerator] Generation error:`, error);

      if (attempt >= MAX_GENERATION_ATTEMPTS) {
        throw new Error(`Scene generation failed after ${MAX_GENERATION_ATTEMPTS} attempts: ${lastError}`);
      }
    }
  }

  if (!generatedCode) {
    throw new Error(`Failed to generate valid code after ${MAX_GENERATION_ATTEMPTS} attempts: ${lastError}`);
  }

  // Save the generated code
  const codePath = await saveSceneCode(projectId, sceneId, version, generatedCode);
  const generationTimeMs = Date.now() - startTime;

  // Also create preview wrapper
  await createScenePreviewWrapper(projectId, sceneId, sceneIndex, version);

  // Emit success event
  await uiEvents.sceneGenerated(projectId, {
    sceneId,
    sceneIndex,
    sceneNumber: sceneIndex + 1,
    version,
    durationMs: generationTimeMs,
    codeLength: generatedCode.length,
  });

  // Send command to Director
  // Note: DirectorJobData expects { command: string } not { type: string }
  await getDirectorQueue().add('SCENE_GENERATED', {
    projectId,
    command: 'SCENE_GENERATED',
    payload: {
      sceneId,
      version,
      code: generatedCode,
      generationTimeMs,
    },
    timestamp: Date.now(),
  });

  // Return result
  const result: SceneAgentJobResult = {
    projectId,
    sceneId,
    version,
    code: generatedCode,
    generationTimeMs,
  };

  return result;
}

// ============================================================================
// Scene Generator Worker
// ============================================================================

export interface SceneGeneratorWorkerOptions {
  concurrency?: number;
}

export function createSceneGeneratorWorker(options: SceneGeneratorWorkerOptions = {}): Worker<SceneAgentJobData, SceneAgentJobResult> {
  const { concurrency = QUEUE_CONCURRENCY[QUEUE_NAMES.SCENE_AGENT] } = options;

  const worker = new Worker<SceneAgentJobData, SceneAgentJobResult>(
    QUEUE_NAMES.SCENE_AGENT,
    processSceneGenerationJob,
    {
      connection: getRedisConnection(),
      concurrency,
    }
  );

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[SceneGenerator] Job ${job.id} completed for scene ${job.data.sceneIndex}`);
  });

  worker.on('failed', async (job, error) => {
    console.error(`[SceneGenerator] Job ${job?.id} failed:`, error.message);

    if (job) {
      await uiEvents.sceneError(job.data.projectId, {
        sceneId: job.data.sceneId,
        sceneIndex: job.data.sceneIndex,
        sceneNumber: job.data.sceneIndex + 1,
        version: job.data.version,
        error: error.message,
        phase: 'generation',
      });

      // Notify Director of failure so it doesn't hang
      await getDirectorQueue().add('ESCALATE_SCENE', {
        projectId: job.data.projectId,
        command: 'ESCALATE_SCENE',
        payload: {
          sceneId: job.data.sceneId,
          reason: `Generation failed after max attempts: ${error.message}`,
          attempts: job.data.version,
          lastScore: 0,
          scoreHistory: [0]
        },
        timestamp: Date.now(),
      });
    }
  });

  worker.on('error', (error) => {
    console.error('[SceneGenerator] Worker error:', error);
  });

  console.log(`[SceneGenerator] Worker started with concurrency ${concurrency}`);

  return worker;
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Save scene code to filesystem
 */
async function saveSceneCode(
  projectId: string,
  sceneId: string,
  version: number,
  code: string
): Promise<string> {
  const relativePath = getSceneCodePath(projectId, sceneId, version);
  const absolutePath = path.join(process.cwd(), relativePath);
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  
  // Write file
  await fs.writeFile(absolutePath, code, 'utf-8');
  
  console.log(`[SceneGenerator] Saved scene code to ${relativePath}`);
  
  return relativePath;
}

/**
 * Create a preview wrapper for the scene
 * This allows rendering the scene independently
 */
async function createScenePreviewWrapper(
  projectId: string,
  sceneId: string,
  sceneIndex: number,
  version: number
): Promise<string> {
  const previewDir = path.join(process.cwd(), GENERATED_SCENES_DIR, projectId, 'previews');
  await fs.mkdir(previewDir, { recursive: true });
  
  const previewPath = path.join(previewDir, `ScenePreview${sceneIndex}.tsx`);
  const scenePath = `../${sceneId}_v${version}.tsx`;
  
  const previewCode = `/**
 * Scene ${sceneIndex} Preview Wrapper
 * Auto-generated for independent scene rendering
 */
import { registerRoot, Composition } from 'remotion';
import Scene from '${scenePath}';

const ScenePreviewRoot: React.FC = () => {
  return (
    <Composition
      id="ScenePreview"
      component={Scene}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

registerRoot(ScenePreviewRoot);
`;

  await fs.writeFile(previewPath, previewCode, 'utf-8');
  console.log(`[SceneGenerator] Created preview wrapper at ${previewPath}`);
  
  return previewPath;
}

// ============================================================================
// Exports
// ============================================================================

export {
  validateGeneratedCode,
  autoFixCode,
  saveSceneCode,
  createScenePreviewWrapper,
};
