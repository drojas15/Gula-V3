/**
 * SCORING ENGINE SERVICE (CORE LOGIC)
 * 
 * This is the core IP of GULA. All medical logic is calculated here.
 * Frontend NEVER calculates medical logic - only displays results.
 * 
 * IMPORTANT: This service is stateless and deterministic.
 */

import {
  BIOMARKERS,
  RANGES,
  MULTIPLIERS,
  TRAFFIC_LIGHT_MAP,
  BiomarkerKey,
  Status,
  TrafficLight
} from '../config/biomarkers.config';
import { RECOMMENDATION_KEYS, getRiskKey } from '../config/recommendations.config';
import { evaluateBiomarker } from './biomarker-evaluator.service';

export interface BiomarkerValue {
  biomarker: BiomarkerKey;
  value: number;
  unit: string;
}

export interface AnalyzedBiomarker {
  biomarker: BiomarkerKey;
  value: number;
  unit: string;
  status: Status;
  trafficLight: TrafficLight;
  weight: number;
  contribution: number; // weight * multiplier
  contribution_percentage: number; // (contribution / total_weight) * 100
  riskKey: string;
  recommendationKeys: string[];
}

export interface HealthScoreResult {
  totalScore: number;
  biomarkers: AnalyzedBiomarker[];
  priorities: Priority[];
}

export interface Priority {
  biomarker: BiomarkerKey;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  messageKey: string;
  contribution_percentage: number;
}

/**
 * Determines the status of a biomarker value based on reference ranges
 */
export function determineStatus(biomarker: BiomarkerKey, value: number): Status {
  const ranges = RANGES[biomarker];
  if (!ranges) {
    throw new Error(`No ranges defined for biomarker: ${biomarker}`);
  }

  // Check in order: CRITICAL -> OUT_OF_RANGE -> GOOD -> OPTIMAL
  // This ensures we catch the most severe status first
  
  if (matchesRange(value, ranges.CRITICAL)) {
    return 'CRITICAL';
  }
  
  if (matchesRange(value, ranges.OUT_OF_RANGE)) {
    return 'OUT_OF_RANGE';
  }
  
  if (matchesRange(value, ranges.GOOD)) {
    return 'GOOD';
  }
  
  if (matchesRange(value, ranges.OPTIMAL)) {
    return 'OPTIMAL';
  }

  // Default to OPTIMAL if no range matches (shouldn't happen with complete ranges)
  return 'OPTIMAL';
}

/**
 * Checks if a value matches a range configuration
 */
function matchesRange(value: number, range?: { min?: number; max?: number }): boolean {
  if (!range) return false;

  const { min, max } = range;

  // If both min and max are defined
  if (min !== undefined && max !== undefined) {
    return value >= min && value <= max;
  }

  // If only min is defined
  if (min !== undefined && max === undefined) {
    return value >= min;
  }

  // If only max is defined
  if (min === undefined && max !== undefined) {
    return value <= max;
  }

  return false;
}

/**
 * Calculates the health score from biomarker values
 * 
 * CRITICAL RULE: Score MUST be normalized to 0-100
 * 
 * Formula:
 *   1. score_raw = Σ (biomarker_weight × status_multiplier)
 *   2. score_max = Σ (biomarker_weight × 1.0)  // Only for MEASURED biomarkers
 *   3. health_score = round((score_raw / score_max) × 100)
 * 
 * Example: 
 *   - HDL (weight 1.0, OPTIMAL) → 1.0 × 1.00 = 1.0
 *   - LDL (weight 1.5, OUT_OF_RANGE) → 1.5 × 0.40 = 0.6
 *   - Total: score_raw = 1.6, score_max = 2.5
 *   - Result: (1.6 / 2.5) × 100 = 64
 * 
 * Final score: ALWAYS 0-100, deterministic, no magic, no opaque AI.
 * 
 * NOTE: For event-driven recalculation, use HealthScoreCalculator service directly.
 * This function is kept for backward compatibility with existing code.
 */
export function calculateHealthScore(biomarkerValues: BiomarkerValue[]): number {
  let scoreRaw = 0;
  let scoreMax = 0;

  for (const biomarkerValue of biomarkerValues) {
    const config = BIOMARKERS[biomarkerValue.biomarker];
    if (!config) {
      console.warn(`Unknown biomarker: ${biomarkerValue.biomarker}, skipping`);
      continue;
    }

    // Skip biomarkers with weight = 0 (informativos, no afectan score)
    // Ejemplo: CRP_STANDARD (PCR normal) tiene peso 0
    if (config.weight === 0) {
      console.log(`[Score] Skipping ${biomarkerValue.biomarker} (weight = 0, informativo)`);
      continue;
    }

    const status = determineStatus(biomarkerValue.biomarker, biomarkerValue.value);
    const multiplier = MULTIPLIERS[status];

    // Accumulate raw score and max possible score
    scoreRaw += config.weight * multiplier;
    scoreMax += config.weight * 1.0; // Max multiplier is always 1.0 (OPTIMAL)
  }

  // Normalize to 0-100
  if (scoreMax === 0) {
    return 0; // Edge case: no biomarkers measured
  }

  const normalizedScore = (scoreRaw / scoreMax) * 100;

  // Round and ensure bounds [0, 100]
  return Math.round(Math.max(0, Math.min(100, normalizedScore)));
}

/**
 * Analyzes a single biomarker value
 * 
 * Contribution = weight × multiplier
 * Example: LDL OUT_OF_RANGE → 15 × 0.40 = 6 pts
 * 
 * Uses BiomarkerEvaluator service for status determination.
 */
export function analyzeBiomarker(
  biomarkerValue: BiomarkerValue
): AnalyzedBiomarker {
  const { biomarker, value, unit } = biomarkerValue;
  
  // Use BiomarkerEvaluator service
  const evaluation = evaluateBiomarker(biomarker, value, unit);
  
  const config = BIOMARKERS[biomarker];
  if (!config) {
    throw new Error(`Unknown biomarker: ${biomarker}`);
  }

  const trafficLight = TRAFFIC_LIGHT_MAP[evaluation.status];
  const multiplier = MULTIPLIERS[evaluation.status];
  const contribution = config.weight * multiplier;
  
  // Contribution percentage: contribution / max_possible_contribution
  // Max possible = weight × 1.00 (OPTIMAL)
  const maxContribution = config.weight * 1.00;
  const contribution_percentage = maxContribution > 0 
    ? (contribution / maxContribution) * 100 
    : 0;
  
  const riskKey = getRiskKey(biomarker, evaluation.status);
  const recommendationKeys = RECOMMENDATION_KEYS[biomarker][evaluation.status] || [];

  return {
    biomarker,
    value,
    unit,
    status: evaluation.status,
    trafficLight,
    weight: config.weight,
    contribution,
    contribution_percentage: Math.round(contribution_percentage * 100) / 100,
    riskKey,
    recommendationKeys
  };
}

/**
 * Calculates health score and analyzes all biomarkers
 * 
 * Formula: round(Σ (biomarker_weight × status_multiplier))
 * Final score: 0-100, deterministic, no magic, no opaque AI.
 */
export function calculateHealthScoreWithAnalysis(
  biomarkerValues: BiomarkerValue[]
): HealthScoreResult {
  // Analyze each biomarker
  const analyzedBiomarkers = biomarkerValues.map(bv => analyzeBiomarker(bv));
  const totalScore = calculateHealthScore(biomarkerValues);
  const priorities = determinePriorities(analyzedBiomarkers);

  return {
    totalScore,
    biomarkers: analyzedBiomarkers,
    priorities
  };
}

/**
 * Determines top 3 priorities based on biomarker status and contribution
 */
function determinePriorities(analyzedBiomarkers: AnalyzedBiomarker[]): Priority[] {
  // Sort by urgency: CRITICAL > OUT_OF_RANGE > GOOD > OPTIMAL
  // Within same status, sort by weight (higher weight = higher priority)
  const sorted = [...analyzedBiomarkers].sort((a, b) => {
    const statusOrder: Record<Status, number> = {
      CRITICAL: 4,
      OUT_OF_RANGE: 3,
      GOOD: 2,
      OPTIMAL: 1
    };

    const statusDiff = statusOrder[b.status] - statusOrder[a.status];
    if (statusDiff !== 0) return statusDiff;

    // If same status, sort by weight (descending)
    return b.weight - a.weight;
  });

  // Take top 3 and map to priorities
  const top3 = sorted.slice(0, 3).map(biomarker => {
    let urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    if (biomarker.status === 'CRITICAL' || biomarker.status === 'OUT_OF_RANGE') {
      urgency = 'HIGH';
    } else if (biomarker.status === 'GOOD') {
      urgency = 'MEDIUM';
    } else {
      urgency = 'LOW';
    }

    return {
      biomarker: biomarker.biomarker,
      urgency,
      messageKey: `${biomarker.biomarker.toLowerCase()}.priority.${urgency.toLowerCase()}`,
      contribution_percentage: biomarker.contribution_percentage
    };
  });

  return top3;
}

