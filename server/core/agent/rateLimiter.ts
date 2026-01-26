import { RATE_LIMITS } from './models';

/**
 * RateLimiter ensures API calls stay within Gemini rate limits.
 *
 * With 5 RPM limit, we need minimum 12 seconds between calls.
 * We use 13 seconds to add a safety buffer.
 */
class RateLimiter {
    private lastCallTime = 0;
    private callCount = 0;
    private windowStart = Date.now();

    /**
     * Wait if necessary to respect rate limits.
     * Returns a promise that resolves when it's safe to make a call.
     */
    async waitForSlot(): Promise<void> {
        const now = Date.now();

        // Reset window every minute
        if (now - this.windowStart >= 60000) {
            this.windowStart = now;
            this.callCount = 0;
        }

        // Check if we've hit RPM limit
        if (this.callCount >= RATE_LIMITS.RPM) {
            const waitTime = 60000 - (now - this.windowStart);
            if (waitTime > 0) {
                console.log(`[RateLimiter] RPM limit reached, waiting ${waitTime}ms`);
                await this.delay(waitTime);
                this.windowStart = Date.now();
                this.callCount = 0;
            }
        }

        // Ensure minimum delay between calls
        const elapsed = now - this.lastCallTime;
        if (elapsed < RATE_LIMITS.MIN_DELAY_MS) {
            const waitTime = RATE_LIMITS.MIN_DELAY_MS - elapsed;
            console.log(`[RateLimiter] Throttling, waiting ${waitTime}ms`);
            await this.delay(waitTime);
        }

        this.lastCallTime = Date.now();
        this.callCount++;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance for global rate limiting across all phases
export const rateLimiter = new RateLimiter();

/**
 * Retry configuration for exponential backoff
 */
interface RetryConfig {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
}

/**
 * Execute a function with exponential backoff retry on rate limit errors.
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns The result of the function
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelayMs = 5000,
        maxDelayMs = 60000
    } = config;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Wait for rate limit slot before attempting
            await rateLimiter.waitForSlot();
            return await fn();
        } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if it's a rate limit error
            const errorMessage = lastError.message || '';
            const isRateLimitError =
                errorMessage.includes('429') ||
                errorMessage.includes('RESOURCE_EXHAUSTED') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('rate') ||
                (error as { status?: number })?.status === 429;

            if (!isRateLimitError) {
                // Not a rate limit error, don't retry
                throw lastError;
            }

            if (attempt === maxRetries) {
                console.error(`[withRetry] Max retries (${maxRetries}) exceeded`);
                throw lastError;
            }

            // Calculate exponential backoff with jitter
            const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
            const jitter = Math.random() * 1000;
            const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

            console.log(
                `[withRetry] Rate limit hit, attempt ${attempt + 1}/${maxRetries + 1}, ` +
                `waiting ${Math.round(delay)}ms before retry`
            );

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('withRetry failed with unknown error');
}

/**
 * Execute a rate-limited API call with automatic retry.
 * This is the main function phases should use for Gemini API calls.
 */
export async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
    return withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 5000,
        maxDelayMs: 60000
    });
}
