/**
 * ACTIVITY PRIORITIZATION SERVICE
 *
 * Implements the 5-step scoring algorithm to select 3 personalized activities:
 *   1. Score de urgencia por biomarcador
 *   2. Score de relevancia por actividad
 *   3. Filtrar el pool
 *   4. Seleccionar 1 por categoría (ejercicio + alimentacion + natural)
 *   5. Construir el template personalizado
 */

import { BIOMARKERS, BiomarkerKey, Status } from '../config/biomarkers.config';
import { ACTIVE_ACTIVITIES, ACTIVITIES_BY_ID, Activity } from '../config/activities.config';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserBiomarkerInput {
  biomarker: BiomarkerKey;
  value: number;
  unit: string;
  status: Status;
}

export interface SelectedActivity {
  activity_id: string;
  title: string;
  category: string;
  personalized_text: string;  // Template already rendered
  evidence_level: string;
  evidence_source: string;
  requires_medical_disclaimer: boolean;
  note?: string;
  primary_biomarker: string;
  primary_value: number;
  primary_unit: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 1 — Score de urgencia por biomarcador
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_POINTS: Record<Status, number> = {
  CRITICAL:     4,
  OUT_OF_RANGE: 2,
  GOOD:         1,
  OPTIMAL:      0,  // excluded
};

function getBiomarkerUrgencyScore(biomarker: BiomarkerKey, status: Status): number {
  const weight = BIOMARKERS[biomarker]?.weight ?? 1.0;
  const points = STATUS_POINTS[status] ?? 0;
  return weight * points;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 2 — Score de relevancia por actividad
// ─────────────────────────────────────────────────────────────────────────────

function getActivityRelevanceScore(
  activity: Activity,
  userBiomarkers: UserBiomarkerInput[]
): number {
  const userMap = new Map(userBiomarkers.map(b => [b.biomarker, b]));
  let score = 0;

  for (const impact of activity.biomarker_impacts) {
    const user = userMap.get(impact.biomarker as BiomarkerKey);
    if (!user) continue;

    const urgency = getBiomarkerUrgencyScore(user.biomarker, user.status);
    if (urgency === 0) continue; // Skip OPTIMAL biomarkers

    // Direction check: DOWN = lower is better, UP = higher is better (HDL)
    const needsLower = impact.direction === 'DOWN';
    const needsHigher = impact.direction === 'UP';

    const isOutOfOptimal = user.status !== 'OPTIMAL';

    // For LOWER_IS_BETTER biomarkers (all except HDL): only count DOWN impacts
    // For HDL: only count UP impacts
    const hdlLike = user.biomarker === 'HDL';

    if (hdlLike && needsHigher && isOutOfOptimal) {
      score += urgency;
    } else if (!hdlLike && needsLower && isOutOfOptimal) {
      score += urgency;
    }
  }

  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 5 — Construir template personalizado
// ─────────────────────────────────────────────────────────────────────────────

function buildDistanceText(biomarker: BiomarkerKey, value: number, unit: string): string {
  const isHigherBetter = biomarker === 'HDL';

  if (isHigherBetter) {
    // For HDL, find how far below optimal
    // Optimal male: ≥55, female: ≥65 — we use a generic threshold here
    const optimalMin = 55; // approximate; actual comes from scoring
    if (value >= optimalMin) return 'ya en rango óptimo';
    const diff = Math.round(optimalMin - value);
    return `${diff} ${unit} bajo el óptimo`;
  } else {
    // All others: how far above optimal
    // Use a rough "above GOOD upper bound" heuristic
    // The template context makes it clear without needing exact threshold
    return `fuera del rango óptimo de prevención`;
  }
}

function renderTemplate(
  activity: Activity,
  primaryBiomarker: UserBiomarkerInput,
  biomarkerDisplayName: string
): string {
  const { value, unit, biomarker } = primaryBiomarker;
  const d1 = buildDistanceText(biomarker, value, unit);

  return activity.template
    .replace('{b1}', biomarkerDisplayName)
    .replace('{v1}', `${value} ${unit}`)
    .replace('{d1}', d1);
}

// Biomarker display names (Spanish)
const BIOMARKER_DISPLAY_NAMES: Record<string, string> = {
  LDL:             'LDL',
  FASTING_GLUCOSE: 'glucosa en ayunas',
  TRIGLYCERIDES:   'triglicéridos',
  VLDL:            'VLDL',
  HDL:             'HDL',
  ALT:             'ALT',
  AST:             'AST',
  URIC_ACID:       'ácido úrico',
  HS_CRP:          'PCR ultrasensible',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main: select 3 activities
// ─────────────────────────────────────────────────────────────────────────────

export function selectActivities(
  userBiomarkers: UserBiomarkerInput[],
  excludeActivityIds: string[] = []
): SelectedActivity[] {
  const userMap = new Map(userBiomarkers.map(b => [b.biomarker, b]));

  // Paso 3 — Filter pool
  const filteredPool = ACTIVE_ACTIVITIES.filter(activity => {
    // Exclude swapped / already assigned activities
    if (excludeActivityIds.includes(activity.activity_id)) return false;

    // Exclude if all target biomarkers are OPTIMAL (score = 0)
    const score = getActivityRelevanceScore(activity, userBiomarkers);
    return score > 0;
  });

  // Score all remaining activities
  const scored = filteredPool.map(activity => ({
    activity,
    score: getActivityRelevanceScore(activity, userBiomarkers),
  })).sort((a, b) => b.score - a.score);

  // Paso 4 — Select best 1 per category
  const categories: Array<'ejercicio' | 'alimentacion' | 'natural'> = ['ejercicio', 'alimentacion', 'natural'];
  const selected: Activity[] = [];

  for (const category of categories) {
    const best = scored.find(s => s.activity.category === category && !selected.includes(s.activity));
    if (best) {
      selected.push(best.activity);
    }
  }

  // Fallback: if no natural found, take second best alimentacion
  if (selected.length < 3) {
    const missingCategories = categories.filter(c => !selected.some(a => a.category === c));
    for (const missing of missingCategories) {
      if (missing === 'natural') {
        const fallback = scored.find(
          s => s.activity.category === 'alimentacion' && !selected.includes(s.activity)
        );
        if (fallback) selected.push(fallback.activity);
        else {
          const fallback2 = scored.find(
            s => s.activity.category === 'ejercicio' && !selected.includes(s.activity)
          );
          if (fallback2) selected.push(fallback2.activity);
        }
      }
    }
  }

  // Paso 5 — Build personalized templates
  return selected.map(activity => {
    // Find the most urgent biomarker this activity impacts
    const impactedBiomarkers = activity.biomarker_impacts
      .map(impact => {
        const user = userMap.get(impact.biomarker as BiomarkerKey);
        if (!user || user.status === 'OPTIMAL') return null;
        const hdlLike = user.biomarker === 'HDL';
        const directionMatches = hdlLike ? impact.direction === 'UP' : impact.direction === 'DOWN';
        if (!directionMatches) return null;
        return {
          biomarker: user,
          urgencyScore: getBiomarkerUrgencyScore(user.biomarker, user.status),
        };
      })
      .filter((x): x is { biomarker: UserBiomarkerInput; urgencyScore: number } => x !== null)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    const primary = impactedBiomarkers[0]?.biomarker ?? userBiomarkers[0];
    const displayName = BIOMARKER_DISPLAY_NAMES[primary.biomarker] ?? primary.biomarker;
    const personalizedText = renderTemplate(activity, primary, displayName);

    return {
      activity_id: activity.activity_id,
      title: activity.title,
      category: activity.category,
      personalized_text: personalizedText,
      evidence_level: activity.evidence_level,
      evidence_source: activity.evidence_source,
      requires_medical_disclaimer: activity.requires_medical_disclaimer,
      note: activity.note,
      primary_biomarker: primary.biomarker,
      primary_value: primary.value,
      primary_unit: primary.unit,
    };
  });
}

/**
 * Swap: select next best activity for a given category,
 * excluding the current one and other already-selected activities.
 */
export function swapActivity(
  category: string,
  currentActivityId: string,
  otherSelectedIds: string[],
  userBiomarkers: UserBiomarkerInput[]
): SelectedActivity | null {
  const exclude = [currentActivityId, ...otherSelectedIds];
  const pool = ACTIVE_ACTIVITIES.filter(
    a => a.category === category && !exclude.includes(a.activity_id)
  );

  if (pool.length === 0) return null;

  const scored = pool
    .map(a => ({ activity: a, score: getActivityRelevanceScore(a, userBiomarkers) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const userMap = new Map(userBiomarkers.map(b => [b.biomarker, b]));
  const activity = scored[0].activity;

  const impactedBiomarkers = activity.biomarker_impacts
    .map(impact => {
      const user = userMap.get(impact.biomarker as BiomarkerKey);
      if (!user || user.status === 'OPTIMAL') return null;
      const hdlLike = user.biomarker === 'HDL';
      const directionMatches = hdlLike ? impact.direction === 'UP' : impact.direction === 'DOWN';
      if (!directionMatches) return null;
      return { biomarker: user, urgencyScore: getBiomarkerUrgencyScore(user.biomarker, user.status) };
    })
    .filter((x): x is { biomarker: UserBiomarkerInput; urgencyScore: number } => x !== null)
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const primary = impactedBiomarkers[0]?.biomarker ?? userBiomarkers[0];
  const displayName = BIOMARKER_DISPLAY_NAMES[primary.biomarker] ?? primary.biomarker;

  return {
    activity_id: activity.activity_id,
    title: activity.title,
    category: activity.category,
    personalized_text: renderTemplate(activity, primary, displayName),
    evidence_level: activity.evidence_level,
    evidence_source: activity.evidence_source,
    requires_medical_disclaimer: activity.requires_medical_disclaimer,
    note: activity.note,
    primary_biomarker: primary.biomarker,
    primary_value: primary.value,
    primary_unit: primary.unit,
  };
}

/** Lookup a single activity by id (for weekly summary impact calculation) */
export { ACTIVITIES_BY_ID };
