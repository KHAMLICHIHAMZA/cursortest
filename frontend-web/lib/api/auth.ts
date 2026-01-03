import { apiClient } from './client';

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
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
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



