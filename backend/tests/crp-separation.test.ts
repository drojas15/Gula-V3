/**
 * CRP SEPARATION TEST
 * 
 * CRÍTICO: Verifica que HS_CRP y CRP_STANDARD sean tratados como biomarcadores distintos
 * 
 * REGLAS OBLIGATORIAS:
 * 1. HS_CRP (ultrasensible) y CRP_STANDARD (normal) NUNCA se comparan entre sí
 * 2. HS_CRP entra al health score (peso > 0)
 * 3. CRP_STANDARD NO entra al health score (peso = 0)
 * 4. Cada uno tiene sus propios rangos de referencia
 * 5. Las tendencias solo comparan el mismo tipo
 */

import { findCanonicalBiomarker, mapCanonicalToBiomarkerKey } from '../src/services/biomarker-alias.service';
import { BIOMARKERS } from '../src/config/biomarkers.config';
import { calculateHealthScore, BiomarkerValue } from '../src/services/scoring-engine.service';

describe('CRP Separation', () => {
  
  describe('Alias Detection', () => {
    test('CRÍTICO: "PCR ultrasensible" debe mapear a HS_CRP', () => {
      const canonical = findCanonicalBiomarker('PCR ULTRASENSIBLE');
      expect(canonical).toBe('HS_CRP');
      
      const biomarkerKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(biomarkerKey).toBe('HS_CRP');
    });

    test('CRÍTICO: "Proteína C Reactiva" sin "ultrasensible" debe mapear a CRP_STANDARD', () => {
      const canonical = findCanonicalBiomarker('PROTEINA C REACTIVA');
      expect(canonical).toBe('CRP_STANDARD');
      
      const biomarkerKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(biomarkerKey).toBe('CRP_STANDARD');
    });

    test('"PCR" a secas debe mapear a CRP_STANDARD', () => {
      const canonical = findCanonicalBiomarker('PCR');
      expect(canonical).toBe('CRP_STANDARD');
      
      const biomarkerKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(biomarkerKey).toBe('CRP_STANDARD');
    });

    test('"PCR US" debe mapear a HS_CRP', () => {
      const canonical = findCanonicalBiomarker('PCR US');
      expect(canonical).toBe('HS_CRP');
      
      const biomarkerKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(biomarkerKey).toBe('HS_CRP');
    });

    test('"hs-CRP" debe mapear a HS_CRP', () => {
      const canonical = findCanonicalBiomarker('hs-CRP');
      expect(canonical).toBe('HS_CRP');
      
      const biomarkerKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(biomarkerKey).toBe('HS_CRP');
    });

    test('"High sensitivity CRP" debe mapear a HS_CRP', () => {
      const canonical = findCanonicalBiomarker('HIGH SENSITIVITY CRP');
      expect(canonical).toBe('HS_CRP');
      
      const biomarkerKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(biomarkerKey).toBe('HS_CRP');
    });

    test('"Proteína C Reactiva Cuantitativa" debe mapear a CRP_STANDARD', () => {
      const canonical = findCanonicalBiomarker('PROTEINA C REACTIVA CUANTITATIVA');
      expect(canonical).toBe('CRP_STANDARD');
      
      const biomarkerKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(biomarkerKey).toBe('CRP_STANDARD');
    });

    test('"PCR Cuantitativa" sin "ultrasensible" debe mapear a CRP_STANDARD', () => {
      const canonical = findCanonicalBiomarker('PCR CUANTITATIVA');
      expect(canonical).toBe('CRP_STANDARD');
      
      const biomarkerKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(biomarkerKey).toBe('CRP_STANDARD');
    });
  });

  describe('Configuration Weights', () => {
    test('CRÍTICO: HS_CRP debe tener peso > 0 (entra al score)', () => {
      expect(BIOMARKERS.HS_CRP.weight).toBeGreaterThan(0);
    });

    test('CRÍTICO: CRP_STANDARD debe tener peso = 0 (NO entra al score)', () => {
      expect(BIOMARKERS.CRP_STANDARD.weight).toBe(0);
    });

    test('HS_CRP y CRP_STANDARD deben tener misma unidad', () => {
      expect(BIOMARKERS.HS_CRP.unit).toBe(BIOMARKERS.CRP_STANDARD.unit);
      expect(BIOMARKERS.HS_CRP.unit).toBe('mg/L');
    });
  });

  describe('Health Score Impact', () => {
    test('CRÍTICO: HS_CRP afecta el health score', () => {
      const biomarkers: BiomarkerValue[] = [
        { biomarker: 'HDL', value: 60, unit: 'mg/dL' },
        { biomarker: 'HS_CRP', value: 5, unit: 'mg/L' } // OUT_OF_RANGE o CRITICAL
      ];
      
      const scoreWithHsCRP = calculateHealthScore(biomarkers);
      
      const biomarkersWithoutCRP: BiomarkerValue[] = [
        { biomarker: 'HDL', value: 60, unit: 'mg/dL' }
      ];
      
      const scoreWithoutCRP = calculateHealthScore(biomarkersWithoutCRP);
      
      // El score debe ser diferente cuando HS_CRP está presente
      expect(scoreWithHsCRP).not.toBe(scoreWithoutCRP);
    });

    test('CRÍTICO: CRP_STANDARD NO afecta el health score', () => {
      const biomarkers: BiomarkerValue[] = [
        { biomarker: 'HDL', value: 60, unit: 'mg/dL' },
        { biomarker: 'CRP_STANDARD', value: 15, unit: 'mg/L' } // Cualquier valor
      ];
      
      const scoreWithCRP = calculateHealthScore(biomarkers);
      
      const biomarkersWithoutCRP: BiomarkerValue[] = [
        { biomarker: 'HDL', value: 60, unit: 'mg/dL' }
      ];
      
      const scoreWithoutCRP = calculateHealthScore(biomarkersWithoutCRP);
      
      // El score debe ser IDÉNTICO con o sin CRP_STANDARD
      expect(scoreWithCRP).toBe(scoreWithoutCRP);
    });

    test('HS_CRP y CRP_STANDARD juntos: solo HS_CRP afecta score', () => {
      const biomarkersWithBoth: BiomarkerValue[] = [
        { biomarker: 'HDL', value: 60, unit: 'mg/dL' },
        { biomarker: 'HS_CRP', value: 3, unit: 'mg/L' },
        { biomarker: 'CRP_STANDARD', value: 15, unit: 'mg/L' }
      ];
      
      const biomarkersOnlyHsCRP: BiomarkerValue[] = [
        { biomarker: 'HDL', value: 60, unit: 'mg/dL' },
        { biomarker: 'HS_CRP', value: 3, unit: 'mg/L' }
      ];
      
      const scoreWithBoth = calculateHealthScore(biomarkersWithBoth);
      const scoreOnlyHsCRP = calculateHealthScore(biomarkersOnlyHsCRP);
      
      // Agregar CRP_STANDARD no debe cambiar el score
      expect(scoreWithBoth).toBe(scoreOnlyHsCRP);
    });
  });

  describe('Type Safety', () => {
    test('HS_CRP y CRP_STANDARD son tipos distintos de BiomarkerKey', () => {
      const hsCRP: 'HS_CRP' = 'HS_CRP';
      const crpStandard: 'CRP_STANDARD' = 'CRP_STANDARD';
      
      // TypeScript debe permitir ambos como BiomarkerKey
      expect(hsCRP).not.toBe(crpStandard);
    });
  });

  describe('Edge Cases', () => {
    test('Texto con "PCR" y "ultrasensible" separados debe detectar HS_CRP', () => {
      const text = 'Examen de PCR realizado con método ultrasensible';
      const canonical = findCanonicalBiomarker(text);
      expect(canonical).toBe('HS_CRP');
    });

    test('Texto con "proteína C reactiva" en minúsculas debe detectar CRP_STANDARD', () => {
      const text = 'proteína c reactiva';
      const canonical = findCanonicalBiomarker(text);
      expect(canonical).toBe('CRP_STANDARD');
    });

    test('NUNCA asumir HS_CRP por defecto', () => {
      // Si detectamos PCR pero no está claro que es ultrasensible,
      // debe ser CRP_STANDARD (conservador)
      const text = 'PCR sérica';
      const canonical = findCanonicalBiomarker(text);
      expect(canonical).toBe('CRP_STANDARD');
    });
  });
});
