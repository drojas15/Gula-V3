/**
 * UPLOAD PAGE
 * 
 * Allows users to upload PDF exam files
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { examAPI } from '@/lib/api';
import { t } from '@/lib/i18n';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [examDate, setExamDate] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresDate, setRequiresDate] = useState(false);
  const [extractedBiomarkers, setExtractedBiomarkers] = useState<any>(null);

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

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo');
      return;
    }

    // If date is required but not provided
    if (requiresDate && !examDate) {
      setError('Por favor, ingresa la fecha del examen');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const result = await examAPI.upload(file, examDate || undefined);
      
      // Check if backend requires exam date
      if (result.requiresExamDate && result.biomarkers) {
        setRequiresDate(true);
        setExtractedBiomarkers(result.biomarkers);
        setUploading(false);
        return;
      }
      
      // Store exam data in sessionStorage as fallback
      // This prevents overwrite when GET /api/exams/:id returns empty mock data
      if (result && result.examId) {
        console.log('UPLOAD - Storing exam data in sessionStorage:', result);
        sessionStorage.setItem(`exam_${result.examId}`, JSON.stringify(result));
      }
      
      // OPTION A: Redirect to results page (current behavior)
      // router.push(`/results/${result.examId}`);
      
      // OPTION B: Redirect directly to dashboard with refresh (recommended)
      // This ensures dashboard shows updated data immediately
      router.push('/dashboard?refresh=true');
    } catch (err: any) {
      const errorData = err.response?.data;
      
      // Check if backend requires exam date
      if (errorData?.requiresExamDate && errorData?.biomarkers) {
        setRequiresDate(true);
        setExtractedBiomarkers(errorData.biomarkers);
        setError('Por favor, ingresa la fecha del examen');
      } else {
        setError(errorData?.error || 'Error al subir el archivo');
      }
    } finally {
      setUploading(false);
    }
  };

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
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {file && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Archivo seleccionado: <span className="font-medium">{file.name}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tamaño: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {/* Exam Date Input - Always visible */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha del examen <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Cannot be in the future
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {requiresDate 
                ? 'No se pudo detectar la fecha en el PDF. Por favor, ingrésala manualmente.'
                : 'Si la fecha no se detecta automáticamente, ingrésala manualmente.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {uploading ? t('common.loading') : 'Subir y Analizar'}
          </button>
        </div>
      </div>
    </div>
  );
}

