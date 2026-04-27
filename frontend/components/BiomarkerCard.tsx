/**
 * BIOMARKER CARD COMPONENT
 * 
 * Displays a single biomarker with its value, status, and traffic light
 * Frontend NEVER calculates status - it comes from the API
 */

'use client';

import { Biomarker } from '@/types';
import { t } from '@/lib/i18n';
import { translateHealthKey } from '@/lib/utils/translateHealthKey';
import { getBiomarkerName } from '@/lib/biomarkers.config';
import RecommendationCard from './RecommendationCard';

interface BiomarkerCardProps {
  biomarker: Biomarker;
}

export default function BiomarkerCard({ biomarker }: BiomarkerCardProps) {
  const getTrafficLightColor = (trafficLight: string): string => {
    switch (trafficLight) {
      case 'GREEN':
        return 'bg-green-500';
      case 'YELLOW':
        return 'bg-yellow-500';
      case 'ORANGE':
        return 'bg-orange-500';
      case 'RED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'OPTIMAL':
        return 'text-green-700';
      case 'GOOD':
        return 'text-yellow-700';
      case 'OUT_OF_RANGE':
        return 'text-orange-700';
      case 'CRITICAL':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(biomarker.trafficLight)}`} />
          <h3 className="text-xl font-semibold">{getBiomarkerName(biomarker.biomarker)}</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{biomarker.value}</div>
          <div className="text-sm text-gray-500">{biomarker.unit}</div>
        </div>
      </div>

      <div className={`text-sm font-medium mb-2 ${getStatusColor(biomarker.status)}`}>
        {t(`biomarkers.status.${biomarker.status.toLowerCase()}`)}
      </div>

      {biomarker.riskKey && translateHealthKey(biomarker.riskKey) && (
        <div className="text-gray-700 mb-4">
          {translateHealthKey(biomarker.riskKey)}
        </div>
      )}

      {biomarker.recommendationKeys.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            {t('recommendations.title')}
          </h4>
          <div className="space-y-2">
            {biomarker.recommendationKeys.map((key, index) => (
              <RecommendationCard key={index} recommendationKey={key} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

