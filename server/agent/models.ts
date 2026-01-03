/**
 * AI Model Configurations
 * 
 * Based on Google's available models:
 * - Gemini 3 Pro (Preview): Most intelligent, best for complex reasoning.
 * - Gemini 2.5 Pro (Stable): State-of-the-art thinking model.
 * - Gemini 2.5 Flash: Best for speed and high volume.
 */

export const AI_MODELS = {
    // Use 3 Pro Preview for maximum intelligence and reasoning
    SMART: 'gemini-3-pro-preview',

    // Use 3 Flash Preview for superior speed/intelligence balance
    FAST: 'gemini-3-flash-preview',

    // Image generation specific model
    IMAGE: 'gemini-2.0-flash-preview-image-generation'
} as const;

export type AIModelType = typeof AI_MODELS[keyof typeof AI_MODELS];
