/**
 * Code Validator
 * 
 * Multi-layer validation system that ensures generated Remotion code is
 * bug-free before it reaches the render pipeline.
 * 
 * Validation layers:
 * 1. TypeScript transpilation check (syntax, types, undefined variables)
 * 2. Static analysis (common patterns, Remotion best practices)
 * 3. AI review and autocorrect (catches semantic issues)
 */

import ts from 'typescript';
import { GoogleGenAI } from '@google/genai';
import { rateLimitedCall } from '../../core/agent/rateLimiter.js';
import { validateSceneCode, extractCodeFromResponse } from './SceneTask.js';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  code: string; // The (possibly corrected) code
  errors: string[];
  warnings: string[];
  correctionsMade: string[];
  validationTimeMs: number;
}

export interface TypeScriptError {
  line: number;
  column: number;
  message: string;
  code: number;
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
// TypeScript Validation
// ============================================================================

/**
 * Compile TypeScript code and extract errors
 */
export function checkTypeScript(code: string): { valid: boolean; errors: TypeScriptError[] } {
  const errors: TypeScriptError[] = [];
  
  // Create a virtual file for compilation
  const fileName = 'scene.tsx';
  
  // TypeScript compiler options for React/Remotion
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.React,
    lib: ['dom', 'es2020'],
    esModuleInterop: true,
    skipLibCheck: true,
    strict: false, // Be lenient - we're checking for runtime errors mainly
    noEmit: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    isolatedModules: true,
    // Don't fail on missing modules - we care about code structure
    noResolve: true,
  };
  
  // Create a minimal host for single-file compilation
  const host: ts.CompilerHost = {
    getSourceFile: (name) => {
      if (name === fileName) {
        return ts.createSourceFile(name, code, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
      }
      // Return empty source for external modules
      return ts.createSourceFile(name, '', ts.ScriptTarget.ES2020, true);
    },
    writeFile: () => {},
    getDefaultLibFileName: () => 'lib.d.ts',
    useCaseSensitiveFileNames: () => true,
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: () => '',
    getNewLine: () => '\n',
    fileExists: () => true,
    readFile: () => '',
    directoryExists: () => true,
    getDirectories: () => [],
  };
  
  // Create program and get diagnostics
  const program = ts.createProgram([fileName], compilerOptions, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  
  // Extract imported names to distinguish between missing imports and undeclared variables
  const importedNames = new Set<string>();
  // Match import { X, Y } from '...'
  const namedImports = code.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}/g);
  for (const match of namedImports) {
    match[1].split(',').forEach(name => {
      const trimmed = name.trim();
      // Handle "X as Y"
      const parts = trimmed.split(/\s+as\s+/);
      importedNames.add(parts[parts.length - 1]);
    });
  }
  // Match import X from '...'
  const defaultImports = code.matchAll(/import\s+(\w+)\s+from/g);
  for (const match of defaultImports) {
    importedNames.add(match[1]);
  }
  // Match import * as X from '...'
  const namespaceImports = code.matchAll(/import\s+\*\s+as\s+(\w+)/g);
  for (const match of namespaceImports) {
    importedNames.add(match[1]);
  }

  // Filter for actual code errors (not type resolution issues from missing modules)
  for (const diagnostic of diagnostics) {
    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      
      // Handle "Cannot find name" (2304) and "change target library" (2584)
      if (diagnostic.code === 2304 || diagnostic.code === 2584) {
        // Extract the name from the message "Cannot find name 'X'."
        const match = message.match(/Cannot find name '([^']+)'.?/);
        if (match) {
          const name = match[1];
          // If the name is in our imports, it's likely a missing type definition (safe to ignore)
          // If NOT in imports, it's an undeclared variable (ERROR!)
          // Also ignore common globals like React, console, process, and standard JS objects
          const standardGlobals = new Set([
            'React', 'console', 'process', 'window', 'document', 'navigator',
            'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'JSON',
            'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Error',
            'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
            'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent'
          ]);

          if (importedNames.has(name) || standardGlobals.has(name)) {
            continue;
          }
        }
      }

      // Skip module resolution errors - we only care about code logic errors
      if (
        diagnostic.code === 2307 || // Cannot find module
        diagnostic.code === 7016 || // Could not find declaration file
        diagnostic.code === 2503 || // Cannot find namespace
        message.includes("Cannot find module") ||
        message.includes("Cannot find namespace")
      ) {
        continue;
      }
      
      errors.push({
        line: line + 1,
        column: character + 1,
        message,
        code: diagnostic.code,
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Static Analysis
// ============================================================================

interface StaticAnalysisResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Perform static analysis for common Remotion issues
 */
export function staticAnalysis(code: string): StaticAnalysisResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for undefined loop variables in map callbacks
  // Pattern: .map((item) => { ... uses i instead of item ... })
  const mapCallbacks = code.matchAll(/\.map\s*\(\s*\(([^)]+)\)\s*=>/g);
  for (const match of mapCallbacks) {
    const params = match[1].split(',').map(p => p.trim());
    const paramNames = params.map(p => p.split(':')[0].trim());
    
    // Find the map callback body
    const startIndex = match.index! + match[0].length;
    let braceCount = 0;
    let inCallback = false;
    let callbackBody = '';
    
    for (let i = startIndex; i < code.length; i++) {
      const char = code[i];
      if (char === '{') {
        braceCount++;
        inCallback = true;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && inCallback) {
          callbackBody = code.slice(startIndex, i + 1);
          break;
        }
      }
    }
    
    // Check for common mistakes
    if (callbackBody) {
      // Using 'i' when it's not a parameter
      if (!paramNames.includes('i') && !paramNames.includes('index')) {
        // Check if 'i' is used as a standalone identifier (not part of a word)
        if (/\bi\s*[%+\-*/=<>!&|]/.test(callbackBody) || 
            /[%+\-*/=<>!&|]\s*i\b/.test(callbackBody) ||
            /\[\s*i\s*\]/.test(callbackBody) ||
            /\bi\s*===?\s*\d/.test(callbackBody) ||
            /\bi\s*%/.test(callbackBody)) {
          errors.push(`Undefined variable 'i' used in .map() callback. Available params: ${paramNames.join(', ')}`);
        }
      }
      
      // Using 'item' when parameter is named differently
      if (!paramNames.includes('item') && paramNames.length > 0) {
        const actualParam = paramNames[0];
        if (/\bitem\./.test(callbackBody) || /\bitem\[/.test(callbackBody)) {
          errors.push(`Using 'item' but parameter is named '${actualParam}' in .map() callback`);
        }
      }
    }
  }
  
  // Check for unbalanced braces/brackets
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  }
  
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  }
  
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
  }
  
  // Check for common React/Remotion issues
  if (code.includes('useEffect') && !code.includes("from 'react'")) {
    warnings.push('Using useEffect but React import may be missing');
  }
  
  if (code.includes('useState') && !code.includes("from 'react'")) {
    warnings.push('Using useState but React import may be missing - consider using useCurrentFrame instead');
  }
  
  // Check for async in component body (not allowed in Remotion render)
  if (/function\s+\w+\s*\([^)]*\)\s*{\s*(?:const|let|var)?\s*\w*\s*=?\s*await\b/.test(code)) {
    errors.push('Await in component body not allowed - data fetching should use inputProps');
  }

  // Check for common interpolate issues
  // Pattern: interpolate(frame, [a, b, ...], ...) where range is not increasing
  const interpolateMatches = code.matchAll(/interpolate\s*\(\s*[^,]+\s*,\s*\[([\s\d.,\-_]+)\]/g);
  for (const match of interpolateMatches) {
    const rangeStr = match[1];
    const values = rangeStr.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

    if (values.length >= 2) {
      for (let i = 0; i < values.length - 1; i++) {
        if (values[i] >= values[i + 1]) {
          errors.push(`interpolate() inputRange must be strictly monotonically increasing. Found [${values.join(', ')}] in match: ${match[0]}`);
          break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// AI Code Review and Autocorrect
// ============================================================================

/**
 * Use AI to review code and fix issues
 */
export async function aiCodeReview(
  code: string,
  errors: string[],
  sceneIndex: number
): Promise<{ corrected: boolean; code: string; corrections: string[] }> {
  const ai = getAIClient();
  
  const prompt = `You are a Remotion React code validator. Review this code and fix any bugs.

## ERRORS FOUND:
${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

## CODE TO FIX:
\`\`\`tsx
${code}
\`\`\`

## INSTRUCTIONS:
1. Fix ALL the errors listed above
2. Keep the same visual design and animation intent
3. Ensure all variables used in callbacks are properly defined
4. If using .map(), ensure you use the correct parameter names (e.g., if param is 'line', don't use 'i')
5. Return ONLY the corrected code in a tsx code block
6. After the code block, list the corrections made (one per line, prefixed with "FIXED: ")

## IMPORTANT RULES:
- Do NOT add new features
- Do NOT change the overall structure
- Only fix the specific bugs mentioned
- Preserve all imports and exports
- The component must export default

Return the fixed code now:`;

  try {
    const response = await rateLimitedCall(() =>
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.3, // Lower temperature for code fixes (be conservative)
          maxOutputTokens: 8192,
          thinkingConfig: {
            thinkingLevel: 'medium' as any,
          },
        },
      })
    );

    const responseText = response.text || '';
    
    // Extract corrected code
    const correctedCode = extractCodeFromResponse(responseText);
    if (!correctedCode) {
      console.warn(`[CodeValidator] AI did not return code block`);
      return { corrected: false, code, corrections: [] };
    }
    
    // Extract corrections list
    const corrections: string[] = [];
    const fixedLines = responseText.match(/FIXED:\s*(.+)/g);
    if (fixedLines) {
      for (const line of fixedLines) {
        corrections.push(line.replace('FIXED:', '').trim());
      }
    }
    
    console.log(`[CodeValidator] AI made ${corrections.length} corrections to scene ${sceneIndex}`);
    
    return {
      corrected: true,
      code: correctedCode,
      corrections,
    };
  } catch (error) {
    console.error(`[CodeValidator] AI review failed:`, error);
    return { corrected: false, code, corrections: [] };
  }
}

// ============================================================================
// Main Validator
// ============================================================================

export interface ValidateOptions {
  sceneIndex: number;
  maxCorrections?: number;
  enableAICorrection?: boolean;
}

/**
 * Validate and optionally autocorrect generated Remotion code
 * 
 * This is the main entry point for the validation pipeline.
 */
export async function validateAndCorrect(
  code: string,
  options: ValidateOptions
): Promise<ValidationResult> {
  const startTime = Date.now();
  const { sceneIndex, maxCorrections = 2, enableAICorrection = true } = options;
  
  let currentCode = code;
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const allCorrections: string[] = [];
  let correctionAttempts = 0;
  
  console.log(`[CodeValidator] Validating scene ${sceneIndex} code (${code.length} chars)`);
  
  // Validation loop
  while (correctionAttempts <= maxCorrections) {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Layer 1: Basic validation
    const basicValidation = validateSceneCode(currentCode);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);
    
    // Layer 2: TypeScript check
    const tsCheck = checkTypeScript(currentCode);
    for (const tsError of tsCheck.errors) {
      errors.push(`TS${tsError.code} (line ${tsError.line}): ${tsError.message}`);
    }
    
    // Layer 3: Static analysis
    const staticCheck = staticAnalysis(currentCode);
    errors.push(...staticCheck.errors);
    warnings.push(...staticCheck.warnings);
    
    // If no errors, we're done
    if (errors.length === 0) {
      console.log(`[CodeValidator] Scene ${sceneIndex} passed validation`);
      return {
        valid: true,
        code: currentCode,
        errors: [],
        warnings,
        correctionsMade: allCorrections,
        validationTimeMs: Date.now() - startTime,
      };
    }
    
    // Log errors found
    console.log(`[CodeValidator] Scene ${sceneIndex} has ${errors.length} errors:`);
    errors.forEach(e => console.log(`  - ${e}`));
    
    // If AI correction is disabled or we've exhausted attempts, fail
    if (!enableAICorrection || correctionAttempts >= maxCorrections) {
      allErrors.push(...errors);
      allWarnings.push(...warnings);
      break;
    }
    
    // Attempt AI correction
    correctionAttempts++;
    console.log(`[CodeValidator] Attempting AI correction ${correctionAttempts}/${maxCorrections}`);
    
    const aiResult = await aiCodeReview(currentCode, errors, sceneIndex);
    
    if (aiResult.corrected && aiResult.code !== currentCode) {
      currentCode = aiResult.code;
      allCorrections.push(...aiResult.corrections);
      console.log(`[CodeValidator] AI corrected scene ${sceneIndex}, re-validating...`);
    } else {
      // AI couldn't fix it
      allErrors.push(...errors);
      allWarnings.push(...warnings);
      break;
    }
  }
  
  // Return with remaining errors
  return {
    valid: false,
    code: currentCode,
    errors: allErrors,
    warnings: allWarnings,
    correctionsMade: allCorrections,
    validationTimeMs: Date.now() - startTime,
  };
}

// ============================================================================
// Quick Validation (No AI)
// ============================================================================

/**
 * Quick validation without AI correction - for fast checks
 */
export function quickValidate(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation
  const basicValidation = validateSceneCode(code);
  errors.push(...basicValidation.errors);
  
  // TypeScript check
  const tsCheck = checkTypeScript(code);
  for (const tsError of tsCheck.errors) {
    errors.push(`TS${tsError.code}: ${tsError.message}`);
  }
  
  // Static analysis
  const staticCheck = staticAnalysis(code);
  errors.push(...staticCheck.errors);
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
