/**
 * DASHBOARD PAGE
 * 
 * Weekly health dashboard showing:
 * 1. Health score snapshot
 * 2. Weekly priorities
 * 3. Weekly actions (main hook)
 * 4. Biomarkers list
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { dashboardAPI, examAPI, DashboardData } from '@/lib/api';
import HealthScoreCard from '@/components/HealthScoreCard';
import ReliabilityBar from '@/components/ReliabilityBar';
import WeeklyActionsCard from '@/components/WeeklyActionsCard';
import BiomarkersListCard from '@/components/BiomarkersListCard';
import OnboardingTooltips, { useOnboarding } from '@/components/OnboardingTooltips';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth(); // User from AuthContext
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [exams, setExams] = useState<any[]>([]); // For debug visualization
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Onboarding - CRITICAL: Pass userId to prevent state leakage between users
  const { shouldShowOnboarding, completeOnboarding, skipOnboarding } = useOnboarding(user?.id || null);

  // CRITICAL: Always fetch fresh data from backend (source of truth)
  // This function is called on mount and when explicitly requested
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // DEV ONLY: Log fetch trigger
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Fetching data...', { forceRefresh, timestamp: new Date().toISOString() });
      }
      
      // Always fetch fresh data - backend is source of truth
      // PASO 2: Force fetch with no-cache to ensure we get data from active backend
      const [dashboard, examsData] = await Promise.all([
        dashboardAPI.getDashboard().catch(err => {
          console.warn('Error fetching dashboard (non-critical):', err);
          return null;
        }),
        // Fetch exams list to verify backend state
        examAPI.list().catch(err => {
          console.warn('Error fetching exams list (non-critical):', err);
          return { exams: [] };
        }),
      ]);
      
      // User data comes from AuthContext, no need to fetch again
      setDashboardData(dashboard);
      setExams(examsData.exams || []); // For debug visualization
      
      // DEV ONLY: Log fetched data
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Data fetched:', {
          health_score: dashboard?.health_score,
          hasBaseline: dashboard?.hasBaseline,
          baselineDate: dashboard?.baselineDate,
          biomarkers_count: dashboard?.biomarkers?.length || 0,
          biomarkers_with_trends: dashboard?.biomarkers?.filter(b => b.trend !== 'NONE').length || 0,
          exams_count: examsData.exams?.length || 0,
          exam_dates: examsData.exams?.map(e => e.examDate) || []
        });
      }
      
      // Clear any error state on successful fetch
      setError(null);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push('/login');
      } else {
        setError(err.message || 'Error al cargar el dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch data on mount and when refresh param is present
  useEffect(() => {
    // Check if we should force refresh (from query param)
    const refreshParam = searchParams?.get('refresh');
    const shouldRefresh = refreshParam === 'true';
    
    fetchData(shouldRefresh);
    
    // If refresh param was present, remove it from URL (clean URL)
    if (shouldRefresh && refreshParam) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        router.replace('/dashboard', { scroll: false });
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, router]); // searchParams is stable, no need to include in deps

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Determine if user has a valid baseline (previous exam with different date)
  // 
  // BASELINE RULE (OBLIGATORY):
  // hasBaseline = true IF AND ONLY IF:
  //   - Backend says hasBaseline === true
  //   - Backend calculates this based ONLY on exam count and dates
  //   - NEVER fallback to biomarkers or trends
  // 
  // This ensures "Primer registro" appears ONLY when it's truly the first exam
  const hasBaseline = useMemo(() => {
    if (!dashboardData) {
      return false;
    }
    
    // Trust backend completely - it calculates based on exams and dates only
    return dashboardData.hasBaseline === true;
  }, [dashboardData]);

  // DEV ONLY: Log baseline detection for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && dashboardData) {
      console.log('🔍 [Dashboard Frontend] Baseline info:', {
        hasBaseline,
        baselineDate: dashboardData.baselineDate,
        examsCount: exams.length,
        examDates: exams.map(e => e.examDate),
        healthScore: dashboardData.health_score
      });
    }
  }, [dashboardData, hasBaseline, exams]);

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-600 mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        {/* Onboarding Tooltips */}
        {shouldShowOnboarding && (
          <OnboardingTooltips
            onComplete={completeOnboarding}
            onSkip={skipOnboarding}
          />
        )}
        
        <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bienvenido, {user?.name || 'Usuario'}
            </h1>
            <p className="text-gray-600">
              Tu dashboard semanal de salud
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/upload"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              + Subir Examen
            </Link>
            <button
              onClick={logout}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* PASO 4: DEBUG VISUAL TEMPORAL (only dev) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs" style={{ opacity: 0.6 }}>
            <div>🔍 Debug Info:</div>
            <div>Backend exams count: {exams.length}</div>
            <div>Dashboard hasBaseline: {hasBaseline ? 'true' : 'false'}</div>
            {exams.length > 0 && (
              <div>Exam dates: {exams.map((e: any) => e.examDate).join(', ')}</div>
            )}
          </div>
        )}

        {dashboardData ? (
          <>
            {/* PASO 1 — JERARQUÍA VISUAL OBLIGATORIA */}
            
            {/* 1. Health Score (grande, dominante) */}
            <HealthScoreCard score={dashboardData.health_score} />

            {/* 2. Barra de Fiabilidad (justo debajo) */}
            {dashboardData.reliability && (
              <ReliabilityBar 
                percentage={dashboardData.reliability.percentage}
                measuredCount={dashboardData.reliability.measuredCount}
                totalCount={dashboardData.reliability.totalCount}
              />
            )}

            {/* 3. Acciones de esta semana (máx 3) */}
            {dashboardData.weekly_actions && dashboardData.weekly_actions.length > 0 && (
              <WeeklyActionsCard actions={dashboardData.weekly_actions} />
            )}

            {/* 4. Biomarcadores (detalle) */}
            {dashboardData.biomarkers && dashboardData.biomarkers.length > 0 && (
              <BiomarkersListCard 
                biomarkers={dashboardData.biomarkers}
                hasBaseline={hasBaseline}
              />
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500 mb-4">No hay datos del dashboard disponibles.</p>
            <Link
              href="/upload"
              className="text-primary-600 hover:text-primary-700"
            >
              Sube tu primer examen para comenzar →
            </Link>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}

