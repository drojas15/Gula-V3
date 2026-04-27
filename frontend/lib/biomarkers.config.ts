/**
 * Frontend biomarker display configuration.
 * Keep in sync with backend/src/config/biomarkers.config.ts
 */

export const BIOMARKER_NAMES: Record<string, string> = {
  LDL: 'Colesterol LDL',
  HBA1C: 'Hemoglobina Glicosilada',
  FASTING_GLUCOSE: 'Glucosa en ayunas',
  TRIGLYCERIDES: 'Triglicéridos',
  HDL: 'Colesterol HDL',
  HS_CRP: 'PCR Ultrasensible',
  CRP_STANDARD: 'PCR Estándar',
  ALT: 'ALT',
  AST: 'AST',
  EGFR: 'Filtración Glomerular',
  URIC_ACID: 'Ácido Úrico',
};

export const getBiomarkerName = (key: string): string =>
  BIOMARKER_NAMES[key] ?? key;

export const BIOMARKER_UNITS: Record<string, string> = {
  LDL: 'mg/dL',
  HBA1C: '%',
  FASTING_GLUCOSE: 'mg/dL',
  TRIGLYCERIDES: 'mg/dL',
  HDL: 'mg/dL',
  HS_CRP: 'mg/L',
  CRP_STANDARD: 'mg/L',
  ALT: 'U/L',
  AST: 'U/L',
  EGFR: 'ml/min',
  URIC_ACID: 'mg/dL',
};

export const BIOMARKER_DESCRIPTIONS: Record<string, string> = {
  LDL: "Colesterol 'malo'. Niveles altos aumentan el riesgo cardiovascular.",
  HBA1C: 'Promedio de glucosa en sangre durante los últimos 3 meses. Indicador de diabetes.',
  FASTING_GLUCOSE: 'Nivel de azúcar en sangre en ayunas. Detecta prediabetes temprano.',
  TRIGLYCERIDES: 'Tipo de grasa en sangre. Relacionado con dieta y riesgo metabólico.',
  HDL: "Colesterol 'bueno'. Niveles más altos protegen el corazón.",
  HS_CRP: 'Marcador de inflamación sistémica de alta sensibilidad. Predice riesgo cardiovascular.',
  CRP_STANDARD: 'Proteína C reactiva estándar. Marcador general de inflamación.',
  ALT: 'Enzima hepática. Niveles altos indican posible daño al hígado.',
  AST: 'Enzima hepática. Complementa ALT para evaluar función del hígado.',
  EGFR: 'Tasa de filtración renal. Mide qué tan bien funcionan tus riñones.',
  URIC_ACID: 'Producto de degradación celular. Niveles altos pueden causar gota.',
};
