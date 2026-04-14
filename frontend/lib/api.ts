/**
 * API CLIENT
 * 
 * Centralized API client for all backend requests
 */

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper to get auth headers
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================
// AUTH API
// ============================================

export interface SignupData {
  email: string;
  name: string;
  password: string;
  age: number;
  sex: 'M' | 'F';
  weight?: number;
  goals?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authAPI = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Validar que la respuesta sea JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Respuesta inválida del servidor. Asegúrate de que el backend esté corriendo en el puerto correcto.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const result = await response.json();
    
    // Store token and user
    if (typeof window !== 'undefined') {
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('token', result.token); // Backward compatibility
      }
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }
    }

    return result;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Validar que la respuesta sea JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Respuesta inválida del servidor. Asegúrate de que el backend esté corriendo en el puerto correcto.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    
    // Store token and user
    if (typeof window !== 'undefined') {
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('token', result.token); // Backward compatibility
      }
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }
    }

    return result;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },
};

// ============================================
// USER API
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  weight?: number;
  goals?: string;
  createdAt: string;
}

export const userAPI = {
  getMe: async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user data');
    }

    return response.json();
  },
};

// ============================================
// EXAM API
// ============================================

export interface Exam {
  id: string;
  userId: string;
  examDate: string;
  uploadedAt: string;
  healthScore: number;
  biomarkers: any;
  requiresExamDate?: boolean;
  parsedBiomarkers?: any[];
}

export const examAPI = {
  upload: async (file: File, examDate?: string): Promise<Exam> => {
    const formData = new FormData();
    formData.append('pdf', file);
    if (examDate) {
      formData.append('examDate', examDate);
    }

    const response = await fetch(`${API_BASE_URL}/exams/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  list: async (): Promise<{ exams: Exam[] }> => {
    const response = await fetch(`${API_BASE_URL}/exams`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get exams');
    }

    return response.json();
  },

  getById: async (examId: string): Promise<Exam> => {
    const response = await fetch(`${API_BASE_URL}/exams/${examId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get exam');
    }

    return response.json();
  },
};

// ============================================
// DASHBOARD API
// ============================================

export interface DashboardData {
  health_score: number;
  score_trend: 'UP' | 'STABLE' | 'DOWN' | 'NONE';
  biomarkers: Array<{
    id: string;
    value: number;
    status: string;
    traffic_light: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    trend?: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NONE';
    unit?: string;
    lastMeasuredAt?: string;
    measurementCount?: number;
  }>;
  weekly_actions: Array<{
    weekly_action_id: string;
    title: string;
    category: string;
    weekly_target: string;
    progress: number;
    completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    impacted_biomarkers: string[];
  }>;
  hasBaseline?: boolean;
  baselineDate?: string | null;
  reliability?: {
    percentage: number;
    measuredCount: number;
    totalCount: number;
  };
}

export const dashboardAPI = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get dashboard data');
    }

    return response.json();
  },

  updateActionProgress: async (
    actionId: string,
    progress: number
  ): Promise<{ progress: number; completion_state: string }> => {
    const response = await fetch(`${API_BASE_URL}/weekly-actions/${actionId}/progress`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress }),
    });

    if (!response.ok) {
      throw new Error('Failed to update progress');
    }

    return response.json();
  },
};

// ============================================
// WEEKLY TRANSITION API
// ============================================

export interface WeeklyTransitionData {
  shouldShowTransition: boolean;
  previousWeek: {
    weekStart: string;
    weekEnd: string;
    weekRange: string;
    actions: Array<{
      id: string;
      title: string;
      progress: number;
      completion_state: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    }>;
  } | null;
  currentWeek: {
    weekStart: string;
    weekEnd: string;
  };
}

export const weeklyTransitionAPI = {
  /**
   * Obtiene datos para la transición semanal
   */
  getTransitionData: async (): Promise<WeeklyTransitionData> => {
    const response = await fetch(`${API_BASE_URL}/weekly-transition`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get transition data: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Confirma la transición y ejecuta re-cálculo semanal
   */
  confirmTransition: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/weekly-transition/confirm`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to confirm transition: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Descarta la transición sin ejecutar re-cálculo
   */
  dismissTransition: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/weekly-transition/dismiss`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to dismiss transition: ${response.statusText}`);
    }

    return response.json();
  },
};
