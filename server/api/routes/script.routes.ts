/**
 * Script Routes
 * 
 * API endpoints for script generation.
 */

import { Router } from 'express';
import { generateScript, transformScript, generateScriptLegacy } from '../../core/controllers';

const router = Router();

/**
 * POST /api/script/generate
 * Generate a story-driven script (30 seconds, 5-phase narrative)
 */
router.post('/generate', generateScript);

/**
 * POST /api/script/transform
 * Transform user plain text into a story-driven script
 */
router.post('/transform', transformScript);

export default router;
