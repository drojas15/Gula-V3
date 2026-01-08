/**
 * HOMEPAGE MVP - GULA
 * 
 * Puerta de entrada clara y directa.
 * Explica qué es Gula en <7 segundos y lleva al usuario a empezar.
 * 
 * NO es marketing. NO es landing SaaS. Es desambiguación + acción.
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 1. LOGO - Pequeño, superior */}
      <header className="pt-6 pb-4 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="text-2xl font-bold text-primary">
              Gula
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL - Centrado verticalmente */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center">
          
          {/* 2. HEADLINE - Protagonista */}
          <h1 className="text-5xl font-bold text-text-main mb-4 leading-tight">
            Entiende tu salud y qué hacer esta semana.
          </h1>
          
          {/* SUBHEADLINE - 1 línea */}
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Gula convierte tus exámenes médicos en prioridades simples y accionables.
          </p>

          {/* 3. QUÉ HACE - Exactamente 3 bullets */}
          <div className="mb-10 space-y-4">
            <div className="flex items-start gap-3 text-left max-w-xl mx-auto">
              <span className="text-primary text-xl flex-shrink-0 mt-1">✓</span>
              <p className="text-base text-gray-700">
                Traduce exámenes confusos a un estado claro
              </p>
            </div>
            
            <div className="flex items-start gap-3 text-left max-w-xl mx-auto">
              <span className="text-primary text-xl flex-shrink-0 mt-1">✓</span>
              <p className="text-base text-gray-700">
                Prioriza solo 3 acciones para esta semana
              </p>
            </div>
            
            <div className="flex items-start gap-3 text-left max-w-xl mx-auto">
              <span className="text-primary text-xl flex-shrink-0 mt-1">✓</span>
              <p className="text-base text-gray-700">
                Te muestra progreso en el tiempo, sin magia
              </p>
            </div>
          </div>

          {/* 4. QUÉ NO ES - Disclaimer visible */}
          <p className="text-sm text-gray-500 mb-8">
            Gula no da diagnósticos ni reemplaza a tu médico.
          </p>

          {/* 5. CTA ÚNICO - Botón primario grande */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/signup')}
              className="px-8 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary-hover transition-colors"
            >
              Sube tus exámenes y empieza
            </button>
          </div>

          {/* 6. OPCIONAL - Texto pequeño (solo si no genera scroll) */}
          <p className="text-sm text-gray-500">
            Funciona incluso si tus exámenes están incompletos.
          </p>

          {/* Link discreto para usuarios existentes */}
          <div className="mt-8">
            <Link 
              href="/login"
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
