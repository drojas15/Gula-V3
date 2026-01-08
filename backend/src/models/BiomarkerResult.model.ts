/**
 * BIOMARKER RESULT MODEL
 * 
 * Represents a historical biomarker value from an exam.
 * This is immutable - never recalculate historical status.
 * 
 * Source of truth for biomarker history.
 */

import { BiomarkerKey, Status } from '../config/biomarkers.config';

export interface BiomarkerResult {
  id: string;
  user_id: string;
  exam_id: string;
  biomarker_code: BiomarkerKey;
  exam_date: Date; // Real exam date, NOT upload date
  value: number;
  unit: string;
  status_at_time: Status; // Status at time of exam (immutable)
  created_at: Date;
}

export interface BiomarkerHistoryPoint {
  exam_date: string; // ISO date string
  value: number;
  status_at_time: Status;
  unit: string;
}

export interface BiomarkerHistoryData {
  biomarker: BiomarkerKey;
  unit: string;
  points: BiomarkerHistoryPoint[];
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE';
  trend_message_key: string;
  threshold_lines: {
    optimal_upper_bound: number | null;
    good_upper_bound: number | null;
    out_of_range_upper_bound: number | null;
  };
  empty_state: 'NO_EXAMS' | 'ONE_EXAM' | 'HAS_DATA';
  time_gaps: Array<{
    from_date: string;
    to_date: string;
    days: number;
  }>;
}

