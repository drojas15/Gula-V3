/**
 * BIOMARKER HISTORY ROUTES
 * 
 * Routes for biomarker history and graph data
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getBiomarkerHistory,
  getAllBiomarkersHistory
} from '../controllers/biomarker-history.controller';

const router = Router();

/**
 * GET /api/biomarkers/:biomarker/history
 * Gets history for a specific biomarker
 */
router.get('/:biomarker/history', authenticateToken, getBiomarkerHistory);

/**
 * GET /api/biomarkers/history
 * Gets history for all biomarkers
 */
router.get('/history', authenticateToken, getAllBiomarkersHistory);

export default router;

