/**
 * PROJECTION ENGINE SERVICE
 * 
 * Soft logic for projections - does NOT touch actual health score.
 * 
 * This service provides:
 * - Expected trends based on actions
 * - Probability of improvement
 * - Narrative guidance
 * 
 * IMPORTANT: Projections are informational only.
 * They do NOT affect clinical scores.
 */

import { BiomarkerKey, Status } from '../config/biomarkers.config';
import { WeeklyActionInstance } from '../models/WeeklyActionInstance.model';

export type ProjectionConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BiomarkerProjection {
  biomarker: BiomarkerKey;
  currentStatus: Status;
  trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE';
  actionsCompletedLast30d: number; // Percentage 0-100
  projectedTrend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  confidence: ProjectionConfidence;
  narrative: string; // i18n key
}

/**
 * Projects biomarker trend based on status, trend, and actions
 * 
 * Example:
 * - LDL OUT_OF_RANGE
 * - Trend: ↓ (improving)
 * - Actions completed: 80%
 * - → "Probabilidad alta de mejora en próximo examen"
 * 
 * Projection ≠ Score
 * This is soft logic for user guidance only.
 */
export function projectBiomarkerTrend(
  biomarker: BiomarkerKey,
  currentStatus: Status,
  trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE',
  actionsCompletedLast30d: number // 0-100
): BiomarkerProjection {
  // Determine projected trend
  let projectedTrend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  let confidence: ProjectionConfidence;
  let narrativeKey: string;

  // If already improving and high action completion → high confidence improvement
  if (trendDirection === 'IMPROVING' && actionsCompletedLast30d >= 70) {
    projectedTrend = 'IMPROVING';
    confidence = 'HIGH';
    narrativeKey = `${biomarker.toLowerCase()}.projection.high_improvement`;
  }
  // If stable but high action completion → medium confidence improvement
  else if (trendDirection === 'STABLE' && actionsCompletedLast30d >= 70) {
    projectedTrend = 'IMPROVING';
    confidence = 'MEDIUM';
    narrativeKey = `${biomarker.toLowerCase()}.projection.medium_improvement`;
  }
  // If worsening but high action completion → medium confidence stabilization
  else if (trendDirection === 'WORSENING' && actionsCompletedLast30d >= 70) {
    projectedTrend = 'STABLE';
    confidence = 'MEDIUM';
    narrativeKey = `${biomarker.toLowerCase()}.projection.stabilization`;
  }
  // If low action completion → low confidence
  else if (actionsCompletedLast30d < 50) {
    projectedTrend = trendDirection === 'WORSENING' ? 'WORSENING' : 'STABLE';
    confidence = 'LOW';
    narrativeKey = `${biomarker.toLowerCase()}.projection.low_confidence`;
  }
  // Default: continue current trend
  else {
    projectedTrend = trendDirection === 'IMPROVING' ? 'IMPROVING' : 
                     trendDirection === 'WORSENING' ? 'WORSENING' : 'STABLE';
    confidence = 'MEDIUM';
    narrativeKey = `${biomarker.toLowerCase()}.projection.continuation`;
  }

  return {
    biomarker,
    currentStatus,
    trendDirection,
    actionsCompletedLast30d,
    projectedTrend,
    confidence,
    narrative: narrativeKey
  };
}

/**
 * Calculates actions completion percentage for last 30 days
 * 
 * This is used for projections only - does not affect score.
 */
export function calculateActionsCompletionLast30d(
  actions: WeeklyActionInstance[]
): number {
  if (actions.length === 0) return 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActions = actions.filter(
    action => new Date(action.created_at) >= thirtyDaysAgo
  );

  if (recentActions.length === 0) return 0;

  const completed = recentActions.filter(
    action => action.completion_state === 'COMPLETED'
  ).length;

  return Math.round((completed / recentActions.length) * 100);
}

