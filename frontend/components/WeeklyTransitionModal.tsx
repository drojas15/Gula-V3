/**
 * WEEKLY TRANSITION MODAL
 * 
 * Cierre semanal claro y repetible que:
 * - Resuma la semana sin juicio
 * - Marque transición a una nueva semana
 * - Refuerce el hábito de volver
 * 
 * PASO 1 — MOMENTO DE CIERRE:
 * - Al inicio de una nueva semana (lunes)
 * - O la primera vez que el usuario abre la app esa semana
 * 
 * PASO 6 — FRECUENCIA:
 * - Mostrar SOLO 1 vez por semana
 * - Si el usuario entra 5 veces, NO repetir el ritual
 */

'use client';

import { useState } from 'react';

interface PreviousAction {
  id: string;
  title: string;
  progress: number;
  completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface WeeklyTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previousWeekActions: PreviousAction[];
  weekRange: string; // e.g., "1-7 Enero"
}

export default function WeeklyTransitionModal({
  isOpen,
  onClose,
  onConfirm,
  previousWeekActions,
  weekRange
}: WeeklyTransitionModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  // Calcular si hubo progreso
  const hadProgress = previousWeekActions.some(action => action.progress > 0);
  
  const handleConfirm = async () => {
    setIsConfirming(true);
    await onConfirm();
    setIsConfirming(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* PASO 2 — BLOQUE 1: RESUMEN CORTO */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 rounded-t-2xl">
          <div className="text-center">
            {/* Texto fijo: "Semana cerrada" */}
            <h2 className="text-3xl font-bold mb-3">Semana cerrada</h2>
            
            {/* Subtexto dinámico (1 línea) */}
            <p className="text-lg opacity-90">
              {hadProgress 
                ? 'Hubo avances en algunas prioridades.'
                : 'Esta semana fue tranquila. Recalculamos con lo que hay.'
              }
            </p>
            
            <div className="text-sm mt-2 opacity-75">
              {weekRange}
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* PASO 2 — BLOQUE 2: ACCIONES (SIN CULPA) */}
          <div className="mb-8">
            {/* Texto fijo: "Estas fueron tus prioridades" */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Estas fueron tus prioridades
            </h3>
            
            <div className="space-y-3">
              {previousWeekActions.map((action) => {
                const isCompleted = action.completion_state === 'COMPLETED';
                const hasProgress = action.progress > 0;
                
                return (
                  <div
                    key={action.id}
                    className={`border-2 rounded-lg p-4 transition ${
                      isCompleted
                        ? 'border-green-300 bg-green-50'
                        : hasProgress
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Check / progreso, SIN porcentajes grandes */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : hasProgress
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-300 text-gray-500'
                        }`}>
                          {isCompleted ? '✓' : hasProgress ? '→' : '○'}
                        </div>
                        
                        <span className={`text-base ${
                          isCompleted ? 'text-green-800 font-medium' : 
                          hasProgress ? 'text-gray-800' : 
                          'text-gray-500'
                        }`}>
                          {action.title}
                        </span>
                      </div>
                      
                      {/* NO listar fallos - mostrar estado positivo */}
                      {isCompleted && (
                        <span className="text-sm text-green-600 font-medium">
                          Completada
                        </span>
                      )}
                      {hasProgress && !isCompleted && (
                        <span className="text-sm text-primary-600">
                          En progreso
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* NO mostrar copy de culpa */}
            {previousWeekActions.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Seguimos ajustando tus prioridades.
              </p>
            )}
          </div>

          {/* PASO 2 — BLOQUE 3: TRANSICIÓN */}
          <div className="border-t border-gray-200 pt-6">
            {/* Texto fijo */}
            <p className="text-base text-gray-700 mb-6 text-center">
              Esta semana nos enfocamos en lo que más impacto tiene ahora.
            </p>
            
            {/* Botón primario */}
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full px-6 py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? 'Calculando...' : 'Ver prioridades de esta semana'}
            </button>
            
            {/* Link secundario discreto */}
            <button
              onClick={onClose}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Cerrar sin cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
