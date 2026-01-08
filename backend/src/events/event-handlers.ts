/**
 * EVENT HANDLERS
 * 
 * Handles events that trigger health score recalculation.
 * 
 * Events that trigger recalculation:
 * 1. LabResultsIngested - New exam uploaded
 * 2. BiomarkerValueEdited - Manual correction
 * 3. MonthlyHealthSnapshot - Monthly cycle closure
 */

import { eventBus, LabResultsIngestedEvent, BiomarkerValueEditedEvent, MonthlyHealthSnapshotEvent } from './event-bus';
import { evaluateBiomarkers } from '../services/biomarker-evaluator.service';
import { calculateHealthScore } from '../services/health-score-calculator.service';
import { analyzeBiomarkerTrends, analyzeScoreTrend } from '../services/trend-analyzer.service';
import { selectWeeklyActions } from '../services/weekly-actions.service';
import { BiomarkerKey, BIOMARKERS, MULTIPLIERS, TRAFFIC_LIGHT_MAP } from '../config/biomarkers.config';
import { RECOMMENDATION_KEYS, getRiskKey } from '../config/recommendations.config';
import { db } from '../db/sqlite';

/**
 * Handles LabResultsIngested event
 * 
 * This is event #1, the most important.
 * 
 * What happens:
 * 1. Parse values
 * 2. Recalculate states (optimal / good / out of range / critical)
 * 3. Recalculate score
 * 4. Recalculate trends
 * 5. Reset Weekly Action Engine
 * 
 * UX: "Nuevo examen recibido → Score actualizado"
 */
async function handleLabResultsIngested(event: LabResultsIngestedEvent): Promise<void> {
  console.log(`[Event] LabResultsIngested for user ${event.userId}, exam ${event.examId}`, {
    examDate: event.examDate.toISOString().split('T')[0],
    biomarkersCount: event.biomarkerValues.length
  });

  try {
    // 1. Evaluate biomarkers (determine status)
    const evaluations = evaluateBiomarkers(event.biomarkerValues);

    // 2. Calculate health score
    const scoreResult = calculateHealthScore(evaluations);

    // REGLA DE ORO: Save biomarker_result (HISTORICAL - IMMUTABLE)
    // - NUNCA se actualiza
    // - NUNCA se reemplaza
    // - SOLO INSERT
    // 
    // Prepared statement for INSERT (never UPDATE/REPLACE)
    const insertBiomarkerResult = db.prepare(`
      INSERT INTO biomarker_result (
        id, user_id, exam_id, biomarker_code, exam_date,
        value, unit, status_at_time, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const examDateISO = event.examDate.toISOString();
    const createdAtISO = new Date().toISOString();
    
    // Insert each biomarker evaluation as a NEW historical record
    // UNIQUE constraint (user_id, biomarker_code, exam_date) prevents duplicates
    // but allows multiple exams with different dates
    for (const evaluation of evaluations) {
      const biomarkerResultId = `br_${event.examId}_${evaluation.biomarker}_${Date.now()}`;
      
      try {
        insertBiomarkerResult.run(
          biomarkerResultId,
          event.userId,
          event.examId,
          evaluation.biomarker,
          examDateISO,
          evaluation.value,
          evaluation.unit,
          evaluation.status,
          createdAtISO
        );
      } catch (error: any) {
        // If UNIQUE constraint violation, it means this exact (user, biomarker, date) already exists
        // This should not happen in normal flow, but log it for debugging
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          console.warn(`[Event] Duplicate biomarker_result skipped:`, {
            userId: event.userId,
            biomarker: evaluation.biomarker,
            examDate: examDateISO.split('T')[0],
            examId: event.examId
          });
        } else {
          console.error(`[Event] Error saving biomarker_result:`, error);
        }
      }
    }
    
    // LOG OBLIGATORIO: After each upload, log biomarker results saved
    const getBiomarkerCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM biomarker_result
      WHERE user_id = ? AND biomarker_code = ?
    `);
    
    console.log('✅ Biomarker results guardados en SQLite (HISTÓRICO):');
    for (const evaluation of evaluations) {
      const countResult = getBiomarkerCount.get(event.userId, evaluation.biomarker) as { count: number };
      console.log('  -', {
        user_id: event.userId,
        biomarker_code: evaluation.biomarker,
        exam_date: examDateISO.split('T')[0],
        value: evaluation.value,
        status_at_time: evaluation.status,
        total_rows_for_biomarker: countResult.count
      });
    }

    // 3. Get previous exam for trend analysis
    // TODO: Query database for previous exam
    const previousValues = null; // Placeholder

    // 4. Analyze trends
    const biomarkerTrends = analyzeBiomarkerTrends(
      event.biomarkerValues.map(bv => ({
        biomarker: bv.biomarker as BiomarkerKey,
        value: bv.value
      })),
      previousValues
    );

    // TODO: Get previous score from database
    const previousScore = null;
    const scoreTrend = analyzeScoreTrend(scoreResult.score, previousScore);
    // Note: scoreTrend is calculated but not used yet (for future use)

    // 5. Reset Weekly Action Engine
    // Convert evaluations to AnalyzedBiomarker format for action selection
    const analyzedBiomarkers = evaluations.map(evaluation => {
      const config = BIOMARKERS[evaluation.biomarker];
      const multiplier = MULTIPLIERS[evaluation.status];
      
      return {
        biomarker: evaluation.biomarker,
        value: evaluation.value,
        unit: evaluation.unit,
        status: evaluation.status,
        trafficLight: TRAFFIC_LIGHT_MAP[evaluation.status],
        weight: config.weight,
        contribution: config.weight * multiplier,
        contribution_percentage: 0, // Calculated separately
        riskKey: getRiskKey(evaluation.biomarker, evaluation.status),
        recommendationKeys: RECOMMENDATION_KEYS[evaluation.biomarker][evaluation.status] || []
      };
    });

    await selectWeeklyActions(analyzedBiomarkers, event.userId);

    console.log(`[Event] Health score recalculated: ${scoreResult.score}`);
  } catch (error) {
    console.error(`[Event] Error handling LabResultsIngested:`, error);
    throw error;
  }
}

/**
 * Handles BiomarkerValueEdited event
 * 
 * Case: User corrects a misparsed value, changes unit, or uploads new PDF for same exam.
 * 
 * What happens:
 * 1. Recalculate only the affected biomarker
 * 2. Recalculate score
 * 3. Recalculate trend ONLY if previous value changed
 */
async function handleBiomarkerValueEdited(event: BiomarkerValueEditedEvent): Promise<void> {
  console.log(`[Event] BiomarkerValueEdited for user ${event.userId}, biomarker ${event.biomarker}`);

  try {
    // TODO: Get all biomarkers for this exam
    // TODO: Update the specific biomarker value
    // TODO: Recalculate only affected biomarker status
    // TODO: Recalculate health score
    // TODO: Recalculate trend if previous value changed

    console.log(`[Event] Biomarker ${event.biomarker} updated: ${event.oldValue} → ${event.newValue}`);
  } catch (error) {
    console.error(`[Event] Error handling BiomarkerValueEdited:`, error);
    throw error;
  }
}

/**
 * Handles MonthlyHealthSnapshot event
 * 
 * Monthly cycle closure (every 30 days).
 * 
 * Does NOT change clinical values.
 * Does change:
 * - Projection
 * - Narrative
 * - Next action
 * 
 * Use: Show "expected trend" vs real, prepare user for next exam.
 * 
 * Important: Do not invent clinical improvement without exam.
 */
async function handleMonthlyHealthSnapshot(event: MonthlyHealthSnapshotEvent): Promise<void> {
  console.log(`[Event] MonthlyHealthSnapshot for user ${event.userId}, month ${event.month}`);

  try {
    // TODO: Get current health score and trends
    // TODO: Get actions completed in last 30 days
    // TODO: Generate projections (soft logic, no score change)
    // TODO: Generate narrative
    // TODO: Prepare next actions

    console.log(`[Event] Monthly snapshot generated for ${event.month}`);
  } catch (error) {
    console.error(`[Event] Error handling MonthlyHealthSnapshot:`, error);
    throw error;
  }
}

// Register event handlers with type casting
eventBus.on('LabResultsIngested', handleLabResultsIngested as any);
eventBus.on('BiomarkerValueEdited', handleBiomarkerValueEdited as any);
eventBus.on('MonthlyHealthSnapshot', handleMonthlyHealthSnapshot as any);

