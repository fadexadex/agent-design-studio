/**
 * Video Routes
 * 
 * API endpoints for video generation and retrieval.
 */

import { Router } from 'express';
import { generateVideo, getJobStatus, getVideo } from '../../core/controllers';

const router = Router();

/**
 * POST /api/video/generate
 * Start video generation for a script
 */
router.post('/generate', generateVideo);

/**
 * GET /api/video/status/:jobId
 * Get the status of a video generation job
 */
router.get('/status/:jobId', getJobStatus);

/**
 * GET /api/video/:jobId
 * Get the generated video file
 */
router.get('/:jobId', getVideo);

export default router;
