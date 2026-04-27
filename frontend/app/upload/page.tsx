/**
 * UPLOAD PAGE
 *
 * Flujo:
 * 1. Usuario selecciona PDF + fecha (opcional)
 * 2. Click "Subir y Analizar" → backend parsea, retorna preview con biomarcadores detectados
 * 3. Usuario ve el preview (qué se detectó, con qué confianza, qué faltó) y confirma fecha
 * 4. Click "Confirmar y Guardar" → backend guarda examen → redirect dashboard
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { examAPI, userAPI } from '@/lib/api';
import { t } from '@/lib/i18n';

// Los 11 biomarcadores que GULA rastrea
const ALL_TRACKED_BIOMARKERS = [
  { key: 'LDL', name: 'Colesterol LDL' },
  { key: 'HDL', name: 'Colesterol HDL' },
  { key: 'TRIGLYCERIDES', name: 'Triglicéridos' },
  { key: 'FASTING_GLUCOSE', name: 'Glucosa en Ayunas' },
  { key: 'HBA1C', name: 'Hemoglobina Glicosilada' },
  { key: 'ALT', name: 'ALT (TGP)' },
  { key: 'AST', name: 'AST (TGO)' },
  { key: 'HS_CRP', name: 'PCR Ultrasensible' },
  { key: 'CRP_STANDARD', name: 'PCR Estándar' },
  { key: 'EGFR', name: 'Filtración Glomerular' },
  { key: 'URIC_ACID', name: 'Ácido Úrico' },
];

interface PreviewBiomarker {
  biomarker: string;
  value: number | null;
  unit: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

interface ParsePreview {
  parsedBiomarkers: PreviewBiomarker[];
  autoDetectedDate: string | null;
  examId?: string; // set if exam was already saved (date found in PDF)
  healthScore?: number;
}

function confidenceBorderClass(confidence: string): string {
  switch (confidence) {
    case 'high':   return 'border-2 border-green-500';
    case 'medium': return 'border-2 border-dashed border-yellow-500';
    case 'low':    return 'border-2 border-dashed border-red-400';
    default:       return 'border-2 border-gray-300';
  }
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [examDate, setExamDate] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'saving'>('upload');
  const [parsedPreview, setParsedPreview] = useState<ParsePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    try {
      setResetLoading(true);
      setResetSuccess(null);
      const result = await userAPI.resetData();
      setResetConfirm(false);
      setResetSuccess(
        `Datos eliminados: ${result.deleted.exams} examen(es), ${result.deleted.biomarkers} biomarcador(es), ${result.deleted.weekly_actions} acción(es) semanal(es).`
      );
    } catch (err: any) {
      setError(err.message || 'Error al resetear los datos');
      setResetConfirm(false);
    } finally {
      setResetLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Por favor, selecciona un archivo PDF');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  // Primera llamada: parsear PDF para mostrar preview
  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo');
      return;
    }

    try {
      setError(null);
      setStep('saving'); // Reusar estado de loading para el parse inicial

      // Subir sin fecha primero para obtener preview
      // Si el backend detecta fecha en el PDF, guardará y retornará examId
      // Si no, retornará requiresExamDate: true con parsedBiomarkers
      const dateToSend = examDate || undefined;
      const result = await examAPI.upload(file, dateToSend);

      if (result.requiresExamDate && result.parsedBiomarkers) {
        // Fecha no detectada en PDF → mostrar preview y pedir fecha
        setParsedPreview({
          parsedBiomarkers: result.parsedBiomarkers,
          autoDetectedDate: null,
        });
        setStep('preview');
        return;
      }

      // Fecha detectada → examen ya guardado, mostrar preview de confirmación
      setParsedPreview({
        parsedBiomarkers: result.parsedBiomarkers || [],
        autoDetectedDate: result.examDate || null,
        examId: result.examId,
        healthScore: result.healthScore,
      });
      if (result.examDate && !examDate) {
        setExamDate(result.examDate);
      }
      setStep('preview');
    } catch (err: any) {
      const errorData = err.response?.data;

      if (errorData?.requiresExamDate && errorData?.parsedBiomarkers) {
        // 400 con datos de preview
        setParsedPreview({
          parsedBiomarkers: errorData.parsedBiomarkers,
          autoDetectedDate: null,
        });
        setStep('preview');
      } else if (errorData?.requiresExamDate && errorData?.biomarkers) {
        // Fallback: backend antiguo sin parsedBiomarkers
        setParsedPreview({
          parsedBiomarkers: (errorData.biomarkers || []).map((b: any) => ({
            biomarker: b.biomarker,
            value: b.value,
            unit: b.unit,
            confidence: 'medium' as const,
          })),
          autoDetectedDate: null,
        });
        setStep('preview');
      } else {
        setError(errorData?.error || 'Error al procesar el archivo');
        setStep('upload');
      }
    }
  };

  // Segunda llamada (si no había fecha): guardar examen con fecha confirmada
  const handleConfirm = async () => {
    if (!parsedPreview) return;

    // Si el examen ya fue guardado (fecha estaba en PDF)
    if (parsedPreview.examId) {
      if (parsedPreview.examId) {
        sessionStorage.setItem(`exam_${parsedPreview.examId}`, JSON.stringify(parsedPreview));
      }
      router.push('/dashboard?refresh=true');
      return;
    }

    if (!examDate) {
      setError('Por favor, ingresa la fecha del examen');
      return;
    }

    if (!file) {
      setError('Archivo no disponible, por favor vuelve a seleccionarlo');
      setStep('upload');
      return;
    }

    try {
      setStep('saving');
      setError(null);

      const result = await examAPI.upload(file, examDate);

      if (result && result.examId) {
        sessionStorage.setItem(`exam_${result.examId}`, JSON.stringify(result));
      }

      router.push('/dashboard?refresh=true');
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.error || 'Error al guardar el examen');
      setStep('preview');
    }
  };

  // ─── Paso 1: Selección de archivo ───────────────────────────────────────────

  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Subir Examen Médico</h1>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona tu archivo PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {file && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Archivo: <span className="font-medium">{file.name}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha del examen <span className="text-gray-400 font-normal">(opcional — se detecta automáticamente)</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no la ingresas, GULA intentará detectarla del PDF. Puedes confirmarla en el siguiente paso.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Subir y Analizar
            </button>
          </div>

          {/* Zona peligrosa: borrar todos los datos */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Zona peligrosa</p>

            {resetSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{resetSuccess}</p>
              </div>
            )}

            {resetConfirm ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium mb-3">
                  Esto borrará todos tus exámenes, biomarcadores y acciones semanales. Tu cuenta no se elimina. ¿Continuar?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    disabled={resetLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {resetLoading ? 'Borrando...' : 'Sí, borrar todo'}
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    disabled={resetLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition"
              >
                Borrar todos mis datos y empezar de cero
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (step === 'saving') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-gray-600 font-medium">Analizando tu examen...</p>
          <p className="text-sm text-gray-400 mt-1">Esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  // ─── Paso 2: Preview de biomarcadores detectados ─────────────────────────────

  const detectedKeys = new Set((parsedPreview?.parsedBiomarkers || []).map(b => b.biomarker));
  const missingBiomarkers = ALL_TRACKED_BIOMARKERS.filter(b => !detectedKeys.has(b.key));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">Revisión del examen</h1>
        <p className="text-gray-500 mb-8">
          Verifica los biomarcadores detectados y confirma la fecha antes de guardar.
        </p>

        {/* Biomarcadores detectados */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4">
            Biomarcadores detectados ({parsedPreview?.parsedBiomarkers.length || 0})
          </h2>

          {parsedPreview && parsedPreview.parsedBiomarkers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {parsedPreview.parsedBiomarkers.map((b) => {
                const meta = ALL_TRACKED_BIOMARKERS.find(m => m.key === b.biomarker);
                return (
                  <div
                    key={b.biomarker}
                    className={`rounded-lg p-3 ${confidenceBorderClass(b.confidence)} bg-white`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        {meta?.name || b.biomarker}
                      </span>
                      {b.confidence === 'low' && (
                        <span className="text-yellow-500 text-xs ml-1" title="Confianza baja">⚠</span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {b.value !== null ? b.value : '—'}
                      {b.unit && <span className="text-xs font-normal text-gray-500 ml-1">{b.unit}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {b.confidence === 'high' ? 'Alta confianza'
                        : b.confidence === 'medium' ? 'Confianza media'
                        : b.confidence === 'low' ? 'Confianza baja — revisar'
                        : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No se detectaron biomarcadores en el PDF.</p>
          )}
        </div>

        {/* Biomarcadores no detectados */}
        {missingBiomarkers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 className="font-semibold text-gray-600 mb-3 text-sm">
              No detectados en este PDF ({missingBiomarkers.length})
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {missingBiomarkers.map(b => (
                <div key={b.key} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400">{b.name}</span>
                  <span className="text-xs text-gray-300 font-bold">—</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fecha del examen */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha del examen <span className="text-red-500">*</span>
          </label>
          {parsedPreview?.autoDetectedDate && (
            <p className="text-xs text-green-600 mb-2">
              Fecha detectada automáticamente del PDF. Puedes corregirla si es necesario.
            </p>
          )}
          {!parsedPreview?.autoDetectedDate && (
            <p className="text-xs text-orange-500 mb-2">
              No se detectó la fecha en el PDF. Por favor, ingrésala manualmente.
            </p>
          )}
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={() => { setStep('upload'); setError(null); }}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parsedPreview?.examId && !examDate}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {t('common.save') || 'Confirmar y Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
