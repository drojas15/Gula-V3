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
import { BiomarkerKey } from '../src/config/biomarkers.config';

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
      const status = determineStatus('LDL', 180);
      expect(status).toBe('CRITICAL');
    });

    it('should return OPTIMAL for HDL above optimal threshold', () => {
      const status = determineStatus('HDL', 65);
      expect(status).toBe('OPTIMAL');
    });

    it('should return CRITICAL for HDL below critical threshold', () => {
      const status = determineStatus('HDL', 35);
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
        { biomarker: 'LDL', value: 200, unit: 'mg/dL' },
        { biomarker: 'HDL', value: 30, unit: 'mg/dL' },
        { biomarker: 'FASTING_GLUCOSE', value: 150, unit: 'mg/dL' }
      ];

      const score = calculateHealthScore(biomarkers);
      expect(score).toBe(0);
    });

    it('should calculate weighted score correctly', () => {
      // LDL (weight 18) = OPTIMAL (1.0), HDL (weight 8) = CRITICAL (0.0)
      // Score = (18 * 1.0 + 8 * 0.0) / (18 + 8) * 100 = 18/26 * 100 = 69
      const biomarkers: BiomarkerValue[] = [
        { biomarker: 'LDL', value: 90, unit: 'mg/dL' },
        { biomarker: 'HDL', value: 35, unit: 'mg/dL' }
      ];

      const score = calculateHealthScore(biomarkers);
      expect(score).toBe(69);
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

      expect(analyzed.biomarker).toBe('LDL');
      expect(analyzed.value).toBe(150);
      expect(analyzed.unit).toBe('mg/dL');
      expect(analyzed.status).toBe('OUT_OF_RANGE');
      expect(analyzed.trafficLight).toBe('ORANGE');
      expect(analyzed.weight).toBe(18);
      expect(analyzed.contribution).toBe(18 * 0.4); // weight * multiplier
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

