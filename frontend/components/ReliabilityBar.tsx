/**
 * RELIABILITY BAR COMPONENT
 * 
 * PASO 3 — FIABILIDAD (¿Qué tan confiable es?)
 * - Barra de progreso visible
 * - Texto: "Fiabilidad de esta evaluación"
 * - "Basado en {X} de {Y} biomarcadores clave"
 * - Tooltip: "La fiabilidad indica qué tan completa es esta evaluación.
 *   No cambia tu puntuación de salud."
 */

'use client';

import { useState } from 'react';

interface ReliabilityBarProps {
  percentage: number; // 0-100
  measuredCount: number;
  totalCount: number;
}

export default function ReliabilityBar({ 
  percentage, 
  measuredCount, 
  totalCount 
}: ReliabilityBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Color de la barra según porcentaje
  const getBarColor = (pct: number): string => {
    if (pct >= 71) return 'bg-green-500';
    if (pct >= 41) return 'bg-yellow-500';
    return 'bg-gray-400';
  };
  
  const getTextColor = (pct: number): string => {
    if (pct >= 71) return 'text-green-700';
    if (pct >= 41) return 'text-yellow-700';
    return 'text-gray-600';
  };
  
  const barColor = getBarColor(percentage);
  const textColor = getTextColor(percentage);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Fiabilidad de esta evaluación
          </h3>
          {/* Info icon con tooltip */}
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            className="w-5 h-5 rounded-full bg-gray-300 text-white text-xs flex items-center justify-center hover:bg-gray-400 transition"
            aria-label="Información sobre fiabilidad"
          >
            i
          </button>
          {showTooltip && (
            <div className="absolute z-10 mt-20 w-72 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
              La fiabilidad indica qué tan completa es esta evaluación.
              No cambia tu puntuación de salud.
            </div>
          )}
        </div>
        <span className={`text-xl font-bold ${textColor}`}>
          {percentage}%
        </span>
      </div>
      
      {/* Barra de progreso visible */}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-3">
        <div 
          className={`${barColor} h-full transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Texto: "Basado en {X} de {Y} biomarcadores clave" */}
      <p className="text-sm text-gray-600">
        Basado en {measuredCount} de {totalCount} biomarcadores clave
      </p>
    </div>
  );
}
