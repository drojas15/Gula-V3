/**
 * WEEKLY FEEDBACK BANNER COMPONENT
 * 
 * Shows feedback when all actions are completed or week ends
 */

'use client';

interface WeeklyFeedbackBannerProps {
  allCompleted: boolean;
  weekEnded: boolean;
}

export default function WeeklyFeedbackBanner({ allCompleted, weekEnded }: WeeklyFeedbackBannerProps) {
  if (!allCompleted && !weekEnded) {
    return null;
  }

  return (
    <div className={`rounded-lg p-6 mb-6 border-2 ${
      allCompleted
        ? 'bg-green-50 border-green-200'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`text-3xl ${allCompleted ? 'text-green-600' : 'text-gray-600'}`}>
          {allCompleted ? '✓' : '📅'}
        </div>
        <h3 className="text-xl font-bold">
          Semana completada
        </h3>
      </div>
      <p className="text-gray-700">
        {allCompleted
          ? 'Buen trabajo. Estás construyendo hábitos que mejoran tu salud.'
          : 'No pasa nada. Cada semana es una nueva oportunidad.'}
      </p>
    </div>
  );
}

