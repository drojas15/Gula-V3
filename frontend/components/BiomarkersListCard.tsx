'use client';

import { useState } from 'react';
import BiomarkerDetailModal from './BiomarkerDetailModal';

interface Biomarker {
  id: string;
  value: number;
  status: string;
  traffic_light: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  trend?: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE';
  unit?: string;
  recommendationKeys?: string[];
  lastMeasuredAt?: string;
  measurementCount?: number;
}

interface BiomarkersListCardProps {
  biomarkers: Biomarker[];
  hasBaseline?: boolean;
}

export default function BiomarkersListCard({ biomarkers, hasBaseline = false }: BiomarkersListCardProps) {
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker | null>(null);

  const getBiomarkerName = (biomarker: string): string => {
    const names: Record<string, string> = {
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
    return names[biomarker] || biomarker;
  };

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

  const getTrendIcon = (trend?: string): string => {
    if (!hasBaseline) return '';
    if (trend === 'IMPROVING') return '↑';
    if (trend === 'WORSENING') return '↓';
    if (trend === 'STABLE') return '→';
    return '';
  };

  if (biomarkers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Todos tus biomarcadores</h2>
        <p className="text-gray-500">No hay biomarcadores disponibles.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Todos tus biomarcadores</h2>

        <div className="space-y-4">
          {biomarkers.map((biomarker) => (
            <button
              key={biomarker.id}
              type="button"
              onClick={() => setSelectedBiomarker(biomarker)}
              className="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getTrafficLightColor(biomarker.traffic_light)}`} />
                  <h3 className="text-lg font-semibold">
                    {getBiomarkerName(biomarker.id)}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {biomarker.value} {biomarker.unit || ''}
                    </div>

                    {biomarker.lastMeasuredAt && biomarker.lastMeasuredAt !== 'No medido aún' ? (
                      <div className="text-xs text-gray-500 mt-1">
                        Última medición: {biomarker.lastMeasuredAt}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">
                        No medido aún
                      </div>
                    )}

                    {biomarker.measurementCount && biomarker.measurementCount >= 2 && biomarker.trend && biomarker.trend !== 'NONE' ? (
                      <div className="text-xs text-gray-500 mt-1">
                        {getTrendIcon(biomarker.trend)} {
                          biomarker.trend === 'IMPROVING' ? 'Mejoró' :
                          biomarker.trend === 'WORSENING' ? 'Empeoró' :
                          'Sin cambios'
                        } desde la última medición
                      </div>
                    ) : biomarker.measurementCount === 1 ? (
                      <div className="text-xs text-gray-500 mt-1">
                        Primera medición
                      </div>
                    ) : null}
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
          ))}
        </div>
      </div>

      <BiomarkerDetailModal
        biomarker={selectedBiomarker}
        onClose={() => setSelectedBiomarker(null)}
      />
    </>
  );
}
