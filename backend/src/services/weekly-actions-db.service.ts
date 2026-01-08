/**
 * WEEKLY ACTIONS DATABASE SERVICE
 * 
 * Implements the 3 mandatory queries for weekly actions system.
 * These are the core queries - without these, there is no system.
 */

import { WeeklyActionInstance, CreateWeeklyActionInput, UpdateProgressInput } from '../models/WeeklyActionInstance.model';

/**
 * A. Guardar acciones semanales
 * INSERT INTO weekly_actions (...)
 */
export async function saveWeeklyActions(
  actions: CreateWeeklyActionInput[]
): Promise<WeeklyActionInstance[]> {
  // TODO: Implement database INSERT
  // INSERT INTO weekly_actions (
  //   id, user_id, action_id, category, weekly_target, success_metric,
  //   impacted_biomarkers, difficulty, progress, completion_state,
  //   week_start, week_end, created_at
  // ) VALUES
  // (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 0, 'PENDING', $8, $9, NOW())
  // RETURNING *;

  // Mock implementation for now
  return actions.map((action, index) => ({
    id: `wa_${Date.now()}_${index}`,
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
    created_at: new Date()
  }));
}

/**
 * B. Acciones completadas últimos 14 días
 * SELECT action_id
 * FROM weekly_actions
 * WHERE user_id = ?
 * AND completion_state = 'COMPLETED'
 * AND created_at >= NOW() - INTERVAL '14 days';
 * 
 * This protects against repetition (key feature).
 */
export async function getCompletedActionsInLast14Days(
  userId: string
): Promise<string[]> {
  // TODO: Implement database query
  // SELECT action_id
  // FROM weekly_actions
  // WHERE user_id = $1
  //   AND completion_state = 'COMPLETED'
  //   AND created_at >= NOW() - INTERVAL '14 days';

  // Mock implementation for now
  return [];
}

/**
 * C. Update de progreso
 * UPDATE weekly_actions
 * SET progress = ?, completion_state = ?
 * WHERE id = ?;
 * 
 * Frontend only sends numbers.
 * Backend decides state.
 */
export async function updateWeeklyActionProgress(
  weeklyActionId: string,
  progress: number
): Promise<WeeklyActionInstance> {
  // TODO: Implement database UPDATE
  // Determine completion_state based on progress
  // UPDATE weekly_actions
  // SET progress = $1, completion_state = $2
  // WHERE id = $3
  // RETURNING *;

  // Determine state based on progress
  let completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  if (progress >= 100) {
    completion_state = 'COMPLETED';
  } else if (progress > 0) {
    completion_state = 'IN_PROGRESS';
  } else {
    completion_state = 'PENDING';
  }

  // Mock implementation for now
  return {
    id: weeklyActionId,
    user_id: '',
    action_id: '',
    category: '',
    weekly_target: '',
    success_metric: '',
    impacted_biomarkers: [],
    difficulty: '',
    progress: Math.max(0, Math.min(100, progress)),
    completion_state,
    week_start: new Date(),
    week_end: new Date(),
    created_at: new Date()
  };
}

/**
 * Get active weekly actions for a user (max 3)
 * 
 * Gets actions for current week (week_start <= CURRENT_DATE <= week_end)
 */
export async function getActiveWeeklyActions(
  userId: string,
  currentDate: Date
): Promise<WeeklyActionInstance[]> {
  // TODO: Implement database query
  // SELECT * FROM weekly_actions
  // WHERE user_id = $1
  //   AND week_start <= $2
  //   AND week_end >= $2
  // ORDER BY created_at
  // LIMIT 3;

  return [];
}

/**
 * Get latest exam data for a user
 */
export async function getLatestExamData(userId: string): Promise<{
  examId: string;
  healthScore: number;
  biomarkers: Array<{ biomarker: string; value: number }>;
} | null> {
  // TODO: Implement database query
  // SELECT e.id, e.health_score
  // FROM exams e
  // WHERE e.user_id = $1
  //   AND e.status = 'completed'
  // ORDER BY e.uploaded_at DESC
  // LIMIT 1;
  //
  // SELECT biomarker, value
  // FROM biomarker_values
  // WHERE exam_id = $1;

  return null;
}

/**
 * Get previous exam data for trend comparison
 */
export async function getPreviousExamData(userId: string): Promise<{
  examId: string;
  healthScore: number;
  biomarkers: Array<{ biomarker: string; value: number }>;
} | null> {
  // TODO: Implement database query
  // SELECT e.id, e.health_score
  // FROM exams e
  // WHERE e.user_id = $1
  //   AND e.status = 'completed'
  // ORDER BY e.uploaded_at DESC
  // LIMIT 1 OFFSET 1;
  //
  // SELECT biomarker, value
  // FROM biomarker_values
  // WHERE exam_id = $1;

  return null;
}

/**
 * Get biomarker history from biomarker_result table
 * 
 * REGLA DE ORO: biomarker_result es HISTÓRICO
 * - NUNCA se actualiza
 * - NUNCA se reemplaza
 * - SOLO INSERT
 * 
 * Query:
 * SELECT exam_date, value, status_at_time, unit
 * FROM biomarker_result
 * WHERE user_id = ?
 *   AND biomarker_code = ?
 * ORDER BY exam_date ASC
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
  // Import SQLite db
  const { db } = await import('../db/sqlite');
  
  // Prepared statement for reading biomarker history
  const getHistory = db.prepare(`
    SELECT exam_date, value, status_at_time, unit
    FROM biomarker_result
    WHERE user_id = ?
      AND biomarker_code = ?
    ORDER BY exam_date ASC
  `);
  
  try {
    const rows = getHistory.all(userId, biomarkerCode) as Array<{
      exam_date: string;
      value: number;
      status_at_time: string;
      unit: string;
    }>;
    
    // Convert to expected format
    return rows.map(row => ({
      exam_date: new Date(row.exam_date),
      value: row.value,
      status_at_time: row.status_at_time,
      unit: row.unit
    }));
  } catch (error: any) {
    console.error('Error reading biomarker history from SQLite:', error);
    return [];
  }
}

