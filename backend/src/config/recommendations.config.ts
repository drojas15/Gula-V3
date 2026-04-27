/**
 * RECOMMENDATIONS CONFIGURATION
 * 
 * This file contains recommendation keys (not human-readable text).
 * Frontend will translate these keys using i18n.
 * 
 * IMPORTANT: 
 * - Backend NEVER returns human-readable text - only keys
 * - MAX 3 recommendations per biomarker per status
 * - All keys in lowercase with dots (e.g., "ldl.reduce_saturated_fat")
 */

import { BiomarkerKey, Status } from './biomarkers.config';

export type RecommendationKeys = Record<BiomarkerKey, Record<Status, string[]>>;

/**
 * RECOMMENDATION KEYS
 * TODO: Complete recommendation keys will be provided by user
 */
export const RECOMMENDATION_KEYS: RecommendationKeys = {
  LDL: {
    OPTIMAL: ['ldl.maintain_diet', 'ldl.keep_exercise'],
    GOOD: ['ldl.reduce_saturated_fat', 'ldl.increase_fiber'],
    OUT_OF_RANGE: ['ldl.reduce_saturated_fat', 'ldl.increase_fiber', 'ldl.add_cardio'],
    CRITICAL: ['ldl.eliminate_trans_fats', 'ldl.daily_cardio', 'ldl.reduce_saturated_fat']
  },
  FASTING_GLUCOSE: {
    OPTIMAL: ['glucose.maintain_diet', 'glucose.keep_exercise'],
    GOOD: ['glucose.reduce_sugar', 'glucose.increase_fiber'],
    OUT_OF_RANGE: ['glucose.reduce_sugar', 'glucose.increase_fiber', 'glucose.add_cardio'],
    CRITICAL: ['glucose.urgent_medical_consult', 'glucose.eliminate_refined_sugar', 'glucose.daily_cardio']
  },
  TRIGLYCERIDES: {
    OPTIMAL: ['triglycerides.maintain_diet', 'triglycerides.keep_exercise'],
    GOOD: ['triglycerides.reduce_sugar', 'triglycerides.increase_fiber'],
    OUT_OF_RANGE: ['triglycerides.reduce_sugar', 'triglycerides.increase_fiber', 'triglycerides.add_cardio'],
    CRITICAL: ['triglycerides.urgent_medical_consult', 'triglycerides.eliminate_refined_sugar', 'triglycerides.daily_cardio']
  },
  VLDL: {
    OPTIMAL: ['vldl.maintain_diet', 'vldl.keep_exercise'],
    GOOD: ['vldl.reduce_sugar', 'vldl.increase_fiber'],
    OUT_OF_RANGE: ['vldl.reduce_sugar', 'vldl.increase_fiber', 'vldl.add_cardio'],
    CRITICAL: ['vldl.urgent_medical_consult', 'vldl.eliminate_refined_sugar', 'vldl.daily_cardio']
  },
  ALT: {
    OPTIMAL: ['alt.maintain_diet', 'alt.keep_exercise'],
    GOOD: ['alt.reduce_alcohol', 'alt.increase_water'],
    OUT_OF_RANGE: ['alt.reduce_alcohol', 'alt.increase_water', 'alt.add_cardio'],
    CRITICAL: ['alt.eliminate_alcohol', 'alt.daily_cardio', 'alt.increase_water']
  },
  HS_CRP: {
    OPTIMAL: ['crp.maintain_diet', 'crp.keep_exercise'],
    GOOD: ['crp.reduce_inflammation', 'crp.increase_omega3'],
    OUT_OF_RANGE: ['crp.reduce_inflammation', 'crp.increase_omega3', 'crp.add_cardio'],
    CRITICAL: ['crp.eliminate_processed_foods', 'crp.daily_cardio', 'crp.reduce_inflammation']
  },
  HDL: {
    OPTIMAL: ['hdl.maintain_diet', 'hdl.keep_exercise'],
    GOOD: ['hdl.increase_healthy_fats', 'hdl.add_cardio'],
    OUT_OF_RANGE: ['hdl.increase_healthy_fats', 'hdl.add_cardio', 'hdl.reduce_sugar'],
    CRITICAL: ['hdl.increase_healthy_fats', 'hdl.daily_cardio', 'hdl.add_cardio']
  },
  AST: {
    OPTIMAL: ['ast.maintain_diet', 'ast.keep_exercise'],
    GOOD: ['ast.reduce_alcohol', 'ast.increase_water'],
    OUT_OF_RANGE: ['ast.reduce_alcohol', 'ast.increase_water', 'ast.add_cardio'],
    CRITICAL: ['ast.eliminate_alcohol', 'ast.daily_cardio', 'ast.increase_water']
  },
  URIC_ACID: {
    OPTIMAL: ['uric_acid.maintain_diet', 'uric_acid.keep_exercise'],
    GOOD: ['uric_acid.reduce_purines', 'uric_acid.increase_water'],
    OUT_OF_RANGE: ['uric_acid.reduce_purines', 'uric_acid.increase_water', 'uric_acid.add_cardio'],
    CRITICAL: ['uric_acid.eliminate_purines', 'uric_acid.increase_water', 'uric_acid.reduce_purines']
  }
};

/**
 * Risk message keys for each biomarker and status
 * Format: {biomarker}.{status}.risk
 */
export function getRiskKey(biomarker: BiomarkerKey, status: Status): string {
  return `${biomarker.toLowerCase()}.${status.toLowerCase()}.risk`;
}

/**
 * Priority message keys
 * Format: {biomarker}.priority.{urgency}
 */
export function getPriorityKey(biomarker: BiomarkerKey, urgency: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  return `${biomarker.toLowerCase()}.priority.${urgency.toLowerCase()}`;
}

