/**
 * PRIORITY LIST COMPONENT
 * 
 * Displays top 3 priorities for the user
 * Frontend NEVER calculates priorities - they come from the API
 */

'use client';

import { Priority } from '@/types';
import { t } from '@/lib/i18n';
import { translateHealthKey } from '@/lib/utils/translateHealthKey';
import { getBiomarkerName } from '@/lib/biomarkers.config';

interface PriorityListProps {
  priorities: Priority[];
}

export default function PriorityList({ priorities }: PriorityListProps) {
  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };


  if (priorities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-2">{t('priorities.title')}</h2>
      <p className="text-gray-600 mb-4">{t('priorities.subtitle')}</p>
      
      <div className="space-y-4">
        {priorities.map((priority, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${getUrgencyColor(priority.urgency)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">#{index + 1}</span>
                <span className="font-semibold">
                  {getBiomarkerName(priority.biomarker)}
                </span>
              </div>
              <span className="text-sm font-medium px-2 py-1 rounded">
                {t(`priorities.${priority.urgency.toLowerCase()}`)}
              </span>
            </div>
            {priority.messageKey && translateHealthKey(priority.messageKey) && (
              <p className="text-sm mt-2">{translateHealthKey(priority.messageKey)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

