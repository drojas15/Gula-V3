/**
 * RESULTS PAGE
 * 
 * Displays exam results with health score, biomarkers, and priorities
 * Frontend NEVER calculates medical logic - only displays API results
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examAPI } from '@/lib/api';
import { ExamResult } from '@/types';
import HealthScore from '@/components/HealthScore';
import BiomarkerCard from '@/components/BiomarkerCard';
import PriorityList from '@/components/PriorityList';
import { t } from '@/lib/i18n';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize with null - NO default empty object that could overwrite
  const [result, setResult] = useState<ExamResult | null>(null);
  
  // Track state changes to detect overwrites
  useEffect(() => {
    if (result) {
      console.log('STATE CHANGED - result:', result);
      console.log('STATE CHANGED - healthScore:', result.healthScore);
      console.log('STATE CHANGED - biomarkers:', result.biomarkers);
      console.log('STATE CHANGED - biomarkers length:', Array.isArray(result.biomarkers) ? result.biomarkers.length : 'N/A');
      console.log('STATE CHANGED - biomarkers is empty?', Array.isArray(result.biomarkers) && result.biomarkers.length === 0);
      console.log('STATE CHANGED - healthScore is 0?', result.healthScore === 0);
    }
  }, [result]);

  useEffect(() => {
    if (!examId) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        
        // Check sessionStorage first (data from upload)
        const storedData = sessionStorage.getItem(`exam_${examId}`);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            console.log('FOUND STORED EXAM DATA:', parsedData);
            console.log('STORED - healthScore:', parsedData.healthScore);
            console.log('STORED - biomarkers:', parsedData.biomarkers);
            console.log('STORED - biomarkers length:', Array.isArray(parsedData.biomarkers) ? parsedData.biomarkers.length : 'N/A');
            
            // Use stored data if it has valid biomarkers
            if (parsedData.biomarkers && Array.isArray(parsedData.biomarkers) && parsedData.biomarkers.length > 0) {
              console.log('SETTING EXAM FROM: sessionStorage (upload data)', parsedData);
              setResult(parsedData);
              setLoading(false);
              return; // Use stored data, skip API call
            }
          } catch (e) {
            console.warn('Failed to parse stored exam data:', e);
          }
        }
        
        // Get raw API response
        const response = await examAPI.get(examId);
        
        // Log RAW API RESPONSE
        console.log('RAW API RESPONSE:', response);
        console.log('BIOMARKERS FROM API:', response.biomarkers);
        console.log('BIOMARKERS TYPE:', typeof response.biomarkers);
        console.log('BIOMARKERS IS ARRAY:', Array.isArray(response.biomarkers));
        console.log('BIOMARKERS LENGTH:', Array.isArray(response.biomarkers) ? response.biomarkers.length : 'N/A');
        
        // Check if API returned empty data (mock response)
        const isEmptyResponse = (
          (response.healthScore === 0 || response.healthScore === undefined) &&
          (!response.biomarkers || !Array.isArray(response.biomarkers) || response.biomarkers.length === 0)
        );
        
        if (isEmptyResponse && storedData) {
          // API returned empty, but we have stored data - use stored data
          console.log('API returned empty data, using stored data from upload');
          const parsedData = JSON.parse(storedData);
          console.log('SETTING EXAM FROM: sessionStorage (fallback)', parsedData);
          setResult(parsedData);
        } else {
          // Use API response
          console.log('SETTING EXAM FROM: API response', response);
          console.log('SETTING - healthScore:', response.healthScore);
          console.log('SETTING - biomarkers:', response.biomarkers);
          console.log('SETTING - biomarkers length:', Array.isArray(response.biomarkers) ? response.biomarkers.length : 'N/A');
          
          // Direct assignment - NO transformation, NO filtering, NO mapping
          // This is the ONLY place where result state is set from API
          setResult(response);
        }
        
        // Log state after setting (use useEffect to see actual state)
        setTimeout(() => {
          const currentResult = storedData ? JSON.parse(storedData) : response;
          console.log('BIOMARKERS IN STATE (after setResult):', currentResult.biomarkers);
        }, 100);
      } catch (err: any) {
        console.error('Error fetching exam results:', err);
        
        // Try sessionStorage as fallback on error
        const storedData = sessionStorage.getItem(`exam_${examId}`);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            console.log('Error occurred, using stored data as fallback:', parsedData);
            setResult(parsedData);
            return;
          } catch (e) {
            console.error('Failed to use stored data fallback:', e);
          }
        }
        
        setError(err.message || 'Error al cargar resultados');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-600 mb-4">{t('common.error')}</div>
          <p className="text-gray-600 mb-4">{error || 'No se pudieron cargar los resultados'}</p>
          <button
            onClick={() => {
              // PASO 3: Navigate to dashboard - NO props, dashboard will fetch fresh data
              router.replace('/dashboard?refresh=true');
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  // Log state in render to trace data flow
  console.log('RENDER - result:', result);
  console.log('RENDER - result.biomarkers:', result.biomarkers);
  console.log('RENDER - biomarkers type:', typeof result.biomarkers);
  console.log('RENDER - biomarkers is array:', Array.isArray(result.biomarkers));
  console.log('RENDER - biomarkers length:', Array.isArray(result.biomarkers) ? result.biomarkers.length : 'N/A');
  console.log('RENDER - healthScore:', result.healthScore);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => {
            // PASO 3: Navigate to dashboard - NO props, dashboard will fetch fresh data
            router.replace('/dashboard?refresh=true');
          }}
          className="mb-6 text-primary-600 hover:text-primary-700"
        >
          ← {t('common.back')}
        </button>

        {/* Health Score - use data.healthScore directly, don't default to 0 if biomarkers exist */}
        <HealthScore score={result.healthScore !== undefined && result.healthScore !== null ? result.healthScore : 0} />

        {/* Priorities */}
        {result.priorities && Array.isArray(result.priorities) && result.priorities.length > 0 && (
          <PriorityList priorities={result.priorities} />
        )}

        {/* Biomarkers - direct assignment, NO filtering, NO transformation */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Todos los Biomarcadores</h2>
          <div className="space-y-4">
            {result && result.biomarkers && Array.isArray(result.biomarkers) && result.biomarkers.length > 0 ? (
              result.biomarkers.map((biomarker, index) => (
                <BiomarkerCard key={biomarker.biomarker || `biomarker-${index}`} biomarker={biomarker} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No hay biomarcadores disponibles para este examen.</p>
                {result && (
                  <div className="text-xs mt-2 text-gray-400 space-y-1">
                    <p>Debug info:</p>
                    <p>biomarkers defined: {result.biomarkers ? 'YES' : 'NO'}</p>
                    <p>biomarkers type: {typeof result.biomarkers}</p>
                    <p>is array: {Array.isArray(result.biomarkers) ? 'YES' : 'NO'}</p>
                    <p>length: {Array.isArray(result.biomarkers) ? result.biomarkers.length : 'N/A'}</p>
                    <p>healthScore: {result.healthScore}</p>
                    <p>Full result keys: {Object.keys(result).join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

