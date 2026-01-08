/**
 * BIOMARKER ALIASES TEST - GULA V1
 * 
 * OBJETIVO: Validar que todos los aliases de la lista oficial mapean correctamente
 * 
 * REGLA CENTRAL:
 * - Un biomarcador clínico = UNA key interna
 * - Muchos nombres externos → una sola key
 * - Los aliases SOLO afectan parsing
 * - Los aliases NO afectan score, lógica ni pesos
 */

import { findCanonicalBiomarker, mapCanonicalToBiomarkerKey } from '../src/services/biomarker-alias.service';
import type { BiomarkerKey } from '../src/config/biomarkers.config';

describe('Biomarker Aliases - GULA V1 Official List', () => {
  
  /**
   * Helper function to test all aliases for a biomarker
   */
  function testAliases(
    biomarkerKey: BiomarkerKey,
    aliases: string[]
  ) {
    aliases.forEach(alias => {
      const canonical = findCanonicalBiomarker(alias);
      expect(canonical).toBeDefined();
      
      const mappedKey = mapCanonicalToBiomarkerKey(canonical!);
      expect(mappedKey).toBe(biomarkerKey);
    });
  }

  describe('LDL - Colesterol de baja densidad', () => {
    const aliases = [
      'ldl',
      'ldl-c',
      'colesterol ldl',
      'colesterol de baja densidad',
      'lipoproteina de baja densidad',
      'LDL',
      'LDL-C',
      'COLESTEROL LDL',
      'Colesterol LDL Directo'
    ];

    test('Todos los aliases de LDL deben mapear a LDL', () => {
      testAliases('LDL', aliases);
    });

    test('Variaciones comunes de LDL', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('LDL Colesterol')!)).toBe('LDL');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Colesterol LDL (calculado)')!)).toBe('LDL');
    });
  });

  describe('HDL - Colesterol de alta densidad', () => {
    const aliases = [
      'hdl',
      'hdl-c',
      'colesterol hdl',
      'colesterol de alta densidad',
      'lipoproteina de alta densidad',
      'HDL',
      'HDL-C',
      'COLESTEROL HDL'
    ];

    test('Todos los aliases de HDL deben mapear a HDL', () => {
      testAliases('HDL', aliases);
    });

    test('Variaciones comunes de HDL', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('HDL Colesterol')!)).toBe('HDL');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Colesterol HDL directo')!)).toBe('HDL');
    });
  });

  describe('TRIGLYCERIDES - Triglicéridos', () => {
    const aliases = [
      'trigliceridos',
      'triglicéridos',
      'triglycerides',
      'tg',
      'TRIGLICERIDOS',
      'TRIGLICÉRIDOS',
      'TRIGLYCERIDES',
      'TG'
    ];

    test('Todos los aliases de TRIGLYCERIDES deben mapear a TRIGLYCERIDES', () => {
      testAliases('TRIGLYCERIDES', aliases);
    });

    test('Variaciones comunes de triglicéridos', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Triglicéridos totales')!)).toBe('TRIGLYCERIDES');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('TG séricos')!)).toBe('TRIGLYCERIDES');
    });
  });

  describe('FASTING_GLUCOSE - Glucosa en ayunas', () => {
    const aliases = [
      'glucosa',
      'glucosa en ayunas',
      'glucemia',
      'glucemia en ayunas',
      'fasting glucose',
      'blood glucose fasting',
      'GLUCOSA',
      'GLUCOSA EN AYUNAS',
      'GLUCEMIA'
    ];

    test('Todos los aliases de FASTING_GLUCOSE deben mapear a FASTING_GLUCOSE', () => {
      testAliases('FASTING_GLUCOSE', aliases);
    });

    test('Variaciones comunes de glucosa', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Glucosa basal')!)).toBe('FASTING_GLUCOSE');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Glucosa (suero)')!)).toBe('FASTING_GLUCOSE');
    });

    test('REGLA ESPECIAL: Glucosa sin mención de ayuno también mapea', () => {
      // El parser mapea "glucosa" a FASTING_GLUCOSE
      // La lógica de negocio debe validar si es en ayunas
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Glucosa')!)).toBe('FASTING_GLUCOSE');
    });
  });

  describe('HBA1C - Hemoglobina glicosilada', () => {
    const aliases = [
      'hba1c',
      'hb a1c',
      'a1c',
      'hemoglobina glicosilada',
      'hemoglobina glucosilada',
      'glycated hemoglobin',
      'HBA1C',
      'HB A1C',
      'A1C'
    ];

    test('Todos los aliases de HBA1C deben mapear a HBA1C', () => {
      testAliases('HBA1C', aliases);
    });

    test('Variaciones comunes de HbA1c', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Hemoglobina A1C')!)).toBe('HBA1C');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('HbA1c')!)).toBe('HBA1C');
    });
  });

  describe('ALT - Alanina aminotransferasa', () => {
    const aliases = [
      'alt',
      'tgp',
      'gpt',
      'alanina aminotransferasa',
      'alanine aminotransferase',
      'ALT',
      'TGP',
      'GPT'
    ];

    test('Todos los aliases de ALT deben mapear a ALT', () => {
      testAliases('ALT', aliases);
    });

    test('Variaciones comunes de ALT', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Transaminasa glutámico pirúvica')!)).toBe('ALT');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('ALT (TGP)')!)).toBe('ALT');
    });
  });

  describe('AST - Aspartato aminotransferasa', () => {
    const aliases = [
      'ast',
      'asat',
      'tgo',
      'got',
      'aspartato aminotransferasa',
      'aspartate aminotransferase',
      'AST',
      'ASAT',
      'TGO',
      'GOT'
    ];

    test('Todos los aliases de AST deben mapear a AST', () => {
      testAliases('AST', aliases);
    });

    test('Variaciones comunes de AST', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Transaminasa glutámico oxalacética')!)).toBe('AST');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('AST (TGO)')!)).toBe('AST');
    });
  });

  describe('HS_CRP - PCR ultrasensible (CRÍTICO)', () => {
    const aliases = [
      'pcr ultrasensible',
      'hs-crp',
      'high sensitivity crp',
      'c-reactive protein high sensitivity',
      'PCR ULTRASENSIBLE',
      'HS-CRP',
      'HIGH SENSITIVITY CRP'
    ];

    test('Todos los aliases de HS_CRP deben mapear a HS_CRP', () => {
      testAliases('HS_CRP', aliases);
    });

    test('CRÍTICO: Variaciones con "ultrasensible" deben mapear a HS_CRP', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('PCR US')!)).toBe('HS_CRP');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('PCR HS')!)).toBe('HS_CRP');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Proteína C Reactiva ultrasensible')!)).toBe('HS_CRP');
    });

    test('PROHIBIDO: NUNCA inferir HS_CRP sin indicadores explícitos', () => {
      // "PCR" sin "ultrasensible" NO debe mapear a HS_CRP
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('PCR')!)).not.toBe('HS_CRP');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Proteína C Reactiva')!)).not.toBe('HS_CRP');
    });
  });

  describe('CRP_STANDARD - PCR normal (NO SCORE)', () => {
    const aliases = [
      'proteina c reactiva',
      'proteína c reactiva',
      'pcr',
      'crp',
      'c-reactive protein',
      'PROTEINA C REACTIVA',
      'PCR',
      'CRP'
    ];

    test('Todos los aliases de CRP_STANDARD deben mapear a CRP_STANDARD', () => {
      testAliases('CRP_STANDARD', aliases);
    });

    test('PCR sin "ultrasensible" debe mapear a CRP_STANDARD', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('PCR cuantitativa')!)).toBe('CRP_STANDARD');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Proteína C Reactiva sérica')!)).toBe('CRP_STANDARD');
    });

    test('NUNCA confundir CRP_STANDARD con HS_CRP', () => {
      const crpStandard = findCanonicalBiomarker('PCR');
      const hsCrp = findCanonicalBiomarker('PCR ultrasensible');
      
      expect(mapCanonicalToBiomarkerKey(crpStandard!)).toBe('CRP_STANDARD');
      expect(mapCanonicalToBiomarkerKey(hsCrp!)).toBe('HS_CRP');
      expect(crpStandard).not.toBe(hsCrp);
    });
  });

  describe('EGFR - Filtrado glomerular estimado', () => {
    const aliases = [
      'egfr',
      'tfg',
      'filtrado glomerular',
      'tasa de filtracion glomerular',
      'tasa de filtración glomerular',
      'estimated gfr',
      'mdrd',
      'ckd-epi',
      'EGFR',
      'TFG'
    ];

    test('Todos los aliases de EGFR deben mapear a EGFR', () => {
      testAliases('EGFR', aliases);
    });

    test('Variaciones comunes de eGFR', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('TFG estimada')!)).toBe('EGFR');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('eGFR CKD-EPI')!)).toBe('EGFR');
    });
  });

  describe('URIC_ACID - Ácido úrico', () => {
    const aliases = [
      'acido urico',
      'ácido úrico',
      'uric acid',
      'urate',
      'uratos sericos',
      'uratos séricos',
      'ACIDO URICO',
      'ÁCIDO ÚRICO',
      'URIC ACID'
    ];

    test('Todos los aliases de URIC_ACID deben mapear a URIC_ACID', () => {
      testAliases('URIC_ACID', aliases);
    });

    test('Variaciones comunes de ácido úrico', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Ácido úrico sérico')!)).toBe('URIC_ACID');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Urato')!)).toBe('URIC_ACID');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Uratos séricos')!)).toBe('URIC_ACID');
    });
  });

  describe('Edge Cases y Validaciones', () => {
    test('PROHIBIDO: Nombres desconocidos no deben crear biomarcadores nuevos', () => {
      const unknown = findCanonicalBiomarker('BIOMARCADOR_INVENTADO_123');
      expect(unknown).toBeUndefined();
    });

    test('Case insensitive: mayúsculas/minúsculas/mixtas', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('ldl')!)).toBe('LDL');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('LDL')!)).toBe('LDL');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Ldl')!)).toBe('LDL');
    });

    test('Tildes/acentos: deben ser normalizados', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('triglicéridos')!)).toBe('TRIGLYCERIDES');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('trigliceridos')!)).toBe('TRIGLYCERIDES');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('ácido úrico')!)).toBe('URIC_ACID');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('acido urico')!)).toBe('URIC_ACID');
    });

    test('Espacios extra deben ser manejados', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('  LDL  ')!)).toBe('LDL');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('COLESTEROL   LDL')!)).toBe('LDL');
    });

    test('Aliases con guiones y caracteres especiales', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('LDL-C')!)).toBe('LDL');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('HDL-C')!)).toBe('HDL');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('hs-CRP')!)).toBe('HS_CRP');
    });
  });

  describe('Consistencia entre laboratorios', () => {
    test('Laboratorio A y B usando nombres distintos → misma key', () => {
      // Laboratorio A usa "LDL"
      const labA = mapCanonicalToBiomarkerKey(findCanonicalBiomarker('LDL')!);
      
      // Laboratorio B usa "Colesterol de baja densidad"
      const labB = mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Colesterol de baja densidad')!);
      
      // Deben mapear a la misma key
      expect(labA).toBe(labB);
      expect(labA).toBe('LDL');
    });

    test('Nombres en español vs inglés → misma key', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Triglicéridos')!)).toBe('TRIGLYCERIDES');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Triglycerides')!)).toBe('TRIGLYCERIDES');
      
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Ácido úrico')!)).toBe('URIC_ACID');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Uric acid')!)).toBe('URIC_ACID');
    });

    test('Siglas vs nombres completos → misma key', () => {
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('ALT')!)).toBe('ALT');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('TGP')!)).toBe('ALT');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Alanina aminotransferasa')!)).toBe('ALT');
      
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('AST')!)).toBe('AST');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('TGO')!)).toBe('AST');
      expect(mapCanonicalToBiomarkerKey(findCanonicalBiomarker('Aspartato aminotransferasa')!)).toBe('AST');
    });
  });
});
