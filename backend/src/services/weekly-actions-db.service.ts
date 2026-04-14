/**
 * WEEKLY ACTIONS DATABASE SERVICE
 *
 * Implements the 3 mandatory queries for weekly actions system.
 * These are the core queries - without these, there is no system.
 */

import { WeeklyActionInstance, CreateWeeklyActionInput } from '../models/WeeklyActionInstance.model';
import { query as dbQuery, queryOne, execute } from '../db/postgres';
import { randomUUID } from 'crypto';

/**
 * A. Guardar acciones semanales
 * INSERT INTO weekly_action_instances (...)
 * CRITICAL: Always requires user_id from CreateWeeklyActionInput
 */
export async function saveWeeklyActions(
  actions: CreateWeeklyActionInput[]
): Promise<WeeklyActionInstance[]> {
  const savedActions: WeeklyActionInstance[] = [];

  for (const action of actions) {
    const id = randomUUID();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO weekly_action_instances (
        id, user_id, action_id, category, weekly_target, success_metric,
        impacted_biomarkers, difficulty, progress, completion_state,
        week_start, week_end, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        action.user_id,
        action.action_id,
        action.category,
        action.weekly_target,
        action.success_metric,
        JSON.stringify(action.impacted_biomarkers),
        action.difficulty,
        0,
        'PENDING',
        action.week_start.toISOString().split('T')[0],
        action.week_end.toISOString().split('T')[0],
        now
      ]
    );

    savedActions.push({
      id,
      user_id: action.user_id,
      action_id: action.action_id,
      category: action.category,
      weekly_target: action.weekly_target,
      success_metric: action.success_metric,
      impacted_biomarkers: action.impacted_biomarkers,
      difficulty: action.difficulty,
      progress: 0,
      completion_state: 'PENDING',
      week_start: action.week_start,
      week_end: action.week_end,
      created_at: new Date(now)
    });
  }

  return savedActions;
}

/**
 * B. Acciones completadas últimos 14 días
 * CRITICAL: Always filters by user_id
 */
export async function getCompletedActionsInLast14Days(
  userId: string
): Promise<string[]> {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const cutoffDate = fourteenDaysAgo.toISOString();

  const results = await dbQuery<{ action_id: string }>(
    `SELECT action_id
     FROM weekly_action_instances
     WHERE user_id = $1
       AND completion_state = 'COMPLETED'
       AND created_at >= $2`,
    [userId, cutoffDate]
  );

  return results.map(row => row.action_id);
}

/**
 * C. Update de progreso
 * CRITICAL: Validates that action belongs to user (authorization check)
 */
export async function updateWeeklyActionProgress(
  weeklyActionId: string,
  progress: number,
  userId: string
): Promise<WeeklyActionInstance> {
  let completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  if (progress >= 100) {
    completion_state = 'COMPLETED';
  } else if (progress > 0) {
    completion_state = 'IN_PROGRESS';
  } else {
    completion_state = 'PENDING';
  }

  const result = await execute(
    `UPDATE weekly_action_instances
     SET progress = $1, completion_state = $2
     WHERE id = $3 AND user_id = $4`,
    [Math.max(0, Math.min(100, progress)), completion_state, weeklyActionId, userId]
  );

  if (result.rowCount === 0) {
    throw new Error('Action not found or unauthorized');
  }

  const action = await queryOne<any>(
    `SELECT * FROM weekly_action_instances WHERE id = $1 AND user_id = $2`,
    [weeklyActionId, userId]
  );

  if (!action) {
    throw new Error('Action not found after update');
  }

  return {
    id: action.id,
    user_id: action.user_id,
    action_id: action.action_id,
    category: action.category,
    weekly_target: action.weekly_target,
    success_metric: action.success_metric,
    impacted_biomarkers: JSON.parse(action.impacted_biomarkers),
    difficulty: action.difficulty,
    progress: action.progress,
    completion_state: action.completion_state,
    week_start: new Date(action.week_start),
    week_end: new Date(action.week_end),
    created_at: new Date(action.created_at)
  };
}

/**
 * Get active weekly actions for a user (max 3)
 * CRITICAL: Always filters by user_id
 */
export async function getActiveWeeklyActions(
  userId: string,
  currentDate: Date
): Promise<WeeklyActionInstance[]> {
  const currentDateStr = currentDate.toISOString().split('T')[0];

  const actions = await dbQuery<any>(
    `SELECT * FROM weekly_action_instances
     WHERE user_id = $1
       AND week_start <= $2
       AND week_end >= $3
     ORDER BY created_at
     LIMIT 3`,
    [userId, currentDateStr, currentDateStr]
  );

  return actions.map(action => ({
    id: action.id,
    user_id: action.user_id,
    action_id: action.action_id,
    category: action.category,
    weekly_target: action.weekly_target,
    success_metric: action.success_metric,
    impacted_biomarkers: JSON.parse(action.impacted_biomarkers),
    difficulty: action.difficulty,
    progress: action.progress,
    completion_state: action.completion_state,
    week_start: new Date(action.week_start),
    week_end: new Date(action.week_end),
    created_at: new Date(action.created_at)
  }));
}

/**
 * Get latest exam data for a user
 */
export async function getLatestExamData(_userId: string): Promise<{
  examId: string;
  healthScore: number;
  biomarkers: Array<{ biomarker: string; value: number }>;
} | null> {
  return null;
}

/**
 * Get previous exam data for trend comparison
 */
export async function getPreviousExamData(_userId: string): Promise<{
  examId: string;
  healthScore: number;
  biomarkers: Array<{ biomarker: string; value: number }>;
} | null> {
  return null;
}

/**
 * Get biomarker history from biomarker_result table
 *
 * REGLA DE ORO: biomarker_result es HISTÓRICO
 * - NUNCA se actualiza
 * - NUNCA se reemplaza
 * - SOLO INSERT
 */
export async function getBiomarkerHistoryFromDB(
  userId: string,
  biomarkerCode: string
): Promise<Array<{
  exam_date: Date;
  value: number;
  status_at_time: string;
  unit: string;
}>> {
  try {
    const rows = await dbQuery<{
      exam_date: string;
      value: number;
      status_at_time: string;
      unit: string;
    }>(
      `SELECT exam_date, value, status_at_time, unit
       FROM biomarker_result
       WHERE user_id = $1
         AND biomarker_code = $2
       ORDER BY exam_date ASC`,
      [userId, biomarkerCode]
    );

    return rows.map(row => ({
      exam_date: new Date(row.exam_date),
      value: row.value,
      status_at_time: row.status_at_time,
      unit: row.unit
    }));
  } catch (error: any) {
    console.error('Error reading biomarker history from PostgreSQL:', error);
    return [];
  }
}
