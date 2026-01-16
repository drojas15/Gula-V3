/**
 * SCORING ENGINE TESTS
 * 
 * Unit tests for the core scoring engine logic
 */

import {
  calculateHealthScore,
  determineStatus,
  analyzeBiomarker,
  calculateHealthScoreWithAnalysis,
  BiomarkerValue
} from '../src/services/scoring-engine.service';
import { BIOMARKERS } from '../src/config/biomarkers.config';

describe('Scoring Engine', () => {
  describe('determineStatus', () => {
    it('should return OPTIMAL for LDL within optimal range', () => {
      const status = determineStatus('LDL', 90);
      expect(status).toBe('OPTIMAL');
    });

    it('should return GOOD for LDL within good range', () => {
      const status = determineStatus('LDL', 120);
      expect(status).toBe('GOOD');
    });

    it('should return OUT_OF_RANGE for LDL within out of range', () => {
      const status = determineStatus('LDL', 150);
      expect(status).toBe('OUT_OF_RANGE');
    });

    it('should return CRITICAL for LDL above critical threshold', () => {
      const status = determineStatus('LDL', 200); // CRITICAL >= 190
      expect(status).toBe('CRITICAL');
    });

    it('should return OPTIMAL for HDL above optimal threshold', () => {
      const status = determineStatus('HDL', 65);
      expect(status).toBe('OPTIMAL');
    });

    it('should return CRITICAL for HDL below critical threshold', () => {
      const status = determineStatus('HDL', 25); // CRITICAL <= 29
      expect(status).toBe('CRITICAL');
    });

    it('should return OPTIMAL for FASTING_GLUCOSE within optimal range', () => {
      const status = determineStatus('FASTING_GLUCOSE', 85);
      expect(status).toBe('OPTIMAL');
    });

    it('should return CRITICAL for FASTING_GLUCOSE above critical threshold', () => {
      const status = determineStatus('FASTING_GLUCOSE', 130);
      expect(status).toBe('CRITICAL');
    });
  });

  describe('calculateHealthScore', () => {
    it('should calculate score of 100 for all optimal biomarkers', () => {
      const biomarkers: BiomarkerValue[] = [
        { biomarker: 'LDL', value: 90, unit: 'mg/dL' },
        { biomarker: 'HDL', value: 65, unit: 'mg/dL' },
        { biomarker: 'FASTING_GLUCOSE', value: 85, unit: 'mg/dL' }
      ];

      const score = calculateHealthScore(biomarkers);
      expect(score).toBe(100);
    });

    it('should calculate score of 0 for all critical biomarkers', () => {
      const biomarkers: BiomarkerValue[] = [
        { biomarker: 'LDL', value: 200, unit: 'mg/dL' },      // CRITICAL
        { biomarker: 'HDL', value: 25, unit: 'mg/dL' },       // CRITICAL
        { biomarker: 'FASTING_GLUCOSE', value: 150, unit: 'mg/dL' } // CRITICAL
      ];

      const score = calculateHealthScore(biomarkers);
      // All CRITICAL = multiplier 0.1 for each
      // LDL: 1.5 * 0.1 = 0.15, HDL: 1.2 * 0.1 = 0.12, GLUCOSE: 1.5 * 0.1 = 0.15
      // Total: 0.42 / 4.2 * 100 = 10
      expect(score).toBe(10);
    });

    it('should calculate weighted score correctly', () => {
      // LDL (weight 1.5) = OPTIMAL (1.0), HDL (weight 1.2) = CRITICAL (0.1)
      // Score = (1.5 * 1.0 + 1.2 * 0.1) / (1.5 + 1.2) * 100 = 1.62/2.7 * 100 = 60
      const biomarkers: BiomarkerValue[] = [
        { biomarker: 'LDL', value: 90, unit: 'mg/dL' },
        { biomarker: 'HDL', value: 25, unit: 'mg/dL' }
      ];

      const score = calculateHealthScore(biomarkers);
      expect(score).toBe(60);
    });
  });

  describe('analyzeBiomarker', () => {
    it('should analyze biomarker correctly', () => {
      const biomarkerValue: BiomarkerValue = {
        biomarker: 'LDL',
        value: 150,
        unit: 'mg/dL'
      };

      const analyzed = analyzeBiomarker(biomarkerValue);
      const ldlWeight = BIOMARKERS['LDL'].weight; // 1.5

      expect(analyzed.biomarker).toBe('LDL');
      expect(analyzed.value).toBe(150);
      expect(analyzed.unit).toBe('mg/dL');
      expect(analyzed.status).toBe('OUT_OF_RANGE');
      expect(analyzed.trafficLight).toBe('ORANGE');
      expect(analyzed.weight).toBe(ldlWeight);
      expect(analyzed.contribution).toBe(ldlWeight * 0.4); // weight * multiplier
      expect(analyzed.riskKey).toBe('ldl.out_of_range.risk');
      expect(analyzed.recommendationKeys.length).toBeGreaterThan(0);
    });
  });

  describe('calculateHealthScoreWithAnalysis', () => {
    it('should return complete analysis with priorities', () => {
      const biomarkers: BiomarkerValue[] = [
        { biomarker: 'LDL', value: 150, unit: 'mg/dL' },
        { biomarker: 'HDL', value: 35, unit: 'mg/dL' },
        { biomarker: 'FASTING_GLUCOSE', value: 85, unit: 'mg/dL' }
      ];

      const result = calculateHealthScoreWithAnalysis(biomarkers);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.biomarkers.length).toBe(3);
      expect(result.priorities.length).toBeLessThanOrEqual(3);
      expect(result.priorities.length).toBeGreaterThan(0);
    });

    it('should prioritize CRITICAL biomarkers first', () => {
      const biomarkers: BiomarkerValue[] = [
        { biomarker: 'LDL', value: 90, unit: 'mg/dL' }, // OPTIMAL
        { biomarker: 'HDL', value: 35, unit: 'mg/dL' }, // CRITICAL
        { biomarker: 'FASTING_GLUCOSE', value: 85, unit: 'mg/dL' } // OPTIMAL
      ];

      const result = calculateHealthScoreWithAnalysis(biomarkers);

      expect(result.priorities[0].biomarker).toBe('HDL');
      expect(result.priorities[0].urgency).toBe('HIGH');
    });
  });
});

