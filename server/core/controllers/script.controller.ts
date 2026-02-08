import { Request, Response } from 'express';
import { 
    generateStoryScript, 
    transformTextToStoryScript,
    generateScriptFromAI // Legacy support
} from '../services/script.service';

/**
 * POST /api/script/generate
 * Generate a story-driven video script using AI
 * Duration is fixed at 30 seconds
 */
export const generateScript = async (req: Request, res: Response) => {
    const { brand, config } = req.body;

    if (!brand || !config) {
        return res.status(400).json({ error: 'Missing brand or config data' });
    }

    try {
        const scriptData = await generateStoryScript(brand, config);
        res.json(scriptData);
    } catch (error: any) {
        console.error('[Script Controller] Error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to generate script. Please try again.'
        });
    }
};

/**
 * POST /api/script/transform
 * Transform user-provided plain text into a story-driven script
 * Duration is fixed at 30 seconds
 */
export const transformScript = async (req: Request, res: Response) => {
    const { text, brand, config } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Missing or empty text input' });
    }

    if (!brand || !config) {
        return res.status(400).json({ error: 'Missing brand or config data' });
    }

    try {
        const scriptData = await transformTextToStoryScript(text.trim(), brand, config);
        res.json(scriptData);
    } catch (error: any) {
        console.error('[Script Controller] Transform error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to transform script. Please try again.'
        });
    }
};

/**
 * POST /api/generate-script (Legacy endpoint)
 * @deprecated Use /api/script/generate instead
 * Generates script and returns in legacy format for backward compatibility
 */
export const generateScriptLegacy = async (req: Request, res: Response) => {
    const { brand, config, targetDuration } = req.body;

    if (!brand || !config) {
        return res.status(400).json({ error: 'Missing brand or config data' });
    }

    try {
        // Use legacy function which returns old format
        const scriptData = await generateScriptFromAI(brand, config, targetDuration);
        res.json(scriptData);
    } catch (error: any) {
        console.error('[Script Controller] Legacy error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to generate script. Please try again.'
        });
    }
};
