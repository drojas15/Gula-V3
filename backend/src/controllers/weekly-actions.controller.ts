/**
 * WEEKLY ACTIONS CONTROLLER
 * 
 * Handles weekly action selection, progress tracking, and dashboard data
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateHealthScoreWithAnalysis, BiomarkerValue } from '../services/scoring-engine.service';
import { BiomarkerKey } from '../config/biomarkers.config';
import { 
  updateWeeklyActionProgress as updateProgressInDB,
  getActiveWeeklyActions
} from '../services/weekly-actions-db.service';

/**
 * GET /api/weekly-actions/dashboard
 * 
 * Returns weekly dashboard data answering 3 questions:
 * 1. How is my health right now? (health_score)
 * 2. What should I focus on THIS WEEK? (weekly_actions)
 * 3. Am I improving or not? (trends)
 * 
 * Deterministic, explainable, simple.
 */
export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // ========================================
    // PASO 1: Get ALL exams from database
    // ========================================
    const { query: dbQuery } = await import('../db/postgres');
    const examsRows = await dbQuery<{
      examId: string;
      userId: string;
      examDate: string;
      createdAt: string;
      healthScore: number | null;
      biomarkers: string;
    }>(
      `SELECT * FROM exams WHERE "userId" = $1 ORDER BY "examDate" ASC`,
      [req.userId]
    );
    
    // Parse biomarkers and create exams array
    interface ExamData {
      examId: string;
      examDate: string;
      healthScore: number | null;
      biomarkers: Array<{ biomarker: string; value: number }>;
    }
    
    const exams: ExamData[] = examsRows.map(row => {
      let biomarkers: Array<{ biomarker: string; value: number }> = [];
      try {
        biomarkers = JSON.parse(row.biomarkers);
      } catch (e) {
        console.warn('Error parsing biomarkers JSON for exam:', row.examId);
      }
      
      return {
        examId: row.examId,
        examDate: row.examDate.split('T')[0], // YYYY-MM-DD
        healthScore: row.healthScore,
        biomarkers
      };
    });
    
    // ========================================
    // PASO 2: Determine hasBaseline ONLY from exams count and dates
    // RULE: hasBaseline = true IF AND ONLY IF:
    //   - exams.length >= 2
    //   - At least 2 DISTINCT exam dates exist
    // ========================================
    const sortedExams = [...exams].sort(
      (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
    );
    
    const uniqueDates = new Set(sortedExams.map(e => e.examDate));
    const hasBaseline = uniqueDates.size >= 2;
    
    // DEBUG LOG (TEMPORAL - OBLIGATORIO)
    console.log('🔍 [Dashboard] Baseline detection:', {
      examsCount: exams.length,
      examDates: sortedExams.map(e => e.examDate),
      uniqueDatesCount: uniqueDates.size,
      hasBaseline,
      userId: req.userId
    });
    
    // ========================================
    // PASO 3: Get comparison pair (latest vs previous)
    // ========================================
    let currentExam: ExamData | null = null;
    let previousExam: ExamData | null = null;
    
    if (sortedExams.length > 0) {
      currentExam = sortedExams[sortedExams.length - 1];
    }
    
    if (sortedExams.length > 1) {
      previousExam = sortedExams[sortedExams.length - 2];
    }
    
    // If no exams, return empty dashboard
    if (!currentExam) {
      res.json({
        health_score: 0,
        score_trend: 'STABLE',
        biomarkers: [],
        weekly_actions: [],
        hasBaseline: false,
        baselineDate: null
      });
      return;
    }
    
    // ========================================
    // PASO 4: Calculate health scores
    // ========================================
    const currentBiomarkerValues: BiomarkerValue[] = currentExam.biomarkers.map(b => ({
      biomarker: b.biomarker as BiomarkerKey,
      value: b.value,
      unit: 'mg/dL' // TODO: Get actual unit from config
    }));
    
    const currentAnalysis = calculateHealthScoreWithAnalysis(currentBiomarkerValues);
    
    const previousScore = previousExam?.healthScore || null;
    const previousBiomarkers = previousExam?.biomarkers.map(b => ({
      biomarker: b.biomarker as BiomarkerKey,
      value: b.value
    })) || null;

    // Get current week's actions
    const currentWeekActions = await getActiveWeeklyActions(req.userId, new Date());

    // If no actions for current week, generate them
    let weeklyActions: any[] = currentWeekActions;
    if (weeklyActions.length === 0) {
      const { selectWeeklyActions } = await import('../services/weekly-actions.service');
      const weeklyActionsResult = await selectWeeklyActions(currentAnalysis.biomarkers, req.userId);
      const { saveWeeklyActions } = await import('../services/weekly-actions-db.service');
      weeklyActions = await saveWeeklyActions(
        weeklyActionsResult.actions.map(action => ({
          user_id: req.userId!,
          action_id: action.action_id,
          category: action.category,
          weekly_target: action.weekly_target,
          success_metric: action.success_metric,
          impacted_biomarkers: action.impacted_biomarkers,
          difficulty: action.difficulty,
          week_start: new Date(action.week_start),
          week_end: new Date(action.week_end)
        }))
      );
    }

    // ========================================
    // PASO 5: Build dashboard with userId and exams array
    // ========================================
    const { buildDashboardData } = await import('../services/dashboard.service');
    const dashboardData = await buildDashboardData(
      req.userId!, // Pass userId for independent biomarker state
      currentAnalysis.biomarkers,
      currentAnalysis.totalScore,
      previousScore,
      previousBiomarkers,
      weeklyActions,
      exams // Pass all exams for baseline calculation
    );

    res.json(dashboardData);
  } catch (error: any) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to get dashboard data' });
  }
}

/**
 * PATCH /api/weekly-actions/:weeklyActionId/progress
 * Updates progress for a weekly action
 */
export async function updateWeeklyActionProgress(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { weeklyActionId } = req.params;
    const { progress } = req.body;

    // Frontend only sends numbers. Backend decides state.
    if (progress === undefined || typeof progress !== 'number') {
      res.status(400).json({ error: 'progress (number) is required' });
      return;
    }

    // Clamp progress to 0-100
    const progressValue = Math.max(0, Math.min(100, Number(progress)));

    // Update progress (mandatory query C)
    // Backend automatically determines completion_state
    // CRITICAL: Pass userId to validate ownership
    const updatedAction = await updateProgressInDB(weeklyActionId, progressValue, req.userId);

    res.json({
      id: updatedAction.id,
      progress: updatedAction.progress,
      completion_state: updatedAction.completion_state,
      message: 'Progress updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating action progress:', error);
    res.status(500).json({ error: error.message || 'Failed to update action progress' });
  }
}

/**
 * GET /api/weekly-actions/current
 * Gets current week's actions for the user
 */
export async function getCurrentWeekActions(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { query: dbQuery } = await import('../db/postgres');
    const currentDate = new Date().toISOString().split('T')[0];

    // CRITICAL: Filter by user_id to ensure data isolation
    const actions = await dbQuery<any>(
      `SELECT * FROM weekly_action_instances
       WHERE user_id = $1
         AND week_start <= $2
         AND week_end >= $3`,
      [req.userId, currentDate, currentDate]
    );

    // Parse JSON fields
    const parsedActions = actions.map(action => ({
      ...action,
      impacted_biomarkers: JSON.parse(action.impacted_biomarkers)
    }));

    res.json({
      actions: parsedActions
    });
  } catch (error: any) {
    console.error('Error getting current week actions:', error);
    res.status(500).json({ error: error.message || 'Failed to get current week actions' });
  }
}

