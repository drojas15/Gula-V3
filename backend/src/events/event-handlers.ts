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
import { query as dbQuery, queryOne, execute } from '../db/postgres';

/**
 * Handles LabResultsIngested event
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

    const examDateISO = event.examDate.toISOString();
    const createdAtISO = new Date().toISOString();

    // REGLA DE ORO: Save biomarker_result (HISTORICAL - IMMUTABLE)
    // Insert each biomarker evaluation as a NEW historical record
    // UNIQUE constraint (user_id, biomarker_code, exam_date) prevents duplicates
    for (const evaluation of evaluations) {
      const biomarkerResultId = `br_${event.examId}_${evaluation.biomarker}_${Date.now()}`;

      try {
        await execute(
          `INSERT INTO biomarker_result (
            id, user_id, exam_id, biomarker_code, exam_date,
            value, unit, status_at_time, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            biomarkerResultId,
            event.userId,
            event.examId,
            evaluation.biomarker,
            examDateISO,
            evaluation.value,
            evaluation.unit,
            evaluation.status,
            createdAtISO
          ]
        );
      } catch (error: any) {
        // PostgreSQL unique violation code is '23505'
        if (error.code === '23505') {
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
    console.log('✅ Biomarker results guardados en PostgreSQL (HISTÓRICO):');
    for (const evaluation of evaluations) {
      const countRows = await dbQuery<{ count: string }>(
        `SELECT COUNT(*) as count FROM biomarker_result WHERE user_id = $1 AND biomarker_code = $2`,
        [event.userId, evaluation.biomarker]
      );
      const count = parseInt(countRows[0]?.count || '0');
      console.log('  -', {
        user_id: event.userId,
        biomarker_code: evaluation.biomarker,
        exam_date: examDateISO.split('T')[0],
        value: evaluation.value,
        status_at_time: evaluation.status,
        total_rows_for_biomarker: count
      });
    }

    // 3. Get previous exam for trend analysis
    const previousValues = null; // Placeholder

    // 4. Analyze trends
    const biomarkerTrends = analyzeBiomarkerTrends(
      event.biomarkerValues.map(bv => ({
        biomarker: bv.biomarker as BiomarkerKey,
        value: bv.value
      })),
      previousValues
    );

    const previousScore = null;
    const scoreTrend = analyzeScoreTrend(scoreResult.score, previousScore);

    // 5. Reset Weekly Action Engine
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
        contribution_percentage: 0,
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
 */
async function handleBiomarkerValueEdited(event: BiomarkerValueEditedEvent): Promise<void> {
  console.log(`[Event] BiomarkerValueEdited for user ${event.userId}, biomarker ${event.biomarker}`);

  try {
    // TODO: Implement biomarker value editing logic
    console.log(`[Event] Biomarker ${event.biomarker} updated: ${event.oldValue} → ${event.newValue}`);
  } catch (error) {
    console.error(`[Event] Error handling BiomarkerValueEdited:`, error);
    throw error;
  }
}

/**
 * Handles MonthlyHealthSnapshot event
 */
async function handleMonthlyHealthSnapshot(event: MonthlyHealthSnapshotEvent): Promise<void> {
  console.log(`[Event] MonthlyHealthSnapshot for user ${event.userId}, month ${event.month}`);

  try {
    // TODO: Implement monthly snapshot logic
    console.log(`[Event] Monthly snapshot generated for ${event.month}`);
  } catch (error) {
    console.error(`[Event] Error handling MonthlyHealthSnapshot:`, error);
    throw error;
  }
}

// Register event handlers
eventBus.on('LabResultsIngested', handleLabResultsIngested as any);
eventBus.on('BiomarkerValueEdited', handleBiomarkerValueEdited as any);
eventBus.on('MonthlyHealthSnapshot', handleMonthlyHealthSnapshot as any);
