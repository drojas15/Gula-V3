'use client';

import { useState } from 'react';
import { WeeklyPlan, WeeklyPlanActivity, weeklyPlanAPI } from '@/lib/api';

interface WeeklyPlanCardProps {
  plan: WeeklyPlan;
  onPlanUpdate: (plan: WeeklyPlan) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  ejercicio:   '🏃',
  alimentacion:'🥗',
  natural:     '🌿',
};

const CATEGORY_LABELS: Record<string, string> = {
  ejercicio:   'Ejercicio',
  alimentacion:'Alimentación',
  natural:     'Natural',
};

const EVIDENCE_LABELS: Record<string, string> = {
  alta:     'Evidencia alta',
  moderada: 'Evidencia moderada',
  limitada: 'Evidencia limitada',
};

function DayDots({ daysCompleted, completedToday }: { daysCompleted: number; completedToday: boolean }) {
  return (
    <div className="flex items-center gap-1 mt-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className={`w-3 h-3 rounded-full inline-block ${
            i < daysCompleted ? 'bg-green-500' : 'bg-gray-200'
          }`}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{daysCompleted}/7 días</span>
    </div>
  );
}

function ActivityCard({
  activity,
  onLog,
  onSwap,
}: {
  activity: WeeklyPlanActivity;
  onLog: () => Promise<void>;
  onSwap: () => Promise<void>;
}) {
  const [logging, setLogging] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const handleLog = async () => {
    if (activity.completed_today || logging) return;
    setLogging(true);
    try { await onLog(); } finally { setLogging(false); }
  };

  const handleSwap = async () => {
    if (activity.was_swapped || swapping) return;
    setSwapping(true);
    try { await onSwap(); } finally { setSwapping(false); }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CATEGORY_ICONS[activity.category] ?? '📋'}</span>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {CATEGORY_LABELS[activity.category] ?? activity.category}
            </span>
            <h3 className="text-base font-semibold text-gray-900 leading-tight mt-0.5">
              {activity.title}
            </h3>
          </div>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
          {EVIDENCE_LABELS[activity.evidence_level] ?? activity.evidence_level}
        </span>
      </div>

      {/* Personalized text */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        {activity.personalized_text}
      </p>

      {/* Note */}
      {activity.note && (
        <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mb-3">
          💡 {activity.note}
        </p>
      )}

      {/* Medical disclaimer */}
      {activity.requires_medical_disclaimer && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
          ⚠️ Consulta con tu médico antes de realizar cambios bruscos en tu alimentación.
        </p>
      )}

      {/* Progress dots */}
      <DayDots daysCompleted={activity.days_completed} completedToday={activity.completed_today} />

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handleLog}
          disabled={activity.completed_today || logging}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
            activity.completed_today
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
          }`}
        >
          {activity.completed_today ? '✓ Registrado hoy' : logging ? 'Guardando...' : '✓ Lo hice hoy'}
        </button>

        {!activity.was_swapped && (
          <button
            onClick={handleSwap}
            disabled={swapping}
            className="ml-3 text-xs text-gray-400 hover:text-gray-600 underline whitespace-nowrap"
          >
            {swapping ? 'Buscando...' : 'Cambiar actividad'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function WeeklyPlanCard({ plan, onPlanUpdate }: WeeklyPlanCardProps) {
  const [localPlan, setLocalPlan] = useState<WeeklyPlan>(plan);

  const updateActivity = (updatedActivity: Partial<WeeklyPlanActivity> & { id: string }) => {
    setLocalPlan(prev => ({
      ...prev,
      activities: prev.activities.map(a =>
        a.id === updatedActivity.id ? { ...a, ...updatedActivity } : a
      ),
    }));
  };

  const handleLog = async (activity: WeeklyPlanActivity) => {
    const result = await weeklyPlanAPI.logCompletion(activity.id);
    if (result.success || result.already_logged) {
      updateActivity({
        id: activity.id,
        days_completed: result.days_completed,
        completed_today: true,
      });
    }
  };

  const handleSwap = async (activity: WeeklyPlanActivity) => {
    const result = await weeklyPlanAPI.swap(activity.id);
    // Replace swapped activity + mark old as swapped
    const updated: WeeklyPlan = {
      ...localPlan,
      activities: localPlan.activities
        .map(a => a.id === activity.id ? { ...a, was_swapped: true } : a)
        .concat(result.activity),
    };
    setLocalPlan(updated);
    onPlanUpdate(updated);
  };

  // Only show active (not swapped) activities
  const visible = localPlan.activities.filter(a => !a.was_swapped);

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tu semana de salud</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {localPlan.days_remaining > 0
              ? `${localPlan.days_remaining} día${localPlan.days_remaining !== 1 ? 's' : ''} restante${localPlan.days_remaining !== 1 ? 's' : ''}`
              : 'Plan completado'}
          </p>
        </div>
        <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border">
          3 actividades
        </span>
      </div>

      {/* Activity cards */}
      <div className="space-y-4">
        {visible.map(activity => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onLog={() => handleLog(activity)}
            onSwap={() => handleSwap(activity)}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-gray-400 py-6 text-sm">
          No hay actividades disponibles para esta semana.
        </p>
      )}
    </div>
  );
}
