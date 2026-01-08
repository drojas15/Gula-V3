/**
 * FRONTEND TYPES
 * 
 * Type definitions for frontend components
 * These match the backend API response format
 */

export type BiomarkerKey = 
  | 'LDL'
  | 'HBA1C'
  | 'HBAIC' // Legacy support
  | 'FASTING_GLUCOSE'
  | 'TRIGLYCERIDES'
  | 'ALT'
  | 'HS_CRP'
  | 'HDL'
  | 'AST'
  | 'EGFR'
  | 'URIC_ACID';

export type Status = 'OPTIMAL' | 'GOOD' | 'OUT_OF_RANGE' | 'CRITICAL';
export type TrafficLight = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface Biomarker {
  biomarker: BiomarkerKey | string; // Allow string for flexibility
  value: number;
  unit: string;
  status: Status;
  trafficLight: TrafficLight;
  weight?: number; // Optional - may not be in API response
  contribution?: number; // Optional - may not be in API response
  contribution_percentage?: number; // Optional
  riskKey?: string; // Optional
  recommendationKeys: string[];
}

export interface Priority {
  biomarker: BiomarkerKey | string; // Allow string for flexibility
  urgency: 'HIGH' | 'MEDIUM' | 'LOW' | string; // Allow string for flexibility
  messageKey?: string; // Optional
}

export interface ExamResult {
  examId?: string;
  userId?: string;
  healthScore: number;
  biomarkers: Biomarker[];
  priorities?: Priority[];
  weekly_actions?: Array<{
    id: string;
    action_id: string;
    progress: number;
    completion_state: string;
    [key: string]: any; // Allow additional fields
  }>;
  [key: string]: any; // Allow additional fields from API
}

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  weight?: number;
  goals?: string;
}

