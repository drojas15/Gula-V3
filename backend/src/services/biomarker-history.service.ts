/**
 * BIOMARKER HISTORY SERVICE
 * 
 * Handles biomarker history queries and graph data preparation.
 * 
 * IMPORTANT:
 * - Historical data is immutable
 * - Never recalculate historical status
 * - Data comes from biomarker_result table
 * - exam_date is real exam date, NOT upload date
 */

import { BiomarkerKey, Status, RANGES, BIOMARKERS } from '../config/biomarkers.config';
import { BiomarkerHistoryData, BiomarkerHistoryPoint } from '../models/BiomarkerResult.model';
import { calculateBiomarkerTrend } from './dashboard.service';
import { getBiomarkerHistoryFromDB } from './weekly-actions-db.service';

/**
 * Gets biomarker history for a user
 * 
 * Query:
 * SELECT exam_date, value, status_at_time, unit
 * FROM biomarker_result
 * WHERE user_id = ?
 *   AND biomarker_code = ?
 * ORDER BY exam_date ASC
 * 
 * IMPORTANT: exam_date is real exam date, NOT upload date.
 * status_at_time is immutable - never recalculate.
 */
export async function getBiomarkerHistory(
  userId: string,
  biomarker: BiomarkerKey
): Promise<BiomarkerHistoryPoint[]> {
  // Get from database
  const dbResults = await getBiomarkerHistoryFromDB(userId, biomarker);

  // Convert to BiomarkerHistoryPoint format
  return dbResults.map(result => ({
    exam_date: result.exam_date.toISOString().split('T')[0], // YYYY-MM-DD
    value: result.value,
    status_at_time: result.status_at_time as Status,
    unit: result.unit
  }));
}

/**
 * Calculates threshold lines from biomarker config
 * 
 * These lines are static and global.
 * They do NOT depend on user data.
 */
export function getThresholdLines(biomarker: BiomarkerKey): {
  optimal_upper_bound: number | null;
  good_upper_bound: number | null;
  out_of_range_upper_bound: number | null;
} {
  const ranges = RANGES[biomarker];
  if (!ranges) {
    return {
      optimal_upper_bound: null,
      good_upper_bound: null,
      out_of_range_upper_bound: null
    };
  }

  return {
    optimal_upper_bound: ranges.OPTIMAL?.max || null,
    good_upper_bound: ranges.GOOD?.max || null,
    out_of_range_upper_bound: ranges.OUT_OF_RANGE?.max || null
  };
}

/**
 * Detects time gaps between exams (> 90 days)
 */
export function detectTimeGaps(
  points: BiomarkerHistoryPoint[]
): Array<{ from_date: string; to_date: string; days: number }> {
  const gaps: Array<{ from_date: string; to_date: string; days: number }> = [];

  for (let i = 1; i < points.length; i++) {
    const fromDate = new Date(points[i - 1].exam_date);
    const toDate = new Date(points[i].exam_date);
    const daysDiff = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 90) {
      gaps.push({
        from_date: points[i - 1].exam_date,
        to_date: points[i].exam_date,
        days: daysDiff
      });
    }
  }

  return gaps;
}

/**
 * Determines empty state
 */
export function getEmptyState(points: BiomarkerHistoryPoint[]): 'NO_EXAMS' | 'ONE_EXAM' | 'HAS_DATA' {
  if (points.length === 0) {
    return 'NO_EXAMS';
  } else if (points.length === 1) {
    return 'ONE_EXAM';
  } else {
    return 'HAS_DATA';
  }
}

/**
 * Calculates trend from last two exams
 * 
 * COMPARISON RULE:
 * - State and copy use ONLY last exam vs second-to-last exam
 * - Graphs use full historical data (all points)
 * 
 * This function is used for:
 * 1. Dashboard state/copy (last 2 exams only)
 * 2. Graph trend indicator (last 2 exams only)
 * 
 * The graph itself shows ALL historical points.
 * 
 * delta = (last_value - previous_value) / previous_value
 * 
 * Noise threshold: |delta| < 3% → STABLE
 * 
 * Direction depends on biomarker:
 * - LDL, TG, Glucose, ALT, AST, hsCRP, Uric Acid: lower is better
 * - HDL, eGFR: higher is better
 */
export function calculateHistoryTrend(
  points: BiomarkerHistoryPoint[],
  biomarker: BiomarkerKey
): 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE' {
  // Need at least 2 exams for comparison
  if (points.length < 2) {
    return 'NONE';
  }

  // Get last two exams (most recent first)
  // Points are ordered by exam_date ASC, so last = most recent
  const lastPoint = points[points.length - 1];
  const previousPoint = points[points.length - 2];
  
  // Calculate trend using ONLY last 2 exams
  // This ensures state/copy reflects last vs second-to-last
  // Graph will show all points, but trend indicator uses only these 2
  const trend = calculateBiomarkerTrend(
    lastPoint.value,
    previousPoint.value,
    biomarker
  );

  // Map BiomarkerTrendDirection to history trend
  if (trend === 'IMPROVING') return 'IMPROVING';
  if (trend === 'WORSENING') return 'WORSENING';
  if (trend === 'STABLE') return 'STABLE';
  return 'NONE';
}

/**
 * Builds complete biomarker history data for graph
 * 
 * Returns data ready for frontend graph rendering.
 */
export async function buildBiomarkerHistoryData(
  userId: string,
  biomarker: BiomarkerKey
): Promise<BiomarkerHistoryData> {
  // Get history points
  const points = await getBiomarkerHistory(userId, biomarker);

  // Get unit from first point or config
  const unit = points.length > 0 
    ? points[0].unit 
    : BIOMARKERS[biomarker].unit;

  // Calculate trend (last 2 exams only)
  const trend = calculateHistoryTrend(points, biomarker);

  // Get threshold lines (static, from config)
  const thresholdLines = getThresholdLines(biomarker);

  // Detect time gaps (> 90 days)
  const timeGaps = detectTimeGaps(points);

  // Determine empty state
  const emptyState = getEmptyState(points);

  // Trend message key
  const trendMessageKey = trend === 'NONE' 
    ? 'biomarker_history.no_trend'
    : `biomarker_history.trend.${trend.toLowerCase()}`;

  return {
    biomarker,
    unit,
    points,
    trend,
    trend_message_key: trendMessageKey,
    threshold_lines: thresholdLines,
    empty_state: emptyState,
    time_gaps: timeGaps
  };
}

