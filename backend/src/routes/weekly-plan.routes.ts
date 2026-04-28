/**
 * WEEKLY PLAN ROUTES
 *
 * GET  /api/weekly-plan/active       — current plan with progress
 * POST /api/weekly-plan/:id/log      — log "did it today"
 * POST /api/weekly-plan/:id/swap     — swap one activity
 * GET  /api/weekly-plan/:id/summary  — weekly summary
 * POST /api/weekly-plan/:id/continue — choose next week mode
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  getActivePlan,
  logActivityCompletion,
  swapPlanActivity,
  buildWeeklySummary,
  setActivitiesContinuation,
} from '../services/weekly-plan.service';
import { getLatestBiomarkerState } from '../services/biomarker-state.service';
import { BIOMARKERS } from '../config/biomarkers.config';

const router = Router();

// ─── GET /active ──────────────────────────────────────────────────────────────
router.get('/active', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Auth required' }); return; }
    const plan = await getActivePlan(req.userId);
    if (!plan) { res.json({ plan: null }); return; }
    res.json({ plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:planActivityId/log ────────────────────────────────────────────────
router.post('/:planActivityId/log', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Auth required' }); return; }
    const result = await logActivityCompletion(req.params.planActivityId, req.userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:planActivityId/swap ───────────────────────────────────────────────
router.post('/:planActivityId/swap', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Auth required' }); return; }

    const biomarkerStates = await getLatestBiomarkerState(req.userId);
    const userBiomarkers = biomarkerStates
      .filter(s => s.value !== null && s.status !== null)
      .map(s => ({
        biomarker: s.biomarker,
        value: s.value!,
        unit: s.unit || BIOMARKERS[s.biomarker]?.unit || 'mg/dL',
        status: s.status!,
      }));

    const updated = await swapPlanActivity(req.params.planActivityId, req.userId, userBiomarkers);
    if (!updated) {
      res.status(400).json({ error: 'Cannot swap — already swapped or no alternatives available' });
      return;
    }
    res.json({ activity: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /:planId/summary ─────────────────────────────────────────────────────
router.get('/:planId/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Auth required' }); return; }

    const biomarkerStates = await getLatestBiomarkerState(req.userId);
    const userBiomarkers = biomarkerStates
      .filter(s => s.value !== null && s.status !== null)
      .map(s => ({
        biomarker: s.biomarker,
        value: s.value!,
        unit: s.unit || BIOMARKERS[s.biomarker]?.unit || 'mg/dL',
        status: s.status!,
      }));

    const summary = await buildWeeklySummary(req.params.planId, req.userId, userBiomarkers);
    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /:planId/continue ───────────────────────────────────────────────────
router.post('/:planId/continue', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Auth required' }); return; }

    const { mode, keep_activity_ids } = req.body as {
      mode: 'same' | 'new' | 'mixed';
      keep_activity_ids?: string[];
    };

    if (!['same', 'new', 'mixed'].includes(mode)) {
      res.status(400).json({ error: 'mode must be same | new | mixed' });
      return;
    }

    await setActivitiesContinuation(req.params.planId, req.userId, mode, keep_activity_ids);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
