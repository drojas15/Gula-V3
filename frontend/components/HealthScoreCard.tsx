/**
 * HEALTH SCORE CARD COMPONENT
 * 
 * PASO 2 — HEALTH SCORE (¿Cómo estoy?)
 * - Número grande (score)
 * - Etiqueta corta: "Estado general de tu salud hoy"
 * - NO explicar cómo se calcula
 * - NO mostrar texto médico
 * - NO mostrar tendencias aquí
 */

'use client';

interface HealthScoreCardProps {
  score: number | null | undefined;
}

export default function HealthScoreCard({ score }: HealthScoreCardProps) {
  const safeScore = score ?? null;

  const getScoreLabel = (s: number): string => {
    if (s >= 85) return 'Excelente';
    if (s >= 70) return 'Bueno';
    if (s >= 50) return 'Mejorable';
    return 'Requiere atención';
  };

  const getScoreBgColor = (s: number): string => {
    if (s >= 85) return 'bg-green-50 border-green-200';
    if (s >= 70) return 'bg-yellow-50 border-yellow-200';
    if (s >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreTextColor = (s: number): string => {
    if (s >= 85) return 'text-green-700';
    if (s >= 70) return 'text-yellow-700';
    if (s >= 50) return 'text-orange-700';
    return 'text-red-700';
  };

  if (safeScore === null) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center mb-6">
        <div className="text-8xl font-bold text-gray-300 mb-4">--</div>
        <div className="text-2xl font-semibold text-gray-400 mb-3">Sin datos</div>
        <p className="text-gray-400 text-base">Sube tu primer examen para ver tu score</p>
      </div>
    );
  }

  return (
    <div className={`${getScoreBgColor(safeScore)} border-2 rounded-lg p-8 text-center mb-6`}>
      <div className={`text-8xl font-bold ${getScoreTextColor(safeScore)} mb-4`}>
        {safeScore}
      </div>
      <div className={`text-2xl font-semibold ${getScoreTextColor(safeScore)} mb-3`}>
        {getScoreLabel(safeScore)}
      </div>
      <p className="text-gray-600 text-base">
        Estado general de tu salud hoy
      </p>
    </div>
  );
}

