/**
 * TESTS UNITARIOS - ROBUST BIOMARKER PARSER
 * 
 * Casos reales de laboratorios LATAM:
 * - Sura
 * - Colsanitas
 * - Compensar
 * 
 * Escenarios:
 * - Valor NO es el primer número
 * - Rangos de referencia en la misma línea
 * - Fechas en la línea
 * - Formatos distintos
 * - hs-CRP vs PCR normal
 */

import { parseLineForBiomarker, parseFullText } from '../src/services/robust-biomarker-parser.service';

describe('Robust Biomarker Parser - Unit Tests', () => {
  
  // ==============================================
  // CASO 1: Valor con rango en misma línea
  // ==============================================
  describe('Valor con rango de referencia', () => {
    test('Triglicéridos: valor antes del rango', () => {
      const line = 'Triglicéridos en suero 111 50 - 150 mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('TRIGLYCERIDES');
      expect(result?.value).toBe(111);
      expect(result?.unit?.toLowerCase()).toBe('mg/dl');
      expect(result?.confidence).not.toBe('none');
    });
    
    test('LDL: valor después del nombre, antes del rango', () => {
      const line = 'LDL-Colesterol 135 REF: 0-100 mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('LDL');
      expect(result?.value).toBe(135);
      expect(result?.unit?.toLowerCase()).toBe('mg/dl');
    });
    
    test('HDL: múltiples números, ignorar rango', () => {
      const line = 'Colesterol HDL 52 Rango: 40-60 mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('HDL');
      expect(result?.value).toBe(52);
      expect(result?.unit?.toLowerCase()).toBe('mg/dl');
    });
  });
  
  // ==============================================
  // CASO 2: Fecha en la línea
  // ==============================================
  describe('Línea con fechas', () => {
    test('Glucosa con fecha en formato dd/mm/yyyy', () => {
      const line = 'Glucosa en ayunas 12/01/2024 95 mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('FASTING_GLUCOSE');
      expect(result?.value).toBe(95);
      expect(result?.value).not.toBe(12); // NO debe tomar parte de la fecha
    });
    
    test('HbA1c con fecha y rango', () => {
      const line = 'Hemoglobina A1C 15/12/2023 5.8 VR: 4.0-6.0 %';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('HBA1C');
      expect(result?.value).toBe(5.8);
      expect(result?.value).not.toBe(15);
      expect(result?.value).not.toBe(4.0);
    });
  });
  
  // ==============================================
  // CASO 3: Valor NO es el primer número
  // ==============================================
  describe('Valor no es primer número', () => {
    test('ALT con código de laboratorio al inicio', () => {
      const line = '001 ALT (TGP) 45 U/L REF: 0-40';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('ALT');
      expect(result?.value).toBe(45);
      expect(result?.value).not.toBe(1); // NO el código
      expect(result?.value).not.toBe(0); // NO el rango
    });
    
    test('AST con múltiples números antes', () => {
      const line = 'Test 123 Código 456 AST (ASAT) 38 Referencia: 10-35 U/L';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('AST');
      expect(result?.value).toBe(38);
      expect(result?.value).not.toBe(123);
      expect(result?.value).not.toBe(456);
    });
  });
  
  // ==============================================
  // CASO 4: Formatos de laboratorios LATAM
  // ==============================================
  describe('Formatos reales LATAM', () => {
    test('Sura - formato con código y columnas', () => {
      const line = 'COLESTEROL LDL     145     0-100     mg/dL     ALTO';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('LDL');
      expect(result?.value).toBe(145);
    });
    
    test('Colsanitas - formato con guiones', () => {
      const line = 'Triglicéridos – 175 – Rango: 0-150 – mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('TRIGLYCERIDES');
      expect(result?.value).toBe(175);
    });
    
    test('Compensar - formato compacto', () => {
      const line = 'GLUCOSA EN AYUNAS: 102 (70-100) mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('FASTING_GLUCOSE');
      expect(result?.value).toBe(102);
    });
  });
  
  // ==============================================
  // CASO 5: hs-CRP vs PCR normal (CRÍTICO)
  // ==============================================
  describe('Separación hs-CRP vs PCR normal', () => {
    test('hs-CRP: detecta PCR ultrasensible', () => {
      const line = 'PCR ultrasensible 2.5 mg/L';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('HS_CRP');
      expect(result?.value).toBe(2.5);
    });
    
    test('hs-CRP: formato hs-CRP', () => {
      const line = 'hs-CRP (High Sensitivity) 1.8 mg/L';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('HS_CRP');
      expect(result?.value).toBe(1.8);
    });
    
    test('PCR normal: NO ultrasensible', () => {
      const line = 'Proteína C Reactiva (PCR) 5.0 mg/L';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('CRP_STANDARD');
      expect(result?.value).toBe(5.0);
    });
    
    test('PCR normal vs hs-CRP: NO confundir', () => {
      const linePCR = 'PCR Cuantitativa 8.0 mg/L';
      const resultPCR = parseLineForBiomarker(linePCR);
      
      const lineHsCRP = 'PCR-US (ultrasensible) 3.2 mg/L';
      const resultHsCRP = parseLineForBiomarker(lineHsCRP);
      
      expect(resultPCR?.biomarker).toBe('CRP_STANDARD');
      expect(resultHsCRP?.biomarker).toBe('HS_CRP');
      expect(resultPCR?.biomarker).not.toBe(resultHsCRP?.biomarker);
    });
  });
  
  // ==============================================
  // CASO 6: eGFR y ácido úrico
  // ==============================================
  describe('eGFR y ácido úrico', () => {
    test('eGFR: filtrado glomerular', () => {
      const line = 'TFG (MDRD) 85 ml/min/1.73m2';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('EGFR');
      expect(result?.value).toBe(85);
    });
    
    test('Ácido úrico con tildes', () => {
      const line = 'Ácido Úrico 6.2 mg/dL Referencia: 3.5-7.2';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('URIC_ACID');
      expect(result?.value).toBe(6.2);
      expect(result?.value).not.toBe(3.5);
    });
  });
  
  // ==============================================
  // CASO 7: Líneas sin valor válido (debe devolver null)
  // ==============================================
  describe('Casos sin valor válido', () => {
    test('Solo nombre del biomarcador', () => {
      const line = 'Colesterol HDL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('HDL');
      expect(result?.value).toBeNull();
      expect(result?.confidence).toBe('none');
    });
    
    test('Solo rangos de referencia', () => {
      const line = 'Triglicéridos Rango: 0-150 mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('TRIGLYCERIDES');
      expect(result?.value).toBeNull();
    });
    
    test('Línea sin biomarcador', () => {
      const line = 'Examen de laboratorio - Fecha: 12/01/2024';
      const result = parseLineForBiomarker(line);
      
      expect(result).toBeNull();
    });
  });
  
  // ==============================================
  // CASO 8: Aliases alternativos
  // ==============================================
  describe('Aliases alternativos', () => {
    test('ALT como TGP', () => {
      const line = 'TGP (GPT) 32 U/L';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('ALT');
      expect(result?.value).toBe(32);
    });
    
    test('AST como TGO', () => {
      const line = 'TGO 28 Referencia: 0-40 U/L';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('AST');
      expect(result?.value).toBe(28);
    });
    
    test('Glucosa sin mención de ayuno', () => {
      const line = 'Glucosa (Suero) 88 mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result).not.toBeNull();
      expect(result?.biomarker).toBe('FASTING_GLUCOSE');
      expect(result?.value).toBe(88);
    });
  });
  
  // ==============================================
  // CASO 9: Parsing de texto completo (múltiples líneas)
  // ==============================================
  describe('Parsing de texto completo', () => {
    test('Múltiples biomarcadores en texto', () => {
      const pdfText = `
        LABORATORIO CLÍNICO - SURA
        Paciente: Juan Pérez
        Fecha: 12/01/2024
        
        PERFIL LIPÍDICO
        Colesterol Total 220 mg/dL
        LDL-Colesterol 145 Ref: 0-100 mg/dL
        HDL-Colesterol 48 40-60 mg/dL
        Triglicéridos 175 0-150 mg/dL
        
        GLUCEMIA
        Glucosa en ayunas 102 70-100 mg/dL
        HbA1c 5.9 % VR: 4.0-6.0
        
        FUNCIÓN HEPÁTICA
        ALT (TGP) 45 U/L
        AST (TGO) 38 U/L
        
        INFLAMACIÓN
        PCR ultrasensible 2.8 mg/L
      `;
      
      const results = parseFullText(pdfText);
      
      // Verificar que se detectaron los biomarcadores clave
      const biomarkers = results.map(r => r.biomarker);
      expect(biomarkers).toContain('LDL');
      expect(biomarkers).toContain('HDL');
      expect(biomarkers).toContain('TRIGLYCERIDES');
      expect(biomarkers).toContain('FASTING_GLUCOSE');
      expect(biomarkers).toContain('HBA1C');
      expect(biomarkers).toContain('ALT');
      expect(biomarkers).toContain('AST');
      expect(biomarkers).toContain('HS_CRP');
      
      // Verificar valores
      const ldl = results.find(r => r.biomarker === 'LDL');
      expect(ldl?.value).toBe(145);
      
      const hdl = results.find(r => r.biomarker === 'HDL');
      expect(hdl?.value).toBe(48);
      
      const trig = results.find(r => r.biomarker === 'TRIGLYCERIDES');
      expect(trig?.value).toBe(175);
      
      const glucose = results.find(r => r.biomarker === 'FASTING_GLUCOSE');
      expect(glucose?.value).toBe(102);
      
      const hba1c = results.find(r => r.biomarker === 'HBA1C');
      expect(hba1c?.value).toBe(5.9);
      
      const hsCRP = results.find(r => r.biomarker === 'HS_CRP');
      expect(hsCRP?.value).toBe(2.8);
    });
    
    test('Un biomarcador = un valor (no duplicados)', () => {
      const pdfText = `
        LDL-Colesterol 145 mg/dL
        Algún texto
        LDL-Colesterol 150 mg/dL
      `;
      
      const results = parseFullText(pdfText);
      const ldlResults = results.filter(r => r.biomarker === 'LDL');
      
      // Solo debe tomar el primer match
      expect(ldlResults.length).toBe(1);
      expect(ldlResults[0].value).toBe(145);
    });
  });
  
  // ==============================================
  // CASO 10: Nivel de confianza
  // ==============================================
  describe('Nivel de confianza', () => {
    test('Alta confianza: 1 candidato + unidad', () => {
      const line = 'LDL-Colesterol 130 mg/dL';
      const result = parseLineForBiomarker(line);
      
      expect(result?.confidence).toBe('high');
    });
    
    test('Media confianza: múltiples candidatos pero con unidad', () => {
      const line = '001 LDL 130 mg/dL';
      const result = parseLineForBiomarker(line);
      
      // Aunque hay múltiples números, la unidad ayuda
      expect(['medium', 'high']).toContain(result?.confidence);
    });
    
    test('Sin confianza: no hay valor', () => {
      const line = 'LDL-Colesterol Ref: 0-100';
      const result = parseLineForBiomarker(line);
      
      expect(result?.confidence).toBe('none');
    });
  });
});
