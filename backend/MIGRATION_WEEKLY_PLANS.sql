-- ============================================================
-- MIGRATION: Weekly Plans, Plan Activities & Activity Logs
-- Run once in Supabase SQL editor
-- ============================================================

-- 1. Weekly plans (one per user per exam cycle)
CREATE TABLE IF NOT EXISTS weekly_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id          TEXT,                 -- exam that triggered this plan
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at          TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'completed', 'skipped')),
  activities_continuation TEXT
                     CHECK (activities_continuation IN ('same', 'new', 'mixed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id     ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_status      ON weekly_plans(status);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_ends_at     ON weekly_plans(ends_at);

-- 2. Activities within a plan (max 3)
CREATE TABLE IF NOT EXISTS weekly_plan_activities (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_id           UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  activity_id              TEXT NOT NULL,
  personalized_text        TEXT NOT NULL,
  category                 TEXT NOT NULL,
  title                    TEXT NOT NULL,
  evidence_level           TEXT,
  requires_medical_disclaimer BOOLEAN NOT NULL DEFAULT FALSE,
  note                     TEXT,
  primary_biomarker        TEXT,
  primary_value            FLOAT,
  primary_unit             TEXT,
  was_swapped              BOOLEAN NOT NULL DEFAULT FALSE,
  swapped_from_activity_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wpa_weekly_plan_id ON weekly_plan_activities(weekly_plan_id);
CREATE INDEX IF NOT EXISTS idx_wpa_activity_id    ON weekly_plan_activities(activity_id);

-- 3. Daily activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_activity_id  UUID NOT NULL REFERENCES weekly_plan_activities(id) ON DELETE CASCADE,
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  completed                BOOLEAN NOT NULL DEFAULT TRUE,
  quantity                 FLOAT,
  quantity_unit            TEXT,
  notes                    TEXT
);

-- One log per activity per day (prevents double-tapping)
CREATE UNIQUE INDEX IF NOT EXISTS unique_log_per_activity_per_day
  ON activity_logs (weekly_plan_activity_id, log_date);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id      ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_plan_act_id  ON activity_logs(weekly_plan_activity_id);
