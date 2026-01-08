/**
 * SQLITE DATABASE SETUP
 * 
 * Local SQLite database for exam persistence.
 * Replaces in-memory examStore with real persistence.
 */

import Database from 'better-sqlite3';
import path from 'path';

// Create database file in project root
const dbPath = path.join(process.cwd(), 'gula.db');

export const db = new Database(dbPath);

// Enable foreign keys (for future use)
db.pragma('foreign_keys = ON');

// Create exams table
db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    examId TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    examDate TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    healthScore REAL,
    biomarkers TEXT NOT NULL
  )
`);

// Create index for faster queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_exams_user_date 
  ON exams(userId, examDate)
`);

// Create biomarker_result table (HISTORICAL - IMMUTABLE)
// REGLA DE ORO: biomarker_result es HISTÓRICO
// - NUNCA se actualiza
// - NUNCA se reemplaza
// - SOLO INSERT
// 
// CLAVE PRIMARIA CORRECTA: Permite múltiples filas por biomarker
// PRIMARY KEY (user_id, biomarker_code, exam_date)
db.exec(`
  CREATE TABLE IF NOT EXISTS biomarker_result (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_id TEXT NOT NULL,
    biomarker_code TEXT NOT NULL,
    exam_date TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    status_at_time TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, biomarker_code, exam_date)
  )
`);

// Create index for faster history queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_biomarker_result_user_biomarker_date
  ON biomarker_result(user_id, biomarker_code, exam_date)
`);

console.log('[SQLite] Database initialized at:', dbPath);

