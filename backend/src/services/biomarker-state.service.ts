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
import { db } from '../db/sqlite';

export interface BiomarkerState {
  biomarker: BiomarkerKey;
  value: number | null;
  status: Status | null;
  unit: string | null;
  lastMeasuredAt: string | null; // YYYY-MM-DD
  measurementCount: number;
  previousValue: number | null; // Para cálculo de tendencia
  previousMeasuredAt: string | null; // Fecha de medición anterior
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
export function getLatestBiomarkerState(userId: string): BiomarkerState[] {
  // Todos los biomarcadores soportados
  // INCLUYE biomarcadores informativos (peso = 0)
  const allBiomarkers: BiomarkerKey[] = [
    'LDL',
    'TRIGLYCERIDES',
    'HDL',
    'FASTING_GLUCOSE',
    'HBA1C',
    'ALT',
    'AST',
    'HS_CRP',       // PCR ultrasensible
    'CRP_STANDARD', // PCR normal (informativo)
    'EGFR',
    'URIC_ACID'
  ];
  
  // Prepared statement: obtener últimas 2 mediciones de un biomarcador
  const getLatestMeasurements = db.prepare(`
    SELECT exam_date, value, status_at_time, unit
    FROM biomarker_result
    WHERE user_id = ?
      AND biomarker_code = ?
    ORDER BY exam_date DESC
    LIMIT 2
  `);
  
  // Prepared statement: contar mediciones totales
  const countMeasurements = db.prepare(`
    SELECT COUNT(*) as count
    FROM biomarker_result
    WHERE user_id = ?
      AND biomarker_code = ?
  `);
  
  const states: BiomarkerState[] = [];
  
  for (const biomarker of allBiomarkers) {
    try {
      // Obtener últimas 2 mediciones
      const measurements = getLatestMeasurements.all(userId, biomarker) as Array<{
        exam_date: string;
        value: number;
        status_at_time: string;
        unit: string;
      }>;
      
      // Contar mediciones totales
      const countResult = countMeasurements.get(userId, biomarker) as { count: number };
      const measurementCount = countResult.count;
      
      if (measurements.length === 0) {
        // NO MEDIDO - sin datos históricos
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
        // Tiene al menos una medición
        const latest = measurements[0];
        const previous = measurements.length > 1 ? measurements[1] : null;
        
        states.push({
          biomarker,
          value: latest.value,
          status: latest.status_at_time as Status,
          unit: latest.unit,
          lastMeasuredAt: latest.exam_date.split('T')[0], // YYYY-MM-DD
          measurementCount,
          previousValue: previous?.value || null,
          previousMeasuredAt: previous ? previous.exam_date.split('T')[0] : null
        });
      }
    } catch (error: any) {
      console.error(`Error getting state for biomarker ${biomarker}:`, error);
      
      // En caso de error, marcar como no medido
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
 * Para gráficas históricas
 */
export function getBiomarkerHistory(
  userId: string,
  biomarker: BiomarkerKey
): Array<{
  exam_date: string;
  value: number;
  status_at_time: string;
  unit: string;
}> {
  const getHistory = db.prepare(`
    SELECT exam_date, value, status_at_time, unit
    FROM biomarker_result
    WHERE user_id = ?
      AND biomarker_code = ?
    ORDER BY exam_date ASC
  `);
  
  try {
    const rows = getHistory.all(userId, biomarker) as Array<{
      exam_date: string;
      value: number;
      status_at_time: string;
      unit: string;
    }>;
    
    return rows.map(row => ({
      exam_date: row.exam_date.split('T')[0], // YYYY-MM-DD
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
 * 
 * CONCEPTO:
 * - Fiabilidad ≠ Salud
 * - Fiabilidad mide cobertura de datos, no estado clínico
 * 
 * DEFINICIÓN:
 * fiabilidad = (Σ pesos de biomarcadores medidos) / (Σ pesos totales)
 * 
 * DONDE:
 * - "medido" = biomarcador con al menos 1 medición histórica (lastMeasuredAt != null)
 * - "peso" = importancia relativa del biomarcador (de biomarkers.config)
 * 
 * REGLAS:
 * - NO afecta health score
 * - NO bloquea funcionalidad
 * - Solo informa al usuario sobre completitud de datos
 */
export interface ReliabilityData {
  reliabilityPercentage: number; // 0-100
  measuredBiomarkersCount: number;
  totalBiomarkersCount: number;
  measuredWeight: number;
  totalWeight: number;
}

export function calculateReliability(biomarkerStates: BiomarkerState[]): ReliabilityData {
  // Obtener todos los biomarcadores soportados
  // INCLUYE biomarcadores informativos (peso = 0)
  const allBiomarkers: BiomarkerKey[] = [
    'LDL',
    'TRIGLYCERIDES',
    'HDL',
    'FASTING_GLUCOSE',
    'HBA1C',
    'ALT',
    'AST',
    'HS_CRP',       // PCR ultrasensible
    'CRP_STANDARD', // PCR normal (informativo, NO afecta fiabilidad)
    'EGFR',
    'URIC_ACID'
  ];
  
  // Calcular peso total (suma de todos los pesos en config)
  let totalWeight = 0;
  for (const biomarker of allBiomarkers) {
    totalWeight += BIOMARKERS[biomarker].weight;
  }
  
  // Calcular peso medido (suma de pesos de biomarcadores con mediciones)
  let measuredWeight = 0;
  let measuredCount = 0;
  
  for (const state of biomarkerStates) {
    // Un biomarcador está "medido" si tiene al menos 1 medición histórica
    if (state.lastMeasuredAt !== null && state.value !== null) {
      measuredWeight += BIOMARKERS[state.biomarker].weight;
      measuredCount++;
    }
  }
  
  // Calcular porcentaje de fiabilidad
  const reliabilityPercentage = Math.round((measuredWeight / totalWeight) * 100);
  
  // DEBUG LOG
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
