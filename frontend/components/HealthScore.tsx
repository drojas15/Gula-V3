/**
 * HEALTH SCORE COMPONENT
 * 
 * Displays the overall health score (0-100)
 * Frontend NEVER calculates this - it comes from the API
 */

'use client';

import { t } from '@/lib/i18n';

interface HealthScoreProps {
  score: number;
}

export default function HealthScore({ score }: HealthScoreProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return t('healthScore.excellent');
    if (score >= 60) return t('healthScore.good');
    if (score >= 40) return t('healthScore.fair');
    return t('healthScore.poor');
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className={`${getScoreBgColor(score)} rounded-lg p-8 text-center`}>
      <h2 className="text-2xl font-bold mb-4">{t('healthScore.title')}</h2>
      <div className={`text-6xl font-bold ${getScoreColor(score)} mb-2`}>
        {score}
      </div>
      <div className={`text-xl font-semibold ${getScoreColor(score)}`}>
        {getScoreLabel(score)}
      </div>
      <p className="text-gray-600 mt-4">{t('healthScore.description')}</p>
    </div>
  );
}

