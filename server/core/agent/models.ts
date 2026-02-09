/**
 * AI Model Configurations
 *
 * Rate Limits for gemini-3-flash-preview (our primary model):
 * - RPM: 5 requests per minute (12 seconds between calls minimum)
 * - TPM: 250K tokens per minute
 * - RPD: 20 requests per day
 *
 * We use gemini-3-flash-preview for all operations.
 */

export const AI_MODELS = {
    // Primary model for all operations
    SMART: 'gemini-3-flash-preview',

    // Same model for speed - keeps us within single model quota
    FAST: 'gemini-3-flash-preview',

    // Image generation specific model
    IMAGE: 'gemini-2.0-flash-preview-image-generation'
} as const;

/**
 * Rate limit configuration based on available quotas
 */
export const RATE_LIMITS = {
    // Requests per minute
    RPM: 60,
    // Minimum delay between requests in ms
    MIN_DELAY_MS: 500,
    // Tokens per minute
    TPM: 1000000,
    // Requests per day
    RPD: 2000,
} as const;

export type AIModelType = typeof AI_MODELS[keyof typeof AI_MODELS];
