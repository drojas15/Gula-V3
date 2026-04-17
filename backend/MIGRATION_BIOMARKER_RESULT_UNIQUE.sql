-- MIGRATION: Add unique constraint to biomarker_result
-- Date: 2026-04-17
-- Purpose: Prevent duplicate records for the same user/biomarker/exam_date combination.
--          The application already handles the 23505 error, but without this constraint
--          duplicates can silently accumulate if the error path is bypassed.
--
-- Run this ONCE against your Supabase database.
-- Safe to run if constraint already exists (IF NOT EXISTS).

-- Add unique constraint
ALTER TABLE biomarker_result
  ADD CONSTRAINT IF NOT EXISTS uq_biomarker_result_user_biomarker_date
  UNIQUE (user_id, biomarker_code, exam_date);

-- Verify
SELECT conname, contype
FROM pg_constraint
WHERE conname = 'uq_biomarker_result_user_biomarker_date';
