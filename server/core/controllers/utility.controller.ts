import { Request, Response } from 'express';
import { getPreviewPath } from '../services/file.service';

/**
 * GET /api/preview/:filename
 * Stream scene preview video file
 */
export const getPreview = (req: Request, res: Response) => {
    const { filename } = req.params;

    const previewPath = getPreviewPath(filename);

    if (previewPath) {
        res.sendFile(previewPath);
    } else {
        res.status(404).json({ error: 'Preview not found' });
    }
};

/**
 * GET /api/health
 * Health check endpoint
 */
export const healthCheck = (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
