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

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    age INTEGER,
    sex TEXT CHECK(sex IN ('M', 'F')),
    weight REAL,
    goals TEXT,
    last_transition_seen TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

// Create index for faster email lookups
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
`);

// Create weekly_action_instances table
db.exec(`
  CREATE TABLE IF NOT EXISTS weekly_action_instances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_id TEXT NOT NULL,
    category TEXT NOT NULL,
    weekly_target TEXT NOT NULL,
    success_metric TEXT NOT NULL,
    impacted_biomarkers TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    completion_state TEXT NOT NULL DEFAULT 'pending',
    week_start TEXT NOT NULL,
    week_end TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Create index for faster user queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_weekly_actions_user_week 
  ON weekly_action_instances(user_id, week_start, week_end)
`);

// Create index for faster action history queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_weekly_actions_user_action
  ON weekly_action_instances(user_id, action_id)
`);

console.log('[SQLite] Database initialized at:', dbPath);

