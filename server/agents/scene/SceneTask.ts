/**
 * Scene Task Types
 * 
 * Defines task types and interfaces for the Scene Generator Agent.
 */

import { BrandContext } from '../types.js';

// ============================================================================
// Scene Generation Task
// ============================================================================

export interface SceneGenerationTask {
  /** Project ID */
  projectId: string;
  
  /** Scene ID */
  sceneId: string;
  
  /** Scene index (0-based) */
  sceneIndex: number;
  
  /** Current version (incremented on each regeneration) */
  version: number;
  
  /** Generation prompt */
  prompt: string;
  
  /** Brand context for styling */
  brandContext: BrandContext;
  
  /** Previous code (for iterations) */
  previousCode?: string;
  
  /** Feedback from evaluation (for iterations) */
  feedback?: string;
  
  /** Scene duration in frames */
  durationFrames?: number;
  
  /** Start frame in the final video */
  startFrame?: number;
  
  /** Force new creative approach */
  forceNewApproach?: boolean;
  
  /** Style hints from Director */
  styleHints?: string[];
  
  /** Constraints from Director */
  constraints?: string[];
}

export interface SceneGenerationResult {
  /** Project ID */
  projectId: string;
  
  /** Scene ID */
  sceneId: string;
  
  /** Scene index */
  sceneIndex: number;
  
  /** Version that was generated */
  version: number;
  
  /** Generated Remotion code */
  code: string;
  
  /** Time taken to generate (ms) */
  generationTimeMs: number;
  
  /** Path where code was saved */
  codePath: string;
  
  /** Whether code passed basic validation */
  validationPassed: boolean;
  
  /** Validation errors if any */
  validationErrors?: string[];
}

// ============================================================================
// Scene Render Task
// ============================================================================

export interface SceneRenderTask {
  /** Project ID */
  projectId: string;
  
  /** Scene ID */
  sceneId: string;
  
  /** Scene index */
  sceneIndex: number;
  
  /** Version to render */
  version: number;
  
  /** Path to the scene code file */
  codePath: string;
  
  /** Scene duration in frames */
  durationFrames: number;
  
  /** Aspect ratio */
  aspectRatio: '16:9' | '9:16';
  
  /** Resolution scale (1.0 for 1080p, 0.667 for 720p) */
  resolutionScale?: number;
}

export interface SceneRenderResult {
  /** Project ID */
  projectId: string;
  
  /** Scene ID */
  sceneId: string;
  
  /** Scene index */
  sceneIndex: number;
  
  /** Version that was rendered */
  version: number;
  
  /** Path to the rendered video */
  videoPath: string;
  
  /** Time taken to render (ms) */
  renderTimeMs: number;
  
  /** File size in bytes */
  fileSizeBytes: number;
}

// ============================================================================
// Code Validation
// ============================================================================

export interface CodeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  hasDefaultExport: boolean;
  usesRemotionPrimitives: boolean;
  estimatedComplexity: 'low' | 'medium' | 'high';
}

/**
 * Validate generated Remotion code
 */
export function validateSceneCode(code: string): CodeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for default export
  const hasDefaultExport = /export\s+default\s+/.test(code) || 
                           /export\s*\{\s*\w+\s+as\s+default\s*\}/.test(code);
  if (!hasDefaultExport) {
    errors.push('Missing default export - component must be exported as default');
  }
  
  // Check for React import
  if (!code.includes('import React') && !code.includes("from 'react'")) {
    warnings.push('Consider adding explicit React import');
  }
  
  // Check for Remotion primitives
  const remotionPrimitives = [
    'useCurrentFrame',
    'useVideoConfig',
    'AbsoluteFill',
    'Sequence',
    'interpolate',
    'spring',
    'Img',
    'Audio',
    'Video',
  ];
  
  const usedPrimitives = remotionPrimitives.filter(p => code.includes(p));
  const usesRemotionPrimitives = usedPrimitives.length > 0;
  
  if (!usesRemotionPrimitives) {
    warnings.push('No Remotion primitives detected - ensure animation hooks are used');
  }
  
  // Check for forbidden patterns
  const forbiddenPatterns = [
    { pattern: /require\s*\(/, message: 'Use ES6 imports instead of require()' },
    { pattern: /document\./, message: 'DOM APIs not available in Remotion' },
    { pattern: /window\./, message: 'Window object not available in Remotion' },
    { pattern: /localStorage/, message: 'localStorage not available in Remotion' },
    { pattern: /fetch\s*\(/, message: 'Async data fetching should be done via inputProps' },
  ];
  
  for (const { pattern, message } of forbiddenPatterns) {
    if (pattern.test(code)) {
      errors.push(message);
    }
  }
  
  // Estimate complexity
  const lineCount = code.split('\n').length;
  const hasSpring = code.includes('spring(');
  const hasSequence = code.includes('<Sequence');
  const hasInterpolate = code.includes('interpolate(');
  
  let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
  if (lineCount > 200 || (hasSpring && hasSequence && hasInterpolate)) {
    estimatedComplexity = 'high';
  } else if (lineCount > 100 || hasSequence) {
    estimatedComplexity = 'medium';
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    hasDefaultExport,
    usesRemotionPrimitives,
    estimatedComplexity,
  };
}

// ============================================================================
// Code Extraction
// ============================================================================

/**
 * Extract TypeScript/TSX code from markdown code blocks
 */
export function extractCodeFromResponse(response: string): string | null {
  // Try to extract from typescript/tsx code blocks
  const patterns = [
    /```(?:typescript|tsx|ts)\n([\s\S]*?)```/,
    /```(?:javascript|jsx|js)\n([\s\S]*?)```/,
    /```\n([\s\S]*?)```/,
  ];
  
  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no code block, check if the response itself is code
  if (response.includes('export default') && response.includes('import')) {
    return response.trim();
  }
  
  return null;
}

// ============================================================================
// File Path Helpers
// ============================================================================

/**
 * Get the file path for a scene's code
 */
export function getSceneCodePath(projectId: string, sceneId: string, version: number): string {
  return `remotion/src/generated/scenes/${projectId}/${sceneId}_v${version}.tsx`;
}

/**
 * Get the file path for a scene's rendered video
 */
export function getSceneVideoPath(projectId: string, sceneId: string, version: number): string {
  return `output/previews/${projectId}/${sceneId}_v${version}.mp4`;
}

/**
 * Get the file path for a scene preview wrapper
 */
export function getScenePreviewWrapperPath(projectId: string, sceneId: string): string {
  return `remotion/src/generated/scenes/${projectId}/previews/${sceneId}Preview.tsx`;
}
