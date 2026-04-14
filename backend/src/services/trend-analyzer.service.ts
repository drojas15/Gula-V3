/**
 * TREND ANALYZER SERVICE
 * 
 * Analyzes trends for biomarkers and health score.
 * 
 * IMPORTANT: Trends are calculated from actual exam data only.
 * Not from actions or habits.
 */

import { BiomarkerKey } from '../config/biomarkers.config';
import { calculateBiomarkerTrend, calculateScoreTrend } from './dashboard.service';

export interface BiomarkerTrendData {
  biomarker: BiomarkerKey;
  currentValue: number;
  previousValue: number | null;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE';
}

export interface ScoreTrendData {
  currentScore: number;
  previousScore: number | null;
  trend: 'UP' | 'STABLE' | 'DOWN' | 'NONE';
}

/**
 * Analyzes trends for all biomarkers
 * 
 * Uses normalized delta with 3% threshold (anti-noise).
 */
export function analyzeBiomarkerTrends(
  currentValues: Array<{ biomarker: BiomarkerKey; value: number }>,
  previousValues: Array<{ biomarker: BiomarkerKey; value: number }> | null
): BiomarkerTrendData[] {
  return currentValues.map(current => {
    const previous = previousValues?.find(
      p => p.biomarker === current.biomarker
    );

    const trend = calculateBiomarkerTrend(
      current.value,
      previous?.value || null,
      current.biomarker
    );

    return {
      biomarker: current.biomarker,
      currentValue: current.value,
      previousValue: previous?.value || null,
      trend
    };
  });
}

/**
 * Analyzes health score trend
 * 
 * Uses 2-point threshold to avoid false "improved" signals.
 */
export function analyzeScoreTrend(
  currentScore: number,
  previousScore: number | null
): ScoreTrendData {
  const trend = calculateScoreTrend(currentScore, previousScore);

  return {
    currentScore,
    previousScore,
    trend
  };
}

