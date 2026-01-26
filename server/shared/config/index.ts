/**
 * Configuration Management
 * 
 * Centralized configuration loading and validation.
 */

import { config as dotenvConfig } from 'dotenv';

/**
 * Load environment variables
 */
export const loadConfig = (): void => {
    // Load from .env.local first
    dotenvConfig({ path: '.env.local' });

    // Validate required environment variables
    const requiredVars = ['GEMINI_API_KEY'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
        console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    }

    // Debug output
    console.log('🔑 GEMINI_API_KEY loaded:',
        process.env.GEMINI_API_KEY ? `Yes (length: ${process.env.GEMINI_API_KEY.length})` : 'No'
    );
};

/**
 * Get configuration values
 */
export const getConfig = () => ({
    port: parseInt(process.env.PORT || '3001', 10),
    geminiApiKey: process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
});

export type AppConfig = ReturnType<typeof getConfig>;
