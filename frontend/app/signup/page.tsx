/**
 * SIGNUP PAGE
 * 
 * User registration page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    age: 35,
    sex: 'M' as 'M' | 'F',
    weight: undefined as number | undefined,
    goals: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log('Form submitted with data:', formData);

    // Validate form data
    if (!formData.email || !formData.name || !formData.password) {
      setError('Por favor completa todos los campos requeridos');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      console.log('Calling signup...');
      await signup(formData);
      console.log('Signup successful');
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Better error handling
      let errorMessage = 'Error al crear cuenta';
      
      if (err.response) {
        // Backend responded with error
        if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data?.details) {
          // Zod validation errors
          const details = err.response.data.details;
          errorMessage = `Error de validación: ${details.map((d: any) => d.message).join(', ')}`;
        } else {
          errorMessage = `Error del servidor (${err.response.status})`;
        }
      } else if (err.message) {
        // Network error or other
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Edad
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  min={18}
                  max={100}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.age}
                  onChange={(e) => {
                    const ageValue = parseInt(e.target.value);
                    if (!isNaN(ageValue) && ageValue >= 18 && ageValue <= 100) {
                      setFormData({ ...formData, age: ageValue });
                    } else if (e.target.value === '') {
                      setFormData({ ...formData, age: 35 });
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                  Sexo
                </label>
                <select
                  id="sex"
                  name="sex"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'M' | 'F' })}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Peso (kg) - Opcional
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              onClick={() => {
                console.log('Button clicked, loading:', loading);
                if (!loading) {
                  console.log('Form data before submit:', formData);
                }
              }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-primary-600 hover:text-primary-500">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

