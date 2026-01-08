/**
 * RESULT COLUMN EXTRACTION SERVICE
 * 
 * Extracts RESULT values (not reference ranges) from lab report rows.
 * Handles column-based extraction with header detection.
 */

export interface ExtractedResult {
  biomarker_code: string;
  value: number;
  unit: string;
  raw_label: string;
  raw_row: string;
}

/**
 * Keywords that indicate RESULT column
 */
const RESULT_COLUMN_KEYWORDS = [
  'RESULTADO',
  'RESULT',
  'VALOR',
  'VALUE',
  'RESULTADO:',
  'VALOR:'
];

/**
 * Keywords that indicate reference range columns (to ignore)
 */
const RANGE_KEYWORDS = [
  'REF',
  'VR',
  'RANGO',
  'REFERENCIA',
  'REFERENCE',
  'RANGE',
  'VALORES DE REFERENCIA'
];

/**
 * Splits a row into columns using multiple spaces, tabs, or vertical alignment
 */
function splitRowIntoColumns(row: string): string[] {
  // First try splitting by multiple spaces (2+)
  let columns = row.split(/\s{2,}/);
  
  // If that doesn't work well, try tabs
  if (columns.length < 2) {
    columns = row.split(/\t+/);
  }
  
  // If still not enough, try single space but filter empty
  if (columns.length < 2) {
    columns = row.split(/\s+/).filter(col => col.length > 0);
  }
  
  return columns.map(col => col.trim()).filter(col => col.length > 0);
}

/**
 * Identifies RESULT column index using keywords
 */
function findResultColumnIndex(columns: string[]): number | null {
  // Check each column for result keywords
  for (let i = 0; i < columns.length; i++) {
    const normalized = columns[i].toUpperCase().replace(/[:\-]/g, ' ').trim();
    
    for (const keyword of RESULT_COLUMN_KEYWORDS) {
      if (normalized.includes(keyword) || normalized === keyword) {
        // Result column is typically the next column after the header
        return i + 1 < columns.length ? i + 1 : null;
      }
    }
  }
  
  return null;
}

/**
 * Checks if a column contains a reference range pattern
 */
function isRangeColumn(column: string): boolean {
  const normalized = column.toUpperCase();
  
  // Check for range keywords
  for (const keyword of RANGE_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }
  
  // Check for range patterns: "70 - 110", "70–110", "70-110"
  const rangePattern = /\d+\s*[–\-]\s*\d+/;
  if (rangePattern.test(column)) {
    return true;
  }
  
  return false;
}

/**
 * Extracts numeric value from a string
 * Returns null if no valid number found
 */
function extractNumericValue(text: string): number | null {
  // Remove common separators and clean
  let cleaned = text.replace(/[,:]/g, ' ').trim();
  
  // Extract first number (including decimals)
  const numberMatch = cleaned.match(/(\d+\.?\d*)/);
  if (!numberMatch) {
    return null;
  }
  
  const value = parseFloat(numberMatch[1]);
  
  if (isNaN(value) || value < 0) {
    return null;
  }
  
  return value;
}

/**
 * Extracts unit from a row (common units: mg/dL, mmol/L, %, U/L, etc.)
 */
function extractUnit(row: string): string {
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
  
  for (const pattern of unitPatterns) {
    const match = row.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return ''; // Default empty if not found
}

/**
 * Extracts result value from a row that contains a biomarker
 * 
 * Strategy:
 * 1. Split row into columns
 * 2. Find RESULT column using keywords
 * 3. Extract numeric value from RESULT column
 * 4. Fallback: first numeric value after biomarker name (before range)
 */
export function extractResultFromRow(
  row: string,
  biomarkerLabel: string
): { value: number | null; unit: string } {
  const columns = splitRowIntoColumns(row);
  
  console.log(`[ResultExtractor] Row: ${row.substring(0, 100)}`);
  console.log(`[ResultExtractor] Columns (${columns.length}):`, columns);
  
  if (columns.length < 2) {
    console.log(`[ResultExtractor] Not enough columns, trying fallback`);
    // Try fallback even with single column
  } else {
    // Strategy 1: Find RESULT column using keywords
    const resultColumnIndex = findResultColumnIndex(columns);
    
    if (resultColumnIndex !== null && resultColumnIndex < columns.length) {
      const resultColumn = columns[resultColumnIndex];
      console.log(`[ResultExtractor] Found RESULT column at index ${resultColumnIndex}: ${resultColumn}`);
      
      // Skip if it's a range column
      if (!isRangeColumn(resultColumn)) {
        const value = extractNumericValue(resultColumn);
        if (value !== null) {
          console.log(`[ResultExtractor] Extracted value from RESULT column: ${value}`);
          return { value, unit: extractUnit(row) };
        }
      } else {
        console.log(`[ResultExtractor] RESULT column is a range column, skipping`);
      }
    }
  }
  
  // Strategy 2: Fallback - find first numeric value after biomarker name
  const normalizedRow = normalizeText(row);
  const normalizedLabel = normalizeText(biomarkerLabel);
  
  const labelIndex = normalizedRow.indexOf(normalizedLabel);
  if (labelIndex === -1) {
    // Try to find any part of the label
    const labelParts = normalizedLabel.split(' ');
    for (const part of labelParts) {
      if (part.length > 3) { // Only use significant parts
        const partIndex = normalizedRow.indexOf(part);
        if (partIndex !== -1) {
          const afterLabel = row.substring(partIndex + part.length);
          const beforeRange = afterLabel.split(/[–\-]/)[0];
          let cleaned = beforeRange;
          for (const keyword of RANGE_KEYWORDS) {
            cleaned = cleaned.replace(new RegExp(keyword, 'gi'), '');
          }
          const value = extractNumericValue(cleaned);
          if (value !== null) {
            const rangePattern = /\d+\s*[–\-]\s*\d+/;
            if (!rangePattern.test(beforeRange)) {
              console.log(`[ResultExtractor] Extracted value using partial label match: ${value}`);
              return { value, unit: extractUnit(row) };
            }
          }
        }
      }
    }
    console.log(`[ResultExtractor] Could not find biomarker label in row`);
    return { value: null, unit: extractUnit(row) };
  }
  
  // Find position after biomarker name
  const afterLabel = row.substring(labelIndex + biomarkerLabel.length);
  console.log(`[ResultExtractor] Text after label: ${afterLabel.substring(0, 50)}`);
  
  // Extract first number before any range pattern
  const beforeRange = afterLabel.split(/[–\-]/)[0]; // Stop at dash/range
  
  // Remove any range keywords before extracting
  let cleaned = beforeRange;
  for (const keyword of RANGE_KEYWORDS) {
    cleaned = cleaned.replace(new RegExp(keyword, 'gi'), '');
  }
  
  const value = extractNumericValue(cleaned);
  
  if (value !== null) {
    // Additional check: reject if value looks like a range (e.g., "70-110")
    const rangePattern = /\d+\s*[–\-]\s*\d+/;
    if (rangePattern.test(beforeRange)) {
      console.log(`[ResultExtractor] Rejected value (looks like range): ${beforeRange}`);
      return { value: null, unit: extractUnit(row) };
    }
    
    console.log(`[ResultExtractor] Extracted value using fallback: ${value}`);
    return { value, unit: extractUnit(row) };
  }
  
  console.log(`[ResultExtractor] Could not extract numeric value`);
  return { value: null, unit: extractUnit(row) };
}

/**
 * Normalizes text (same as alias service)
 */
function normalizeText(text: string): string {
  let normalized = text.toUpperCase();
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  normalized = normalized.replace(/[\s\t]+/g, ' ').trim();
  return normalized;
}

