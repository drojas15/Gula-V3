/**
 * BIOMARKER ALIAS RESOLUTION SERVICE
 * 
 * Handles Spanish LATAM biomarker name aliases and normalization.
 * Maps various lab report formats to canonical biomarker codes.
 */

import { BiomarkerKey } from '../config/biomarkers.config';

/**
 * Canonical biomarker codes (English, internal only)
 */
export type CanonicalBiomarker = 
  | 'LDL'
  | 'TRIGLYCERIDES'
  | 'HDL'
  | 'GLUCOSE_FASTING'
  | 'HBA1C'
  | 'ALT'
  | 'AST'
  | 'HS_CRP'          // PCR ultrasensible
  | 'CRP_STANDARD'    // PCR normal
  | 'CREATININE'
  | 'EGFR'
  | 'URIC_ACID';

/**
 * BIOMARKER ALIASES - GULA V1 (OFICIAL)
 * 
 * Un biomarcador clínico = UNA key interna
 * Muchos nombres externos → una sola key
 * Los aliases SOLO afectan parsing
 * Los aliases NO afectan score, lógica ni pesos
 * 
 * Matching is done using CONTAINS after normalization:
 * - Lowercase
 * - Sin tildes/acentos
 * - Trim espacios
 */
export const BIOMARKER_ALIASES: Record<CanonicalBiomarker, string[]> = {
  // LDL - Colesterol de baja densidad
  LDL: [
    'LDL',
    'LDL-C',
    'COLESTEROL LDL',
    'LDL COLESTEROL',
    'COLESTEROL LDL DIRECTO',
    'COLESTEROL DE BAJA DENSIDAD',
    'LIPOPROTEINA DE BAJA DENSIDAD'
  ],
  
  // HDL - Colesterol de alta densidad
  HDL: [
    'HDL',
    'HDL-C',
    'COLESTEROL HDL',
    'HDL COLESTEROL',
    'COLESTEROL DE ALTA DENSIDAD',
    'LIPOPROTEINA DE ALTA DENSIDAD'
  ],
  
  // TRIGLYCERIDES - Triglicéridos
  TRIGLYCERIDES: [
    'TRIGLICERIDOS',
    'TRIGLICÉRIDOS',
    'TRIGLICERIDOS TOTALES',
    'TRIGLYCERIDES',
    'TG'
  ],
  
  // GLUCOSE_FASTING - Glucosa en ayunas
  // REGLA ESPECIAL: Si NO se menciona ayuno → marcar como contexto desconocido
  GLUCOSE_FASTING: [
    'GLUCOSA',
    'GLUCOSA EN AYUNAS',
    'GLUCOSA BASAL',
    'GLUCEMIA',
    'GLUCEMIA EN AYUNAS',
    'FASTING GLUCOSE',
    'BLOOD GLUCOSE FASTING',
    'GLUCOSA SUERO',
    'GLUCOSA (SUERO)'
  ],
  
  // HBA1C - Hemoglobina glicosilada
  HBA1C: [
    'HBA1C',
    'HB A1C',
    'A1C',
    'HEMOGLOBINA GLICOSILADA',
    'HEMOGLOBINA GLUCOSILADA',
    'HEMOGLOBINA A1C',
    'GLYCATED HEMOGLOBIN'
  ],
  
  // ALT - Alanina aminotransferasa
  ALT: [
    'ALT',
    'TGP',
    'GPT',
    'ALANINA AMINOTRANSFERASA',
    'ALANINE AMINOTRANSFERASE',
    'TRANSAMINASA GLUTAMICO PIRUVICA'
  ],
  
  // AST - Aspartato aminotransferasa
  AST: [
    'AST',
    'ASAT',
    'TGO',
    'GOT',
    'ASPARTATO AMINOTRANSFERASA',
    'ASPARTATE AMINOTRANSFERASE',
    'TRANSAMINASA GLUTAMICO OXALACETICA'
  ],
  // HS_CRP - PCR ultrasensible (ALTO VALOR CLÍNICO)
  // CRÍTICO: Solo mapear si menciona EXPLÍCITAMENTE "ultrasensible" o "high sensitivity"
  // NUNCA inferir HS_CRP si no está claro
  HS_CRP: [
    'PCR ULTRASENSIBLE',
    'HS-CRP',
    'HIGH SENSITIVITY CRP',
    'C-REACTIVE PROTEIN HIGH SENSITIVITY',
    'PROTEINA C REACTIVA ULTRASENSIBLE',
    'PCR US',
    'PCR HS',
    'PCR CUANTITATIVA ULTRASENSIBLE'
  ],
  
  // CRP_STANDARD - PCR normal (INFORMATIVO SOLO)
  // NO entra al health score (peso = 0)
  // Detecta cuando NO contiene "ultrasensible", "hs", "us", "high sensitivity"
  CRP_STANDARD: [
    'PROTEINA C REACTIVA',
    'PROTEÍNA C REACTIVA',
    'PCR',
    'CRP',
    'C-REACTIVE PROTEIN',
    'PROTEINA C REACTIVA CUANTITATIVA',
    'PCR CUANTITATIVA'
    // NOTA: "PCR" a secas se maneja con lógica especial en findCanonicalBiomarker
  ],
  
  // CREATININE - Creatinina (no se usa directamente, sirve para calcular eGFR)
  CREATININE: [
    'CREATININA',
    'CREATININA EN SUERO',
    'CREATININA SERICA'
  ],
  
  // EGFR - Filtrado glomerular estimado
  EGFR: [
    'EGFR',
    'TFG',
    'FILTRADO GLOMERULAR',
    'TASA DE FILTRACION GLOMERULAR',
    'TASA DE FILTRACIÓN GLOMERULAR',
    'ESTIMATED GFR',
    'MDRD',
    'CKD-EPI'
  ],
  
  // URIC_ACID - Ácido úrico
  URIC_ACID: [
    'ACIDO URICO',
    'ÁCIDO ÚRICO',
    'URIC ACID',
    'URATE',
    'URATO',
    'URATOS SERICOS',
    'URATOS SÉRICOS'
  ]
};

/**
 * Maps canonical biomarkers to internal BiomarkerKey
 * Note: GLUCOSE_FASTING maps to FASTING_GLUCOSE
 * Note: CREATININE is not directly used - eGFR is calculated from it
 * Note: HS_CRP and CRP_STANDARD are DISTINCT biomarkers
 */
export function mapCanonicalToBiomarkerKey(canonical: CanonicalBiomarker): BiomarkerKey | null {
  const mapping: Record<CanonicalBiomarker, BiomarkerKey | null> = {
    LDL: 'LDL',
    TRIGLYCERIDES: 'TRIGLYCERIDES',
    HDL: 'HDL',
    GLUCOSE_FASTING: 'FASTING_GLUCOSE',
    HBA1C: null,          // Removed from active biomarkers
    ALT: 'ALT',
    AST: 'AST',
    HS_CRP: 'HS_CRP',
    CRP_STANDARD: null,   // Removed from active biomarkers
    CREATININE: null,     // Used to calculate eGFR, not stored directly
    EGFR: null,           // Removed from active biomarkers
    URIC_ACID: 'URIC_ACID'
  };
  
  return mapping[canonical];
}

/**
 * Normalizes text for matching:
 * - Convert to UPPERCASE
 * - Remove accents / diacritics
 * - Normalize multiple spaces to single space
 */
export function normalizeText(text: string): string {
  // Convert to uppercase
  let normalized = text.toUpperCase();
  
  // Remove accents / diacritics
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Normalize multiple spaces and tabs to single space
  normalized = normalized.replace(/[\s\t]+/g, ' ').trim();
  
  return normalized;
}

/**
 * Finds canonical biomarker for a given text
 * Returns undefined if no match found
 * 
 * MATCHING STRATEGY (orden de prioridad):
 * 1. Exact match (igualdad exacta)
 * 2. Word boundary match (palabra completa)
 * 3. Contains match (contiene el alias)
 * 
 * Esto evita conflictos como TG capturando TGP/TGO
 * 
 * CRITICAL: Special handling for CRP/PCR
 * - If text contains "ultrasensible", "hs", "us" → HS_CRP
 * - If text contains "pcr" or "proteina c reactiva" without above → CRP_STANDARD
 * - NEVER assume HS_CRP by default
 */
export function findCanonicalBiomarker(text: string): CanonicalBiomarker | undefined {
  const normalized = normalizeText(text);
  
  // ============================================
  // SPECIAL CASE: CRP/PCR Detection
  // ============================================
  // Check if this is a CRP/PCR result
  const isPCR = normalized.includes('PCR') || 
                normalized.includes('PROTEINA C REACTIVA') ||
                normalized.includes('C REACTIVE PROTEIN') ||
                normalized.includes('C-REACTIVE PROTEIN') ||
                normalized.includes('CRP');
  
  if (isPCR) {
    // Check for ultrasensitive markers
    const isUltrasensitive = normalized.includes('ULTRASENSIBLE') ||
                             normalized.includes('HS-CRP') ||
                             normalized.includes('HSCRP') ||
                             normalized.includes('HS CRP') ||
                             normalized.includes('PCR HS') ||
                             normalized.includes('PCR US') ||
                             normalized.includes('HIGH SENSITIVITY');
    
    // Return appropriate type
    if (isUltrasensitive) {
      return 'HS_CRP';
    } else {
      // PCR normal (no ultrasensible keywords)
      return 'CRP_STANDARD';
    }
  }
  
  // ============================================
  // STANDARD BIOMARKER DETECTION
  // ============================================
  // Sort aliases by length (longer first) to prioritize specific matches
  const biomarkerEntries = Object.entries(BIOMARKER_ALIASES);
  
  // PHASE 1: Exact match
  for (const [canonical, aliases] of biomarkerEntries) {
    // Skip CRP variants as they're handled above
    if (canonical === 'HS_CRP' || canonical === 'CRP_STANDARD') {
      continue;
    }
    
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalized === normalizedAlias) {
        return canonical as CanonicalBiomarker;
      }
    }
  }
  
  // PHASE 2: Word boundary match (para aliases cortos como TGP, TGO, TG, URATE)
  // Esto evita que "TG" capture "TGP" o "TGO"
  for (const [canonical, aliases] of biomarkerEntries) {
    if (canonical === 'HS_CRP' || canonical === 'CRP_STANDARD') {
      continue;
    }
    
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      
      // Para aliases cortos (≤5 caracteres), buscar como palabra completa
      if (normalizedAlias.length <= 5) {
        // Crear regex con word boundaries: \b{alias}\b
        const regex = new RegExp(`\\b${normalizedAlias}\\b`);
        if (regex.test(normalized)) {
          return canonical as CanonicalBiomarker;
        }
      }
    }
  }
  
  // PHASE 3: Contains match (para aliases largos)
  // Ordenar por longitud descendente para priorizar matches más específicos
  const sortedEntries = biomarkerEntries.map(([canonical, aliases]) => ({
    canonical,
    aliases: [...aliases].sort((a, b) => b.length - a.length)
  }));
  
  for (const { canonical, aliases } of sortedEntries) {
    if (canonical === 'HS_CRP' || canonical === 'CRP_STANDARD') {
      continue;
    }
    
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      
      // Solo usar CONTAINS para aliases largos (>5 caracteres)
      if (normalizedAlias.length > 5) {
        if (normalized.includes(normalizedAlias)) {
          return canonical as CanonicalBiomarker;
        }
      }
    }
  }
  
  return undefined;
}

