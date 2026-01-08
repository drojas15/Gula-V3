/**
 * PROGRESS INPUT MODAL COMPONENT
 * 
 * Allows user to manually input progress for weekly actions
 */

'use client';

import { useState, useEffect } from 'react';

interface ProgressInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
  actionTitle: string;
  weeklyTarget: string;
  currentProgress: number;
  inputType: 'minutes' | 'grams' | 'days' | 'sessions' | 'liters';
}

export default function ProgressInputModal({
  isOpen,
  onClose,
  onSubmit,
  actionTitle,
  weeklyTarget,
  currentProgress,
  inputType
}: ProgressInputModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Parse target to get max value
  const getMaxValue = (): number => {
    const targetMatch = weeklyTarget.match(/(\d+)/);
    if (!targetMatch) return 100;
    
    const targetNumber = parseInt(targetMatch[1]);
    
    // Calculate remaining based on current progress
    const currentValue = (currentProgress / 100) * targetNumber;
    const remaining = targetNumber - currentValue;
    
    return Math.max(0, Math.round(remaining));
  };

  const getInputLabel = (): string => {
    switch (inputType) {
      case 'minutes':
        return '¿Cuántos minutos hiciste hoy?';
      case 'grams':
        return '¿Cuántos gramos de fibra consumiste hoy?';
      case 'liters':
        return '¿Cuántos litros de agua consumiste hoy?';
      case 'sessions':
        return '¿Cuántas sesiones completaste?';
      case 'days':
        return '¿Marcar día como cumplido?';
      default:
        return '¿Cuánto progreso quieres registrar?';
    }
  };

  const getInputPlaceholder = (): string => {
    const max = getMaxValue();
    switch (inputType) {
      case 'minutes':
        return `Máximo: ${max} min`;
      case 'grams':
        return `Máximo: ${max} g`;
      case 'liters':
        return `Máximo: ${max} L`;
      case 'sessions':
        return `Máximo: ${max} sesiones`;
      default:
        return `Máximo: ${max}`;
    }
  };

  const handleSubmit = () => {
    setError(null);
    
    if (!inputValue.trim()) {
      setError('Por favor ingresa un valor');
      return;
    }

    const value = parseFloat(inputValue);
    
    if (isNaN(value) || value <= 0) {
      setError('El valor debe ser un número mayor a 0');
      return;
    }

    const maxValue = getMaxValue();
    if (value > maxValue) {
      setError(`El valor no puede exceder ${maxValue} (objetivo semanal)`);
      return;
    }

    onSubmit(value);
    setInputValue('');
    setError(null);
    onClose();
  };

  const handleDayComplete = () => {
    onSubmit(1);
    setInputValue('');
    setError(null);
    onClose();
  };

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-2">{actionTitle}</h3>
        <p className="text-gray-600 mb-4">{getInputLabel()}</p>

        {inputType === 'days' ? (
          <div className="mb-4">
            <button
              onClick={handleDayComplete}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Marcar día como cumplido
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="number"
                min="0"
                max={getMaxValue()}
                value={inputValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)) {
                    setInputValue(val);
                    setError(null);
                  }
                }}
                placeholder={getInputPlaceholder()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none text-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                  if (e.key === 'Escape') {
                    onClose();
                  }
                }}
              />
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Registrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

