'use client';

import { useEffect, useState } from 'react';
import { biomarkerAPI, BiomarkerHistoryData } from '@/lib/api';

interface Biomarker {
  id: string;
  value: number;
  status: string;
  traffic_light: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  trend?: string;
  unit?: string;
  lastMeasuredAt?: string;
  measurementCount?: number;
}

interface BiomarkerDetailModalProps {
  biomarker: Biomarker | null;
  onClose: () => void;
}

const BIOMARKER_NAMES: Record<string, string> = {
  LDL: 'Colesterol LDL',
  HBA1C: 'Hemoglobina Glicosilada',
  FASTING_GLUCOSE: 'Glucosa en ayunas',
  TRIGLYCERIDES: 'Triglicéridos',
  ALT: 'ALT',
  HS_CRP: 'PCR Ultrasensible',
  HDL: 'Colesterol HDL',
  AST: 'AST',
  EGFR: 'Filtración Glomerular',
  URIC_ACID: 'Ácido Úrico',
};

const BIOMARKER_DESCRIPTIONS: Record<string, string> = {
  LDL: "Colesterol 'malo'. Niveles altos aumentan el riesgo cardiovascular.",
  HBA1C: 'Promedio de glucosa en sangre durante los últimos 3 meses. Indicador de diabetes.',
  FASTING_GLUCOSE: 'Nivel de azúcar en sangre en ayunas. Detecta prediabetes temprano.',
  TRIGLYCERIDES: 'Tipo de grasa en sangre. Relacionado con dieta y riesgo metabólico.',
  HDL: "Colesterol 'bueno'. Niveles más altos protegen el corazón.",
  HS_CRP: 'Marcador de inflamación sistémica. Predice riesgo cardiovascular.',
  ALT: 'Enzima hepática. Niveles altos indican posible daño al hígado.',
  AST: 'Enzima hepática. Complementa ALT para evaluar función del hígado.',
  EGFR: 'Tasa de filtración renal. Mide qué tan bien funcionan tus riñones.',
  URIC_ACID: 'Producto de degradación celular. Niveles altos pueden causar gota.',
};

function getTrafficLightColor(trafficLight: string): string {
  const colors: Record<string, string> = {
    GREEN: 'bg-green-500',
    YELLOW: 'bg-yellow-500',
    ORANGE: 'bg-orange-500',
    RED: 'bg-red-500',
  };
  return colors[trafficLight] || 'bg-gray-500';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPTIMAL: 'Óptimo',
    GOOD: 'Bueno',
    OUT_OF_RANGE: 'Fuera de rango',
    CRITICAL: 'Crítico',
  };
  return labels[status] || status;
}

function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    OPTIMAL: 'bg-green-100 text-green-800 border-green-300',
    GOOD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    OUT_OF_RANGE: 'bg-orange-100 text-orange-800 border-orange-300',
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getHistoryStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPTIMAL: 'text-green-700 bg-green-50',
    GOOD: 'text-yellow-700 bg-yellow-50',
    OUT_OF_RANGE: 'text-orange-700 bg-orange-50',
    CRITICAL: 'text-red-700 bg-red-50',
  };
  return colors[status] || 'text-gray-700 bg-gray-50';
}

function getTrendText(trend: string): string {
  const map: Record<string, string> = {
    IMPROVING: '↑ Mejorando',
    WORSENING: '↓ Empeorando',
    STABLE: '→ Estable',
    NONE: '',
  };
  return map[trend] || '';
}

function getTrendColor(trend: string): string {
  const colors: Record<string, string> = {
    IMPROVING: 'text-green-600',
    WORSENING: 'text-red-600',
    STABLE: 'text-gray-500',
    NONE: '',
  };
  return colors[trend] || '';
}

export default function BiomarkerDetailModal({ biomarker, onClose }: BiomarkerDetailModalProps) {
  const [history, setHistory] = useState<BiomarkerHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!biomarker) return;

    setHistory(null);
    setError(null);
    setLoading(true);

    biomarkerAPI
      .getHistory(biomarker.id)
      .then(setHistory)
      .catch(() => setError('No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, [biomarker]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!biomarker) return null;

  const name = BIOMARKER_NAMES[biomarker.id] || biomarker.id;
  const description = BIOMARKER_DESCRIPTIONS[biomarker.id] || '';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getTrafficLightColor(biomarker.traffic_light)}`} />
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current value */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {biomarker.value} <span className="text-lg font-normal text-gray-500">{biomarker.unit || ''}</span>
              </div>
              {biomarker.lastMeasuredAt && biomarker.lastMeasuredAt !== 'No medido aún' && (
                <div className="text-sm text-gray-500 mt-1">Última medición: {biomarker.lastMeasuredAt}</div>
              )}
            </div>
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getStatusBadgeColor(biomarker.status)}`}>
              {getStatusLabel(biomarker.status)}
            </span>
          </div>

          {/* Trend */}
          {biomarker.trend && biomarker.trend !== 'NONE' && (biomarker.measurementCount ?? 0) >= 2 && (
            <div className={`text-sm font-medium ${getTrendColor(biomarker.trend)}`}>
              {getTrendText(biomarker.trend)} desde la última medición
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">¿Qué mide?</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          )}

          {/* History */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Historial de mediciones</h3>

            {loading && (
              <div className="text-center py-6 text-gray-400 text-sm">Cargando historial...</div>
            )}

            {error && (
              <div className="text-center py-6 text-red-500 text-sm">{error}</div>
            )}

            {!loading && !error && history && (
              <>
                {history.empty_state === 'NO_EXAMS' && (
                  <p className="text-sm text-gray-500 text-center py-4">Sin mediciones registradas aún.</p>
                )}

                {(history.empty_state === 'ONE_EXAM' || history.empty_state === 'HAS_DATA') && history.points.length > 0 && (
                  <div className="space-y-2">
                    {[...history.points].reverse().map((point, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                      >
                        <span className="text-sm text-gray-600">{point.exam_date}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {point.value} {point.unit}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${getHistoryStatusColor(point.status_at_time)}`}>
                            {getStatusLabel(point.status_at_time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trend message */}
                {history.trend !== 'NONE' && history.points.length >= 2 && (
                  <div className={`mt-3 text-sm font-medium ${getTrendColor(history.trend)}`}>
                    {getTrendText(history.trend)} en tus últimas 2 mediciones
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reference ranges */}
          {!loading && history && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Rangos de referencia (prevención)</h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                    <span className="text-gray-600">Óptimo</span>
                  </span>
                  <span className="text-gray-700 font-medium">
                    {history.threshold_lines.optimal_upper_bound !== null
                      ? `≤ ${history.threshold_lines.optimal_upper_bound} ${history.unit}`
                      : `≥ ${history.threshold_lines.good_upper_bound ?? '—'} ${history.unit}`}
                  </span>
                </div>
                {history.threshold_lines.good_upper_bound !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                      <span className="text-gray-600">Bueno</span>
                    </span>
                    <span className="text-gray-700 font-medium">
                      ≤ {history.threshold_lines.good_upper_bound} {history.unit}
                    </span>
                  </div>
                )}
                {history.threshold_lines.out_of_range_upper_bound !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                      <span className="text-gray-600">Fuera de rango</span>
                    </span>
                    <span className="text-gray-700 font-medium">
                      ≤ {history.threshold_lines.out_of_range_upper_bound} {history.unit}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    <span className="text-gray-600">Crítico</span>
                  </span>
                  <span className="text-gray-700 font-medium">
                    {history.threshold_lines.out_of_range_upper_bound !== null
                      ? `> ${history.threshold_lines.out_of_range_upper_bound} ${history.unit}`
                      : history.threshold_lines.optimal_upper_bound !== null
                      ? `< ${history.threshold_lines.optimal_upper_bound} ${history.unit}`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
