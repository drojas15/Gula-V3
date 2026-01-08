/**
 * EXAM MODEL
 * 
 * Database model for Exam entity
 * 
 * CRITICAL: examDate is the REAL exam date (when the exam was taken),
 * NOT the upload date. This is essential for comparison logic.
 */

export type ExamStatus = 'processing' | 'completed' | 'failed';

export interface Exam {
  id: string;
  userId: string;
  examDate: Date; // REAL exam date (when exam was taken), NOT upload date - CRITICAL for comparison
  uploadedAt: Date; // When user uploaded the PDF
  pdfUrl: string;
  status: ExamStatus;
  healthScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExamInput {
  userId: string;
  pdfUrl: string;
  examDate: Date | string; // REQUIRED: Real exam date (from PDF or user input)
}

export interface UpdateExamInput {
  status?: ExamStatus;
  healthScore?: number;
}

