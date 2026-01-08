/**
 * BIOMARKER EVALUATOR SERVICE
 * 
 * Evaluates biomarker values and determines status.
 * Pure function - no side effects.
 */

import { BiomarkerKey, Status, RANGES } from '../config/biomarkers.config';

export interface BiomarkerEvaluation {
  biomarker: BiomarkerKey;
  value: number;
  unit: string;
  status: Status;
}

/**
 * Evaluates a single biomarker value
 * 
 * Status resolution:
 * - If value ∈ optimal_range → OPTIMAL
 * - Else if ∈ good_range → GOOD
 * - Else if ∈ out_of_range → OUT_OF_RANGE
 * - Else → CRITICAL
 */
export function evaluateBiomarker(
  biomarker: BiomarkerKey,
  value: number,
  unit: string
): BiomarkerEvaluation {
  const ranges = RANGES[biomarker];
  if (!ranges) {
    throw new Error(`No ranges defined for biomarker: ${biomarker}`);
  }

  // Check in order: CRITICAL -> OUT_OF_RANGE -> GOOD -> OPTIMAL
  const status = determineStatus(biomarker, value);

  return {
    biomarker,
    value,
    unit,
    status
  };
}

/**
 * Determines status from value and ranges
 */
function determineStatus(biomarker: BiomarkerKey, value: number): Status {
  const ranges = RANGES[biomarker];
  
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

  // Default to OPTIMAL if no range matches
  return 'OPTIMAL';
}

/**
 * Checks if a value matches a range configuration
 */
function matchesRange(value: number, range?: { min?: number; max?: number }): boolean {
  if (!range) return false;

  const { min, max } = range;

  if (min !== undefined && max !== undefined) {
    return value >= min && value <= max;
  }

  if (min !== undefined && max === undefined) {
    return value >= min;
  }

  if (min === undefined && max !== undefined) {
    return value <= max;
  }

  return false;
}

/**
 * Evaluates multiple biomarkers
 */
export function evaluateBiomarkers(
  biomarkerValues: Array<{ biomarker: BiomarkerKey; value: number; unit: string }>
): BiomarkerEvaluation[] {
  return biomarkerValues.map(bv => 
    evaluateBiomarker(bv.biomarker, bv.value, bv.unit)
  );
}

