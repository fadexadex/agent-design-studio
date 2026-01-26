import { Request, Response } from 'express';
import { generateScriptFromAI } from '../services/script.service';

/**
 * POST /api/generate-script
 * Generate a video script using AI based on brand context and video config
 */
export const generateScript = async (req: Request, res: Response) => {
    const { brand, config, targetDuration = 45 } = req.body;

    if (!brand || !config) {
        return res.status(400).json({ error: 'Missing brand or config data' });
    }

    try {
        const scriptData = await generateScriptFromAI(brand, config, targetDuration);
        res.json(scriptData);
    } catch (error: any) {
        console.error('[Script Controller] Error:', error);

        const statusCode = error.message.includes('not configured') ? 500 : 500;
        return res.status(statusCode).json({
            error: error.message || 'Failed to generate script. Please try again.'
        });
    }
};
