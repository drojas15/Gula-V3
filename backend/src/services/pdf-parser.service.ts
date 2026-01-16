/**
 * PDF PARSER SERVICE
 * 
 * Handles PDF upload and text extraction.
 * Uses pdf-parse library to extract text from PDF files.
 */

import pdfParse from 'pdf-parse';
import { extractBiomarkers, normalizeUnits } from './biomarker-analyzer.service';
import { BiomarkerValue } from './scoring-engine.service';
import { parseFullText, convertToLegacyFormat } from './robust-biomarker-parser.service';

export interface ParseResult {
  success: boolean;
  text?: string;
  biomarkers?: BiomarkerValue[];
  examDate?: Date | null; // Extracted exam date from PDF (if found)
  error?: string;
}

/**
 * Attempts to extract exam date from PDF text
 * Looks for common date patterns in LATAM lab reports
 */
function extractExamDateFromText(text: string): Date | null {
  // Common date patterns in LATAM lab PDFs
  const datePatterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
    // YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,
    // DD de MMMM de YYYY (Spanish format)
    /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/gi,
  ];

  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Try to parse the first date found
      for (const match of matches) {
        try {
          const date = new Date(match);
          // Validate date is reasonable (not too old, not in future)
          const now = new Date();
          const minDate = new Date(now.getFullYear() - 10, 0, 1); // 10 years ago
          const maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow (allow today)
          
          if (date >= minDate && date <= maxDate && !isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          // Continue to next match
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

