/**
 * RECOMMENDATION CARD COMPONENT
 * 
 * Displays a single recommendation
 * Uses centralized translation helper - never shows raw keys
 */

'use client';

import { translateHealthKey } from '@/lib/utils/translateHealthKey';

interface RecommendationCardProps {
  recommendationKey: string;
}

export default function RecommendationCard({ recommendationKey }: RecommendationCardProps) {
  const recommendation = translateHealthKey(recommendationKey);

  // Never render if no translation found (never show raw key)
  if (!recommendation) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
      <p className="text-sm text-gray-800">{recommendation}</p>
    </div>
  );
}

