import { Request, Response } from 'express';
import {
    generateJobId,
    createJob,
    startVideoGeneration,
    getJob,
    formatJobStatus
} from '../services/video.service';

/**
 * POST /api/generate
 * Start video generation with brand context and video config
 */
export const generateVideo = async (req: Request, res: Response) => {
    const { brand, config } = req.body;

    if (!brand || !config) {
        return res.status(400).json({ error: 'Missing brand or config data' });
    }

    const jobId = generateJobId();
    createJob(jobId);

    // Start async generation (fire and forget)
    startVideoGeneration(jobId, brand, config);

    res.json({ jobId });
};

/**
 * GET /api/status/:jobId
 * Check the status of a generation job
 */
export const getJobStatus = (req: Request, res: Response) => {
    const { jobId } = req.params;
    const job = getJob(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json(formatJobStatus(job, jobId));
};

/**
 * GET /api/video/:jobId
 * Stream the rendered video file
 */
export const getVideo = (req: Request, res: Response) => {
    const { jobId } = req.params;
    const job = getJob(jobId);

    if (!job || !job.videoPath) {
        return res.status(404).json({ error: 'Video not found' });
    }

    res.sendFile(job.videoPath);
};
