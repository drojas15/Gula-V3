-- MIGRATION: Add users table
-- Date: 2026-02-09
-- Purpose: Enable real user authentication and data isolation

-- Create users table
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
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create weekly_action_instances table
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
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_weekly_actions_user_week 
ON weekly_action_instances(user_id, week_start, week_end);

-- Create index for faster action history queries
CREATE INDEX IF NOT EXISTS idx_weekly_actions_user_action
ON weekly_action_instances(user_id, action_id);
