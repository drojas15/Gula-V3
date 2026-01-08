/**
 * DASHBOARD SERVICE
 * 
 * Implements weekly dashboard logic:
 * - Health score snapshot with trend
 * - Biomarker status grid with traffic lights
 * - Weekly actions
 * - Lightweight trends
 * 
 * Deterministic, explainable, simple.
 * No gamification. No medical diagnosis.
 */

import { AnalyzedBiomarker } from './scoring-engine.service';
import { BiomarkerKey, Status } from '../config/biomarkers.config';
import { WeeklyActionInstance } from '../models/WeeklyActionInstance.model';

export type TrendDirection = 'UP' | 'STABLE' | 'DOWN' | 'NONE';
export type BiomarkerTrendDirection = 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE';

export interface BiomarkerTrend {
  id: BiomarkerKey;
  value: number;
  status: Status;
  traffic_light: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  trend: BiomarkerTrendDirection; // IMPROVING (↑) | STABLE (→) | WORSENING (↓) | NONE
  lastMeasuredAt: string; // YYYY-MM-DD - fecha de última medición
  measurementCount: number; // Número de mediciones históricas
}

export interface WeeklyActionDisplay {
  weekly_action_id: string;
  title: string; // Plain language title (from i18n key)
  category: string;
  weekly_target: string;
  progress: number;
  completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  impacted_biomarkers: BiomarkerKey[];
}

export interface DashboardData {
  health_score: number;
  score_trend: TrendDirection;
  biomarkers: BiomarkerTrend[];
  weekly_actions: WeeklyActionDisplay[];
  // Baseline validation: true ONLY if there's a previous exam with different date
  hasBaseline?: boolean;
  baselineDate?: string | null; // YYYY-MM-DD format
  // Reliability: data completeness indicator (NOT health indicator)
  reliability?: {
    percentage: number; // 0-100
    measuredCount: number;
    totalCount: number;
  };
}

/**
 * Calculates trend direction by comparing two values
 * 
 * TREND LOGIC (by biomarker):
 * 
 * A. Delta normalizado
 *    delta = (current_value - previous_value) / previous_value
 * 
 * B. Umbrales (anti-ruido)
 *    |delta| < 3% → STABLE
 *    ≥ +3% en dirección saludable → IMPROVING
 *    ≥ +3% en dirección no saludable → WORSENING
 * 
 * C. Trend output (solo flecha)
 *    IMPROVING → ↑
 *    STABLE → →
 *    WORSENING → ↓
 * 
 * Example LDL:
 *    -5% → IMPROVING (↓ is better for LDL)
 *    +4% → WORSENING
 * 
 * Edge case: First exam → NONE
 */
export function calculateBiomarkerTrend(
  current: number,
  previous: number | null,
  biomarker: BiomarkerKey,
  thresholdPercent: number = 3
): BiomarkerTrendDirection {
  // Edge case: First exam
  if (previous === null || previous === 0) {
    return 'NONE';
  }
  
  // Determine if higher is better for this biomarker
  const higherIsBetter = biomarker === 'HDL' || biomarker === 'EGFR';
  
  // Calculate normalized delta
  const delta = (current - previous) / previous;
  const deltaPercent = Math.abs(delta) * 100;
  
  // Threshold: 3% minimum change
  if (deltaPercent < thresholdPercent) {
    return 'STABLE';
  }
  
  // Determine direction based on biomarker type
  if (higherIsBetter) {
    // For HDL/EGFR: higher value = better
    return delta > 0 ? 'IMPROVING' : 'WORSENING';
  } else {
    // For others: lower value = better
    return delta < 0 ? 'IMPROVING' : 'WORSENING';
  }
}

/**
 * Calculates health score trend by comparing current vs previous period
 * 
 * SCORE TREND (macro):
 * 
 * Rule: Simple and explainable
 * score_delta = current_health_score - previous_health_score
 * 
 * ≥ +2 pts → UP
 * ≤ −2 pts → DOWN
 * else → STABLE
 * 
 * This avoids false "improved" signals from noise.
 * 
 * Edge case: First exam → STABLE (no comparison)
 */
export function calculateScoreTrend(
  currentScore: number,
  previousScore: number | null,
  threshold: number = 2
): TrendDirection {
  // Edge case: First exam
  if (previousScore === null) {
    return 'STABLE';
  }
  
  const scoreDelta = currentScore - previousScore;
  
  if (scoreDelta >= threshold) {
    return 'UP';
  } else if (scoreDelta <= -threshold) {
    return 'DOWN';
  } else {
    return 'STABLE';
  }
}

/**
 * Converts biomarker status to traffic light color
 * 
 * STRICT COLOR LOGIC:
 * - OPTIMAL → GREEN
 * - GOOD → YELLOW
 * - OUT_OF_RANGE → ORANGE
 * - CRITICAL → RED
 * 
 * IMPORTANT: Color is based ONLY on status.
 * Weight, score impact, or priority NEVER change color.
 */
export function statusToTrafficLight(status: Status): 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' {
  const mapping: Record<Status, 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'> = {
    OPTIMAL: 'GREEN',
    GOOD: 'YELLOW',
    OUT_OF_RANGE: 'ORANGE',
    CRITICAL: 'RED'
  };
  
  return mapping[status];
}

/**
 * Formats weekly action for display
 * 
 * Converts action_id to title key for i18n.
 * Frontend will resolve the actual text.
 */
export function formatWeeklyActionForDisplay(
  action: WeeklyActionInstance
): WeeklyActionDisplay {
  // Title key format: {action_id}.title
  // Frontend will resolve via i18n
  const titleKey = `${action.action_id}.title`;
  
  return {
    weekly_action_id: action.id,
    title: titleKey, // Frontend resolves this
    category: action.category,
    weekly_target: action.weekly_target,
    progress: action.progress,
    completion_state: action.completion_state,
    impacted_biomarkers: action.impacted_biomarkers as BiomarkerKey[]
  };
}

/**
 * Gets the two most recent exams for comparison
 * 
 * COMPARISON RULE:
 * - State and copy are based ONLY on last exam vs second-to-last exam
 * - Graphs use full historical data (separate function)
 * 
 * @param exams Array of exams ordered by date (ascending)
 * @returns Object with current (last) and previous (second-to-last) exam data
 */
export function getComparisonPair<T extends { examDate?: Date | string | null }>(
  exams: T[]
): { current: T | null; previous: T | null } {
  if (exams.length === 0) {
    return { current: null, previous: null };
  }
  
  if (exams.length === 1) {
    return { current: exams[0], previous: null };
  }
  
  // Get last two exams (most recent first)
  const sorted = [...exams].sort((a, b) => {
    const dateA = a.examDate ? (typeof a.examDate === 'string' ? new Date(a.examDate) : a.examDate) : new Date(0);
    const dateB = b.examDate ? (typeof b.examDate === 'string' ? new Date(b.examDate) : b.examDate) : new Date(0);
    return dateB.getTime() - dateA.getTime(); // Descending (most recent first)
  });
  
  return {
    current: sorted[0],
    previous: sorted[1]
  };
}

/**
 * Builds complete dashboard data
 * 
 * Answers 3 questions:
 * 1. How is my health right now? (health_score)
 * 2. What should I focus on THIS WEEK? (weekly_actions)
 * 3. Am I improving or not? (trends)
 * 
 * COMPARISON LOGIC:
 * - Each biomarker has independent history
 * - Trend calculated per biomarker (not global)
 * - If biomarker not in latest exam, show last historical value
 * 
 * BASELINE RULE (OBLIGATORY):
 * hasBaseline = true IF AND ONLY IF:
 *   - exams.length >= 2
 *   - At least 2 DISTINCT exam dates exist
 * 
 * BIOMARKER RULE (OBLIGATORY):
 * - Each biomarker shows its own lastMeasuredAt
 * - NEVER use 0 for unmeasured biomarkers in recent exams
 * - Preserve last historical value
 */
export function buildDashboardData(
  userId: string, // For fetching independent biomarker state
  _currentBiomarkers: AnalyzedBiomarker[], // Not used anymore - kept for compatibility
  currentScore: number,
  previousScore: number | null,
  _previousBiomarkers: Array<{ biomarker: BiomarkerKey; value: number }> | null, // Not used anymore - kept for compatibility
  weeklyActions: WeeklyActionInstance[],
  exams: Array<{ examDate: string }> // All exams for baseline calculation
): DashboardData {
  // Calculate score trend (last vs second-to-last only)
  const scoreTrend = calculateScoreTrend(currentScore, previousScore);
  
  // ========================================
  // BASELINE DETECTION (SOLO EXÁMENES Y FECHAS)
  // ========================================
  // RULE: hasBaseline = true IF AND ONLY IF:
  //   1. exams.length >= 2
  //   2. At least 2 DISTINCT exam dates exist
  // 
  // NEVER check biomarkers, scores, or any other data!
  // ========================================
  
  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  );
  
  const uniqueDates = new Set(sortedExams.map(e => e.examDate));
  const hasBaseline = uniqueDates.size >= 2;
  
  let baselineDate: string | null = null;
  if (hasBaseline && sortedExams.length >= 2) {
    // Baseline date is the second-to-last exam date
    baselineDate = sortedExams[sortedExams.length - 2].examDate;
  }
  
  // DEBUG LOG (TEMPORAL - OBLIGATORIO)
  console.log('📊 [buildDashboardData] Baseline calculation:', {
    examsCount: exams.length,
    examDates: sortedExams.map(e => e.examDate),
    uniqueDatesCount: uniqueDates.size,
    hasBaseline,
    baselineDate
  });
  
  // ========================================
  // PASO 2: Obtener estado independiente de cada biomarcador
  // ========================================
  // REGLA: Cada biomarcador tiene su propio historial
  // - Si no está en el último examen, se conserva su último valor histórico
  // - NUNCA usar 0 como default
  // - Mostrar fecha de última medición
  // ========================================
  
  const { getLatestBiomarkerState } = require('./biomarker-state.service');
  const biomarkerStates: Array<{
    biomarker: BiomarkerKey;
    value: number | null;
    status: Status | null;
    unit: string | null;
    lastMeasuredAt: string | null;
    measurementCount: number;
    previousValue: number | null;
    previousMeasuredAt: string | null;
  }> = getLatestBiomarkerState(userId);
  
  // Build biomarker trends usando el estado independiente de cada biomarcador
  // REGLA: NUNCA mostrar biomarcadores sin medición (value = null)
  // Solo mostrar biomarcadores que han sido medidos al menos una vez
  const biomarkers: BiomarkerTrend[] = biomarkerStates
    .filter((state): state is typeof state & { value: number; status: Status; lastMeasuredAt: string } => {
      // FILTRAR biomarcadores NO MEDIDOS
      // Solo mostrar si tiene valor y status
      // Type guard: después de este filtro, TypeScript sabe que value y status no son null
      return state.value !== null && state.status !== null && state.lastMeasuredAt !== null;
    })
    .map(state => {
      // Calcular tendencia SOLO si hay al menos 2 mediciones de este biomarcador
      let trend: BiomarkerTrendDirection = 'NONE';
      
      if (state.measurementCount >= 2 && state.previousValue !== null) {
        // Comparar última vs anterior para ESTE biomarcador específico
        trend = calculateBiomarkerTrend(
          state.value,
          state.previousValue,
          state.biomarker
        );
      }
      
      return {
        id: state.biomarker,
        value: state.value,
        status: state.status,
        traffic_light: statusToTrafficLight(state.status),
        trend,
        lastMeasuredAt: state.lastMeasuredAt,
        measurementCount: state.measurementCount
      };
    });
  
  // Format weekly actions (max 3)
  const formattedActions = weeklyActions
    .slice(0, 3)
    .map(formatWeeklyActionForDisplay);
  
  // ========================================
  // PASO 3: Calcular fiabilidad (cobertura de datos)
  // ========================================
  const { calculateReliability } = require('./biomarker-state.service');
  const reliabilityData = calculateReliability(biomarkerStates);
  
  return {
    health_score: currentScore,
    score_trend: scoreTrend,
    biomarkers,
    weekly_actions: formattedActions,
    hasBaseline,
    baselineDate,
    reliability: {
      percentage: reliabilityData.reliabilityPercentage,
      measuredCount: reliabilityData.measuredBiomarkersCount,
      totalCount: reliabilityData.totalBiomarkersCount
    }
  };
}

