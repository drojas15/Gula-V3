/**
 * ONBOARDING TOOLTIPS
 * 
 * Onboarding ultra corto (≤30 segundos) con tooltips secuenciales.
 * 
 * OBJETIVO: Explicar el modelo mental del producto, NO educar en salud.
 * 
 * 3 PASOS OBLIGATORIOS:
 * 1. Health Score - "Tu estado general"
 * 2. Fiabilidad - "Qué tan completa es esta evaluación"
 * 3. Acciones Semanales - "Qué hacer esta semana"
 */

'use client';

import { useState, useEffect } from 'react';

interface OnboardingTooltipsProps {
  onComplete: () => void;
  onSkip: () => void;
}

type TooltipStep = 'score' | 'reliability' | 'actions' | null;

export default function OnboardingTooltips({ onComplete, onSkip }: OnboardingTooltipsProps) {
  const [currentStep, setCurrentStep] = useState<TooltipStep>('score');

  // Si no hay paso activo, no mostrar nada
  if (!currentStep) return null;

  const handleNext = () => {
    if (currentStep === 'score') {
      setCurrentStep('reliability');
    } else if (currentStep === 'reliability') {
      setCurrentStep('actions');
    } else if (currentStep === 'actions') {
      setCurrentStep(null);
      onComplete();
    }
  };

  const handleSkip = () => {
    setCurrentStep(null);
    onSkip();
  };

  // PASO 1 — HEALTH SCORE
  if (currentStep === 'score') {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
        {/* Spotlight en el health score */}
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-auto">
            {/* Título */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Tu estado general
            </h3>
            
            {/* Texto (1 línea, máx 12 palabras) */}
            <p className="text-base text-gray-700 mb-4">
              Resume cómo estás hoy según tus exámenes.
            </p>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Saltar
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 text-white rounded-lg transition"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
              >
                Siguiente
              </button>
            </div>

            {/* Indicador de progreso */}
            <div className="flex gap-2 mt-4 justify-center">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PASO 2 — FIABILIDAD
  if (currentStep === 'reliability') {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
        {/* Spotlight en la barra de fiabilidad */}
        <div className="absolute top-64 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-auto">
            {/* Título */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Qué tan completa es esta evaluación
            </h3>
            
            {/* Texto (1 línea) */}
            <p className="text-base text-gray-700 mb-2">
              Depende de cuántos biomarcadores se midieron.
            </p>

            {/* Nota pequeña */}
            <p className="text-sm text-gray-500 mb-4">
              No cambia tu puntuación.
            </p>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Saltar
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 text-white rounded-lg transition"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
              >
                Siguiente
              </button>
            </div>

            {/* Indicador de progreso */}
            <div className="flex gap-2 mt-4 justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PASO 3 — ACCIONES SEMANALES
  if (currentStep === 'actions') {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
        {/* Spotlight en las acciones semanales */}
        <div className="absolute top-96 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-auto">
            {/* Título */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Qué hacer esta semana
            </h3>
            
            {/* Texto (1 línea, máx 12 palabras) */}
            <p className="text-base text-gray-700 mb-4">
              Máximo 3 prioridades. Nada más.
            </p>

            {/* CTA FINAL */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Saltar
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 text-white rounded-lg transition font-semibold"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
              >
                Empezar
              </button>
            </div>

            {/* Indicador de progreso */}
            <div className="flex gap-2 mt-4 justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Hook para controlar el estado del onboarding
 */
export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    // Verificar si ya vio el onboarding
    const hasSeenOnboarding = localStorage.getItem('gula_onboarding_completed');
    
    if (!hasSeenOnboarding) {
      // Esperar un momento antes de mostrar (mejor UX)
      setTimeout(() => {
        setShouldShowOnboarding(true);
      }, 500);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('gula_onboarding_completed', 'true');
    setShouldShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem('gula_onboarding_completed', 'true');
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    completeOnboarding,
    skipOnboarding,
  };
}
