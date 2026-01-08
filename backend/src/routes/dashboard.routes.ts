/**
 * DASHBOARD ROUTES
 * 
 * Routes for dashboard data
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getDashboard } from '../controllers/weekly-actions.controller';

const router = Router();

/**
 * GET /api/dashboard
 * Returns complete dashboard with health score, biomarkers, and weekly actions
 */
router.get('/', authenticateToken, getDashboard);

export default router;
