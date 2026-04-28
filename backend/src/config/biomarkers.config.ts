/**
 * BIOMARKERS CONFIGURATION
 *
 * 9 biomarcadores activos. Rangos de PREVENCIÓN (no laboratorio clásico).
 * HDL, ALT, AST y URIC_ACID tienen rangos diferenciados por sexo.
 */

export type BiomarkerKey =
  | 'LDL'
  | 'FASTING_GLUCOSE'
  | 'TRIGLYCERIDES'
  | 'VLDL'
  | 'HDL'
  | 'ALT'
  | 'AST'
  | 'URIC_ACID'
  | 'HS_CRP';

export type Status = 'OPTIMAL' | 'GOOD' | 'OUT_OF_RANGE' | 'CRITICAL';
export type TrafficLight = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface BiomarkerConfig {
  weight: number;
  unit: string;
}

export interface RangeConfig {
  OPTIMAL?: { min?: number; max?: number };
  GOOD?: { min?: number; max?: number };
  OUT_OF_RANGE?: { min?: number; max?: number };
  CRITICAL?: { min?: number; max?: number };
}

export interface BiomarkerRanges {
  [key: string]: RangeConfig;
}

/**
 * PESOS — importancia relativa en el health score
 * LOWER_IS_BETTER: LDL, FASTING_GLUCOSE, TRIGLYCERIDES, VLDL, ALT, AST, HS_CRP, URIC_ACID
 * HIGHER_IS_BETTER: HDL
 */
export const BIOMARKERS: Record<BiomarkerKey, BiomarkerConfig> = {
  FASTING_GLUCOSE: { weight: 1.8, unit: 'mg/dL' },
  LDL:             { weight: 1.6, unit: 'mg/dL' },
  HDL:             { weight: 1.4, unit: 'mg/dL' },
  TRIGLYCERIDES:   { weight: 1.3, unit: 'mg/dL' },
  VLDL:            { weight: 1.2, unit: 'mg/dL' },
  HS_CRP:          { weight: 1.2, unit: 'mg/L'  },
  ALT:             { weight: 1.1, unit: 'U/L'   },
  AST:             { weight: 1.0, unit: 'U/L'   },
  URIC_ACID:       { weight: 1.0, unit: 'mg/dL' },
};

// ─────────────────────────────────────────────────────────────────────────────
// RANGOS MASCULINOS
// ─────────────────────────────────────────────────────────────────────────────
export const RANGES_MALE: BiomarkerRanges = {
  // LDL (mg/dL) — LOWER_IS_BETTER — prevención cardiovascular LATAM
  LDL: {
    OPTIMAL:      { max: 99 },
    GOOD:         { min: 100, max: 129 },
    OUT_OF_RANGE: { min: 130, max: 189 },
    CRITICAL:     { min: 190 },
  },

  // Glucosa en ayunas (mg/dL) — LOWER_IS_BETTER — piso fisiológico 70
  FASTING_GLUCOSE: {
    OPTIMAL:      { min: 70, max: 90  },
    GOOD:         { min: 91, max: 99  },
    OUT_OF_RANGE: { min: 100, max: 125 },
    CRITICAL:     { min: 126 },
  },

  // Triglicéridos (mg/dL) — LOWER_IS_BETTER
  TRIGLYCERIDES: {
    OPTIMAL:      { min: 0,   max: 99  },
    GOOD:         { min: 100, max: 149 },
    OUT_OF_RANGE: { min: 150, max: 499 },
    CRITICAL:     { min: 500 },
  },

  // VLDL (mg/dL) — LOWER_IS_BETTER — sin diferencia por sexo — solo 2 estados
  VLDL: {
    OPTIMAL:  { min: 0, max: 40 },
    CRITICAL: { min: 41 },
  },

  // HDL (mg/dL) — HIGHER_IS_BETTER — AHA/ACC, hombre
  HDL: {
    OPTIMAL:      { min: 55 },
    GOOD:         { min: 40, max: 54 },
    OUT_OF_RANGE: { min: 30, max: 39 },
    CRITICAL:     { max: 29 },
  },

  // ALT / TGP (U/L) — LOWER_IS_BETTER — AASLD 2023, hombre
  ALT: {
    OPTIMAL:      { min: 0,  max: 25 },
    GOOD:         { min: 26, max: 40 },
    OUT_OF_RANGE: { min: 41, max: 80 },
    CRITICAL:     { min: 81 },
  },

  // AST / TGO (U/L) — LOWER_IS_BETTER — AASLD 2023, hombre
  AST: {
    OPTIMAL:      { min: 0,  max: 25 },
    GOOD:         { min: 26, max: 40 },
    OUT_OF_RANGE: { min: 41, max: 80 },
    CRITICAL:     { min: 81 },
  },

  // Ácido Úrico (mg/dL) — LOWER_IS_BETTER — EULAR, hombre
  URIC_ACID: {
    OPTIMAL:      { min: 0,   max: 5.5 },
    GOOD:         { min: 5.6, max: 6.8 },
    OUT_OF_RANGE: { min: 6.9, max: 9.0 },
    CRITICAL:     { min: 9.1 },
  },

  // hs-CRP (mg/L) — LOWER_IS_BETTER — riesgo CV, sin diferencia por sexo
  HS_CRP: {
    OPTIMAL:      { max: 1.0 },
    GOOD:         { min: 1.0,  max: 3.0  },
    OUT_OF_RANGE: { min: 3.1,  max: 10.0 },
    CRITICAL:     { min: 10.1 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RANGOS FEMENINOS
// Solo difieren: HDL, ALT, AST, URIC_ACID
// ─────────────────────────────────────────────────────────────────────────────
export const RANGES_FEMALE: BiomarkerRanges = {
  ...RANGES_MALE,

  // HDL (mg/dL) — HIGHER_IS_BETTER — AHA/ACC, mujer
  HDL: {
    OPTIMAL:      { min: 65 },
    GOOD:         { min: 50, max: 64 },
    OUT_OF_RANGE: { min: 35, max: 49 },
    CRITICAL:     { max: 34 },
  },

  // ALT / TGP (U/L) — LOWER_IS_BETTER — AASLD 2023, mujer
  ALT: {
    OPTIMAL:      { min: 0,  max: 20 },
    GOOD:         { min: 21, max: 32 },
    OUT_OF_RANGE: { min: 33, max: 65 },
    CRITICAL:     { min: 66 },
  },

  // AST / TGO (U/L) — LOWER_IS_BETTER — AASLD 2023, mujer
  AST: {
    OPTIMAL:      { min: 0,  max: 20 },
    GOOD:         { min: 21, max: 32 },
    OUT_OF_RANGE: { min: 33, max: 65 },
    CRITICAL:     { min: 66 },
  },

  // Ácido Úrico (mg/dL) — LOWER_IS_BETTER — EULAR, mujer
  URIC_ACID: {
    OPTIMAL:      { min: 0,   max: 4.5 },
    GOOD:         { min: 4.6, max: 5.8 },
    OUT_OF_RANGE: { min: 5.9, max: 7.5 },
    CRITICAL:     { min: 7.6 },
  },
};

/**
 * Devuelve los rangos correspondientes al sexo del usuario.
 * Default: MALE (para retrocompatibilidad en casos sin sex).
 */
export function getRangesForSex(sex?: 'M' | 'F'): BiomarkerRanges {
  return sex === 'F' ? RANGES_FEMALE : RANGES_MALE;
}

/** Alias backward-compatible */
export const RANGES: BiomarkerRanges = RANGES_MALE;

/**
 * Status multipliers para el health score (determinístico)
 * health_score = round(Σ (weight × multiplier) / Σ weight × 100)
 */
export const MULTIPLIERS: Record<Status, number> = {
  OPTIMAL:      1.00,
  GOOD:         0.75,
  OUT_OF_RANGE: 0.40,
  CRITICAL:     0.10,
};

export const TRAFFIC_LIGHT_MAP: Record<Status, TrafficLight> = {
  OPTIMAL:      'GREEN',
  GOOD:         'YELLOW',
  OUT_OF_RANGE: 'ORANGE',
  CRITICAL:     'RED',
};
