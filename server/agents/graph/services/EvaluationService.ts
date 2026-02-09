import { GoogleGenAI } from '@google/genai';
import { rateLimitedCall } from '../../../core/agent/rateLimiter.js';
import { BrandContext, SCORE_THRESHOLDS } from '../../types.js';
import { SceneEvaluationDetails, calculateSceneScore } from '../../evaluation/ScoreAggregator.js';

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

export interface SceneEvaluationInput {
  projectId: string;
  sceneId: string;
  sceneIndex: number;
  version: number;
  code: string;
  videoPath?: string;
  brandContext: BrandContext;
  sceneDescription?: string;
  previousFeedback?: string;
}

export interface SceneIssue {
  category: 'code' | 'visual' | 'brand' | 'technical';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumber?: number;
}

export interface SceneEvaluationResult {
  score: number;
  passed: boolean;
  shouldEscalate: boolean;
  escalationReason?: 'max_attempts' | 'low_score' | 'diminishing_returns';
  feedback: string;
  details: SceneEvaluationDetails;
  issues: SceneIssue[];
  suggestions: string[];
  evaluationTimeMs: number;
}

export class EvaluationService {
  static async evaluateScene(input: SceneEvaluationInput): Promise<SceneEvaluationResult> {
    const startTime = Date.now();
    const ai = getAIClient();

    const prompt = this.buildEvaluationPrompt(input);

    const response = await rateLimitedCall(() =>
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 1.0,
          maxOutputTokens: 4096,
          thinkingConfig: {
            thinkingLevel: 'low' as any,
          },
        },
      })
    );

    const responseText = response.text || '';
    const evaluation = this.parseEvaluationResponse(responseText);

    const score = calculateSceneScore(evaluation.details);
    const passed = score >= SCORE_THRESHOLDS.SCENE_LOCAL_PASS;
    const shouldEscalate = score < SCORE_THRESHOLDS.SCENE_ESCALATION_SCORE;

    return {
      score,
      passed,
      shouldEscalate,
      escalationReason: shouldEscalate ? 'low_score' : undefined,
      feedback: evaluation.feedback,
      details: evaluation.details,
      issues: evaluation.issues,
      suggestions: evaluation.suggestions,
      evaluationTimeMs: Date.now() - startTime,
    };
  }

  private static buildEvaluationPrompt(input: SceneEvaluationInput): string {
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

  private static parseEvaluationResponse(
    responseText: string
  ): {
    details: SceneEvaluationDetails;
    feedback: string;
    issues: SceneIssue[];
    suggestions: string[];
  } {
    try {
      let jsonStr = responseText.trim();
      
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      const parsed = JSON.parse(jsonStr);
      
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
        issues: (parsed.issues || []).map((issue: any) => ({
          category: issue.category || 'technical',
          severity: issue.severity || 'medium',
          description: issue.description || 'Unknown issue',
          lineNumber: issue.lineNumber,
        })),
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      console.warn('Failed to parse evaluation response:', error);
      
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
}
