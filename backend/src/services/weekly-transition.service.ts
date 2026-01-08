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

import { db } from '../db/sqlite';
import {
  evaluateActionAdaptation,
  AdaptationDecision,
  ActionHistory
} from './action-adaptation.service';
import { BiomarkerKey } from '../config/biomarkers.config';

export interface WeeklyTransitionData {
  shouldShowTransition: boolean;
  previousWeek: {
    weekStart: string; // YYYY-MM-DD
    weekEnd: string; // YYYY-MM-DD
    weekRange: string; // "1-7 Enero"
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
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajustar a Lunes
  
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

/**
 * Formatea fecha a YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formatea rango de semana para mostrar (e.g., "1-7 Enero")
 */
function formatWeekRange(start: Date, end: Date): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = months[start.getMonth()];
  
  return `${startDay}-${endDay} ${month}`;
}

/**
 * Verifica si el usuario ya vio la transición de esta semana
 */
export function hasSeenWeeklyTransition(userId: string): boolean {
  const { start: currentWeekStart } = getCurrentWeekDates();
  const currentWeekStartStr = formatDate(currentWeekStart);
  
  try {
    const query = db.prepare(`
      SELECT last_transition_seen
      FROM users
      WHERE id = ?
    `);
    
    const user = query.get(userId) as { last_transition_seen: string | null } | undefined;
    
    if (!user || !user.last_transition_seen) {
      return false;
    }
    
    // Comparar fechas
    return user.last_transition_seen >= currentWeekStartStr;
  } catch (error) {
    console.error('[Weekly Transition] Error checking transition seen:', error);
    return false;
  }
}

/**
 * Marca que el usuario vio la transición de esta semana
 */
export function markWeeklyTransitionSeen(userId: string): void {
  const { start: currentWeekStart } = getCurrentWeekDates();
  const currentWeekStartStr = formatDate(currentWeekStart);
  
  try {
    const query = db.prepare(`
      UPDATE users
      SET last_transition_seen = ?
      WHERE id = ?
    `);
    
    query.run(currentWeekStartStr, userId);
  } catch (error) {
    console.error('[Weekly Transition] Error marking transition seen:', error);
  }
}

/**
 * Obtiene los datos necesarios para la transición semanal
 * 
 * PASO 1 — MOMENTO DE CIERRE:
 * - Detecta si es una nueva semana
 * - Verifica si ya vio la transición esta semana
 */
export function getWeeklyTransitionData(userId: string): WeeklyTransitionData {
  const { start: currentWeekStart, end: currentWeekEnd } = getCurrentWeekDates();
  
  // PASO 6 — FRECUENCIA: Verificar si ya vio la transición esta semana
  const alreadySeen = hasSeenWeeklyTransition(userId);
  
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
  
  // Obtener acciones de la semana anterior
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  
  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
  
  try {
    const query = db.prepare(`
      SELECT 
        id,
        action_id,
        progress,
        completion_state
      FROM weekly_action_instances
      WHERE user_id = ?
        AND week_start = ?
      ORDER BY created_at ASC
    `);
    
    const previousActions = query.all(
      userId,
      formatDate(previousWeekStart)
    ) as Array<{
      id: string;
      action_id: string;
      progress: number;
      completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    }>;
    
    // Si no hay acciones de la semana anterior, no mostrar transición
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
    
    // Formatear acciones para el frontend
    const formattedActions = previousActions.map(action => ({
      id: action.id,
      title: `${action.action_id}.title`, // i18n key
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
 * 
 * PASO 3 — RE-CÁLCULO:
 * - Ejecutar re-cálculo semanal
 * - Aplicar internalización, adaptación de dificultad, reemplazos
 * - Generar nuevo set de máx. 3 acciones
 * 
 * @returns true si se ejecutó exitosamente
 */
export async function executeWeeklyRecalculation(userId: string): Promise<boolean> {
  try {
    console.log(`[Weekly Transition] Starting recalculation for user ${userId}`);
    
    // 1. Obtener acciones de la semana anterior
    const previousWeekActions = getPreviousWeekActions(userId);
    
    // 2. Para cada acción, evaluar adaptación
    const adaptationDecisions: Array<{
      actionId: string;
      decision: AdaptationDecision;
    }> = [];
    
    for (const action of previousWeekActions) {
      const history = getActionHistoryForUser(userId, action.action_id, 3);
      
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
    
    // 3. Aplicar decisiones de adaptación
    for (const { actionId, decision } of adaptationDecisions) {
      applyAdaptationDecision(userId, actionId, decision);
    }
    
    // 4. TODO: Generar nuevo set de 3 acciones
    // Esto se integrará con weekly-actions.service.ts
    
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
function getPreviousWeekActions(userId: string): Array<{
  id: string;
  action_id: string;
  difficulty: string;
  progress: number;
  impacted_biomarkers: BiomarkerKey[];
}> {
  const { start: currentWeekStart } = getCurrentWeekDates();
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  
  try {
    const query = db.prepare(`
      SELECT 
        id,
        action_id,
        difficulty,
        progress,
        impacted_biomarkers
      FROM weekly_action_instances
      WHERE user_id = ?
        AND week_start = ?
    `);
    
    const actions = query.all(userId, formatDate(previousWeekStart)) as Array<{
      id: string;
      action_id: string;
      difficulty: string;
      progress: number;
      impacted_biomarkers: string; // JSON array
    }>;
    
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
function getActionHistoryForUser(
  userId: string,
  actionId: string,
  weeks: number
): ActionHistory[] {
  try {
    const query = db.prepare(`
      SELECT 
        action_id as actionId,
        week_start as weekStart,
        week_end as weekEnd,
        progress,
        difficulty
      FROM weekly_action_instances
      WHERE user_id = ?
        AND action_id = ?
      ORDER BY week_start DESC
      LIMIT ?
    `);
    
    return query.all(userId, actionId, weeks) as ActionHistory[];
  } catch (error) {
    console.error('[Weekly Transition] Error getting action history:', error);
    return [];
  }
}

/**
 * Aplica una decisión de adaptación a una acción
 */
function applyAdaptationDecision(
  userId: string,
  actionId: string,
  decision: AdaptationDecision
): void {
  console.log(`[Weekly Transition] Applying decision for ${actionId}:`, decision);
  
  // TODO: Implementar lógica de aplicación según decision.action
  // - CONTINUE: no hacer nada
  // - DEGRADE: actualizar difficulty
  // - REPLACE: crear nueva acción, marcar anterior como cooldown
  // - RETIRE: marcar como internalizada
}
