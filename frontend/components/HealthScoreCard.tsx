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
  score: number;
}

export default function HealthScoreCard({ score }: HealthScoreCardProps) {
  const getScoreLabel = (score: number): string => {
    if (score >= 85) return 'Excelente';
    if (score >= 70) return 'Bueno';
    if (score >= 50) return 'Mejorable';
    return 'Requiere atención';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 85) return 'text-green-700';
    if (score >= 70) return 'text-yellow-700';
    if (score >= 50) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className={`${getScoreBgColor(score)} border-2 rounded-lg p-8 text-center mb-6`}>
      {/* Número grande (score) */}
      <div className={`text-8xl font-bold ${getScoreTextColor(score)} mb-4`}>
        {score}
      </div>
      
      {/* Etiqueta de estado */}
      <div className={`text-2xl font-semibold ${getScoreTextColor(score)} mb-3`}>
        {getScoreLabel(score)}
      </div>
      
      {/* Etiqueta corta: "Estado general de tu salud hoy" */}
      <p className="text-gray-600 text-base">
        Estado general de tu salud hoy
      </p>
    </div>
  );
}

