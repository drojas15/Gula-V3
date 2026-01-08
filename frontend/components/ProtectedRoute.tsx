/**
 * PROTECTED ROUTE
 * 
 * Componente para proteger rutas que requieren autenticación.
 * Redirige a /login si el usuario no está autenticado.
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si ya terminó de cargar y no está autenticado, redirigir a login
    if (!isLoading && !isAuthenticated) {
      // Guardar la ruta actual para redirigir después del login
      const returnUrl = pathname !== '/login' && pathname !== '/signup' 
        ? pathname 
        : '/dashboard';
      
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Mientras carga, mostrar un loader simple
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (la redirección se encarga)
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
}
