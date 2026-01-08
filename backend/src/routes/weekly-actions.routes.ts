/**
 * WEEKLY ACTIONS ROUTES
 * 
 * Routes for weekly action management
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getDashboard,
  updateWeeklyActionProgress,
  getCurrentWeekActions
} from '../controllers/weekly-actions.controller';

const router = Router();

/**
 * GET /api/weekly-actions/dashboard
 * Returns complete dashboard with health score, biomarkers, and weekly actions
 */
router.get('/dashboard', authenticateToken, getDashboard);

/**
 * GET /api/weekly-actions/current
 * Gets current week's actions for the authenticated user
 */
router.get('/current', authenticateToken, getCurrentWeekActions);

/**
 * PATCH /api/weekly-actions/:weeklyActionId/progress
 * Updates progress for a specific weekly action
 */
router.patch('/:weeklyActionId/progress', authenticateToken, updateWeeklyActionProgress);

export default router;

