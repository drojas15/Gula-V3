'use client';

import { useState } from 'react';
import BiomarkerDetailModal from './BiomarkerDetailModal';
import { getBiomarkerName } from '@/lib/biomarkers.config';

interface Biomarker {
  id: string;
  value: number;
  unit: string;
  status: string;
  traffic_light: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  trend?: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE';
  recommendationKeys?: string[];
  lastMeasuredAt?: string;
  measurementCount?: number;
  previous_value?: number | null;
  previous_measured_at?: string | null;
}

interface BiomarkersListCardProps {
  biomarkers: Biomarker[];
  hasBaseline?: boolean;
}

export default function BiomarkersListCard({ biomarkers }: BiomarkersListCardProps) {
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker | null>(null);

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      OPTIMAL: 'Óptimo',
      GOOD: 'Bueno',
      OUT_OF_RANGE: 'Fuera de rango',
      CRITICAL: 'Crítico',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      OPTIMAL: 'bg-green-100 text-green-800 border-green-300',
      GOOD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      OUT_OF_RANGE: 'bg-orange-100 text-orange-800 border-orange-300',
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusExplanation = (status: string): string => {
    const explanations: Record<string, string> = {
      OPTIMAL: 'En rango ideal',
      GOOD: 'Dentro de rango',
      OUT_OF_RANGE: 'Fuera de rango',
      CRITICAL: 'Requiere atención',
    };
    return explanations[status] || '';
  };

  const getTrafficLightColor = (trafficLight: string): string => {
    const colors: Record<string, string> = {
      GREEN: 'bg-green-500',
      YELLOW: 'bg-yellow-500',
      ORANGE: 'bg-orange-500',
      RED: 'bg-red-500',
    };
    return colors[trafficLight] || 'bg-gray-500';
  };

  const getDeltaDisplay = (biomarker: Biomarker): { text: string; colorClass: string } | null => {
    if (
      biomarker.previous_value == null ||
      !biomarker.measurementCount ||
      biomarker.measurementCount < 2 ||
      !biomarker.trend ||
      biomarker.trend === 'NONE'
    ) {
      return null;
    }

    const delta = biomarker.value - biomarker.previous_value;
    const sign = delta > 0 ? '+' : '';
    const unit = biomarker.unit || '';
    const text = `${sign}${delta % 1 === 0 ? delta : delta.toFixed(1)} ${unit}`.trim();

    const colorClass =
      biomarker.trend === 'IMPROVING'
        ? 'text-green-600'
        : biomarker.trend === 'WORSENING'
        ? 'text-red-500'
        : 'text-gray-400';

    return { text, colorClass };
  };

  if (biomarkers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Todos tus biomarcadores</h2>
        <p className="text-gray-500">No hay biomarcadores disponibles.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Todos tus biomarcadores</h2>

        <div className="space-y-4">
          {biomarkers.map((biomarker) => {
            const delta = getDeltaDisplay(biomarker);

            return (
              <button
                key={biomarker.id}
                type="button"
                onClick={() => setSelectedBiomarker(biomarker)}
                className="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getTrafficLightColor(biomarker.traffic_light)}`} />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getBiomarkerName(biomarker.id)}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {/* Valor actual + unidad */}
                      <div className="text-xl font-bold text-gray-900">
                        {biomarker.value}{' '}
                        <span className="text-sm font-normal text-gray-500">{biomarker.unit}</span>
                      </div>

                      {/* Delta respecto al examen anterior */}
                      {delta && (
                        <div className={`text-xs font-medium mt-0.5 ${delta.colorClass}`}>
                          {delta.text} desde anterior
                        </div>
                      )}

                      {/* Fecha de última medición */}
                      {biomarker.lastMeasuredAt && biomarker.lastMeasuredAt !== 'No medido aún' ? (
                        <div className="text-xs text-gray-400 mt-1">
                          Última medición: {biomarker.lastMeasuredAt}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-1">No medido aún</div>
                      )}

                      {biomarker.measurementCount === 1 && (
                        <div className="text-xs text-gray-400">Primera medición</div>
                      )}
                    </div>
                    <span className="text-gray-300 text-xl">›</span>
                  </div>
                </div>

                <div className="mb-1">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium border ${getStatusColor(biomarker.status)}`}>
                    {getStatusLabel(biomarker.status)} · {getStatusExplanation(biomarker.status)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <BiomarkerDetailModal
        biomarker={selectedBiomarker}
        onClose={() => setSelectedBiomarker(null)}
      />
    </>
  );
}
