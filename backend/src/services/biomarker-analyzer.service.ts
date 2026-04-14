/**
 * BIOMARKER ANALYZER SERVICE
 * 
 * Handles extraction and normalization of biomarker values from parsed PDF text.
 * 
 * TWO-PHASE PARSING STRATEGY for LATAM lab PDFs:
 * - PHASE 1: Detect biomarkers (labels may be on separate rows)
 * - PHASE 2: Resolve values (scan next 3-5 lines)
 */

import { BiomarkerKey, BIOMARKERS } from '../config/biomarkers.config';
import { BiomarkerValue } from './scoring-engine.service';
import { findCanonicalBiomarker, mapCanonicalToBiomarkerKey, CanonicalBiomarker } from './biomarker-alias.service';

/**
 * Interface for detected biomarker (before value resolution)
 */
interface DetectedBiomarker {
  canonical: CanonicalBiomarker;
  biomarkerKey: BiomarkerKey;
  rawLabel: string;
  lineIndex: number;
  resolved: boolean;
  value?: number;
  unit?: string;
}

/**
 * Extracts biomarker values from parsed PDF text
 * 
 * TWO-PHASE PARSING STRATEGY:
 * 
 * PHASE 1 - Biomarker Detection:
 * - Iterate line by line
 * - Normalize text (uppercase, no accents)
 * - If line matches biomarker alias: store context and line index
 * 
 * PHASE 2 - Result Value Resolution:
 * - After detecting biomarker, scan NEXT 3-5 lines
 * - Extract first numeric value that is NOT a range
 * - Associate value with biomarker
 * 
 * This handles LATAM lab PDFs where labels and values are on different rows.
 */
export function extractBiomarkers(pdfText: string): BiomarkerValue[] {
  const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const detectedBiomarkers: DetectedBiomarker[] = [];
  const foundBiomarkerKeys = new Set<BiomarkerKey>();

  // Debug: Log first 30 lines to see PDF structure
  console.log('[Biomarker] PDF text sample (first 30 lines):');
  lines.slice(0, 30).forEach((line, idx) => {
    console.log(`[${idx}] ${line.substring(0, 120)}`);
  });

  // ============================================
  // PHASE 1: BIOMARKER DETECTION
  // ============================================
  console.log('[Biomarker] PHASE 1: Detecting biomarkers...');
  
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (!line.trim()) continue;

    // Try to find a canonical biomarker match
    const canonical = findCanonicalBiomarker(line);
    
    if (!canonical) continue;

    // Map to internal biomarker key
    const biomarkerKey = mapCanonicalToBiomarkerKey(canonical);
    
    // Skip if mapping is null (e.g., CREATININE)
    if (!biomarkerKey) {
      console.log(`[Biomarker] Skipping ${canonical} (no mapping to BiomarkerKey)`);
      continue;
    }
    
    // Skip if we already detected this biomarker (first match wins)
    if (foundBiomarkerKeys.has(biomarkerKey)) {
      const existing = detectedBiomarkers.find(d => d.biomarkerKey === biomarkerKey);
      console.log(`[Biomarker] Skipping ${canonical} (already detected at line ${existing?.lineIndex})`);
      continue;
    }

    console.log(`[Biomarker] PHASE 1: Detected ${canonical} (${biomarkerKey}) at line ${lineIdx}: ${line.substring(0, 80)}`);
    
    detectedBiomarkers.push({
      canonical,
      biomarkerKey,
      rawLabel: line,
      lineIndex: lineIdx,
      resolved: false
    });

    foundBiomarkerKeys.add(biomarkerKey);
  }

  console.log(`[Biomarker] PHASE 1 complete: Detected ${detectedBiomarkers.length} biomarkers`);

  // ============================================
  // PHASE 2: RESULT VALUE RESOLUTION
  // ============================================
  console.log('[Biomarker] PHASE 2: Resolving values...');
  
  const extracted: BiomarkerValue[] = [];
  const unresolved: DetectedBiomarker[] = [];

  for (const detected of detectedBiomarkers) {
    console.log(`[Biomarker] PHASE 2: Resolving value for ${detected.canonical} (line ${detected.lineIndex})`);
    
    // Scan next 3-5 lines for value
    const scanStart = detected.lineIndex + 1;
    const scanEnd = Math.min(scanStart + 5, lines.length);
    const scanLines = lines.slice(scanStart, scanEnd);
    
    console.log(`[Biomarker] Scanning lines ${scanStart}-${scanEnd - 1} for value:`);
    scanLines.forEach((line, idx) => {
      console.log(`  [${scanStart + idx}] ${line.substring(0, 100)}`);
    });

    let valueFound = false;
    
    for (const scanLine of scanLines) {
      const { value, unit } = extractValueFromScanLine(scanLine, detected.rawLabel);
      
      if (value !== null) {
        // Validate value is reasonable
        if (!isValidValue(detected.biomarkerKey, value)) {
          console.warn(`[Biomarker] Invalid value ${value} for ${detected.biomarkerKey} (out of range)`);
          continue;
        }

        const config = BIOMARKERS[detected.biomarkerKey];
        
        extracted.push({
          biomarker: detected.biomarkerKey,
          value,
          unit: unit || config.unit
        });

        detected.resolved = true;
        detected.value = value;
        detected.unit = unit || config.unit;
        valueFound = true;
        
        console.log(`[Biomarker] ✓ Resolved ${detected.biomarkerKey}: ${value} ${detected.unit || config.unit}`);
        break; // Found value, move to next biomarker
      }
    }

    if (!valueFound) {
      console.warn(`[Biomarker] ✗ Could not resolve value for ${detected.canonical} (DETECTED_BUT_UNRESOLVED)`);
      unresolved.push(detected);
    }
  }

  console.log(`[Biomarker] PHASE 2 complete: Resolved ${extracted.length}/${detectedBiomarkers.length} biomarkers`);
  if (unresolved.length > 0) {
    console.warn(`[Biomarker] Unresolved biomarkers (${unresolved.length}):`, unresolved.map(u => u.canonical));
  }

  return extracted;
}

/**
 * Extracts value from a scan line (used in PHASE 2)
 * 
 * Looks for numeric values that are NOT ranges
 * Rejects values preceded by REF, VR, RANGO
 * Rejects range patterns (e.g., "70-110")
 */
function extractValueFromScanLine(scanLine: string, _biomarkerLabel: string): { value: number | null; unit: string } {
  const normalized = scanLine.toUpperCase();
  
  // Skip if line contains range keywords
  const rangeKeywords = ['REF', 'VR', 'RANGO', 'REFERENCIA', 'RANGE', 'VALORES DE REFERENCIA'];
  for (const keyword of rangeKeywords) {
    if (normalized.includes(keyword)) {
      console.log(`[Biomarker] Skipping line (contains ${keyword}): ${scanLine.substring(0, 60)}`);
      return { value: null, unit: '' };
    }
  }
  
  // Skip if line contains range pattern (e.g., "70-110", "70–110", "70 - 110")
  const rangePattern = /\d+\s*[–\-]\s*\d+/;
  if (rangePattern.test(scanLine)) {
    console.log(`[Biomarker] Skipping line (range pattern): ${scanLine.substring(0, 60)}`);
    return { value: null, unit: '' };
  }
  
  // Extract first numeric value (including decimals)
  const numberMatch = scanLine.match(/(\d+\.?\d*)/);
  if (!numberMatch) {
    return { value: null, unit: '' };
  }
  
  const value = parseFloat(numberMatch[1]);
  if (isNaN(value) || value < 0) {
    return { value: null, unit: '' };
  }
  
  // Extract unit if present
  const unitPatterns = [
    /(mg\/dL)/i,
    /(mmol\/L)/i,
    /(g\/dL)/i,
    /(U\/L)/i,
    /(IU\/L)/i,
    /(ml\/min)/i,
    /(%)/,
    /(mg\/L)/i
  ];
  
  let unit = '';
  for (const pattern of unitPatterns) {
    const match = scanLine.match(pattern);
    if (match) {
      unit = match[1];
      break;
    }
  }
  
  console.log(`[Biomarker] Extracted value from scan line: ${value} ${unit || '(no unit)'}`);
  return { value, unit };
}

/**
 * Validates that a value is within reasonable bounds for a biomarker
 * This catches parsing errors and impossible values
 */
function isValidValue(biomarker: BiomarkerKey, value: number): boolean {
  const validations: Record<BiomarkerKey, { min: number; max: number }> = {
    LDL: { min: 0, max: 500 },
    HBA1C: { min: 0, max: 20 },
    FASTING_GLUCOSE: { min: 0, max: 500 },
    TRIGLYCERIDES: { min: 0, max: 1000 },
    ALT: { min: 0, max: 1000 },
    HS_CRP: { min: 0, max: 100 },
    HDL: { min: 0, max: 200 },
    AST: { min: 0, max: 1000 },
    EGFR: { min: 0, max: 200 },
    URIC_ACID: { min: 0, max: 20 },
    CRP_STANDARD: { min: 0, max: 500 }
  };

  const validation = validations[biomarker];
  if (!validation) {
    console.warn(`No validation found for biomarker: ${biomarker}`);
    return false;
  }
  return value >= validation.min && value <= validation.max;
}

/**
 * Normalizes units if needed (future enhancement)
 * Currently assumes PDFs use standard units
 */
export function normalizeUnits(biomarkerValues: BiomarkerValue[]): BiomarkerValue[] {
  // TODO: Implement unit conversion if needed
  // For now, assume PDFs use standard units
  return biomarkerValues;
}
