/**
 * HEALTH SCORE CALCULATOR SERVICE
 * 
 * Calculates health score from biomarker evaluations.
 * 
 * Formula: round(Σ (biomarker_weight × status_multiplier))
 * 
 * IMPORTANT: This service is pure - no side effects.
 * Score recalculation is event-driven, not on-demand.
 */

import { BiomarkerEvaluation } from './biomarker-evaluator.service';
import { BIOMARKERS, MULTIPLIERS, BiomarkerKey } from '../config/biomarkers.config';

export interface HealthScoreResult {
  score: number; // 0-100
  contributions: Array<{
    biomarker: BiomarkerKey;
    weight: number;
    multiplier: number;
    contribution: number;
  }>;
}

/**
 * Calculates health score from biomarker evaluations
 * 
 * Formula: round(Σ (biomarker_weight × status_multiplier))
 * 
 * Example: LDL OUT_OF_RANGE → 15 × 0.40 = 6 pts
 * 
 * Final score: 0-100, deterministic, no magic, no opaque AI.
 */
export function calculateHealthScore(
  evaluations: BiomarkerEvaluation[]
): HealthScoreResult {
  const contributions = evaluations.map(evaluation => {
    const config = BIOMARKERS[evaluation.biomarker];
    if (!config) {
      throw new Error(`Unknown biomarker: ${evaluation.biomarker}`);
    }

    const multiplier = MULTIPLIERS[evaluation.status];
    const contribution = config.weight * multiplier;

    return {
      biomarker: evaluation.biomarker,
      weight: config.weight,
      multiplier,
      contribution
    };
  });

  const totalScore = contributions.reduce((sum, c) => sum + c.contribution, 0);
  const score = Math.round(totalScore);

  return {
    score: Math.max(0, Math.min(100, score)), // Clamp to 0-100
    contributions
  };
}

