/**
 * ACTION ADAPTATION SERVICE
 * 
 * Implementa la lógica de adaptación de dificultad y reemplazo inteligente
 * de acciones semanales según el cumplimiento del usuario.
 * 
 * REGLAS:
 * 1. Si progress == 0 por 1 semana: NO hacer nada
 * 2. Si progress == 0 por 2 semanas consecutivas:
 *    - Si isDegradable: HARD → MEDIUM → EASY
 *    - Si NO es degradable: marcar para posible reemplazo
 * 3. Si acción está en EASY y progress == 0 por 2 semanas:
 *    - Retirar acción (state = COOLDOWN)
 *    - Seleccionar acción complementaria
 */

import { BiomarkerKey } from '../config/biomarkers.config';
import {
  MAIN_ACTION_CATALOG,
  DifficultyLevel,
  getNextDifficultyLevel,
  canDegrade,
  getComplementaryActions,
  ADAPTATION_MESSAGES
} from '../config/actions-v2.config';

export interface ActionHistory {
  actionId: string;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  progress: number;
  difficulty: DifficultyLevel;
}

export interface AdaptationDecision {
  action: 'CONTINUE' | 'DEGRADE' | 'REPLACE' | 'RETIRE';
  newDifficulty?: DifficultyLevel;
  replacementActionId?: string;
  message: string;
  cooldownUntil?: string; // YYYY-MM-DD
}

/**
 * Evalúa si una acción necesita adaptación basada en su historial
 * 
 * @param actionId - ID de la acción
 * @param currentDifficulty - Dificultad actual
 * @param history - Historial de las últimas 2-3 semanas
 * @param targetBiomarkers - Biomarcadores objetivo
 * @returns Decisión de adaptación
 */
export function evaluateActionAdaptation(
  actionId: string,
  currentDifficulty: DifficultyLevel,
  history: ActionHistory[],
  targetBiomarkers: BiomarkerKey[]
): AdaptationDecision {
  // Validar que la acción existe en el catálogo
  const actionDef = MAIN_ACTION_CATALOG[actionId];
  if (!actionDef) {
    return {
      action: 'CONTINUE',
      message: ADAPTATION_MESSAGES.no_change
    };
  }
  
  // Ordenar historial por fecha (más reciente primero)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
  
  // REGLA 1: Si solo hay 1 semana con progress == 0, NO hacer nada
  if (sortedHistory.length === 1 && sortedHistory[0].progress === 0) {
    return {
      action: 'CONTINUE',
      message: ADAPTATION_MESSAGES.no_change
    };
  }
  
  // REGLA 2: Si hay 2 semanas consecutivas con progress == 0
  if (sortedHistory.length >= 2) {
    const lastTwoWeeks = sortedHistory.slice(0, 2);
    const bothZero = lastTwoWeeks.every(week => week.progress === 0);
    
    if (bothZero) {
      // REGLA 3: Si está en EASY, retirar y reemplazar
      if (currentDifficulty === 'EASY') {
        return evaluateReplacement(actionId, targetBiomarkers);
      }
      
      // REGLA 2a: Si es degradable, bajar dificultad
      if (actionDef.isDegradable && canDegrade(actionId, currentDifficulty)) {
        const newDifficulty = getNextDifficultyLevel(currentDifficulty);
        if (newDifficulty) {
          return {
            action: 'DEGRADE',
            newDifficulty,
            message: ADAPTATION_MESSAGES.difficulty_reduced
          };
        }
      }
      
      // REGLA 2b: Si NO es degradable, considerar reemplazo
      if (!actionDef.isDegradable) {
        return evaluateReplacement(actionId, targetBiomarkers);
      }
    }
  }
  
  // Sin cambios necesarios
  return {
    action: 'CONTINUE',
    message: ADAPTATION_MESSAGES.no_change
  };
}

/**
 * Evalúa el reemplazo de una acción que no está funcionando
 * 
 * @param actionId - ID de la acción a reemplazar
 * @param targetBiomarkers - Biomarcadores objetivo
 * @returns Decisión de reemplazo
 */
function evaluateReplacement(
  actionId: string,
  targetBiomarkers: BiomarkerKey[]
): AdaptationDecision {
  // Obtener acciones complementarias
  const complementaryActions = getComplementaryActions(actionId, targetBiomarkers);
  
  if (complementaryActions.length === 0) {
    // No hay acciones complementarias, mantener la actual
    return {
      action: 'CONTINUE',
      message: ADAPTATION_MESSAGES.no_change
    };
  }
  
  // Seleccionar la primera acción complementaria
  // TODO: Mejorar lógica de selección (considerar historial, prioridad, etc.)
  const replacementAction = complementaryActions[0];
  
  // Calcular cooldown (2-4 semanas)
  const cooldownWeeks = Math.floor(Math.random() * 3) + 2; // 2, 3 o 4 semanas
  const cooldownUntil = new Date();
  cooldownUntil.setDate(cooldownUntil.getDate() + (cooldownWeeks * 7));
  
  return {
    action: 'REPLACE',
    replacementActionId: replacementAction.id,
    message: ADAPTATION_MESSAGES.action_replaced,
    cooldownUntil: cooldownUntil.toISOString().split('T')[0]
  };
}

/**
 * Determina la dificultad inicial para una nueva acción
 * basada en el perfil del usuario y el biomarcador
 * 
 * @param actionId - ID de la acción
 * @param biomarkerStatus - Estado del biomarcador (CRITICAL, OUT_OF_RANGE, GOOD, OPTIMAL)
 * @returns Dificultad inicial
 */
export function determineInitialDifficulty(
  actionId: string,
  biomarkerStatus: 'CRITICAL' | 'OUT_OF_RANGE' | 'GOOD' | 'OPTIMAL'
): DifficultyLevel {
  const actionDef = MAIN_ACTION_CATALOG[actionId];
  if (!actionDef) return 'MEDIUM';
  
  // Si el biomarcador está CRITICAL o OUT_OF_RANGE, empezar con dificultad más baja
  if (biomarkerStatus === 'CRITICAL' || biomarkerStatus === 'OUT_OF_RANGE') {
    // Buscar la dificultad más baja disponible
    if (actionDef.variants.EASY) return 'EASY';
    if (actionDef.variants.MEDIUM) return 'MEDIUM';
    if (actionDef.variants.HARD) return 'HARD';
  }
  
  // Si el biomarcador está GOOD u OPTIMAL, empezar con dificultad media o alta
  if (biomarkerStatus === 'GOOD') {
    if (actionDef.variants.MEDIUM) return 'MEDIUM';
    if (actionDef.variants.EASY) return 'EASY';
    if (actionDef.variants.HARD) return 'HARD';
  }
  
  if (biomarkerStatus === 'OPTIMAL') {
    if (actionDef.variants.HARD) return 'HARD';
    if (actionDef.variants.MEDIUM) return 'MEDIUM';
    if (actionDef.variants.EASY) return 'EASY';
  }
  
  // Fallback a MEDIUM
  return 'MEDIUM';
}

/**
 * Obtiene la configuración de la acción para una dificultad específica
 * 
 * @param actionId - ID de la acción
 * @param difficulty - Dificultad deseada
 * @returns Configuración de la variante o null si no existe
 */
export function getActionVariant(actionId: string, difficulty: DifficultyLevel) {
  const actionDef = MAIN_ACTION_CATALOG[actionId];
  if (!actionDef) return null;
  
  return actionDef.variants[difficulty] || null;
}

/**
 * Verifica si una acción está en cooldown
 * 
 * @param cooldownUntil - Fecha hasta la que la acción está en cooldown (YYYY-MM-DD)
 * @param currentDate - Fecha actual
 * @returns true si está en cooldown, false si no
 */
export function isInCooldown(cooldownUntil: string | null, currentDate: Date = new Date()): boolean {
  if (!cooldownUntil) return false;
  
  const cooldownDate = new Date(cooldownUntil);
  return currentDate < cooldownDate;
}

/**
 * Obtiene el historial de una acción específica para un usuario
 * 
 * @param userId - ID del usuario
 * @param actionId - ID de la acción
 * @param weeks - Número de semanas a consultar (default: 3)
 * @returns Historial de la acción
 */
export async function getActionHistory(
  _userId: string,
  _actionId: string,
  _weeks: number = 3
): Promise<ActionHistory[]> {
  // TODO: Implementar consulta a base de datos
  // Por ahora retorna array vacío
  return [];
}

/**
 * Aplica una decisión de adaptación a una acción
 * 
 * @param userId - ID del usuario
 * @param actionId - ID de la acción
 * @param decision - Decisión de adaptación
 * @returns true si se aplicó exitosamente
 */
export async function applyAdaptationDecision(
  userId: string,
  actionId: string,
  decision: AdaptationDecision
): Promise<boolean> {
  // TODO: Implementar actualización en base de datos
  console.log(`[Action Adaptation] Applied decision for user ${userId}, action ${actionId}:`, decision);
  return true;
}
