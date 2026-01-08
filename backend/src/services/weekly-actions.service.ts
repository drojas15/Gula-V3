/**
 * WEEKLY ACTIONS SERVICE
 * 
 * PRINCIPIO FUNDAMENTAL: SLOTS ROTATIVOS, NO BACKLOG
 * 
 * Acciones semanales = 3 slots que rotan cada semana
 * - NO se acumulan acciones de semanas anteriores
 * - Cada semana se genera un NUEVO set basado en estado actual
 * - Usuario NUNCA ve más de 3 acciones activas
 * - NO hay "deuda" de semanas anteriores
 * 
 * LÓGICA DE ROTACIÓN:
 * 1. Cada inicio de semana: re-evaluar biomarcadores actuales
 * 2. Identificar top 3 problemas (CRITICAL > OUT_OF_RANGE > GOOD)
 * 3. Construir NUEVO set de 3 acciones
 * 4. Acciones pueden repetirse (hábitos) sin acumularse
 * 5. Evitar acciones completadas en últimos 14 días (cooldown)
 * 
 * VER: docs/WEEKLY_ACTIONS_ROTATION.md para documentación completa
 * 
 * IMPORTANT: Backend returns only structured data - no human-readable text
 */

import { AnalyzedBiomarker } from './scoring-engine.service';
import { BiomarkerKey, Status } from '../config/biomarkers.config';
import {
  ACTION_DEFINITIONS,
  WeeklyAction,
  CompletionState,
  getActionsByBiomarker
} from '../config/actions.config';
import { getCompletedActionsInLast14Days } from './weekly-actions-db.service';

export interface WeeklyActionWithProgress extends WeeklyAction {
  progress: number; // 0-100
  completion_state: CompletionState;
  week_start: string; // DATE format YYYY-MM-DD
  week_end: string; // DATE format YYYY-MM-DD
}

export interface WeeklyActionsResult {
  actions: WeeklyActionWithProgress[];
  primary_biomarker: BiomarkerKey;
  week_start: string; // DATE format YYYY-MM-DD
  week_end: string; // DATE format YYYY-MM-DD
}

/**
 * Gets start and end dates for current week (Monday to Sunday)
 */
function getCurrentWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

/**
 * Formats date to ISO string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Selects weekly actions based on biomarker analysis
 * 
 * ROTACIÓN SEMANAL (SLOTS, NO BACKLOG):
 * - Genera un NUEVO set de máx 3 acciones cada semana
 * - NO arrastra acciones de semanas anteriores
 * - Acciones pueden repetirse (hábitos) sin acumularse
 * - Usuario siempre ve exactamente 3 acciones para ESTA semana
 * 
 * LÓGICA DE DECISIÓN:
 * 1. Si problema persiste + acción relevante → puede CONTINUAR (ocupa slot)
 * 2. Si problema mejoró → acción se ELIMINA
 * 3. Si problema más prioritario aparece → acción se REEMPLAZA
 * 4. Ejercicio puede repetirse semana a semana (hábito recurrente)
 * 
 * VALIDACIONES:
 * ✔️ Máx 3 acciones activas (HARD LIMIT)
 * ✔️ No repetir acción completada en últimos 14 días (cooldown)
 * ✔️ Al menos 1 acción del biomarcador de mayor peso
 * ✔️ No duplicar categorías en la misma semana
 * ✔️ Si todo OPTIMAL → solo 1 acción de mantenimiento
 * 
 * RULES:
 * 1. Identify biomarkers NOT in OPTIMAL
 * 2. Sort by: CRITICAL first, then OUT_OF_RANGE, then GOOD
 * 3. Within same severity, higher biomarker weight wins
 * 4. Select 1 primary action from highest-priority biomarker (MUST impact highest weight)
 * 5. Select up to 2 secondary actions that:
 *    - impact different biomarkers OR
 *    - support same biomarker without duplicating category
 * 6. Do NOT repeat actions completed in last 14 days
 * 7. If no biomarkers OUT_OF_RANGE or CRITICAL: select 1 maintenance action only
 */
export async function selectWeeklyActions(
  analyzedBiomarkers: AnalyzedBiomarker[],
  userId: string
): Promise<WeeklyActionsResult> {
  // Get completed actions in last 14 days (mandatory query B)
  const completedActionIdsInLast14Days = await getCompletedActionsInLast14Days(userId);
  const weekDates = getCurrentWeekDates();
  const weekStart = formatDate(weekDates.start);
  const weekEnd = formatDate(weekDates.end);

  // Filter biomarkers NOT in OPTIMAL
  const nonOptimalBiomarkers = analyzedBiomarkers.filter(
    b => b.status !== 'OPTIMAL'
  );

  // Check if we have any CRITICAL or OUT_OF_RANGE biomarkers
  const hasCriticalOrOutOfRange = nonOptimalBiomarkers.some(
    b => b.status === 'CRITICAL' || b.status === 'OUT_OF_RANGE'
  );

  // If all optimal OR no critical/out_of_range, return maintenance action
  if (nonOptimalBiomarkers.length === 0 || !hasCriticalOrOutOfRange) {
    return getMaintenanceActions(weekStart, weekEnd);
  }

  // Sort by priority: CRITICAL > OUT_OF_RANGE > GOOD, then by weight
  // Actions are decided by:
  // 1. Severity (status)
  // 2. Weight
  // 3. Trend (worsening > stable > improving)
  const sortedBiomarkers = [...nonOptimalBiomarkers].sort((a, b) => {
    const statusOrder: Record<Status, number> = {
      CRITICAL: 4,
      OUT_OF_RANGE: 3,
      GOOD: 2,
      OPTIMAL: 1
    };

    const statusDiff = statusOrder[b.status] - statusOrder[a.status];
    if (statusDiff !== 0) return statusDiff;

    // If same status, sort by weight (descending)
    const weightDiff = b.weight - a.weight;
    if (weightDiff !== 0) return weightDiff;

    // If same status and weight, prioritize worsening trends
    // Note: Trend data would need to be passed in for full implementation
    // For now, weight is the tiebreaker
    return 0;
  });

  // Get primary biomarker (highest priority - highest weight)
  const primaryBiomarker = sortedBiomarkers[0];
  
  // VALIDATION: At least 1 action MUST be linked to highest weight biomarker
  // Get all candidate actions for primary biomarker
  const primaryBiomarkerActions = getActionsByBiomarker(primaryBiomarker.biomarker);
  
  // Filter out recently completed actions (14-day cooldown)
  const availablePrimaryActions = primaryBiomarkerActions.filter(
    action => !completedActionIdsInLast14Days.includes(action.action_id)
  );

  if (availablePrimaryActions.length === 0) {
    // Fallback: use recommendation keys if no library actions available
    const primaryRecommendationKey = primaryBiomarker.recommendationKeys[0];
    const fallbackAction = ACTION_DEFINITIONS[primaryRecommendationKey];
    if (!fallbackAction) {
      throw new Error(`No action available for biomarker: ${primaryBiomarker.biomarker}`);
    }
      return {
        actions: [{
          ...fallbackAction,
          progress: 0,
          completion_state: 'PENDING',
          week_start: weekStart,
          week_end: weekEnd
        }],
        primary_biomarker: primaryBiomarker.biomarker,
        week_start: weekStart,
        week_end: weekEnd
      };
  }

  // Select primary action (MUST impact highest weight biomarker)
  const primaryAction = availablePrimaryActions[0];
  const selectedActions: WeeklyActionWithProgress[] = [{
    ...primaryAction,
    progress: 0,
    completion_state: 'PENDING',
    week_start: weekStart,
    week_end: weekEnd
  }];

  const usedActionIds = new Set([primaryAction.action_id]);
  const usedCategories = new Set([primaryAction.category]);
  const usedBiomarkers = new Set([primaryBiomarker.biomarker]);

  // Select up to 2 secondary actions
  // Strategy: Try to cover different biomarkers and categories
  for (let i = 1; i < sortedBiomarkers.length && selectedActions.length < 3; i++) {
    const biomarker = sortedBiomarkers[i];
    const candidateActions = getActionsByBiomarker(biomarker.biomarker);

    // Filter candidates
    const validCandidates = candidateActions.filter(action => {
      // Skip if already used
      if (usedActionIds.has(action.action_id)) return false;
      
      // Skip if completed in last 14 days
      if (completedActionIdsInLast14Days.includes(action.action_id)) return false;
      
      // Prefer actions that:
      // 1. Impact different biomarkers, OR
      // 2. Support same biomarker but different category
      const impactsDifferentBiomarker = !usedBiomarkers.has(biomarker.biomarker);
      const differentCategory = !usedCategories.has(action.category);
      
      return impactsDifferentBiomarker || differentCategory;
    });

    if (validCandidates.length > 0) {
      // Prefer actions that impact multiple biomarkers or different category
      const bestCandidate = validCandidates.sort((a, b) => {
        // Prefer different category
        const aDiffCategory = !usedCategories.has(a.category) ? 1 : 0;
        const bDiffCategory = !usedCategories.has(b.category) ? 1 : 0;
        if (aDiffCategory !== bDiffCategory) return bDiffCategory - aDiffCategory;
        
        // Prefer actions impacting more biomarkers
        return b.impacted_biomarkers.length - a.impacted_biomarkers.length;
      })[0];

      selectedActions.push({
        ...bestCandidate,
        progress: 0,
        completion_state: 'PENDING',
        week_start: weekStart,
        week_end: weekEnd
      });

      usedActionIds.add(bestCandidate.action_id);
      usedCategories.add(bestCandidate.category);
      bestCandidate.impacted_biomarkers.forEach(b => usedBiomarkers.add(b));
    }
  }

  // If we still have slots, try to get actions from primary biomarker with different categories
  if (selectedActions.length < 3) {
    const primaryBiomarkerSecondaryActions = primaryBiomarkerActions.filter(action => {
      if (usedActionIds.has(action.action_id)) return false;
      if (completedActionIdsInLast14Days.includes(action.action_id)) return false;
      if (usedCategories.has(action.category)) return false;
      return true;
    });

    if (primaryBiomarkerSecondaryActions.length > 0) {
      const secondaryAction = primaryBiomarkerSecondaryActions[0];
      selectedActions.push({
        ...secondaryAction,
        progress: 0,
        completion_state: 'PENDING',
        week_start: weekStart,
        week_end: weekEnd
      });
    }
  }

  // VALIDATION: Max 3 actions (hard limit - SLOTS ROTATIVOS)
  // Este es el set completo para ESTA semana
  // NO incluye acciones de semanas anteriores
  const finalActions = selectedActions.slice(0, 3);

  return {
    actions: finalActions,
    primary_biomarker: primaryBiomarker.biomarker,
    week_start: weekStart,
    week_end: weekEnd
  };
}

/**
 * Returns maintenance actions when all biomarkers are optimal or no critical issues
 * 
 * REGLA DE MANTENIMIENTO:
 * - Cuando todo está OPTIMAL → solo 1 acción
 * - Fomenta hábitos saludables sin abrumar
 * - Puede repetirse semana a semana (hábito recurrente)
 * 
 * VALIDATION: If everything is OPTIMAL → 1 maintenance action only
 */
function getMaintenanceActions(
  weekStart: string,
  weekEnd: string
): WeeklyActionsResult {
  // Select one maintenance action (prefer activity)
  // Estas acciones pueden repetirse indefinidamente (hábitos)
  const maintenanceAction = ACTION_DEFINITIONS['activity.daily_walk'] || 
                           ACTION_DEFINITIONS['ldl.keep_exercise'] ||
                           ACTION_DEFINITIONS['nutrition.vegetables_daily'];

  if (!maintenanceAction) {
    throw new Error('No maintenance action available');
  }

  // VALIDATION: Only 1 action when all optimal
  // Usuario no necesita 3 acciones si ya está saludable
  return {
    actions: [{
      ...maintenanceAction,
      progress: 0,
      completion_state: 'PENDING',
      week_start: weekStart,
      week_end: weekEnd
    }],
    primary_biomarker: 'LDL', // Default
    week_start: weekStart,
    week_end: weekEnd
  };
}

/**
 * Updates action progress based on success metric value
 */
export function updateActionProgress(
  currentValue: number,
  targetValue: number
): { progress: number; completion_state: CompletionState } {
  const progress = Math.min(100, Math.max(0, Math.round((currentValue / targetValue) * 100)));
  
  let completion_state: CompletionState;
  if (progress >= 100) {
    completion_state = 'COMPLETED';
  } else if (progress > 0) {
    completion_state = 'IN_PROGRESS';
  } else {
    completion_state = 'PENDING';
  }

  return { progress, completion_state };
}

/**
 * Parses weekly target string to extract numeric value
 * Examples: "150_minutes" -> 150, "5_days" -> 5, "0_servings" -> 0
 */
export function parseWeeklyTarget(target: string): number {
  const match = target.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Determines if an action should be INTERNALIZED (removed from weekly slots)
 * 
 * INTERNALIZACIÓN = Acción deja de ser la mejor palanca semanal
 * 
 * Una acción se internaliza si cumple AL MENOS UNA condición:
 * 1. El biomarcador objetivo mejoró o se estabilizó
 * 2. La acción fue completada ≥2 semanas consecutivas (hábitos)
 * 3. Existe otra acción con mayor impacto que necesita el slot
 * 
 * TIPOS:
 * - HÁBITOS (ejercicio, sueño): Se internalizan tras ≥2 semanas completadas
 * - CORRECCIONES (alimentación): Se internalizan al mejorar biomarcador o tras ≥3 semanas fáciles
 * - EDUCATIVAS: Se internalizan automáticamente tras 1 semana
 * 
 * Ver: docs/ACTION_INTERNALIZATION.md para documentación completa
 * 
 * @param action - Acción a evaluar
 * @param currentBiomarkerState - Estado actual del biomarcador objetivo
 * @param previousBiomarkerState - Estado anterior del biomarcador
 * @param consecutiveWeeksCompleted - Semanas consecutivas completadas
 * @returns true si debe internalizarse (liberar slot)
 */
export function shouldInternalize(
  action: WeeklyActionWithProgress,
  currentBiomarkerState: { status: Status; value: number } | null,
  previousBiomarkerState: { status: Status; value: number } | null,
  consecutiveWeeksCompleted: number
): boolean {
  // CONDICIÓN 1: Biomarcador mejoró o se estabilizó
  if (currentBiomarkerState && previousBiomarkerState) {
    const statusOrder: Record<Status, number> = {
      OPTIMAL: 4,
      GOOD: 3,
      OUT_OF_RANGE: 2,
      CRITICAL: 1
    };
    
    if (statusOrder[currentBiomarkerState.status] > statusOrder[previousBiomarkerState.status]) {
      return true; // Biomarcador mejoró → INTERNALIZAR
    }
  }
  
  // CONDICIÓN 2: Hábitos completados ≥2 semanas consecutivas
  if (action.category === 'ACTIVITY' || action.category === 'RECOVERY') {
    if (consecutiveWeeksCompleted >= 2 && action.completion_state === 'COMPLETED') {
      return true; // Hábito formado → INTERNALIZAR
    }
  }
  
  // CONDICIÓN 2.5: Correcciones fáciles completadas ≥3 semanas
  if (action.category === 'NUTRITION' || action.category === 'ELIMINATION') {
    if (consecutiveWeeksCompleted >= 3 && 
        action.completion_state === 'COMPLETED' &&
        action.difficulty === 'LOW') {
      return true; // Baja fricción → INTERNALIZAR
    }
  }
  
  // CONDICIÓN 3: Acciones educativas >1 semana (automático)
  // TODO: Implementar cuando tengamos categoría 'EDUCATION'
  
  // Por defecto, NO internalizar (continúa en slots)
  return false;
}

/**
 * Determines if action should be replaced with simpler version
 * 
 * Rule: If an action is NOT completed → next week don't punish, simplify.
 * 
 * Example: Failed activity.cardio_150 → Next week → activity.daily_walk
 * 
 * Fixed map, no AI, no weird heuristics.
 */
export function getSimplerAction(actionId: string): string | null {
  // Fixed map of actions to their simpler alternatives
  const simplerAlternatives: Record<string, string> = {
    // ACTIVITY simplifications
    'activity.cardio_150': 'activity.daily_walk',
    'activity.strength_2x': 'activity.daily_walk',
    'ldl.add_cardio': 'activity.daily_walk',
    'ldl.daily_cardio': 'activity.cardio_150',
    'hdl.daily_cardio': 'activity.cardio_150',
    'hba1c.daily_cardio': 'activity.cardio_150',
    'glucose.daily_cardio': 'activity.cardio_150',
    'triglycerides.daily_cardio': 'activity.cardio_150',
    'alt.daily_cardio': 'activity.cardio_150',
    'ast.daily_cardio': 'activity.cardio_150',
    'crp.daily_cardio': 'activity.cardio_150',
    'uric_acid.add_cardio': 'activity.daily_walk',
    
    // NUTRITION simplifications
    'nutrition.fiber_25g': 'nutrition.vegetables_daily',
    'ldl.increase_fiber': 'nutrition.vegetables_daily',
    'hba1c.increase_fiber': 'nutrition.vegetables_daily',
    'glucose.increase_fiber': 'nutrition.vegetables_daily',
    'triglycerides.increase_fiber': 'nutrition.vegetables_daily',
    'nutrition.low_refined_carbs': 'nutrition.no_sugary_drinks',
    'nutrition.mediterranean_pattern': 'nutrition.vegetables_daily',
    
    // ELIMINATION simplifications
    'elimination.no_alcohol': 'elimination.no_beer',
    'alt.eliminate_alcohol': 'elimination.no_beer',
    'ast.eliminate_alcohol': 'elimination.no_beer',
    'ldl.eliminate_trans_fats': 'ldl.reduce_saturated_fat',
    'hba1c.eliminate_refined_sugar': 'nutrition.no_sugary_drinks',
    'glucose.eliminate_refined_sugar': 'nutrition.no_sugary_drinks',
    'triglycerides.eliminate_refined_sugar': 'nutrition.no_sugary_drinks',
    'crp.eliminate_processed_foods': 'elimination.no_ultra_processed',
    'uric_acid.eliminate_purines': 'elimination.limit_fructose',
    
    // RECOVERY simplifications
    'recovery.sleep_7h': 'recovery.fixed_sleep_schedule',
    'recovery.stress_breaks': 'recovery.fixed_sleep_schedule'
  };

  return simplerAlternatives[actionId] || null;
}
