/**
 * SCORE MODEL
 * 
 * Database model for Score entity (versioned)
 */

export interface BiomarkerScore {
  biomarker: string;
  contribution: number;
  weight: number;
  multiplier: number;
}

export interface Score {
  id: string;
  examId: string;
  totalScore: number;
  version: string;
  calculatedAt: Date;
  biomarkerScores: BiomarkerScore[];
  createdAt: Date;
}

export interface CreateScoreInput {
  examId: string;
  totalScore: number;
  version: string;
  biomarkerScores: BiomarkerScore[];
}

