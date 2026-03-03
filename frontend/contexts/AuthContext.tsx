/**
 * AUTH CONTEXT
 * 
 * Maneja el estado de autenticación global de la aplicación.
 * 
 * FEATURES:
 * - Estado persistente (localStorage)
 * - Login/Logout
 * - Protección de rutas
 * - Usuario actual
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, type AuthResponse } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  sex?: 'M' | 'F';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    name: string;
    password: string;
    age: number;
    sex: 'M' | 'F';
    weight?: number;
    goals?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Al iniciar la app, verificar si hay sesión guardada
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
        // Si hay error, limpiar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result: AuthResponse = await authAPI.login({ email, password });
      setUser(result.user as User);
      router.push('/dashboard');
    } catch (error: any) {
      throw error; // Re-throw para que el componente maneje el error
    }
  };

  const signup = async (data: {
    email: string;
    name: string;
    password: string;
    age: number;
    sex: 'M' | 'F';
    weight?: number;
    goals?: string;
  }) => {
    try {
      const result: AuthResponse = await authAPI.signup(data);
      setUser(result.user as User);
      router.push('/dashboard');
    } catch (error: any) {
      throw error; // Re-throw para que el componente maneje el error
    }
  };

  const logout = () => {
    // Store userId before clearing state (needed for cleanup)
    const currentUserId = user?.id;
    
    authAPI.logout();
    setUser(null);
    
    // CRITICAL: Clear sessionStorage to prevent data leakage between users
    // Remove all exam data cached in sessionStorage
    if (typeof window !== 'undefined') {
      // Clear sessionStorage exam data
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('exam_')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear user-specific onboarding state from localStorage
      if (currentUserId) {
        localStorage.removeItem(`gula_onboarding_completed_${currentUserId}`);
      }
      
      // Also clear old onboarding key (for backwards compatibility)
      localStorage.removeItem('gula_onboarding_completed');
    }
    
    router.push('/login');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
