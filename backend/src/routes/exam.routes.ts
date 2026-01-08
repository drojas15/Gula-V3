/**
 * EXAM ROUTES
 * 
 * Handles exam upload and results retrieval
 */

import { Router, Response } from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { parsePDF, validatePDF } from '../services/pdf-parser.service';
import { calculateHealthScoreWithAnalysis } from '../services/scoring-engine.service';
import { selectWeeklyActions } from '../services/weekly-actions.service';
import { saveWeeklyActions } from '../services/weekly-actions-db.service';
import { eventBus, LabResultsIngestedEvent } from '../events/event-bus';
import { db } from '../db/sqlite';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// PASO 3: Prepared statements for SQLite (better performance)
const insertExam = db.prepare(`
  INSERT INTO exams (examId, userId, examDate, createdAt, healthScore, biomarkers)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const updateExamHealthScore = db.prepare(`
  UPDATE exams 
  SET healthScore = ?
  WHERE examId = ?
`);

const getExamsByUser = db.prepare(`
  SELECT * FROM exams
  WHERE userId = ?
  ORDER BY examDate ASC
`);

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
      // If not found in PDF, frontend MUST provide it
      let examDate: Date;
      
      if (req.body.examDate) {
        // User provided date (manual input or from frontend)
        examDate = new Date(req.body.examDate);
        if (isNaN(examDate.getTime())) {
          res.status(400).json({ error: 'Invalid exam date format' });
          return;
        }
      } else if (parseResult.examDate) {
        // Date extracted from PDF
        examDate = parseResult.examDate;
      } else {
        // No date found - require user input
        res.status(400).json({ 
          error: 'Exam date is required',
          requiresExamDate: true,
          biomarkers: parseResult.biomarkers // Return biomarkers so frontend can show form
        });
        return;
      }

      // Validate exam date is reasonable
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 10, 0, 1); // 10 years ago
      const maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      
      if (examDate < minDate || examDate > maxDate) {
        res.status(400).json({ error: 'Exam date must be within the last 10 years and not in the future' });
        return;
      }

      // TODO: Save PDF to storage (S3, local, etc.) and get URL
      const pdfUrl = `uploads/${req.userId}/${Date.now()}.pdf`;

      // TODO: Create exam record in database with status 'processing'
      // CRITICAL: Each upload creates a NEW exam record (no overwrite)
      // examId must be unique per exam
      const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // PASO 3: Save exam to SQLite (WRITE)
      // Store biomarkers as JSON string for now (will be normalized later)
      const biomarkersJson = JSON.stringify(parseResult.biomarkers);
      const createdAt = new Date().toISOString();
      const examDateISO = examDate.toISOString();
      
      try {
        insertExam.run(
          examId,
          req.userId!,
          examDateISO,
          createdAt,
          null, // healthScore will be updated after analysis
          biomarkersJson
        );
        
        // LOG: Exam saved (POST-ANALYSIS)
        const totalExams = getExamsByUser.all(req.userId!).length;
        console.log('✅ Examen guardado en SQLite:', {
          examId,
          examDate: examDateISO.split('T')[0],
          userId: req.userId,
          totalExamsForUser: totalExams,
          storage: 'SQLite (persistent)'
        });
      } catch (error: any) {
        console.error('Error saving exam to SQLite:', error);
        // Continue with processing even if DB write fails (graceful degradation)
      }

      // Emit LabResultsIngested event
      // This triggers:
      // 1. Biomarker evaluation
      // 2. Health score calculation
      // 3. Trend analysis
      // 4. Weekly actions generation
      const event: LabResultsIngestedEvent = {
        type: 'LabResultsIngested',
        userId: req.userId!,
        examId,
        examDate, // CRITICAL: Pass exam date to event handler
        biomarkerValues: parseResult.biomarkers.map(b => ({
          biomarker: b.biomarker,
          value: b.value,
          unit: b.unit
        })),
        timestamp: new Date()
      };

      await eventBus.emit(event);

      // Calculate for immediate response (event handler does async work)
      const analysis = calculateHealthScoreWithAnalysis(parseResult.biomarkers);

      // Select weekly actions (max 3) based on biomarker analysis
      // Includes 14-day check internally
      const weeklyActionsResult = await selectWeeklyActions(analysis.biomarkers, req.userId!);

      // Save weekly actions to database (mandatory query A)
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

      // TODO: Save biomarker values to database (normalized table)
      // TODO: Save score to database (scores table)
      // TODO: Update exam status to 'completed' and set healthScore
      
      // PASO 3: Update exam with health score in SQLite
      try {
        updateExamHealthScore.run(analysis.totalScore, examId);
        console.log('✅ Health score actualizado en SQLite:', {
          examId,
          healthScore: analysis.totalScore
        });
      } catch (error: any) {
        console.error('Error updating health score in SQLite:', error);
        // Continue even if update fails
      }

      res.status(201).json({
        examId,
        userId: req.userId,
        examDate: examDate.toISOString().split('T')[0], // YYYY-MM-DD format
        healthScore: analysis.totalScore,
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

    // TODO: Fetch exam from database
    // TODO: Verify exam belongs to user
    // TODO: Fetch biomarker values
    // TODO: Fetch score
    
    // For now, return mock data structure that matches ExamResult interface
    // This should be replaced with actual database query
    res.status(200).json({
      examId,
      userId: req.userId,
      healthScore: 0,
      biomarkers: [],
      priorities: []
    });
  } catch (error: any) {
    console.error('[Exam] Error retrieving exam:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve exam' });
  }
});

/**
 * GET /api/exams
 * Lists all exams for the authenticated user
 * 
 * Returns array of exams with examDate for comparison detection
 * 
 * Example response:
 * {
 *   exams: [
 *     { examId: "1", examDate: "2025-03-10", biomarkers: [...] },
 *     { examId: "2", examDate: "2025-06-15", biomarkers: [...] }
 *   ]
 * }
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // PASO 4: Read exams from SQLite (READ)
    try {
      const rows = getExamsByUser.all(req.userId!) as Array<{
        examId: string;
        userId: string;
        examDate: string;
        createdAt: string;
        healthScore: number | null;
        biomarkers: string;
      }>;
      
      // Parse biomarkers JSON and format response
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
          examDate: row.examDate.split('T')[0], // YYYY-MM-DD
          healthScore: row.healthScore,
          createdAt: row.createdAt,
          biomarkers // Include for compatibility
        };
      });
      
      // LOG: Exams returned (VERIFY LISTADO)
      console.log('📦 Exámenes devueltos desde SQLite:', {
        userId: req.userId,
        totalExams: exams.length,
        storage: 'SQLite (persistent)',
        exams: exams.map(e => ({
          id: e.examId,
          date: e.examDate,
          healthScore: e.healthScore
        }))
      });
      
      // CRITICAL: Each exam must have examDate (not uploadedAt)
      res.status(200).json({
        exams
      });
    } catch (error: any) {
      console.error('Error reading exams from SQLite:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to retrieve exams',
        exams: [] // Return empty array on error
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve exams' });
  }
});

export default router;

