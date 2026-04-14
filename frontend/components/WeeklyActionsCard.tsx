/**
 * WEEKLY ACTIONS CARD COMPONENT
 * 
 * Main hook - displays up to 3 weekly actions with progress tracking
 * Core interaction of the app - visually prominent
 */

'use client';

import { useState, useMemo } from 'react';
import { dashboardAPI } from '@/lib/api';
import { translateHealthKey } from '@/lib/utils/translateHealthKey';
import WeeklyFeedbackBanner from './WeeklyFeedbackBanner';
import ProgressInputModal from './ProgressInputModal';

interface WeeklyAction {
  weekly_action_id: string;
  title: string; // i18n key
  category: string;
  weekly_target: string;
  progress: number;
  completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  impacted_biomarkers: string[];
  week_start?: string; // YYYY-MM-DD
  week_end?: string; // YYYY-MM-DD
}

interface WeeklyActionsCardProps {
  actions: WeeklyAction[];
}

export default function WeeklyActionsCard({ actions }: WeeklyActionsCardProps) {
  const [localActions, setLocalActions] = useState(actions);
  const [updating, setUpdating] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<WeeklyAction | null>(null);

  const getActionTitle = (titleKey: string): string => {
    // Use centralized translation helper
    const translated = translateHealthKey(titleKey);
    if (translated) {
      return translated;
    }
    
    // If no translation found, return a generic message (never show raw key)
    return 'Acción semanal';
  };

  const getBiomarkerName = (biomarker: string): string => {
    const names: Record<string, string> = {
      LDL: 'LDL',
      HBA1C: 'HbA1c',
      FASTING_GLUCOSE: 'Glucosa',
      TRIGLYCERIDES: 'TG',
      ALT: 'ALT',
      HS_CRP: 'PCR',
      HDL: 'HDL',
      AST: 'AST',
      EGFR: 'eGFR',
      URIC_ACID: 'Ácido Úrico',
    };
    return names[biomarker] || biomarker;
  };

  const formatProgress = (action: WeeklyAction): string => {
    const target = action.weekly_target;
    const progress = action.progress;
    
    // Parse target to extract number
    const targetMatch = target.match(/(\d+)/);
    if (!targetMatch) return `${progress}%`;
    
    const targetNumber = parseInt(targetMatch[1]);
    const current = Math.round((progress / 100) * targetNumber);
    
    // Determine unit from target
    if (target.includes('minute') || target.includes('min')) {
      return `${current} / ${targetNumber} min`;
    }
    if (target.includes('day') || target.includes('día') || target.includes('days')) {
      return `${current} / ${targetNumber} días`;
    }
    if (target.includes('session')) {
      return `${current} / ${targetNumber} sesiones`;
    }
    if (target.includes('gram') || target.includes('g_')) {
      return `${current} / ${targetNumber} g`;
    }
    if (target.includes('liter') || target.includes('L_')) {
      return `${current} / ${targetNumber} L`;
    }
    
    return `${current} / ${targetNumber}`;
  };

  const getInputType = (action: WeeklyAction): 'minutes' | 'grams' | 'days' | 'sessions' | 'liters' => {
    const target = action.weekly_target.toLowerCase();
    
    if (target.includes('minute') || target.includes('min')) {
      return 'minutes';
    }
    if (target.includes('gram') || target.includes('g_') || target.includes('fiber')) {
      return 'grams';
    }
    if (target.includes('liter') || target.includes('l_') || target.includes('water')) {
      return 'liters';
    }
    if (target.includes('session')) {
      return 'sessions';
    }
    if (target.includes('day') || target.includes('día') || target.includes('days') || target.includes('night')) {
      return 'days';
    }
    
    // Default to days for habits
    return 'days';
  };

  const calculateNewProgress = (action: WeeklyAction, userInput: number): number => {
    const target = action.weekly_target;
    const targetMatch = target.match(/(\d+)/);
    if (!targetMatch) {
      // Percentage-based (shouldn't happen, but fallback)
      return Math.min(100, action.progress + userInput);
    }
    
    const targetNumber = parseInt(targetMatch[1]);
    const currentProgress = (action.progress / 100) * targetNumber;
    const newProgress = currentProgress + userInput;
    const newPercentage = Math.min(100, Math.round((newProgress / targetNumber) * 100));
    
    return newPercentage;
  };

  const handleOpenModal = (action: WeeklyAction) => {
    setSelectedAction(action);
    setModalOpen(true);
  };

  const handleModalSubmit = (userInput: number) => {
    if (!selectedAction) return;
    
    const newProgress = calculateNewProgress(selectedAction, userInput);
    handleProgressUpdate(selectedAction.weekly_action_id, newProgress);
    setSelectedAction(null);
  };

  const handleProgressUpdate = async (actionId: string, newProgress: number) => {
    // Store original state for error recovery (before optimistic update)
    const originalAction = localActions.find(a => a.weekly_action_id === actionId);
    if (!originalAction) return;

    // Optimistic update
    setLocalActions(prev =>
      prev.map(a =>
        a.weekly_action_id === actionId
          ? {
              ...a,
              progress: newProgress,
              completion_state: (newProgress >= 100 ? 'COMPLETED' : a.completion_state === 'PENDING' ? 'IN_PROGRESS' : a.completion_state) as WeeklyAction['completion_state']
            }
          : a
      )
    );

    setUpdating(actionId);
    try {
      const updated = await dashboardAPI.updateActionProgress(actionId, newProgress);
      setLocalActions(prev =>
        prev.map(a =>
          a.weekly_action_id === actionId
            ? { ...a, progress: updated.progress, completion_state: updated.completion_state as WeeklyAction['completion_state'] }
            : a
        )
      );
    } catch (error) {
      console.error('Error updating progress:', error);
      // Revert optimistic update on error
      setLocalActions(prev =>
        prev.map(a =>
          a.weekly_action_id === actionId
            ? { ...a, progress: originalAction.progress, completion_state: originalAction.completion_state }
            : a
        )
      );
    } finally {
      setUpdating(null);
    }
  };

  // Check if all actions are completed
  const allCompleted = useMemo(() => {
    return localActions.length > 0 && localActions.every(a => a.completion_state === 'COMPLETED');
  }, [localActions]);

  // Check if week has ended
  const weekEnded = useMemo(() => {
    if (localActions.length === 0) return false;
    const firstAction = localActions[0];
    if (!firstAction.week_end) return false;
    
    const weekEndDate = new Date(firstAction.week_end);
    weekEndDate.setHours(23, 59, 59, 999);
    const now = new Date();
    
    return now > weekEndDate;
  }, [localActions]);

  if (localActions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-primary-200">
        <h2 className="text-2xl font-bold mb-2">Prioridades esta semana</h2>
        <p className="text-gray-600">No hay acciones asignadas para esta semana.</p>
      </div>
    );
  }

  return (
    <>
      {/* Weekly Feedback Banner */}
      <WeeklyFeedbackBanner allCompleted={allCompleted} weekEnded={weekEnded} />

      {/* PASO 4 — ACCIONES (¿Qué hago esta semana?) */}
      {/* Título flexible: "Prioridades esta semana" (puede mostrar 1-3 acciones) */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-primary-200">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Prioridades esta semana</h2>
        </div>
        
        <div className="space-y-6">
          {localActions.slice(0, 3).map((action) => {
            const isCompleted = action.completion_state === 'COMPLETED';
            
            return (
              <div
                key={action.weekly_action_id}
                className={`border-2 rounded-xl p-6 transition-all ${
                  isCompleted
                    ? 'border-green-300 bg-green-50'
                    : action.progress > 0
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-primary-200'
                }`}
              >
                {/* Frase accionable (verbo + objeto) */}
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {getActionTitle(action.title)}
                </h3>
                
                {/* Micro-razón debajo (1 línea): "Impacta: {biomarcador}" */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Impacta:</span>
                  {action.impacted_biomarkers.map((bm, idx) => (
                    <span
                      key={idx}
                      className="text-sm font-medium text-gray-700"
                    >
                      {getBiomarkerName(bm)}{idx < action.impacted_biomarkers.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                
                {/* Progress indicator */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Progreso</span>
                    <span className="font-bold text-gray-900">{formatProgress(action)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500'
                          : action.progress > 0
                          ? 'bg-primary-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: `${Math.min(100, action.progress)}%` }}
                    />
                  </div>
                </div>
                
                {/* Primary CTA */}
                {isCompleted ? (
                  <div className="w-full px-4 py-3 bg-green-100 text-green-700 rounded-lg font-medium text-center">
                    ✓ Acción completada esta semana
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenModal(action)}
                    disabled={updating === action.weekly_action_id}
                    className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Registrar progreso
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Input Modal */}
      {selectedAction && (
        <ProgressInputModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedAction(null);
          }}
          onSubmit={handleModalSubmit}
          actionTitle={getActionTitle(selectedAction.title)}
          weeklyTarget={selectedAction.weekly_target}
          currentProgress={selectedAction.progress}
          inputType={getInputType(selectedAction)}
        />
      )}
    </>
  );
}

