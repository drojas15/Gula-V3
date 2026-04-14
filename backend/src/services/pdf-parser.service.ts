/**
 * PDF PARSER SERVICE
 * 
 * Handles PDF upload and text extraction.
 * Uses pdf-parse library to extract text from PDF files.
 */

import pdfParse from 'pdf-parse';
import { normalizeUnits } from './biomarker-analyzer.service';
import { BiomarkerValue } from './scoring-engine.service';
import { parseFullText, convertToLegacyFormat, ParsedBiomarker } from './robust-biomarker-parser.service';

export interface ParseResult {
  success: boolean;
  text?: string;
  biomarkers?: BiomarkerValue[];
  parsedBiomarkers?: ParsedBiomarker[]; // Raw parsed results with confidence levels
  examDate?: Date | null; // Extracted exam date from PDF (if found)
  error?: string;
}

const SPANISH_MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
};

/**
 * Parses a date match string into a Date object using format-aware parsing.
 * Avoids new Date(string) for LATAM formats which Node.js cannot parse.
 */
function parseDateFromMatch(match: string, patternIndex: number): Date | null {
  try {
    if (patternIndex === 0) {
      // DD/MM/YYYY or DD-MM-YYYY
      const sep = match.includes('/') ? '/' : '-';
      const parts = match.split(sep);
      if (parts.length !== 3) return null;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      return new Date(year, month - 1, day);
    }

    if (patternIndex === 1) {
      // YYYY-MM-DD — ISO format, safe to pass to new Date
      return new Date(match);
    }

    if (patternIndex === 2) {
      // DD de MMMM de YYYY (Spanish)
      const spanishPattern = /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i;
      const m = match.match(spanishPattern);
      if (!m) return null;
      const day = parseInt(m[1], 10);
      const monthName = m[2].toLowerCase();
      const year = parseInt(m[3], 10);
      const monthIndex = SPANISH_MONTHS[monthName];
      if (monthIndex === undefined || isNaN(day) || isNaN(year)) return null;
      return new Date(year, monthIndex, day);
    }
  } catch (e) {
    // fall through
  }
  return null;
}

/**
 * Attempts to extract exam date from PDF text
 * Looks for common date patterns in LATAM lab reports
 */
function extractExamDateFromText(text: string): Date | null {
  // Common date patterns in LATAM lab PDFs (order matters — index is passed to parseDateFromMatch)
  const datePatterns = [
    // Pattern 0: DD/MM/YYYY or DD-MM-YYYY
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g,
    // Pattern 1: YYYY-MM-DD
    /\d{4}-\d{1,2}-\d{1,2}/g,
    // Pattern 2: DD de MMMM de YYYY (Spanish format)
    /\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/gi,
  ];

  const now = new Date();
  const minDate = new Date(now.getFullYear() - 10, 0, 1);
  const maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  for (let i = 0; i < datePatterns.length; i++) {
    const matches = text.match(datePatterns[i]);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const date = parseDateFromMatch(match, i);
        if (date && !isNaN(date.getTime()) && date >= minDate && date <= maxDate) {
          return date;
        }
      }
    }
  }

  return null;
}

/**
 * Parses a PDF buffer and extracts biomarker values and exam date
 */
export async function parsePDF(pdfBuffer: Buffer): Promise<ParseResult> {
  try {
    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'PDF does not contain extractable text'
      };
    }

    // Attempt to extract exam date from PDF text
    const examDate = extractExamDateFromText(text);

    // Extract biomarkers from text using ROBUST parser
    console.log('[PDF Parser] Using ROBUST biomarker parser');
    const parsedBiomarkers = parseFullText(text);
    const biomarkers = convertToLegacyFormat(parsedBiomarkers);
    const normalizedBiomarkers = normalizeUnits(biomarkers);

    if (normalizedBiomarkers.length === 0) {
      return {
        success: false,
        error: 'No biomarkers found in PDF',
        text,
        examDate
      };
    }

    return {
      success: true,
      text,
      biomarkers: normalizedBiomarkers,
      parsedBiomarkers, // include raw results with confidence levels
      examDate: examDate || null // null if not found - frontend must request it
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to parse PDF'
    };
  }
}

/**
 * Validates PDF file before parsing
 */
export function validatePDF(file: Express.Multer.File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.mimetype !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF' };
  }

  // Max file size: 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  return { valid: true };
}

