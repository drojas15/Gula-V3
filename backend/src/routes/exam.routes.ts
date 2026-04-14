/**
 * EXAM ROUTES
 *
 * Handles exam upload and results retrieval
 */

import { Router, Response } from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { parsePDF, validatePDF } from '../services/pdf-parser.service';
import { parseFullText } from '../services/robust-biomarker-parser.service';
import { calculateHealthScoreWithAnalysis } from '../services/scoring-engine.service';
import { selectWeeklyActions } from '../services/weekly-actions.service';
import { saveWeeklyActions } from '../services/weekly-actions-db.service';
import { eventBus, LabResultsIngestedEvent } from '../events/event-bus';
import { query as dbQuery, queryOne, execute } from '../db/postgres';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/exams/upload
 * Uploads and processes a PDF exam
 */
router.post(
  '/upload',
  authenticateToken,
  upload.single('pdf'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const file = req.file;
      const validation = validatePDF(file as Express.Multer.File);

      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      // Parse PDF
      const parseResult = await parsePDF(file!.buffer);

      if (!parseResult.success || !parseResult.biomarkers) {
        res.status(400).json({
          error: parseResult.error || 'Failed to extract biomarkers from PDF'
        });
        return;
      }

      // CRITICAL: Get exam date from request body or extracted from PDF
      let examDate: Date;

      if (req.body.examDate) {
        examDate = new Date(req.body.examDate);
        if (isNaN(examDate.getTime())) {
          res.status(400).json({ error: 'Invalid exam date format' });
          return;
        }
      } else if (parseResult.examDate) {
        examDate = parseResult.examDate;
      } else {
        // No date found - require user input
        res.status(400).json({
          error: 'Exam date is required',
          requiresExamDate: true,
          biomarkers: parseResult.biomarkers, // Return biomarkers so frontend can show form
          parsedBiomarkers: parseResult.parsedBiomarkers // Include confidence levels for preview
        });
        return;
      }

      // Validate exam date is reasonable
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 10, 0, 1);
      const maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      if (examDate < minDate || examDate > maxDate) {
        res.status(400).json({ error: 'Exam date must be within the last 10 years and not in the future' });
        return;
      }

      // TODO: Save PDF to Supabase Storage and get URL

      const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const biomarkersJson = JSON.stringify(parseResult.biomarkers);
      const createdAt = new Date().toISOString();
      const examDateISO = examDate.toISOString();

      try {
        await execute(
          `INSERT INTO exams ("examId", "userId", "examDate", "createdAt", "healthScore", biomarkers)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [examId, req.userId!, examDateISO, createdAt, null, biomarkersJson]
        );

        // LOG: Exam saved
        const rows = await dbQuery<{ count: string }>(
          `SELECT COUNT(*) as count FROM exams WHERE "userId" = $1`,
          [req.userId!]
        );
        const totalExams = parseInt(rows[0]?.count || '0');
        console.log('✅ Examen guardado en PostgreSQL:', {
          examId,
          examDate: examDateISO.split('T')[0],
          userId: req.userId,
          totalExamsForUser: totalExams,
          storage: 'PostgreSQL (Supabase)'
        });
      } catch (error: any) {
        console.error('Error saving exam to PostgreSQL:', error);
        // Continue with processing even if DB write fails
      }

      // Emit LabResultsIngested event
      const event: LabResultsIngestedEvent = {
        type: 'LabResultsIngested',
        userId: req.userId!,
        examId,
        examDate,
        biomarkerValues: parseResult.biomarkers.map(b => ({
          biomarker: b.biomarker,
          value: b.value,
          unit: b.unit
        })),
        timestamp: new Date()
      };

      await eventBus.emit(event);

      // Calculate for immediate response
      const analysis = calculateHealthScoreWithAnalysis(parseResult.biomarkers);

      // Select weekly actions (max 3) based on biomarker analysis
      const weeklyActionsResult = await selectWeeklyActions(analysis.biomarkers, req.userId!);

      // Save weekly actions to database
      const savedActions = await saveWeeklyActions(
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

      // Update exam with health score
      try {
        await execute(
          `UPDATE exams SET "healthScore" = $1 WHERE "examId" = $2`,
          [analysis.totalScore, examId]
        );
        console.log('✅ Health score actualizado en PostgreSQL:', {
          examId,
          healthScore: analysis.totalScore
        });
      } catch (error: any) {
        console.error('Error updating health score in PostgreSQL:', error);
      }

      res.status(201).json({
        examId,
        userId: req.userId,
        examDate: examDate.toISOString().split('T')[0],
        healthScore: analysis.totalScore,
        parsedBiomarkers: (parseResult.parsedBiomarkers || []).map(p => ({
          biomarker: p.biomarker,
          value: p.value,
          unit: p.unit,
          confidence: p.confidence
        })),
        biomarkers: analysis.biomarkers.map(b => ({
          biomarker: b.biomarker,
          value: b.value,
          unit: b.unit,
          status: b.status,
          trafficLight: b.trafficLight,
          weight: b.weight,
          contribution: b.contribution,
          contribution_percentage: b.contribution_percentage,
          riskKey: b.riskKey,
          recommendationKeys: b.recommendationKeys
        })),
        priorities: analysis.priorities,
        weekly_actions: savedActions.map(action => ({
          id: action.id,
          action_id: action.action_id,
          category: action.category,
          weekly_target: action.weekly_target,
          success_metric: action.success_metric,
          impacted_biomarkers: action.impacted_biomarkers,
          difficulty: action.difficulty,
          progress: action.progress,
          completion_state: action.completion_state,
          week_start: action.week_start.toISOString().split('T')[0],
          week_end: action.week_end.toISOString().split('T')[0]
        })),
        primary_biomarker: weeklyActionsResult.primary_biomarker,
        week_start: weeklyActionsResult.week_start,
        week_end: weeklyActionsResult.week_end
      });
    } catch (error: any) {
      console.error('Error processing exam:', error);
      res.status(500).json({ error: error.message || 'Failed to process exam' });
    }
  }
);

/**
 * GET /api/exams/:examId
 * Retrieves exam results
 */
router.get('/:examId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { examId } = req.params;

    // CRITICAL: Fetch exam and verify it belongs to user (authorization check)
    const exam = await queryOne<any>(
      `SELECT * FROM exams WHERE "examId" = $1 AND "userId" = $2`,
      [examId, req.userId]
    );

    if (!exam) {
      res.status(404).json({ error: 'Exam not found or unauthorized' });
      return;
    }

    const biomarkers = JSON.parse(exam.biomarkers);

    const biomarkerHistory = await dbQuery<any>(
      `SELECT biomarker_code, value, status_at_time, unit
       FROM biomarker_result
       WHERE user_id = $1 AND exam_id = $2`,
      [req.userId, examId]
    );

    res.status(200).json({
      examId: exam.examId,
      userId: exam.userId,
      examDate: exam.examDate,
      healthScore: exam.healthScore,
      biomarkers,
      biomarkerHistory,
      createdAt: exam.createdAt
    });
  } catch (error: any) {
    console.error('[Exam] Error retrieving exam:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve exam' });
  }
});

/**
 * GET /api/exams
 * Lists all exams for the authenticated user
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const rows = await dbQuery<{
        examId: string;
        userId: string;
        examDate: string;
        createdAt: string;
        healthScore: number | null;
        biomarkers: string;
      }>(
        `SELECT * FROM exams WHERE "userId" = $1 ORDER BY "examDate" ASC`,
        [req.userId!]
      );

      const exams = rows.map(row => {
        let biomarkers;
        try {
          biomarkers = JSON.parse(row.biomarkers);
        } catch (e) {
          console.warn('Error parsing biomarkers JSON for exam:', row.examId);
          biomarkers = [];
        }

        return {
          examId: row.examId,
          examDate: row.examDate.split('T')[0],
          healthScore: row.healthScore,
          createdAt: row.createdAt,
          biomarkers
        };
      });

      console.log('📦 Exámenes devueltos desde PostgreSQL:', {
        userId: req.userId,
        totalExams: exams.length,
        storage: 'PostgreSQL (Supabase)',
        exams: exams.map(e => ({
          id: e.examId,
          date: e.examDate,
          healthScore: e.healthScore
        }))
      });

      res.status(200).json({ exams });
    } catch (error: any) {
      console.error('Error reading exams from PostgreSQL:', error);
      res.status(500).json({
        error: error.message || 'Failed to retrieve exams',
        exams: []
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve exams' });
  }
});

export default router;
