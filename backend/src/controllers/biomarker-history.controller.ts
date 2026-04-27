/**
 * BIOMARKER HISTORY CONTROLLER
 * 
 * Handles biomarker history and graph data requests.
 * 
 * IMPORTANT: This is for historical evolution only, never diagnosis.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { buildBiomarkerHistoryData } from '../services/biomarker-history.service';
import { BiomarkerKey } from '../config/biomarkers.config';

/**
 * GET /api/biomarkers/:biomarker/history
 * 
 * Returns biomarker history data for graph rendering.
 * 
 * Response includes:
 * - Historical points (exam_date, value, status_at_time)
 * - Trend (IMPROVING | STABLE | WORSENING | NONE)
 * - Threshold lines (from config)
 * - Empty state
 * - Time gaps (> 90 days)
 */
export async function getBiomarkerHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { biomarker } = req.params;

    // Validate biomarker
    const validBiomarkers: BiomarkerKey[] = [
      'LDL',
      'FASTING_GLUCOSE',
      'TRIGLYCERIDES',
      'VLDL',
      'HDL',
      'ALT',
      'AST',
      'URIC_ACID',
      'HS_CRP',
    ];

    if (!validBiomarkers.includes(biomarker as BiomarkerKey)) {
      res.status(400).json({ error: 'Invalid biomarker' });
      return;
    }

    // Build history data
    const historyData = await buildBiomarkerHistoryData(
      req.userId,
      biomarker as BiomarkerKey
    );

    res.json(historyData);
  } catch (error: any) {
    console.error('Error getting biomarker history:', error);
    res.status(500).json({ error: error.message || 'Failed to get biomarker history' });
  }
}

/**
 * GET /api/biomarkers/history
 * 
 * Returns history for all biomarkers.
 * Useful for dashboard overview.
 */
export async function getAllBiomarkersHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const biomarkers: BiomarkerKey[] = [
      'LDL',
      'FASTING_GLUCOSE',
      'TRIGLYCERIDES',
      'VLDL',
      'HDL',
      'ALT',
      'AST',
      'URIC_ACID',
      'HS_CRP',
    ];

    // Get history for all biomarkers
    const historyPromises = biomarkers.map(biomarker =>
      buildBiomarkerHistoryData(req.userId!, biomarker)
    );

    const histories = await Promise.all(historyPromises);

    res.json({
      biomarkers: histories
    });
  } catch (error: any) {
    console.error('Error getting all biomarkers history:', error);
    res.status(500).json({ error: error.message || 'Failed to get biomarkers history' });
  }
}

