import { apiClient } from './client';

/** Render cold start peut dépasser 15s ; le client global est à 15s par défaut. */
const AUTH_SLOW_OPS_TIMEOUT_MS = 60_000;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId?: string;
    agencyIds?: string[];
    phone?: string;
    address?: string;
    addressDetails?: {
      line1?: string;
      line2?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
    dateOfBirth?: string;
    profileCompletionRequired?: boolean;
    missingProfileFields?: string[];
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials, {
      timeout: AUTH_SLOW_OPS_TIMEOUT_MS,
    });
    const data = response.data;
    return {
      accessToken: data.accessToken || data.access_token,
      refreshToken: data.refreshToken || data.refresh_token,
      user: data.user,
    };
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post(
      '/auth/refresh',
      { refreshToken },
      { timeout: AUTH_SLOW_OPS_TIMEOUT_MS },
    );
    const data = response.data;
    return { accessToken: data.accessToken || data.access_token };
  },

  forgotPassword: async (email: string, client: 'web' | 'admin' | 'agency' = 'web'): Promise<{ message: string }> => {
    const response = await apiClient.post(
      '/auth/forgot-password',
      { email, client },
      { timeout: AUTH_SLOW_OPS_TIMEOUT_MS },
    );
    return response.data;
  },

  me: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  getMe: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};



