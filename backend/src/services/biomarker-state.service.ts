/**
 * BIOMARKER STATE SERVICE
 *
 * Obtiene el estado actual de cada biomarcador basándose en su historial independiente.
 *
 * REGLA DE ORO (NO NEGOCIABLE):
 * - Cada biomarcador tiene su propio historial
 * - Un examen parcial solo actualiza biomarcadores presentes
 * - NUNCA asignar valores 0 por ausencia
 * - Mostrar fecha de última medición por biomarcador
 */

import { BiomarkerKey, Status, BIOMARKERS } from '../config/biomarkers.config';
import { query as dbQuery } from '../db/postgres';

export interface BiomarkerState {
  biomarker: BiomarkerKey;
  value: number | null;
  status: Status | null;
  unit: string | null;
  lastMeasuredAt: string | null;
  measurementCount: number;
  previousValue: number | null;
  previousMeasuredAt: string | null;
}

/**
 * Obtiene el estado actual de cada biomarcador para un usuario
 *
 * Para cada biomarcador soportado:
 * 1. Busca su último registro en biomarker_result (ORDER BY exam_date DESC LIMIT 1)
 * 2. Si existe: retorna valor, status, fecha
 * 3. Si NO existe: retorna null (NO_MEDIDO)
 *
 * NUNCA:
 * - Inferir valores
 * - Usar 0 como default
 * - Crear registros sintéticos
 */
export async function getLatestBiomarkerState(userId: string): Promise<BiomarkerState[]> {
  const allBiomarkers: BiomarkerKey[] = [
    'LDL',
    'TRIGLYCERIDES',
    'HDL',
    'FASTING_GLUCOSE',
    'HBA1C',
    'ALT',
    'AST',
    'HS_CRP',
    'CRP_STANDARD',
    'EGFR',
    'URIC_ACID'
  ];

  const states: BiomarkerState[] = [];

  for (const biomarker of allBiomarkers) {
    try {
      const measurements = await dbQuery<{
        exam_date: string;
        value: number;
        status_at_time: string;
        unit: string;
      }>(
        `SELECT exam_date, value, status_at_time, unit
         FROM biomarker_result
         WHERE user_id = $1 AND biomarker_code = $2
         ORDER BY exam_date DESC
         LIMIT 2`,
        [userId, biomarker]
      );

      const countRows = await dbQuery<{ count: string }>(
        `SELECT COUNT(*) as count FROM biomarker_result WHERE user_id = $1 AND biomarker_code = $2`,
        [userId, biomarker]
      );
      const measurementCount = parseInt(countRows[0]?.count || '0');

      if (measurements.length === 0) {
        states.push({
          biomarker,
          value: null,
          status: null,
          unit: null,
          lastMeasuredAt: null,
          measurementCount: 0,
          previousValue: null,
          previousMeasuredAt: null
        });
      } else {
        const latest = measurements[0];
        const previous = measurements.length > 1 ? measurements[1] : null;

        states.push({
          biomarker,
          value: latest.value,
          status: latest.status_at_time as Status,
          unit: latest.unit,
          lastMeasuredAt: latest.exam_date.split('T')[0],
          measurementCount,
          previousValue: previous?.value || null,
          previousMeasuredAt: previous ? previous.exam_date.split('T')[0] : null
        });
      }
    } catch (error: any) {
      console.error(`Error getting state for biomarker ${biomarker}:`, error);
      states.push({
        biomarker,
        value: null,
        status: null,
        unit: null,
        lastMeasuredAt: null,
        measurementCount: 0,
        previousValue: null,
        previousMeasuredAt: null
      });
    }
  }

  return states;
}

/**
 * Obtiene el historial completo de un biomarcador específico
 */
export async function getBiomarkerHistory(
  userId: string,
  biomarker: BiomarkerKey
): Promise<Array<{
  exam_date: string;
  value: number;
  status_at_time: string;
  unit: string;
}>> {
  try {
    const rows = await dbQuery<{
      exam_date: string;
      value: number;
      status_at_time: string;
      unit: string;
    }>(
      `SELECT exam_date, value, status_at_time, unit
       FROM biomarker_result
       WHERE user_id = $1 AND biomarker_code = $2
       ORDER BY exam_date ASC`,
      [userId, biomarker]
    );

    return rows.map(row => ({
      exam_date: row.exam_date.split('T')[0],
      value: row.value,
      status_at_time: row.status_at_time,
      unit: row.unit
    }));
  } catch (error: any) {
    console.error(`Error getting history for biomarker ${biomarker}:`, error);
    return [];
  }
}

/**
 * Calcula la fiabilidad de la evaluación de salud
 */
export interface ReliabilityData {
  reliabilityPercentage: number;
  measuredBiomarkersCount: number;
  totalBiomarkersCount: number;
  measuredWeight: number;
  totalWeight: number;
}

export function calculateReliability(biomarkerStates: BiomarkerState[]): ReliabilityData {
  const allBiomarkers: BiomarkerKey[] = [
    'LDL',
    'TRIGLYCERIDES',
    'HDL',
    'FASTING_GLUCOSE',
    'HBA1C',
    'ALT',
    'AST',
    'HS_CRP',
    'CRP_STANDARD',
    'EGFR',
    'URIC_ACID'
  ];

  let totalWeight = 0;
  for (const biomarker of allBiomarkers) {
    totalWeight += BIOMARKERS[biomarker].weight;
  }

  let measuredWeight = 0;
  let measuredCount = 0;

  for (const state of biomarkerStates) {
    if (state.lastMeasuredAt !== null && state.value !== null) {
      measuredWeight += BIOMARKERS[state.biomarker].weight;
      measuredCount++;
    }
  }

  const reliabilityPercentage = Math.round((measuredWeight / totalWeight) * 100);

  console.log('📊 [Reliability] Calculation:', {
    totalWeight,
    measuredWeight,
    reliabilityPercentage,
    measuredCount,
    totalCount: allBiomarkers.length
  });

  return {
    reliabilityPercentage,
    measuredBiomarkersCount: measuredCount,
    totalBiomarkersCount: allBiomarkers.length,
    measuredWeight,
    totalWeight
  };
}
