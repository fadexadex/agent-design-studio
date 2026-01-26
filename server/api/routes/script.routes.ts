/**
 * Script Routes
 * 
 * API endpoints for script generation.
 */

import { Router } from 'express';
import { generateScript } from '../../core/controllers';

const router = Router();

/**
 * POST /api/script/generate
 * Generate a script from a prompt
 */
router.post('/generate', generateScript);

export default router;
