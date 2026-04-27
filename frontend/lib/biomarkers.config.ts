/**
 * Frontend biomarker display configuration.
 * Keep in sync with backend/src/config/biomarkers.config.ts
 */

export const BIOMARKER_NAMES: Record<string, string> = {
  LDL:             'Colesterol LDL',
  FASTING_GLUCOSE: 'Glucosa en ayunas',
  TRIGLYCERIDES:   'Triglicéridos',
  VLDL:            'VLDL',
  HDL:             'Colesterol HDL',
  ALT:             'ALT (TGP)',
  AST:             'AST (TGO)',
  URIC_ACID:       'Ácido Úrico',
  HS_CRP:          'PCR Ultrasensible',
};

export const getBiomarkerName = (key: string): string =>
  BIOMARKER_NAMES[key] ?? key;

export const BIOMARKER_UNITS: Record<string, string> = {
  LDL:             'mg/dL',
  FASTING_GLUCOSE: 'mg/dL',
  TRIGLYCERIDES:   'mg/dL',
  VLDL:            'mg/dL',
  HDL:             'mg/dL',
  ALT:             'U/L',
  AST:             'U/L',
  URIC_ACID:       'mg/dL',
  HS_CRP:          'mg/L',
};

export const BIOMARKER_DESCRIPTIONS: Record<string, string> = {
  LDL:             "Colesterol 'malo'. Niveles altos aumentan el riesgo cardiovascular.",
  FASTING_GLUCOSE: 'Nivel de azúcar en sangre en ayunas. Detecta prediabetes temprano.',
  TRIGLYCERIDES:   'Tipo de grasa en sangre. Relacionado con dieta y riesgo metabólico.',
  VLDL:            'Lipoproteína de muy baja densidad. Transporta triglicéridos y contribuye al riesgo cardiovascular.',
  HDL:             "Colesterol 'bueno'. Niveles más altos protegen el corazón.",
  ALT:             'Enzima hepática. Niveles altos indican posible daño al hígado.',
  AST:             'Enzima hepática. Complementa ALT para evaluar función del hígado.',
  URIC_ACID:       'Producto de degradación celular. Niveles altos pueden causar gota y daño renal.',
  HS_CRP:          'Marcador de inflamación sistémica de alta sensibilidad. Predice riesgo cardiovascular.',
};
