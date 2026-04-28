/**
 * ACTIVITIES CATALOG — GULA V2
 *
 * 18 actividades con impacto clínico validado.
 * Template variables: {b1} biomarcador más urgente, {v1} valor actual, {d1} distancia al óptimo.
 *
 * Categorías: ejercicio (3) | alimentacion (9) | natural (6)
 * Dirección: UP = sube el biomarcador (bueno para HDL) | DOWN = baja (bueno para LDL, TG, etc.)
 */

export type ActivityCategory = 'ejercicio' | 'alimentacion' | 'natural';
export type EvidenceLevel = 'alta' | 'moderada' | 'limitada';
export type ImpactDirection = 'UP' | 'DOWN';

export interface ActivityBiomarkerImpact {
  biomarker: string;        // BiomarkerKey
  direction: ImpactDirection;
  impact_min: number;
  impact_max: number;
  impact_unit: string;      // 'mg/dL' | 'U/L' | 'mg/L'
}

export interface Activity {
  activity_id: string;
  title: string;
  category: ActivityCategory;
  template: string;         // Variables: {b1}, {v1}, {d1}
  note?: string;            // Consejo extra opcional
  evidence_level: EvidenceLevel;
  evidence_source: string;
  requires_medical_disclaimer: boolean;
  active: boolean;
  biomarker_impacts: ActivityBiomarkerImpact[];
}

// ─────────────────────────────────────────────────────────────────────────────
// EJERCICIO (3)
// ─────────────────────────────────────────────────────────────────────────────

const EJERCICIO_ACTIVITIES: Activity[] = [
  {
    activity_id: 'cardio_150',
    title: '150 minutos de cardio moderado esta semana',
    category: 'ejercicio',
    template: 'Haz 30 min de caminata rápida, trote o bici 5 días esta semana. Tu {b1} está en {v1} — {d1}. El cardio sostenido es la intervención con mayor impacto sobre el perfil lipídico.',
    evidence_level: 'alta',
    evidence_source: 'AHA/ACC 2026, NHLBI TLC Program',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'HDL',             direction: 'UP',   impact_min: 3,   impact_max: 6,   impact_unit: 'mg/dL' },
      { biomarker: 'LDL',             direction: 'DOWN', impact_min: 5,   impact_max: 10,  impact_unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES',   direction: 'DOWN', impact_min: 10,  impact_max: 20,  impact_unit: 'mg/dL' },
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 5,   impact_max: 10,  impact_unit: 'mg/dL' },
      { biomarker: 'HS_CRP',          direction: 'DOWN', impact_min: 0.3, impact_max: 0.8, impact_unit: 'mg/L'  },
      { biomarker: 'ALT',             direction: 'DOWN', impact_min: 3,   impact_max: 8,   impact_unit: 'U/L'   },
      { biomarker: 'AST',             direction: 'DOWN', impact_min: 2,   impact_max: 6,   impact_unit: 'U/L'   },
    ],
  },
  {
    activity_id: 'strength_2x',
    title: '2 sesiones de fuerza esta semana',
    category: 'ejercicio',
    template: 'Haz 2 entrenamientos de pesas o resistencia de 30–45 min. Tu {b1} está en {v1} — el entrenamiento de fuerza mejora la sensibilidad a la insulina y complementa el cardio.',
    evidence_level: 'alta',
    evidence_source: 'AHA/ACC Guidelines, múltiples RCTs',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'HDL',             direction: 'UP',   impact_min: 2,  impact_max: 4,  impact_unit: 'mg/dL' },
      { biomarker: 'LDL',             direction: 'DOWN', impact_min: 3,  impact_max: 7,  impact_unit: 'mg/dL' },
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 4,  impact_max: 8,  impact_unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES',   direction: 'DOWN', impact_min: 8,  impact_max: 15, impact_unit: 'mg/dL' },
    ],
  },
  {
    activity_id: 'steps_daily',
    title: '8.000 pasos diarios esta semana',
    category: 'ejercicio',
    template: 'Activa el contador de pasos y llega a 8.000 cada día. Tu {b1} está en {v1} — {d1}. La actividad acumulada diaria mejora marcadores metabólicos sin necesidad de ejercicio formal.',
    evidence_level: 'alta',
    evidence_source: 'JAMA Internal Medicine, AHA guidelines',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 3,   impact_max: 7,   impact_unit: 'mg/dL' },
      { biomarker: 'LDL',             direction: 'DOWN', impact_min: 3,   impact_max: 6,   impact_unit: 'mg/dL' },
      { biomarker: 'HDL',             direction: 'UP',   impact_min: 2,   impact_max: 4,   impact_unit: 'mg/dL' },
      { biomarker: 'HS_CRP',          direction: 'DOWN', impact_min: 0.2, impact_max: 0.5, impact_unit: 'mg/L'  },
      { biomarker: 'TRIGLYCERIDES',   direction: 'DOWN', impact_min: 5,   impact_max: 12,  impact_unit: 'mg/dL' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ALIMENTACIÓN (9)
// ─────────────────────────────────────────────────────────────────────────────

const ALIMENTACION_ACTIVITIES: Activity[] = [
  {
    activity_id: 'reduce_saturated',
    title: 'Elimina las grasas saturadas 5 días',
    category: 'alimentacion',
    template: 'Evita carnes rojas grasas, embutidos, mantequilla y lácteos enteros por 5 días. Tu {b1} está en {v1} — {d1}. Reducir grasas saturadas es el cambio dietario con mayor impacto sobre el LDL.',
    evidence_level: 'alta',
    evidence_source: 'ATP III / NHLBI TLC, Circulation 2002',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'LDL',           direction: 'DOWN', impact_min: 8,  impact_max: 15, impact_unit: 'mg/dL' },
      { biomarker: 'VLDL',          direction: 'DOWN', impact_min: 3,  impact_max: 6,  impact_unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES', direction: 'DOWN', impact_min: 10, impact_max: 20, impact_unit: 'mg/dL' },
    ],
  },
  {
    activity_id: 'soluble_fiber',
    title: 'Fibra soluble en cada comida principal',
    category: 'alimentacion',
    template: 'Incluye avena, fríjoles, lentejas, manzana o pera en desayuno, almuerzo y comida. Tu {b1} está en {v1} — {d1}. La fibra soluble bloquea la absorción de colesterol en el intestino.',
    evidence_level: 'alta',
    evidence_source: 'NHLBI TLC Program, AHA Dietary Guidelines',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'LDL',             direction: 'DOWN', impact_min: 5,  impact_max: 10, impact_unit: 'mg/dL' },
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 4,  impact_max: 8,  impact_unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES',   direction: 'DOWN', impact_min: 8,  impact_max: 15, impact_unit: 'mg/dL' },
    ],
  },
  {
    activity_id: 'eliminate_sugar',
    title: 'Sin azúcar añadida ni ultraprocesados esta semana',
    category: 'alimentacion',
    template: 'Evita refrescos, jugos industriales, dulces y paquetes procesados. Tu {b1} está en {v1} — {d1}. El azúcar y la fructosa son la principal causa dietaria de triglicéridos y ácido úrico elevados.',
    evidence_level: 'alta',
    evidence_source: 'JAMA 2014 fructose meta-analysis, ACC/AHA 2026',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'TRIGLYCERIDES',   direction: 'DOWN', impact_min: 20,  impact_max: 40,  impact_unit: 'mg/dL' },
      { biomarker: 'VLDL',            direction: 'DOWN', impact_min: 4,   impact_max: 8,   impact_unit: 'mg/dL' },
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 5,   impact_max: 12,  impact_unit: 'mg/dL' },
      { biomarker: 'URIC_ACID',       direction: 'DOWN', impact_min: 0.3, impact_max: 0.7, impact_unit: 'mg/dL' },
      { biomarker: 'ALT',             direction: 'DOWN', impact_min: 3,   impact_max: 7,   impact_unit: 'U/L'   },
      { biomarker: 'AST',             direction: 'DOWN', impact_min: 2,   impact_max: 5,   impact_unit: 'U/L'   },
    ],
  },
  {
    activity_id: 'omega3_fish',
    title: 'Pescado azul 3 veces esta semana',
    category: 'alimentacion',
    template: 'Incluye salmón, atún, sardinas o macarela en 3 comidas. Tu {b1} está en {v1} — {d1}. Los omega-3 del pescado tienen el efecto más fuerte sobre triglicéridos de cualquier alimento estudiado.',
    evidence_level: 'alta',
    evidence_source: 'ACC/AHA Guidelines, Cochrane Review omega-3',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'TRIGLYCERIDES', direction: 'DOWN', impact_min: 15,  impact_max: 30,  impact_unit: 'mg/dL' },
      { biomarker: 'VLDL',         direction: 'DOWN', impact_min: 3,   impact_max: 6,   impact_unit: 'mg/dL' },
      { biomarker: 'HS_CRP',       direction: 'DOWN', impact_min: 0.3, impact_max: 0.7, impact_unit: 'mg/L'  },
      { biomarker: 'ALT',          direction: 'DOWN', impact_min: 2,   impact_max: 5,   impact_unit: 'U/L'   },
      { biomarker: 'AST',          direction: 'DOWN', impact_min: 2,   impact_max: 4,   impact_unit: 'U/L'   },
    ],
  },
  {
    activity_id: 'hydration',
    title: '2.5 litros de agua al día esta semana',
    category: 'alimentacion',
    template: 'Toma al menos 10 vasos de agua distribuidos durante el día. Tu {b1} está en {v1} — {d1}. La hidratación adecuada aumenta la excreción renal de ácido úrico, el mecanismo más directo para bajarlo.',
    evidence_level: 'alta',
    evidence_source: 'Arthritis Care & Research, estudios de gota',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'URIC_ACID', direction: 'DOWN', impact_min: 0.5, impact_max: 1.0, impact_unit: 'mg/dL' },
      { biomarker: 'HS_CRP',   direction: 'DOWN', impact_min: 0.1, impact_max: 0.3, impact_unit: 'mg/L'  },
    ],
  },
  {
    activity_id: 'reduce_alcohol',
    title: 'Sin alcohol esta semana',
    category: 'alimentacion',
    template: 'Elimina completamente el alcohol los 7 días. Tu {b1} está en {v1} — {d1}. El alcohol es procesado directamente por el hígado y es la causa dietaria más directa de ALT y AST elevados.',
    evidence_level: 'alta',
    evidence_source: 'EASL Guidelines, AASLD Clinical Practice',
    requires_medical_disclaimer: true,
    active: true,
    biomarker_impacts: [
      { biomarker: 'ALT',          direction: 'DOWN', impact_min: 5,   impact_max: 15,  impact_unit: 'U/L'   },
      { biomarker: 'AST',          direction: 'DOWN', impact_min: 4,   impact_max: 12,  impact_unit: 'U/L'   },
      { biomarker: 'TRIGLYCERIDES',direction: 'DOWN', impact_min: 10,  impact_max: 25,  impact_unit: 'mg/dL' },
      { biomarker: 'URIC_ACID',    direction: 'DOWN', impact_min: 0.3, impact_max: 0.6, impact_unit: 'mg/dL' },
    ],
  },
  {
    activity_id: 'reduce_purines',
    title: 'Reduce carnes rojas y vísceras esta semana',
    category: 'alimentacion',
    template: 'Evita carnes rojas, hígado, riñones y mariscos. Cámbialos por pollo, huevo o legumbres. Tu {b1} está en {v1} — {d1}. Las purinas de vísceras y carnes rojas son el principal precursor dietario del ácido úrico.',
    evidence_level: 'alta',
    evidence_source: 'EULAR Gout Guidelines, Arthritis & Rheumatology',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'URIC_ACID', direction: 'DOWN', impact_min: 0.4, impact_max: 0.9, impact_unit: 'mg/dL' },
      { biomarker: 'ALT',       direction: 'DOWN', impact_min: 2,   impact_max: 5,   impact_unit: 'U/L'   },
      { biomarker: 'AST',       direction: 'DOWN', impact_min: 2,   impact_max: 4,   impact_unit: 'U/L'   },
    ],
  },
  {
    activity_id: 'mediterranean',
    title: 'Patrón mediterráneo esta semana',
    category: 'alimentacion',
    template: 'Base de verduras, legumbres, aceite de oliva y nueces — carnes rojas máximo 1 vez. Tu {b1} está en {v1} — {d1}. El patrón mediterráneo tiene la mayor evidencia para reducir inflamación sistémica.',
    evidence_level: 'alta',
    evidence_source: 'PREDIMED trial, ACC/AHA 2026',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'HS_CRP',          direction: 'DOWN', impact_min: 0.4, impact_max: 1.0, impact_unit: 'mg/L'  },
      { biomarker: 'LDL',             direction: 'DOWN', impact_min: 5,   impact_max: 12,  impact_unit: 'mg/dL' },
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 3,   impact_max: 7,   impact_unit: 'mg/dL' },
      { biomarker: 'ALT',             direction: 'DOWN', impact_min: 3,   impact_max: 7,   impact_unit: 'U/L'   },
      { biomarker: 'AST',             direction: 'DOWN', impact_min: 2,   impact_max: 5,   impact_unit: 'U/L'   },
    ],
  },
  {
    activity_id: 'fasting_window',
    title: 'Come en una ventana de 10 horas esta semana',
    category: 'alimentacion',
    template: 'Si desayunas a las 7am, cierra la cocina a las 5pm. Tu {b1} está en {v1} — {d1}. La ventana de alimentación reducida mejora la glucosa posprandial sin dieta estricta.',
    evidence_level: 'moderada',
    evidence_source: 'Cell Metabolism 2020, RCTs time-restricted eating',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 4,  impact_max: 9,  impact_unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES',   direction: 'DOWN', impact_min: 10, impact_max: 20, impact_unit: 'mg/dL' },
      { biomarker: 'VLDL',            direction: 'DOWN', impact_min: 2,  impact_max: 5,  impact_unit: 'mg/dL' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NATURAL (6)
// ─────────────────────────────────────────────────────────────────────────────

const NATURAL_ACTIVITIES: Activity[] = [
  {
    activity_id: 'sleep_7h',
    title: 'Duerme 7–9 horas cada noche esta semana',
    category: 'natural',
    template: 'Acuéstate a la misma hora y apaga pantallas 30 min antes. Tu {b1} está en {v1} — {d1}. El sueño insuficiente activa enzimas que aceleran la producción de ácido úrico y aumentan la inflamación.',
    evidence_level: 'alta',
    evidence_source: 'PMC 2025 sleep-uric acid review',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'URIC_ACID',       direction: 'DOWN', impact_min: 0.2, impact_max: 0.5, impact_unit: 'mg/dL' },
      { biomarker: 'HS_CRP',          direction: 'DOWN', impact_min: 0.2, impact_max: 0.5, impact_unit: 'mg/L'  },
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 2,   impact_max: 5,   impact_unit: 'mg/dL' },
    ],
  },
  {
    activity_id: 'green_tea',
    title: '3 tazas de té verde al día esta semana',
    category: 'natural',
    template: 'Toma té verde sin azúcar en la mañana, después del almuerzo y en la tarde. Tu {b1} está en {v1} — {d1}. Meta-análisis de más de 3.000 participantes confirman reducción significativa de LDL.',
    note: 'Como bebida, no como suplemento concentrado.',
    evidence_level: 'alta',
    evidence_source: 'PMC meta-analysis 31 RCTs, Frontiers Nutrition 2022',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'LDL',    direction: 'DOWN', impact_min: 2,   impact_max: 5,   impact_unit: 'mg/dL' },
      { biomarker: 'HS_CRP', direction: 'DOWN', impact_min: 0.2, impact_max: 0.4, impact_unit: 'mg/L'  },
    ],
  },
  {
    activity_id: 'turmeric_food',
    title: 'Añade cúrcuma a tus comidas esta semana',
    category: 'natural',
    template: 'Agrega 1 cucharadita de cúrcuma con pimienta negra a sopas, arroces o huevos todos los días. Tu {b1} está en {v1} — {d1}. 64 ensayos clínicos confirman mejora en LDL, triglicéridos y HDL.',
    note: 'La pimienta negra aumenta la absorción de curcumina hasta 20 veces.',
    evidence_level: 'moderada',
    evidence_source: 'PubMed meta-analysis 64 RCTs 2023, PMC curcumin NAFLD',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'LDL',          direction: 'DOWN', impact_min: 3, impact_max: 7, impact_unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES',direction: 'DOWN', impact_min: 4, impact_max: 8, impact_unit: 'mg/dL' },
      { biomarker: 'HDL',          direction: 'UP',   impact_min: 1, impact_max: 2, impact_unit: 'mg/dL' },
      { biomarker: 'ALT',          direction: 'DOWN', impact_min: 2, impact_max: 5, impact_unit: 'U/L'   },
      { biomarker: 'AST',          direction: 'DOWN', impact_min: 2, impact_max: 4, impact_unit: 'U/L'   },
    ],
  },
  {
    activity_id: 'cinnamon_food',
    title: '1 cucharadita de canela al día esta semana',
    category: 'natural',
    template: 'Agrega canela a tu avena, café o fruta en el desayuno. Tu {b1} está en {v1} — {d1}. Estudios clínicos muestran reducción de glucosa en ayunas y mejora en sensibilidad a la insulina.',
    note: 'Usa canela de Ceilán (Ceylon). Evita la cassia en exceso.',
    evidence_level: 'moderada',
    evidence_source: 'MDPI 2026 RCT, Annals Family Medicine',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 3,   impact_max: 8,   impact_unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES',   direction: 'DOWN', impact_min: 5,   impact_max: 12,  impact_unit: 'mg/dL' },
      { biomarker: 'URIC_ACID',       direction: 'DOWN', impact_min: 0.2, impact_max: 0.4, impact_unit: 'mg/dL' },
      { biomarker: 'LDL',             direction: 'DOWN', impact_min: 2,   impact_max: 5,   impact_unit: 'mg/dL' },
    ],
  },
  {
    activity_id: 'acv_meals',
    title: 'Vinagre de manzana antes de las comidas esta semana',
    category: 'natural',
    template: 'Diluye 1 cucharada de vinagre de manzana en un vaso de agua y tómalo 10–15 min antes de almuerzo y comida. Tu {b1} está en {v1} — {d1}. Frena la digestión del almidón y reduce el pico de glucosa posprandial.',
    note: 'Siempre diluido — el ácido acético sin diluir daña el esmalte dental.',
    evidence_level: 'moderada',
    evidence_source: 'European J Clinical Nutrition, systematic review 2021',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'FASTING_GLUCOSE', direction: 'DOWN', impact_min: 3, impact_max: 7,  impact_unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES',   direction: 'DOWN', impact_min: 5, impact_max: 12, impact_unit: 'mg/dL' },
      { biomarker: 'LDL',             direction: 'DOWN', impact_min: 2, impact_max: 5,  impact_unit: 'mg/dL' },
    ],
  },
  {
    activity_id: 'avocado_daily',
    title: 'Medio aguacate al día esta semana',
    category: 'natural',
    template: 'Incluye medio aguacate en tu almuerzo o desayuno todos los días. Tu {b1} está en {v1} — {d1}. Evidencia moderada-alta en múltiples RCTs confirma reducción significativa de LDL.',
    evidence_level: 'moderada',
    evidence_source: 'ScienceDirect systematic review 2021',
    requires_medical_disclaimer: false,
    active: true,
    biomarker_impacts: [
      { biomarker: 'LDL',    direction: 'DOWN', impact_min: 5,   impact_max: 10,  impact_unit: 'mg/dL' },
      { biomarker: 'HDL',    direction: 'UP',   impact_min: 1,   impact_max: 3,   impact_unit: 'mg/dL' },
      { biomarker: 'HS_CRP', direction: 'DOWN', impact_min: 0.2, impact_max: 0.4, impact_unit: 'mg/L'  },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO COMPLETO (18 actividades)
// ─────────────────────────────────────────────────────────────────────────────

export const ACTIVITIES_CATALOG: Activity[] = [
  ...EJERCICIO_ACTIVITIES,
  ...ALIMENTACION_ACTIVITIES,
  ...NATURAL_ACTIVITIES,
];

/** Lookup por activity_id */
export const ACTIVITIES_BY_ID: Record<string, Activity> = Object.fromEntries(
  ACTIVITIES_CATALOG.map(a => [a.activity_id, a])
);

/** Solo actividades activas */
export const ACTIVE_ACTIVITIES = ACTIVITIES_CATALOG.filter(a => a.active);
