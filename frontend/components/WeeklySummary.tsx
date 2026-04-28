'use client';

import { useState } from 'react';
import { weeklyPlanAPI } from '@/lib/api';

interface ProjectedImpact {
  biomarker: string;
  impact_min: number;
  impact_max: number;
  impact_unit: string;
  current_value: number;
  current_unit: string;
}

interface SummaryActivity {
  activity_id: string;
  title: string;
  category: string;
  days_completed: number;
  completion_rate: number;
  projected_impacts: ProjectedImpact[];
}

interface WeeklySummaryData {
  plan_id: string;
  activities: SummaryActivity[];
  has_critical_biomarkers: boolean;
  all_above_50_pct: boolean;
  weakest_activity?: { activity_id: string; title: string; completion_rate: number };
}

interface WeeklySummaryProps {
  planId: string;
  onContinue?: () => void;
}

const BIOMARKER_NAMES: Record<string, string> = {
  LDL:             'LDL',
  FASTING_GLUCOSE: 'Glucosa en ayunas',
  TRIGLYCERIDES:   'Triglicéridos',
  VLDL:            'VLDL',
  HDL:             'HDL',
  ALT:             'ALT',
  AST:             'AST',
  URIC_ACID:       'Ácido Úrico',
  HS_CRP:          'PCR Ultrasensible',
};

function completionEmoji(days: number): string {
  if (days >= 5) return '✅';
  if (days >= 3) return '⚠️';
  return '❌';
}

function ProgressBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${pct >= 71 ? 'bg-green-500' : pct >= 43 ? 'bg-yellow-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function WeeklySummary({ planId, onContinue }: WeeklySummaryProps) {
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [continuationStep, setContinuationStep] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await weeklyPlanAPI.getSummary(planId);
      setSummary(data.summary);
      setLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (mode: 'same' | 'new' | 'mixed') => {
    setSaving(true);
    try {
      await weeklyPlanAPI.setContinuation(planId, mode);
      onContinue?.();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-center">
        <p className="text-gray-600 mb-4">¿Quieres ver el resumen de tu semana?</p>
        <button
          onClick={loadSummary}
          disabled={loading}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
        >
          {loading ? 'Cargando...' : 'Ver resumen semanal'}
        </button>
      </div>
    );
  }

  if (!summary) return null;

  // Deduplicate projected impacts across all activities
  const allImpacts: ProjectedImpact[] = [];
  for (const act of summary.activities) {
    for (const impact of act.projected_impacts) {
      const existing = allImpacts.find(i => i.biomarker === impact.biomarker);
      if (!existing) {
        allImpacts.push(impact);
      } else {
        // Accumulate min/max
        existing.impact_min += impact.impact_min;
        existing.impact_max += impact.impact_max;
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Resumen de tu semana</h2>

      {/* Bloque 1 — Lo que hiciste */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Lo que hiciste</h3>
        <div className="space-y-3">
          {summary.activities.map(act => (
            <div key={act.activity_id} className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{completionEmoji(act.days_completed)}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{act.title}</span>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{act.days_completed}/7 días</span>
                </div>
                <ProgressBar rate={act.completion_rate} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque 2 — Lo que quedó faltando */}
      {!summary.all_above_50_pct && summary.weakest_activity && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">"{summary.weakest_activity.title}"</span> lo completaste{' '}
            {Math.round(summary.weakest_activity.completion_rate * 7)} de 7 días — es la actividad con más
            espacio para mejorar la próxima semana.
          </p>
        </div>
      )}

      {/* Bloque 3 — Qué esperar en tu próximo examen */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Qué esperar en tu próximo examen</h3>

        {allImpacts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Esta semana fue difícil — cualquier progreso cuenta. La consistencia se construye semana a semana.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Basado en lo que hiciste esta semana, en tu próximo examen podrías ver:
            </p>
            <ul className="space-y-1.5">
              {allImpacts.map(impact => (
                <li key={impact.biomarker} className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">•</span>
                  <span className="font-medium text-gray-800">
                    {BIOMARKER_NAMES[impact.biomarker] ?? impact.biomarker}:
                  </span>
                  <span className="text-gray-600">
                    reducción estimada de {impact.impact_min}–{impact.impact_max} {impact.impact_unit}
                    {' '}(hoy estás en {impact.current_value} {impact.current_unit})
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
          ⚠️ Estos son estimados basados en evidencia clínica general. Los resultados reales varían por persona. Gula no reemplaza una consulta médica.
        </p>
      </div>

      {/* Bloque 4 — Disclaimer crítico */}
      {summary.has_critical_biomarkers && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            🏥 Tienes biomarcadores en estado crítico. Estas actividades son un complemento — te recomendamos consultar con un médico para un plan de atención adecuado.
          </p>
        </div>
      )}

      {/* Bloque 5 — Transición próxima semana */}
      {!continuationStep ? (
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => setContinuationStep(true)}
            className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition"
          >
            ¿Cómo arrancas la próxima semana?
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">¿Cómo quieres arrancar la próxima semana?</p>
          <div className="space-y-2">
            <button
              onClick={() => handleContinue('same')}
              disabled={saving}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition text-sm"
            >
              <span className="font-medium">Continuar con las mismas</span>
              <span className="block text-gray-500 text-xs mt-0.5">Las 3 actividades se repiten tal cual</span>
            </button>
            <button
              onClick={() => handleContinue('new')}
              disabled={saving}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition text-sm"
            >
              <span className="font-medium">Proponer nuevas</span>
              <span className="block text-gray-500 text-xs mt-0.5">El algoritmo selecciona 3 actividades distintas</span>
            </button>
            <button
              onClick={() => handleContinue('mixed')}
              disabled={saving}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition text-sm"
            >
              <span className="font-medium">Mezclar</span>
              <span className="block text-gray-500 text-xs mt-0.5">Conserva algunas y renueva otras</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
