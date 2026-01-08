/**
 * BIOMARKERS CONFIGURATION
 * 
 * This file contains the exact 10 biomarkers with their weights and units.
 * Reference ranges and recommendations will be added when provided.
 * 
 * IMPORTANT: All biomarker logic in English (code, keys, comments)
 */

export type BiomarkerKey = 
  | 'LDL'
  | 'HBA1C'
  | 'FASTING_GLUCOSE'
  | 'TRIGLYCERIDES'
  | 'ALT'
  | 'HS_CRP'
  | 'CRP_STANDARD'  // PCR normal - NO entra al score
  | 'HDL'
  | 'AST'
  | 'EGFR'
  | 'URIC_ACID';

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
 * BIOMARKERS - 10 principales + informativos
 * 
 * PESOS V1 (OFICIAL)
 * - Representan la importancia relativa de cada biomarcador
 * - Se usan para calcular fiabilidad del Health Score
 * - Biomarcadores cardiometabólicos tienen mayor peso
 * - AST/Uric Acid tienen menor peso por ser contextuales
 * 
 * REGLAS:
 * - PESO > 0: Entra al health score y fiabilidad
 * - PESO = 0: NO entra al score (solo informativo)
 * - NO hardcodear pesos en lógica
 * - Pesos SOLO viven en este config
 * 
 * BIOMARCADORES INFORMATIVOS (peso 0):
 * - CRP_STANDARD: PCR normal (NO ultrasensible)
 *   * Rangos diferentes a HS_CRP
 *   * No se compara con HS_CRP
 *   * No afecta health score
 */
export const BIOMARKERS: Record<BiomarkerKey, BiomarkerConfig> = {
  LDL: { weight: 1.5, unit: 'mg/dL' },
  HBA1C: { weight: 1.8, unit: '%' },
  FASTING_GLUCOSE: { weight: 1.5, unit: 'mg/dL' },
  TRIGLYCERIDES: { weight: 1.2, unit: 'mg/dL' },
  HDL: { weight: 1.2, unit: 'mg/dL' },
  HS_CRP: { weight: 1.3, unit: 'mg/L' },      // PCR ultrasensible
  CRP_STANDARD: { weight: 0, unit: 'mg/L' },  // PCR normal (informativo)
  ALT: { weight: 1.0, unit: 'U/L' },
  AST: { weight: 0.8, unit: 'U/L' },
  EGFR: { weight: 1.0, unit: 'ml/min' },
  URIC_ACID: { weight: 0.8, unit: 'mg/dL' }
};

/**
 * REFERENCE RANGES - PREVENCIÓN MVP (V1)
 * 
 * IMPORTANTE: Estos son rangos de PREVENCIÓN/RIESGO, no rangos de laboratorio.
 * El objetivo es detectar riesgo temprano, no esperar a valores "fuera de rango clínico".
 * 
 * NOTAS:
 * - LOWER_IS_BETTER: LDL, Triglycerides, Glucose, HbA1c, ALT, AST, hs-CRP, Uric Acid
 * - HIGHER_IS_BETTER: HDL, eGFR
 * - Si un biomarcador no viene en el último examen: conservar último valor y fecha
 * - NUNCA renderizar 0 por ausencia
 * 
 * UI: Mostrar etiqueta "Rangos de prevención" para contexto
 */
export const RANGES: BiomarkerRanges = {
  // LDL (mg/dL) - LOWER_IS_BETTER
  // Prevención cardiovascular poblacional (coherente con guías LATAM)
  LDL: {
    OPTIMAL: { max: 99 },
    GOOD: { min: 100, max: 129 },
    OUT_OF_RANGE: { min: 130, max: 189 },
    CRITICAL: { min: 190 }
  },
  
  // HbA1c (%) - LOWER_IS_BETTER
  // Prevención diabetes: detectar prediabetes temprano
  HBA1C: {
    OPTIMAL: { min: 0, max: 5.3 },
    GOOD: { min: 5.4, max: 5.6 },
    OUT_OF_RANGE: { min: 5.7, max: 6.4 },
    CRITICAL: { min: 6.5 }
  },
  
  // Glucose fasting (mg/dL) - LOWER_IS_BETTER (con piso fisiológico)
  // Nota: valores <70 se marcan como OUT_OF_RANGE por hipoglucemia
  FASTING_GLUCOSE: {
    OPTIMAL: { min: 70, max: 90 },
    GOOD: { min: 91, max: 99 },
    OUT_OF_RANGE: { min: 100, max: 125 },
    CRITICAL: { min: 126 }
  },
  
  // Triglycerides (mg/dL) - LOWER_IS_BETTER
  // Valores >500 son emergencia metabólica
  TRIGLYCERIDES: {
    OPTIMAL: { min: 0, max: 99 },
    GOOD: { min: 100, max: 149 },
    OUT_OF_RANGE: { min: 150, max: 499 },
    CRITICAL: { min: 500 }
  },
  
  // HDL (mg/dL) - HIGHER_IS_BETTER
  // Colesterol "bueno": más alto es mejor (cardioprotector)
  // Rangos generales; sex-specific consideración futura
  HDL: {
    OPTIMAL: { min: 60 },
    GOOD: { min: 40, max: 59 },
    OUT_OF_RANGE: { min: 30, max: 39 },
    CRITICAL: { max: 29 }
  },
  
  // ALT / TGP (U/L) - LOWER_IS_BETTER
  // Salud hepática: valores más estrictos para prevención
  ALT: {
    OPTIMAL: { min: 0, max: 25 },
    GOOD: { min: 26, max: 40 },
    OUT_OF_RANGE: { min: 41, max: 80 },
    CRITICAL: { min: 81 }
  },
  
  // AST / TGO (U/L) - LOWER_IS_BETTER
  // Complemento de ALT para función hepática
  AST: {
    OPTIMAL: { min: 0, max: 25 },
    GOOD: { min: 26, max: 40 },
    OUT_OF_RANGE: { min: 41, max: 80 },
    CRITICAL: { min: 81 }
  },
  
  // hs-CRP / PCR ultrasensible (mg/L) - LOWER_IS_BETTER
  // CRÍTICO: NO usar el rango "laboratorio" de 0-5 mg/L
  // Riesgo CV: <1 bajo, 1-3 moderado, >3 alto
  // >10 suele indicar inflamación aguda → NO usar para score cardiovascular
  HS_CRP: {
    OPTIMAL: { max: 1.0 },
    GOOD: { min: 1.0, max: 3.0 },
    OUT_OF_RANGE: { min: 3.1, max: 10.0 },
    CRITICAL: { min: 10.1 }
  },
  
  // CRP_STANDARD / PCR normal (mg/L) - INFORMATIVO SOLO
  // CRÍTICO: Rangos MUY DIFERENTES a HS_CRP
  // NUNCA comparar con HS_CRP
  // NO entra al health score (peso = 0)
  // Rango normal de laboratorio: <5 mg/L
  // >10 indica inflamación/infección activa
  CRP_STANDARD: {
    OPTIMAL: { max: 3.0 },
    GOOD: { min: 3.1, max: 10.0 },
    OUT_OF_RANGE: { min: 10.1, max: 50.0 },
    CRITICAL: { min: 50.1 }
  },
  
  // eGFR (mL/min/1.73m²) - HIGHER_IS_BETTER
  // Función renal: <60 es enfermedad renal crónica (ERC)
  EGFR: {
    OPTIMAL: { min: 90 },
    GOOD: { min: 75, max: 89 },
    OUT_OF_RANGE: { min: 60, max: 74 },
    CRITICAL: { max: 59 }
  },
  
  // Uric Acid (mg/dL) - LOWER_IS_BETTER
  // Gota y riesgo metabólico
  URIC_ACID: {
    OPTIMAL: { min: 0, max: 5.5 },
    GOOD: { min: 5.6, max: 6.8 },
    OUT_OF_RANGE: { min: 6.9, max: 9.0 },
    CRITICAL: { min: 9.1 }
  }
};

/**
 * Status multipliers for scoring (deterministic)
 * 
 * health_score = round(Σ (biomarker_weight × status_multiplier))
 * 
 * Example: LDL OUT_OF_RANGE → 15 × 0.40 = 6 pts
 */
export const MULTIPLIERS: Record<Status, number> = {
  OPTIMAL: 1.00,
  GOOD: 0.75,
  OUT_OF_RANGE: 0.40,
  CRITICAL: 0.10
};

/**
 * Traffic light mapping
 */
export const TRAFFIC_LIGHT_MAP: Record<Status, TrafficLight> = {
  OPTIMAL: 'GREEN',
  GOOD: 'YELLOW',
  OUT_OF_RANGE: 'ORANGE',
  CRITICAL: 'RED'
};

