/**
 * HEALTH SCORE NORMALIZATION TEST
 * 
 * CRITICAL: Verifica que el health score SIEMPRE esté entre 0 y 100
 * 
 * REGLA OBLIGATORIA:
 * - score_raw = Σ (biomarker_weight × status_multiplier)
 * - score_max = Σ (biomarker_weight × 1.0)
 * - health_score = round((score_raw / score_max) × 100)
 * - NUNCA mostrar score_raw directamente
 */

import { calculateHealthScore, BiomarkerValue } from '../src/services/scoring-engine.service';

describe('Health Score Normalization', () => {
  
  test('CRÍTICO: Score debe estar entre 0-100 con pocos biomarcadores', () => {
    // Caso real: Usuario con solo 4 biomarcadores medidos
    const biomarkers: BiomarkerValue[] = [
      { biomarker: 'HDL', value: 64, unit: 'mg/dL' },      // OPTIMAL (1.0 × 1.00 = 1.0)
      { biomarker: 'LDL', value: 107, unit: 'mg/dL' },     // GOOD (1.5 × 0.80 = 1.2)
      { biomarker: 'HS_CRP', value: 3, unit: 'mg/L' },     // GOOD (1.0 × 0.80 = 0.8)
      { biomarker: 'URIC_ACID', value: 4.2, unit: 'mg/dL' } // OPTIMAL (0.8 × 1.00 = 0.8)
    ];
    
    // Total score normalizado debe estar entre 0-100
    
    const score = calculateHealthScore(biomarkers);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThan(10); // NUNCA mostrar números como "4"
    expect(score).toBe(85); // Valor real normalizado
  });

  test('Score con todos los biomarcadores OPTIMAL debe ser cercano a 100', () => {
    const biomarkers: BiomarkerValue[] = [
      { biomarker: 'HDL', value: 70, unit: 'mg/dL' },
      { biomarker: 'LDL', value: 90, unit: 'mg/dL' },
      { biomarker: 'TRIGLYCERIDES', value: 100, unit: 'mg/dL' },
      { biomarker: 'FASTING_GLUCOSE', value: 85, unit: 'mg/dL' },
      { biomarker: 'HBA1C', value: 5.2, unit: '%' },
    ];
    
    const score = calculateHealthScore(biomarkers);
    
    // Con todos OPTIMAL/GOOD, el score debe ser muy alto
    expect(score).toBeGreaterThanOrEqual(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('Score con todos los biomarcadores CRITICAL debe ser cercano a 0', () => {
    const biomarkers: BiomarkerValue[] = [
      { biomarker: 'LDL', value: 250, unit: 'mg/dL' },         // CRITICAL
      { biomarker: 'TRIGLYCERIDES', value: 600, unit: 'mg/dL' }, // CRITICAL
      { biomarker: 'FASTING_GLUCOSE', value: 150, unit: 'mg/dL' }, // CRITICAL
      { biomarker: 'HBA1C', value: 7.5, unit: '%' },           // CRITICAL
    ];
    
    const score = calculateHealthScore(biomarkers);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeLessThan(30); // Debe ser bajo pero normalizado
  });

  test('Score con mezcla de estados debe estar normalizado', () => {
    const biomarkers: BiomarkerValue[] = [
      { biomarker: 'HDL', value: 45, unit: 'mg/dL' },          // GOOD
      { biomarker: 'LDL', value: 140, unit: 'mg/dL' },         // OUT_OF_RANGE
      { biomarker: 'TRIGLYCERIDES', value: 180, unit: 'mg/dL' }, // GOOD
      { biomarker: 'FASTING_GLUCOSE', value: 105, unit: 'mg/dL' }, // GOOD
      { biomarker: 'HS_CRP', value: 5, unit: 'mg/L' },         // OUT_OF_RANGE
    ];
    
    const score = calculateHealthScore(biomarkers);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThan(40); // Debe estar en rango medio
    expect(score).toBeLessThan(80);
  });

  test('Score con un solo biomarcador debe estar normalizado', () => {
    const biomarkers: BiomarkerValue[] = [
      { biomarker: 'LDL', value: 130, unit: 'mg/dL' } // GOOD (OUT_OF_RANGE según rangos)
    ];
    
    const score = calculateHealthScore(biomarkers);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThan(10); // Lo importante: NUNCA < 10
  });

  test('Score con array vacío debe ser 0', () => {
    const biomarkers: BiomarkerValue[] = [];
    
    const score = calculateHealthScore(biomarkers);
    
    expect(score).toBe(0);
  });

  test('PROHIBIDO: Score nunca debe ser menor a 10 con biomarcadores medidos', () => {
    // Este test asegura que NUNCA volvamos a ver "4" en el dashboard
    const biomarkers: BiomarkerValue[] = [
      { biomarker: 'HDL', value: 64, unit: 'mg/dL' },
      { biomarker: 'LDL', value: 107, unit: 'mg/dL' },
      { biomarker: 'HS_CRP', value: 3, unit: 'mg/L' },
      { biomarker: 'URIC_ACID', value: 4.2, unit: 'mg/dL' }
    ];
    
    const score = calculateHealthScore(biomarkers);
    
    // Con al menos un biomarcador medido, el score debe ser >= 10
    if (biomarkers.length > 0) {
      expect(score).toBeGreaterThanOrEqual(10);
    }
  });

  test('Score debe ser determinístico', () => {
    const biomarkers: BiomarkerValue[] = [
      { biomarker: 'HDL', value: 55, unit: 'mg/dL' },
      { biomarker: 'LDL', value: 120, unit: 'mg/dL' },
    ];
    
    const score1 = calculateHealthScore(biomarkers);
    const score2 = calculateHealthScore(biomarkers);
    const score3 = calculateHealthScore(biomarkers);
    
    // Mismo input = mismo output SIEMPRE
    expect(score1).toBe(score2);
    expect(score2).toBe(score3);
  });

  test('Score debe ser un número entero', () => {
    const biomarkers: BiomarkerValue[] = [
      { biomarker: 'HDL', value: 62, unit: 'mg/dL' },
      { biomarker: 'LDL', value: 115, unit: 'mg/dL' },
    ];
    
    const score = calculateHealthScore(biomarkers);
    
    expect(Number.isInteger(score)).toBe(true);
  });
});
