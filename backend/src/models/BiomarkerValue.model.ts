/**
 * BIOMARKER VALUE MODEL
 * 
 * Database model for BiomarkerValue entity (time-series)
 */

import { BiomarkerKey, Status, TrafficLight } from '../config/biomarkers.config';

export interface BiomarkerValueRecord {
  id: string;
  examId: string;
  biomarker: BiomarkerKey;
  value: number;
  unit: string;
  status: Status;
  trafficLight: TrafficLight;
  timestamp: Date;
  createdAt: Date;
}

export interface CreateBiomarkerValueInput {
  examId: string;
  biomarker: BiomarkerKey;
  value: number;
  unit: string;
  status: Status;
  trafficLight: TrafficLight;
}

