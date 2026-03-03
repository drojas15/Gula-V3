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
 * CRITICAL: Always requires user_id from CreateWeeklyActionInput
 */
export async function saveWeeklyActions(
  actions: CreateWeeklyActionInput[]
): Promise<WeeklyActionInstance[]> {
  const { db } = await import('../db/sqlite');
  const { randomUUID } = await import('crypto');

  const insertStmt = db.prepare(`
    INSERT INTO weekly_action_instances (
      id, user_id, action_id, category, weekly_target, success_metric,
      impacted_biomarkers, difficulty, progress, completion_state,
      week_start, week_end, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const savedActions: WeeklyActionInstance[] = [];

  for (const action of actions) {
    const id = randomUUID();
    const now = new Date().toISOString();

    insertStmt.run(
      id,
      action.user_id, // CRITICAL: user_id from input
      action.action_id,
      action.category,
      action.weekly_target,
      action.success_metric,
      JSON.stringify(action.impacted_biomarkers),
      action.difficulty,
      0, // initial progress
      'PENDING', // initial completion_state
      action.week_start.toISOString().split('T')[0],
      action.week_end.toISOString().split('T')[0],
      now
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
 * SELECT action_id
 * FROM weekly_actions
 * WHERE user_id = ?
 * AND completion_state = 'COMPLETED'
 * AND created_at >= NOW() - INTERVAL '14 days';
 * 
 * This protects against repetition (key feature).
 * CRITICAL: Always filters by user_id
 */
export async function getCompletedActionsInLast14Days(
  userId: string
): Promise<string[]> {
  const { db } = await import('../db/sqlite');

  // Calculate date 14 days ago
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const cutoffDate = fourteenDaysAgo.toISOString();

  // CRITICAL: Filter by user_id to ensure data isolation
  const results = db.prepare(`
    SELECT action_id
    FROM weekly_action_instances
    WHERE user_id = ?
      AND completion_state = 'COMPLETED'
      AND created_at >= ?
  `).all(userId, cutoffDate) as Array<{ action_id: string }>;

  return results.map(row => row.action_id);
}

/**
 * C. Update de progreso
 * UPDATE weekly_actions
 * SET progress = ?, completion_state = ?
 * WHERE id = ? AND user_id = ?;
 * 
 * Frontend only sends numbers.
 * Backend decides state.
 * 
 * CRITICAL: Validates that action belongs to user (authorization check)
 */
export async function updateWeeklyActionProgress(
  weeklyActionId: string,
  progress: number,
  userId: string
): Promise<WeeklyActionInstance> {
  const { db } = await import('../db/sqlite');

  // Determine state based on progress
  let completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  if (progress >= 100) {
    completion_state = 'COMPLETED';
  } else if (progress > 0) {
    completion_state = 'IN_PROGRESS';
  } else {
    completion_state = 'PENDING';
  }

  // AUTHORIZATION CHECK: Update only if action belongs to user
  const updateStmt = db.prepare(`
    UPDATE weekly_action_instances
    SET progress = ?, completion_state = ?
    WHERE id = ? AND user_id = ?
  `);

  const result = updateStmt.run(
    Math.max(0, Math.min(100, progress)),
    completion_state,
    weeklyActionId,
    userId
  );

  // If no rows were updated, action doesn't exist or doesn't belong to user
  if (result.changes === 0) {
    throw new Error('Action not found or unauthorized');
  }

  // Fetch updated action
  const getStmt = db.prepare(`
    SELECT * FROM weekly_action_instances
    WHERE id = ? AND user_id = ?
  `);

  const action = getStmt.get(weeklyActionId, userId) as any;

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
 * 
 * Gets actions for current week (week_start <= CURRENT_DATE <= week_end)
 * CRITICAL: Always filters by user_id
 */
export async function getActiveWeeklyActions(
  userId: string,
  currentDate: Date
): Promise<WeeklyActionInstance[]> {
  const { db } = await import('../db/sqlite');

  const currentDateStr = currentDate.toISOString().split('T')[0];

  // CRITICAL: Filter by user_id to ensure data isolation
  const actions = db.prepare(`
    SELECT * FROM weekly_action_instances
    WHERE user_id = ?
      AND week_start <= ?
      AND week_end >= ?
    ORDER BY created_at
    LIMIT 3
  `).all(userId, currentDateStr, currentDateStr) as any[];

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

