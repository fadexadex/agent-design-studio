/**
 * Gemini Thought Extraction Utilities
 *
 * This module provides utilities for extracting thought summaries and thought signatures
 * from Gemini API responses.
 *
 * Key concepts from Google's documentation:
 *
 * 1. **Thought Summaries** (`part.thought` = true): Human-readable summaries of the model's
 *    internal reasoning process. These can be displayed to users to show how the model
 *    is thinking. Enable with `includeThoughts: true` in the request config.
 *
 * 2. **Thought Signatures** (`part.thoughtSignature`): Encrypted, opaque representations
 *    of the model's thought process. These MUST be passed back in multi-turn conversations
 *    to maintain reasoning context. Required for Gemini 3 function calling.
 *
 * @see https://ai.google.dev/gemini-api/docs/thinking
 * @see https://ai.google.dev/gemini-api/docs/thought-signatures
 */

import { GenerateContentResponse, Part } from '@google/genai';

/**
 * Result of extracting thoughts from a Gemini response.
 */
export interface GeminiThoughtExtraction {
  /**
   * The main text content from the response (non-thought parts).
   */
  text: string;

  /**
   * Human-readable thought summary from the model.
   * Available when `includeThoughts: true` is set in the request.
   */
  thoughtSummary?: string;

  /**
   * Opaque thought signature for maintaining context across turns.
   * Must be passed back to the API in subsequent requests.
   */
  thoughtSignature?: string;
}

/**
 * Extract thoughts, text, and thought signatures from a Gemini response.
 *
 * @param response - The GenerateContentResponse from Gemini API
 * @returns Extracted thoughts, text, and signatures
 *
 * @example
 * ```typescript
 * const response = await ai.models.generateContent({
 *   model: 'gemini-2.5-flash',
 *   contents: [{ role: 'user', parts: [{ text: prompt }] }],
 *   config: {
 *     thinkingConfig: { includeThoughts: true }
 *   }
 * });
 *
 * const { text, thoughtSummary, thoughtSignature } = extractGeminiThoughts(response);
 *
 * if (thoughtSummary) {
 *   console.log('Model thinking:', thoughtSummary);
 * }
 * ```
 */
export function extractGeminiThoughts(response: GenerateContentResponse): GeminiThoughtExtraction {
  const result: GeminiThoughtExtraction = {
    text: '',
    thoughtSummary: undefined,
    thoughtSignature: undefined,
  };

  console.log('[extractGeminiThoughts] Starting extraction...');
  console.log('[extractGeminiThoughts] Response type:', typeof response);
  console.log('[extractGeminiThoughts] Response keys:', response ? Object.keys(response) : 'null');

  // Access the raw response structure
  const candidates = response.candidates;
  console.log('[extractGeminiThoughts] Candidates:', {
    hasCandidates: !!candidates,
    candidateCount: candidates?.length || 0,
  });
  
  if (!candidates || candidates.length === 0) {
    // Fallback to simple text accessor
    console.log('[extractGeminiThoughts] No candidates, falling back to response.text');
    console.log('[extractGeminiThoughts] response.text:', response.text ? `${response.text.substring(0, 100)}...` : '(empty/undefined)');
    result.text = response.text || '';
    return result;
  }

  const content = candidates[0].content;
  console.log('[extractGeminiThoughts] Candidate content:', {
    hasContent: !!content,
    hasParts: !!content?.parts,
    partsCount: content?.parts?.length || 0,
    finishReason: candidates[0].finishReason,
  });
  
  if (!content || !content.parts) {
    console.log('[extractGeminiThoughts] No content/parts, falling back to response.text');
    result.text = response.text || '';
    return result;
  }

  const textParts: string[] = [];
  const thoughtParts: string[] = [];

  for (let i = 0; i < content.parts.length; i++) {
    const part = content.parts[i];
    console.log(`[extractGeminiThoughts] Part ${i}:`, {
      hasText: !!part.text,
      textLength: part.text?.length || 0,
      isThought: (part as any).thought,
      hasThoughtSignature: !!(part as any).thoughtSignature,
      partKeys: Object.keys(part),
    });
    
    // Extract thought signature from any part (usually on the last or first function call part)
    if ((part as any).thoughtSignature) {
      result.thoughtSignature = (part as any).thoughtSignature;
    }

    // Check if this is a thought part (model's thinking summary)
    if ((part as any).thought === true && part.text) {
      thoughtParts.push(part.text);
    } else if (part.text) {
      // Regular text part
      textParts.push(part.text);
    }
  }

  result.text = textParts.join('\n');
  result.thoughtSummary = thoughtParts.length > 0 ? thoughtParts.join('\n') : undefined;

  console.log('[extractGeminiThoughts] Final result:', {
    textLength: result.text.length,
    textPreview: result.text.substring(0, 100) || '(empty)',
    hasThoughtSummary: !!result.thoughtSummary,
    hasThoughtSignature: !!result.thoughtSignature,
  });

  return result;
}

/**
 * Configuration for Gemini API requests with thinking enabled.
 *
 * Use this to get the recommended config for enabling thought summaries.
 */
export function getThinkingConfig(options: {
  /** Enable thought summaries in the response */
  includeThoughts?: boolean;
  /** Thinking level for Gemini 3 models: 'low', 'medium', 'high' */
  thinkingLevel?: 'low' | 'medium' | 'high' | 'minimal';
  /** Thinking budget for Gemini 2.5 models (token count, -1 for dynamic) */
  thinkingBudget?: number;
} = {}) {
  const { includeThoughts = true, thinkingLevel, thinkingBudget } = options;

  const config: any = {};

  if (includeThoughts || thinkingLevel || thinkingBudget !== undefined) {
    config.thinkingConfig = {};

    if (includeThoughts) {
      config.thinkingConfig.includeThoughts = true;
    }

    if (thinkingLevel) {
      config.thinkingConfig.thinkingLevel = thinkingLevel;
    }

    if (thinkingBudget !== undefined) {
      config.thinkingConfig.thinkingBudget = thinkingBudget;
    }
  }

  return config;
}

/**
 * Format a thought summary for display, handling long summaries gracefully.
 *
 * @param thoughtSummary - The raw thought summary from Gemini
 * @param maxLength - Maximum characters to display (default 500)
 * @returns Formatted thought summary
 */
export function formatThoughtSummary(thoughtSummary: string, maxLength: number = 500): string {
  if (!thoughtSummary) return '';

  // Clean up the summary
  let formatted = thoughtSummary.trim();

  // Truncate if too long
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength) + '...';
  }

  return formatted;
}
