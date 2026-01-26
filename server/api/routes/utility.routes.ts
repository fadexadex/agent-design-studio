/**
 * Utility Routes
 * 
 * API endpoints for utility functions like health check and previews.
 */

import { Router } from 'express';
import { getPreview, healthCheck } from '../../core/controllers';

const router = Router();

/**
 * GET /api/utility/health
 * Health check endpoint
 */
router.get('/health', healthCheck);

/**
 * GET /api/utility/preview/:filename
 * Get a preview file
 */
router.get('/preview/:filename', getPreview);

export default router;
