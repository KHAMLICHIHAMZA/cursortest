import { z } from 'zod';
import { Platform } from 'react-native';
import api, { apiService } from './api';

// Import expo-secure-store conditionally (not available on web)
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const USER_KEY = 'user_data';
const AGENCIES_KEY = 'agencies_data';
const PERMISSIONS_KEY = 'permissions_data';
const MODULES_KEY = 'modules_data';

// Helper functions for secure storage with web fallback
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    if (!SecureStore) {
      return null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return;
    }
    if (!SecureStore) {
      throw new Error('SecureStore is not available');
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
      return;
    }
    if (!SecureStore) {
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error deleting from SecureStore:', error);
    }
  },
};

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'AGENCY_MANAGER' | 'AGENT';
  companyId: string;
  company?: {
    id: string;
    name: string;
    isActive: boolean;
    status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  };
  agencyIds: string[];
}

export interface Agency {
  id: string;
  name: string;
  isActive: boolean;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export interface Permission {
  resource: string;
  action: string;
}

export interface Module {
  id: string;
  name: string;
  isActive: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  agencies: Agency[];
  permissions: Permission[];
  modules: Module[];
}

export const authService = {
  async login(data: LoginInput): Promise<LoginResponse> {
    console.log('[authService] Début login avec:', { email: data.email, passwordLength: data.password.length });
    console.log('[authService] API baseURL:', (api as any).defaults?.baseURL || 'non défini');
    
    try {
      const response = await api.post<any>('/auth/login', data);
      console.log('[authService] ✅ Login réussi, réponse:', response.status, response.data?.user?.email);
      
      // Backend now returns: { access_token, refresh_token, user, agencies, permissions, modules }
      const accessToken = response.data.access_token || response.data.accessToken;
      const refreshToken = response.data.refresh_token || response.data.refreshToken;
      const userData = response.data.user;
      const agenciesData = response.data.agencies || [];
      const permissionsData = response.data.permissions || [];
      const modulesData = response.data.modules || [];
      
      // Store tokens
      await apiService.setToken(accessToken);
      if (refreshToken) {
        await apiService.setRefreshToken(refreshToken);
      }
      
      // Store user data
      const user: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || userData.name?.split(' ')[0] || '',
        lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
        role: userData.role,
        companyId: userData.companyId,
        company: userData.company,
        agencyIds: userData.agencyIds || [],
      };
      
      const agencies: Agency[] = agenciesData.map((a: any) => ({
        id: a.id,
        name: a.name,
        isActive: a.isActive !== false,
        status: a.status,
      }));
      
      const permissions: Permission[] = permissionsData;
      const modules: Module[] = modulesData;
      
      await secureStorage.setItem(USER_KEY, JSON.stringify(user));
      await secureStorage.setItem(AGENCIES_KEY, JSON.stringify(agencies));
      await secureStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
      await secureStorage.setItem(MODULES_KEY, JSON.stringify(modules));
      
      return {
        access_token: accessToken,
        user,
        agencies,
        permissions,
        modules,
      };
    } catch (error: any) {
      console.error('[authService] ❌ Erreur login:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
        },
      });
      throw error;
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const data = await secureStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async getAgencies(): Promise<Agency[]> {
    try {
      const data = await secureStorage.getItem(AGENCIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async getPermissions(): Promise<Permission[]> {
    try {
      const data = await secureStorage.getItem(PERMISSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async getModules(): Promise<Module[]> {
    try {
      const data = await secureStorage.getItem(MODULES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async logout(): Promise<void> {
    await apiService.logout();
    await secureStorage.removeItem(USER_KEY);
    await secureStorage.removeItem(AGENCIES_KEY);
    await secureStorage.removeItem(PERMISSIONS_KEY);
    await secureStorage.removeItem(MODULES_KEY);
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await apiService.getToken();
    return !!token;
  },
};

