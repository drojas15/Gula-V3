/**
 * WEEKLY ACTION INSTANCE MODEL
 * 
 * Represents a selected action for a specific week.
 * Matches database schema exactly - no additional fields.
 */

export type CompletionState = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface WeeklyActionInstance {
  id: string; // UUID PK
  user_id: string; // UUID
  action_id: string; // TEXT
  category: string; // TEXT
  weekly_target: string; // TEXT
  success_metric: string; // TEXT
  impacted_biomarkers: string[]; // TEXT[]
  difficulty: string; // TEXT
  progress: number; // INTEGER DEFAULT 0
  completion_state: CompletionState; // TEXT
  week_start: Date; // DATE
  week_end: Date; // DATE
  created_at: Date; // TIMESTAMP
}

export interface CreateWeeklyActionInput {
  user_id: string;
  action_id: string;
  category: string;
  weekly_target: string;
  success_metric: string;
  impacted_biomarkers: string[];
  difficulty: string;
  week_start: Date;
  week_end: Date;
}

export interface UpdateProgressInput {
  progress: number; // Frontend sends number, backend decides state
}

