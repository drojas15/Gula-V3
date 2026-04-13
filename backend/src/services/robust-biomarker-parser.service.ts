/**
 * ROBUST BIOMARKER PARSER SERVICE
 * 
 * Parser tolerante a formatos distintos que:
 * - Identifica biomarcadores mapeados en el texto
 * - Extrae el valor correcto aunque NO sea el primer número
 * - Ignora fechas, rangos, referencias
 * - NUNCA inventa valores
 * - Devuelve null si no hay match confiable
 * 
 * REGLAS:
 * 1. Normalización previa (lowercase, sin tildes, sin *, sin paréntesis)
 * 2. Parseo línea por línea (cada línea es independiente)
 * 3. Detección por concepto (no por posición)
 * 4. Valor = número más cercano al alias que NO sea fecha/rango
 * 5. hs-CRP ≠ PCR normal (separación conceptual)
 */

import { BiomarkerKey } from '../config/biomarkers.config';
import { findCanonicalBiomarker, mapCanonicalToBiomarkerKey } from './biomarker-alias.service';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

export interface ParsedBiomarker {
  biomarker: BiomarkerKey | null;
  raw_line: string;
  value: number | null;
  unit: string | null;
  confidence: ConfidenceLevel;
}

/**
 * Normaliza texto según las reglas:
 * - Lowercase
 * - Eliminar tildes
 * - Eliminar *, paréntesis, dobles espacios
 * - Unificar separadores (: – - → espacio)
 */
function normalizeLineText(text: string): string {
  let normalized = text.toLowerCase();
  
  // Eliminar tildes/acentos
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Eliminar asteriscos y paréntesis
  normalized = normalized.replace(/[*()]/g, '');
  
  // Unificar separadores: : – - → espacio
  normalized = normalized.replace(/[:–\-]/g, ' ');
  
  // Eliminar dobles espacios
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Extrae todos los números decimales de una línea
 * Devuelve array de { value, position, context }
 */
interface NumberCandidate {
  value: number;
  position: number;  // Posición del inicio del número en el texto
  context: string;   // Texto alrededor (10 chars antes y después)
}

function extractAllNumbers(line: string): NumberCandidate[] {
  const candidates: NumberCandidate[] = [];
  const regex = /\d+\.?\d*/g;
  let match;
  
  while ((match = regex.exec(line)) !== null) {
    const value = parseFloat(match[0]);
    const position = match.index;
    
    // Extraer contexto (10 chars antes y después)
    const contextStart = Math.max(0, position - 10);
    const contextEnd = Math.min(line.length, position + match[0].length + 10);
    const context = line.substring(contextStart, contextEnd);
    
    candidates.push({
      value,
      position,
      context
    });
  }
  
  return candidates;
}

/**
 * Verifica si un número específico es parte de una fecha
 * Busca patrones de fecha alrededor del número específico
 */
function isNumberPartOfDate(candidate: NumberCandidate, line: string): boolean {
  // Extraer contexto más amplio (20 chars antes y después)
  const start = Math.max(0, candidate.position - 20);
  const end = Math.min(line.length, candidate.position + String(candidate.value).length + 20);
  const wideContext = line.substring(start, end);
  
  // Buscar si este número específico está dentro de un patrón de fecha
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    /\d{1,2}-\d{1,2}-\d{2,4}/g,
    /\d{4}-\d{1,2}-\d{1,2}/g,
    /\d{1,2}\.\d{1,2}\.\d{2,4}/g
  ];
  
  for (const pattern of datePatterns) {
    const matches = Array.from(wideContext.matchAll(pattern));
    for (const match of matches) {
      if (match[0].includes(String(candidate.value))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica si un número específico es parte de un rango
 */
function isNumberPartOfRange(candidate: NumberCandidate, line: string): boolean {
  // Extraer contexto más amplio (15 chars antes y después)
  const start = Math.max(0, candidate.position - 15);
  const end = Math.min(line.length, candidate.position + String(candidate.value).length + 15);
  const wideContext = line.substring(start, end);
  
  // Buscar si este número está en un patrón de rango
  const rangePattern = /\d+\.?\d*\s*[\-–]\s*\d+\.?\d*/g;
  const matches = Array.from(wideContext.matchAll(rangePattern));
  
  for (const match of matches) {
    if (match[0].includes(String(candidate.value))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filtra candidatos que son parte de fechas o rangos.
 * IMPORTANT: `line` must be the SAME string from which positions were extracted
 * (i.e. the normalized string). Using rawLine here would cause position drift
 * due to whitespace collapsing in normalizeLineText.
 */
function filterInvalidCandidates(candidates: NumberCandidate[], line: string): NumberCandidate[] {
  return candidates.filter(candidate => {
    // Verificar si este número específico es parte de una fecha
    if (isNumberPartOfDate(candidate, line)) {
      console.log(`  [Parser] Ignorando ${candidate.value} (es parte de fecha): "${candidate.context}"`);
      return false;
    }

    // Verificar si este número específico es parte de un rango
    if (isNumberPartOfRange(candidate, line)) {
      console.log(`  [Parser] Ignorando ${candidate.value} (es parte de rango): "${candidate.context}"`);
      return false;
    }

    // Verificar si está precedido por palabras clave de referencia
    const contextBefore = line.substring(Math.max(0, candidate.position - 20), candidate.position).toLowerCase();
    const refKeywords = ['ref', 'vr', 'rango', 'referencia', 'reference', 'range', 'valores de referencia'];

    for (const keyword of refKeywords) {
      if (contextBefore.includes(keyword)) {
        console.log(`  [Parser] Ignorando ${candidate.value} (precedido por '${keyword}'): "${candidate.context}"`);
        return false;
      }
    }

    return true;
  });
}

/**
 * Extrae unidad de medida de la línea
 */
function extractUnit(line: string): string | null {
  const unitPatterns = [
    /(mg\/dl)/i,
    /(mmol\/l)/i,
    /(g\/dl)/i,
    /(u\/l)/i,
    /(iu\/l)/i,
    /(ml\/min)/i,
    /(%)/,
    /(mg\/l)/i
  ];
  
  for (const pattern of unitPatterns) {
    const match = line.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Encuentra la posición aproximada del alias en el texto normalizado
 */
function findAliasPosition(normalizedLine: string, biomarkerKey: BiomarkerKey): number {
  // Usar el servicio de aliases para obtener las variantes
  const { BIOMARKER_ALIASES } = require('./biomarker-alias.service');
  
  // Encontrar qué canonical corresponde
  for (const [canonical, aliases] of Object.entries(BIOMARKER_ALIASES)) {
    const mappedKey = mapCanonicalToBiomarkerKey(canonical as any);
    if (mappedKey === biomarkerKey) {
      // Buscar cualquier alias en la línea
      for (const alias of aliases as string[]) {
        const normalizedAlias = alias.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        
        const position = normalizedLine.indexOf(normalizedAlias);
        if (position !== -1) {
          return position + normalizedAlias.length; // Fin del alias
        }
      }
    }
  }
  
  return 0; // Si no encontramos, asumir inicio
}

/**
 * Selecciona el número más cercano al alias detectado
 */
function selectClosestValue(candidates: NumberCandidate[], aliasPosition: number): NumberCandidate | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  
  // Calcular distancia de cada candidato al alias
  const withDistances = candidates.map(c => ({
    ...c,
    distance: Math.abs(c.position - aliasPosition)
  }));
  
  // Ordenar por distancia (más cercano primero)
  withDistances.sort((a, b) => a.distance - b.distance);
  
  console.log(`  [Parser] Candidatos ordenados por distancia:`);
  withDistances.forEach(c => {
    console.log(`    ${c.value} @ pos ${c.position} (distancia: ${c.distance})`);
  });
  
  return withDistances[0];
}

/**
 * Determina el nivel de confianza del parsing
 */
function determineConfidence(
  value: number | null,
  candidatesCount: number,
  hasUnit: boolean
): ConfidenceLevel {
  if (value === null) return 'none';
  
  // Alta confianza: 1 candidato + unidad
  if (candidatesCount === 1 && hasUnit) return 'high';
  
  // Media confianza: 1 candidato sin unidad, o múltiples candidatos con unidad
  if (candidatesCount === 1 || (candidatesCount > 1 && hasUnit)) return 'medium';
  
  // Baja confianza: múltiples candidatos sin unidad clara
  return 'low';
}

/**
 * Parsea UNA línea para extraer biomarcador y valor
 * 
 * Proceso:
 * 1. Normalizar línea
 * 2. Detectar si contiene alias de biomarcador
 * 3. Si NO → retornar null
 * 4. Si SÍ → extraer todos los números
 * 5. Filtrar números inválidos (fechas, rangos, refs)
 * 6. Seleccionar número más cercano al alias
 * 7. Extraer unidad
 * 8. Devolver resultado con nivel de confianza
 */
export function parseLineForBiomarker(rawLine: string): ParsedBiomarker | null {
  const normalized = normalizeLineText(rawLine);
  
  // 1. Detectar biomarcador
  const canonical = findCanonicalBiomarker(normalized);
  
  if (!canonical) {
    return null; // No hay biomarcador en esta línea
  }
  
  const biomarkerKey = mapCanonicalToBiomarkerKey(canonical);
  
  if (!biomarkerKey) {
    console.log(`[Parser] Biomarcador ${canonical} no mapeado a BiomarkerKey`);
    return null;
  }
  
  console.log(`[Parser] Línea: "${rawLine}"`);
  console.log(`[Parser] Alias detectado: ${canonical} → ${biomarkerKey}`);
  
  // 2. Extraer todos los números
  const allNumbers = extractAllNumbers(normalized);
  console.log(`[Parser] Números encontrados: [${allNumbers.map(n => n.value).join(', ')}]`);
  
  // 3. Filtrar candidatos inválidos (usar normalized para que las posiciones coincidan)
  const validCandidates = filterInvalidCandidates(allNumbers, normalized);
  console.log(`[Parser] Candidatos válidos: [${validCandidates.map(n => n.value).join(', ')}]`);
  
  // 4. Si no hay candidatos válidos, devolver null
  if (validCandidates.length === 0) {
    console.log(`[Parser] No hay candidatos válidos para ${biomarkerKey}`);
    return {
      biomarker: biomarkerKey,
      raw_line: rawLine,
      value: null,
      unit: null,
      confidence: 'none'
    };
  }
  
  // 5. Encontrar posición del alias
  const aliasPosition = findAliasPosition(normalized, biomarkerKey);
  console.log(`[Parser] Posición del alias: ${aliasPosition}`);
  
  // 6. Seleccionar el más cercano
  const selected = selectClosestValue(validCandidates, aliasPosition);
  
  if (!selected) {
    return {
      biomarker: biomarkerKey,
      raw_line: rawLine,
      value: null,
      unit: null,
      confidence: 'none'
    };
  }
  
  // 7. Extraer unidad
  const unit = extractUnit(rawLine);
  
  // 8. Determinar confianza
  const confidence = determineConfidence(selected.value, validCandidates.length, unit !== null);
  
  console.log(`[Parser] ✓ Valor final: ${selected.value} ${unit || '(sin unidad)'} [confianza: ${confidence}]`);
  
  return {
    biomarker: biomarkerKey,
    raw_line: rawLine,
    value: selected.value,
    unit,
    confidence
  };
}

/**
 * Parsea texto completo del PDF línea por línea
 *
 * Reglas:
 * - Un biomarcador = un valor (primer match válido)
 * - No sobrescribir valores
 * - Líneas independientes
 * - Soporte multi-línea: si el biomarcador se detecta sin valor, se busca el valor en la siguiente línea
 */
export function parseFullText(pdfText: string): ParsedBiomarker[] {
  const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log(`[Parser] Parseando ${lines.length} líneas`);
  console.log('[Parser] =====================================');

  const results: ParsedBiomarker[] = [];
  const foundBiomarkers = new Set<BiomarkerKey>();

  // Para soporte multi-línea: guarda el biomarcador detectado sin valor en la línea anterior
  let pendingBiomarker: { key: BiomarkerKey; rawLine: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const parsed = parseLineForBiomarker(line);

    if (parsed && parsed.biomarker) {
      // Línea contiene un alias de biomarcador
      pendingBiomarker = null; // reset (esta línea tiene contexto propio)

      if (!foundBiomarkers.has(parsed.biomarker)) {
        if (parsed.value !== null) {
          results.push(parsed);
          foundBiomarkers.add(parsed.biomarker);
          console.log(`[Parser] Biomarcador ${parsed.biomarker} agregado con valor ${parsed.value} (línea ${i})`);
        } else {
          // Biomarcador detectado sin valor → esperar siguiente línea
          pendingBiomarker = { key: parsed.biomarker, rawLine: line };
          console.log(`[Parser] Biomarcador ${parsed.biomarker} detectado sin valor, esperando siguiente línea (línea ${i})`);
        }
      } else {
        console.log(`[Parser] Biomarcador ${parsed.biomarker} ya detectado con valor, ignorando (línea ${i})`);
      }
    } else if (pendingBiomarker !== null && !foundBiomarkers.has(pendingBiomarker.key)) {
      // Línea sin alias de biomarcador — intentar extraer valor para el pendingBiomarker
      // Heurística: solo si la línea es corta (≤ 60 chars) y tiene pocos candidatos numéricos
      const normalized = normalizeLineText(line);
      if (normalized.length <= 60) {
        const nums = extractAllNumbers(normalized);
        const valid = filterInvalidCandidates(nums, normalized);
        if (valid.length >= 1 && valid.length <= 3) {
          const selected = selectClosestValue(valid, 0);
          if (selected) {
            const unit = extractUnit(line);
            const confidence = determineConfidence(selected.value, valid.length, unit !== null);
            results.push({
              biomarker: pendingBiomarker.key,
              raw_line: pendingBiomarker.rawLine + ' | ' + line,
              value: selected.value,
              unit,
              confidence
            });
            foundBiomarkers.add(pendingBiomarker.key);
            console.log(`[Parser] Biomarcador ${pendingBiomarker.key} resuelto con valor multi-línea: ${selected.value} (línea ${i})`);
          }
        }
      }
      pendingBiomarker = null;
    } else {
      pendingBiomarker = null;
    }

    console.log('[Parser] -------------------------------------');
  }

  console.log('[Parser] =====================================');
  console.log(`[Parser] Total biomarcadores parseados: ${results.length}`);

  return results;
}

/**
 * Convierte ParsedBiomarker a formato BiomarkerValue (para compatibilidad)
 */
export function convertToLegacyFormat(parsed: ParsedBiomarker[]): Array<{ biomarker: BiomarkerKey; value: number; unit: string }> {
  return parsed
    .filter(p => p.biomarker !== null && p.value !== null)
    .map(p => ({
      biomarker: p.biomarker!,
      value: p.value!,
      unit: p.unit || ''
    }));
}
