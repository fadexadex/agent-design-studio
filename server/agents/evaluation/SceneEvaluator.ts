/**
 * Scene Evaluator
 * 
 * Tier 1 evaluation: Analyzes individual scenes for quality, brand alignment,
 * and technical correctness. Uses Gemini for intelligent evaluation.
 */

import { GoogleGenAI } from '@google/genai';
import { BrandContext, SCORE_THRESHOLDS } from '../types.js';
import { SceneEvaluationDetails, calculateSceneScore } from './ScoreAggregator.js';
import { rateLimitedCall } from '../../core/agent/rateLimiter.js';

// ============================================================================
// Types
// ============================================================================

export interface SceneEvaluationInput {
  /** Project ID */
  projectId: string;
  
  /** Scene ID */
  sceneId: string;
  
  /** Scene index (0-based) */
  sceneIndex: number;
  
  /** Version being evaluated */
  version: number;
  
  /** Generated Remotion code */
  code: string;
  
  /** Path to rendered video (optional - if not rendered yet) */
  videoPath?: string;
  
  /** Brand context for alignment checking */
  brandContext: BrandContext;
  
  /** Scene description/prompt */
  sceneDescription?: string;
  
  /** Previous evaluation feedback (for context) */
  previousFeedback?: string;
}

export interface SceneEvaluationResult {
  /** Project ID */
  projectId: string;
  
  /** Scene ID */
  sceneId: string;
  
  /** Scene index */
  sceneIndex: number;
  
  /** Version that was evaluated */
  version: number;
  
  /** Overall score (0-1) */
  score: number;
  
  /** Whether the scene passes Tier 1 threshold */
  passed: boolean;
  
  /** Whether to escalate to Director */
  shouldEscalate: boolean;
  
  /** Reason for escalation if applicable */
  escalationReason?: 'max_attempts' | 'low_score' | 'diminishing_returns';
  
  /** Human-readable feedback for improvement */
  feedback: string;
  
  /** Detailed scores per category */
  details: SceneEvaluationDetails;
  
  /** Specific issues found */
  issues: SceneIssue[];
  
  /** Suggested improvements */
  suggestions: string[];
  
  /** Evaluation time in ms */
  evaluationTimeMs: number;
}

export interface SceneIssue {
  category: 'code' | 'visual' | 'brand' | 'technical';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumber?: number;
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
// Scene Evaluator Class
// ============================================================================

export class SceneEvaluator {
  private ai: GoogleGenAI;

  constructor(ai?: GoogleGenAI) {
    this.ai = ai || getAIClient();
  }

  /**
   * Evaluate a scene
   */
  async evaluate(input: SceneEvaluationInput): Promise<SceneEvaluationResult> {
    const startTime = Date.now();

    console.log(`[SceneEvaluator] Evaluating scene ${input.sceneIndex} v${input.version}`);

    // Build evaluation prompt
    const prompt = this.buildEvaluationPrompt(input);

    // Call Gemini for evaluation
    const response = await rateLimitedCall(() =>
      this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          // Gemini 3 best practice: use default temperature of 1.0
          temperature: 1.0,
          maxOutputTokens: 4096,
          // Use low thinking for faster evaluation
          thinkingConfig: {
            thinkingLevel: 'low',
          },
        },
      })
    );

    const responseText = response.text || '';
    
    // Parse the evaluation response
    const evaluation = this.parseEvaluationResponse(responseText, input);
    
    // Calculate overall score
    const score = calculateSceneScore(evaluation.details);
    
    // Determine if passed
    const passed = score >= SCORE_THRESHOLDS.SCENE_LOCAL_PASS;
    
    // Determine if should escalate
    const shouldEscalate = score < SCORE_THRESHOLDS.SCENE_ESCALATION_SCORE;
    
    const evaluationTimeMs = Date.now() - startTime;

    console.log(`[SceneEvaluator] Scene ${input.sceneIndex} score: ${(score * 100).toFixed(1)}% (${passed ? 'PASSED' : 'FAILED'})`);

    return {
      projectId: input.projectId,
      sceneId: input.sceneId,
      sceneIndex: input.sceneIndex,
      version: input.version,
      score,
      passed,
      shouldEscalate,
      escalationReason: shouldEscalate ? 'low_score' : undefined,
      feedback: evaluation.feedback,
      details: evaluation.details,
      issues: evaluation.issues,
      suggestions: evaluation.suggestions,
      evaluationTimeMs,
    };
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(input: SceneEvaluationInput): string {
    const { code, brandContext, sceneDescription, sceneIndex } = input;

    return `You are an expert motion graphics evaluator. Analyze this Remotion scene code and provide a detailed evaluation.

## SCENE CONTEXT
- Scene ${sceneIndex + 1}
- Brand: "${brandContext.name}"
- Industry: ${brandContext.industry || 'Technology'}
- Style: ${brandContext.style || 'dynamic'}
- Primary Color: ${brandContext.colors.primary}
${sceneDescription ? `- Description: ${sceneDescription}` : ''}

## CODE TO EVALUATE
\`\`\`tsx
${code}
\`\`\`

## EVALUATION CRITERIA

### 1. Code Quality (0-100)
- Clean, readable code structure
- Proper TypeScript types
- No code smells or anti-patterns
- Efficient animation logic
- Proper use of Remotion APIs

### 2. Visual Appeal (0-100)
- Creative and engaging motion design
- Smooth animations with proper easing
- Good use of timing and pacing
- Visual hierarchy and composition
- Professional polish

### 3. Brand Alignment (0-100)
- Correct use of brand colors
- Appropriate for the industry
- Matches the requested style
- Brand name/tagline properly featured (if applicable)
- Consistent with brand identity

### 4. Technical Correctness (0-100)
- Valid Remotion component structure
- Proper frame-based timing (uses fps, not hardcoded)
- Correct interpolation clamping
- No potential runtime errors
- Responsive to video dimensions

## RESPONSE FORMAT
Respond with ONLY a JSON object (no markdown code blocks):

{
  "codeQuality": <0-100>,
  "visualAppeal": <0-100>,
  "brandAlignment": <0-100>,
  "technicalCorrectness": <0-100>,
  "feedback": "<2-3 sentences summarizing the overall quality and main issues>",
  "issues": [
    {
      "category": "code|visual|brand|technical",
      "severity": "low|medium|high",
      "description": "<specific issue>",
      "lineNumber": <optional line number>
    }
  ],
  "suggestions": [
    "<specific actionable improvement suggestion>"
  ]
}`;
  }

  /**
   * Parse evaluation response from Gemini
   */
  private parseEvaluationResponse(
    responseText: string,
    input: SceneEvaluationInput
  ): {
    details: SceneEvaluationDetails;
    feedback: string;
    issues: SceneIssue[];
    suggestions: string[];
  } {
    try {
      // Try to extract JSON from response
      let jsonStr = responseText.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      // Parse JSON
      const parsed = JSON.parse(jsonStr);
      
      // Normalize scores to 0-1 range
      const normalize = (score: number): number => {
        const clamped = Math.max(0, Math.min(100, score));
        return clamped / 100;
      };

      return {
        details: {
          codeQuality: normalize(parsed.codeQuality || 50),
          visualAppeal: normalize(parsed.visualAppeal || 50),
          brandAlignment: normalize(parsed.brandAlignment || 50),
          technicalCorrectness: normalize(parsed.technicalCorrectness || 50),
        },
        feedback: parsed.feedback || 'No feedback provided',
        issues: (parsed.issues || []).map((issue: Record<string, unknown>) => ({
          category: issue.category || 'technical',
          severity: issue.severity || 'medium',
          description: issue.description || 'Unknown issue',
          lineNumber: issue.lineNumber,
        })),
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      console.warn('[SceneEvaluator] Failed to parse evaluation response:', error);
      
      // Return default scores if parsing fails
      return {
        details: {
          codeQuality: 0.5,
          visualAppeal: 0.5,
          brandAlignment: 0.5,
          technicalCorrectness: 0.5,
        },
        feedback: 'Evaluation parsing failed. Please review the code manually.',
        issues: [{
          category: 'technical',
          severity: 'medium',
          description: 'Could not parse AI evaluation response',
        }],
        suggestions: ['Consider regenerating the scene for better results'],
      };
    }
  }

  /**
   * Quick validation without AI (for pre-screening)
   */
  quickValidate(code: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for required imports
    if (!code.includes('remotion') && !code.includes('@/components')) {
      errors.push('Missing Remotion or component library import');
    }

    // Check for default export
    if (!code.includes('export default')) {
      errors.push('Missing default export');
    }

    // Check for frame-based timing
    if (!code.includes('useCurrentFrame') && !code.includes('frame')) {
      errors.push('No frame-based animation detected');
    }

    // Check for hardcoded frame numbers (bad practice)
    const hardcodedFrames = code.match(/\[\s*0\s*,\s*30\s*\]/g);
    if (hardcodedFrames && hardcodedFrames.length > 2) {
      errors.push('Too many hardcoded frame numbers - use fps for timing');
    }

    // Check for unclamped interpolations
    const interpolateCalls = code.match(/interpolate\s*\([^)]+\)/g) || [];
    const hasUnclampedInterpolate = interpolateCalls.some(
      call => !call.includes('extrapolateRight') && !call.includes('clamp')
    );
    if (hasUnclampedInterpolate && interpolateCalls.length > 0) {
      errors.push('Some interpolations may not be clamped');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate improvement feedback based on evaluation
   */
  generateImprovementFeedback(result: SceneEvaluationResult): string {
    const { details, issues, suggestions } = result;
    const lines: string[] = [];

    // Identify weakest area
    const scores = [
      { name: 'Code Quality', score: details.codeQuality },
      { name: 'Visual Appeal', score: details.visualAppeal },
      { name: 'Brand Alignment', score: details.brandAlignment },
      { name: 'Technical Correctness', score: details.technicalCorrectness },
    ].sort((a, b) => a.score - b.score);

    const weakest = scores[0];
    lines.push(`Focus on improving ${weakest.name} (currently ${(weakest.score * 100).toFixed(0)}%).`);

    // Add high-severity issues
    const highSeverityIssues = issues.filter(i => i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      lines.push('\nCritical issues to fix:');
      highSeverityIssues.forEach(issue => {
        lines.push(`- ${issue.description}`);
      });
    }

    // Add top suggestions
    if (suggestions.length > 0) {
      lines.push('\nKey improvements:');
      suggestions.slice(0, 3).forEach(suggestion => {
        lines.push(`- ${suggestion}`);
      });
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Exports
// ============================================================================

export function createSceneEvaluator(ai?: GoogleGenAI): SceneEvaluator {
  return new SceneEvaluator(ai);
}
