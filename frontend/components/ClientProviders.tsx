/**
 * CLIENT PROVIDERS
 * 
 * Envuelve la aplicación con todos los providers del lado del cliente.
 * Separado del layout root porque los providers deben ser client components.
 */

'use client';

import { AuthProvider } from '@/contexts/AuthContext';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
