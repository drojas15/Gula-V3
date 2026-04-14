/**
 * WEEKLY TRANSITION SERVICE
 *
 * Maneja el cierre semanal y la transición a una nueva semana:
 * - Detecta si es una nueva semana
 * - Obtiene resumen de la semana anterior
 * - Ejecuta re-cálculo semanal
 * - Aplica internalización, adaptación y reemplazos
 * - Genera nuevo set de máx. 3 acciones
 */

import { query as dbQuery, queryOne, execute } from '../db/postgres';
import {
  evaluateActionAdaptation,
  AdaptationDecision,
  ActionHistory
} from './action-adaptation.service';
import { BiomarkerKey } from '../config/biomarkers.config';

export interface WeeklyTransitionData {
  shouldShowTransition: boolean;
  previousWeek: {
    weekStart: string;
    weekEnd: string;
    weekRange: string;
    actions: Array<{
      id: string;
      title: string;
      progress: number;
      completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    }>;
  } | null;
  currentWeek: {
    weekStart: string;
    weekEnd: string;
  };
}

/**
 * Obtiene las fechas de inicio y fin de la semana actual (Lunes-Domingo)
 */
function getCurrentWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatWeekRange(start: Date, end: Date): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${start.getDate()}-${end.getDate()} ${months[start.getMonth()]}`;
}

/**
 * Verifica si el usuario ya vio la transición de esta semana
 */
export async function hasSeenWeeklyTransition(userId: string): Promise<boolean> {
  const { start: currentWeekStart } = getCurrentWeekDates();
  const currentWeekStartStr = formatDate(currentWeekStart);

  try {
    const user = await queryOne<{ last_transition_seen: string | null }>(
      'SELECT last_transition_seen FROM users WHERE id = $1',
      [userId]
    );

    if (!user || !user.last_transition_seen) {
      return false;
    }

    return user.last_transition_seen >= currentWeekStartStr;
  } catch (error) {
    console.error('[Weekly Transition] Error checking transition seen:', error);
    return false;
  }
}

/**
 * Marca que el usuario vio la transición de esta semana
 */
export async function markWeeklyTransitionSeen(userId: string): Promise<void> {
  const { start: currentWeekStart } = getCurrentWeekDates();
  const currentWeekStartStr = formatDate(currentWeekStart);

  try {
    await execute(
      'UPDATE users SET last_transition_seen = $1 WHERE id = $2',
      [currentWeekStartStr, userId]
    );
  } catch (error) {
    console.error('[Weekly Transition] Error marking transition seen:', error);
  }
}

/**
 * Obtiene los datos necesarios para la transición semanal
 */
export async function getWeeklyTransitionData(userId: string): Promise<WeeklyTransitionData> {
  const { start: currentWeekStart, end: currentWeekEnd } = getCurrentWeekDates();

  const alreadySeen = await hasSeenWeeklyTransition(userId);

  if (alreadySeen) {
    return {
      shouldShowTransition: false,
      previousWeek: null,
      currentWeek: {
        weekStart: formatDate(currentWeekStart),
        weekEnd: formatDate(currentWeekEnd)
      }
    };
  }

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);

  try {
    const previousActions = await dbQuery<{
      id: string;
      action_id: string;
      progress: number;
      completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    }>(
      `SELECT id, action_id, progress, completion_state
       FROM weekly_action_instances
       WHERE user_id = $1 AND week_start = $2
       ORDER BY created_at ASC`,
      [userId, formatDate(previousWeekStart)]
    );

    if (previousActions.length === 0) {
      return {
        shouldShowTransition: false,
        previousWeek: null,
        currentWeek: {
          weekStart: formatDate(currentWeekStart),
          weekEnd: formatDate(currentWeekEnd)
        }
      };
    }

    const formattedActions = previousActions.map(action => ({
      id: action.id,
      title: `${action.action_id}.title`,
      progress: action.progress,
      completion_state: action.completion_state
    }));

    return {
      shouldShowTransition: true,
      previousWeek: {
        weekStart: formatDate(previousWeekStart),
        weekEnd: formatDate(previousWeekEnd),
        weekRange: formatWeekRange(previousWeekStart, previousWeekEnd),
        actions: formattedActions
      },
      currentWeek: {
        weekStart: formatDate(currentWeekStart),
        weekEnd: formatDate(currentWeekEnd)
      }
    };
  } catch (error) {
    console.error('[Weekly Transition] Error getting transition data:', error);
    return {
      shouldShowTransition: false,
      previousWeek: null,
      currentWeek: {
        weekStart: formatDate(currentWeekStart),
        weekEnd: formatDate(currentWeekEnd)
      }
    };
  }
}

/**
 * Ejecuta el re-cálculo semanal completo
 */
export async function executeWeeklyRecalculation(userId: string): Promise<boolean> {
  try {
    console.log(`[Weekly Transition] Starting recalculation for user ${userId}`);

    const previousWeekActions = await getPreviousWeekActions(userId);

    const adaptationDecisions: Array<{
      actionId: string;
      decision: AdaptationDecision;
    }> = [];

    for (const action of previousWeekActions) {
      const history = await getActionHistoryForUser(userId, action.action_id, 3);

      const decision = evaluateActionAdaptation(
        action.action_id,
        action.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
        history,
        action.impacted_biomarkers
      );

      adaptationDecisions.push({
        actionId: action.action_id,
        decision
      });
    }

    for (const { actionId, decision } of adaptationDecisions) {
      applyAdaptationDecision(userId, actionId, decision);
    }

    console.log(`[Weekly Transition] Recalculation completed for user ${userId}`);
    return true;
  } catch (error) {
    console.error('[Weekly Transition] Error during recalculation:', error);
    return false;
  }
}

/**
 * Obtiene las acciones de la semana anterior para un usuario
 */
async function getPreviousWeekActions(userId: string): Promise<Array<{
  id: string;
  action_id: string;
  difficulty: string;
  progress: number;
  impacted_biomarkers: BiomarkerKey[];
}>> {
  const { start: currentWeekStart } = getCurrentWeekDates();
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  try {
    const actions = await dbQuery<{
      id: string;
      action_id: string;
      difficulty: string;
      progress: number;
      impacted_biomarkers: string;
    }>(
      `SELECT id, action_id, difficulty, progress, impacted_biomarkers
       FROM weekly_action_instances
       WHERE user_id = $1 AND week_start = $2`,
      [userId, formatDate(previousWeekStart)]
    );

    return actions.map(action => ({
      ...action,
      impacted_biomarkers: JSON.parse(action.impacted_biomarkers) as BiomarkerKey[]
    }));
  } catch (error) {
    console.error('[Weekly Transition] Error getting previous week actions:', error);
    return [];
  }
}

/**
 * Obtiene el historial de una acción para un usuario
 */
async function getActionHistoryForUser(
  userId: string,
  actionId: string,
  weeks: number
): Promise<ActionHistory[]> {
  try {
    return await dbQuery<ActionHistory>(
      `SELECT
        action_id as "actionId",
        week_start as "weekStart",
        week_end as "weekEnd",
        progress,
        difficulty
       FROM weekly_action_instances
       WHERE user_id = $1 AND action_id = $2
       ORDER BY week_start DESC
       LIMIT $3`,
      [userId, actionId, weeks]
    );
  } catch (error) {
    console.error('[Weekly Transition] Error getting action history:', error);
    return [];
  }
}

/**
 * Aplica una decisión de adaptación a una acción
 */
function applyAdaptationDecision(
  _userId: string,
  actionId: string,
  decision: AdaptationDecision
): void {
  console.log(`[Weekly Transition] Applying decision for ${actionId}:`, decision);
  // TODO: Implement adaptation logic
}
