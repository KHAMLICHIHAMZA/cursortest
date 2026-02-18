import axios, { AxiosInstance, AxiosError } from 'axios';
import { Platform, Alert } from 'react-native';
import { API_CONFIG } from '../config/api';
import { getStoredLanguage } from '../i18n';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Callback pour notifier le contexte d'authentification
let onUnauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Import expo-secure-store conditionally (not available on web)
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  private async getStoredValue(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
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
  }

  private async setStoredValue(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
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
  }

  private async deleteStoredValue(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
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
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getStoredValue(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const lang = await getStoredLanguage();
        config.headers['Accept-Language'] = lang;
        // Debug: log request method and URL
        console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log(`[API] Headers:`, config.headers);
        return config;
      },
      (error) => {
        console.error('[API] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] ✅ Response ${response.status} from ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        const requestUrl = (error.config?.url || '').toString();
        console.error('[API] ❌ Response error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
          },
        });
        // Important: don't auto-logout on auth endpoints (login/forgot/reset)
        // Otherwise the UI may not show the real error (e.g. "mot de passe incorrect").
        const isAuthEndpoint =
          requestUrl.includes('/auth/login') ||
          requestUrl.includes('/auth/forgot-password') ||
          requestUrl.includes('/auth/reset-password') ||
          requestUrl.includes('/auth/refresh');

        if (error.response?.status === 401 && !isAuthEndpoint) {
          // Tenter de rafraîchir le token si disponible
          const refreshToken = await this.getStoredValue(REFRESH_TOKEN_KEY);
          
          if (refreshToken && !error.config?.url?.includes('/auth/refresh')) {
            try {
              // Tenter de rafraîchir le token
              const refreshResponse = await axios.post(
                `${API_CONFIG.baseURL}/auth/refresh`,
                { refresh_token: refreshToken }
              );
              
              const newAccessToken = refreshResponse.data.access_token || refreshResponse.data.accessToken;
              if (newAccessToken) {
                await this.setToken(newAccessToken);
                // Réessayer la requête originale avec le nouveau token
                if (error.config) {
                  error.config.headers.Authorization = `Bearer ${newAccessToken}`;
                  return this.client.request(error.config);
                }
              }
            } catch (refreshError) {
              console.log('[API] ❌ Token refresh failed, logging out');
              // Si le refresh échoue, déconnecter l'utilisateur
            }
          }
          
          // Déconnexion et notification
          await this.logout();
          
          // Notifier le contexte d'authentification
          if (onUnauthorizedCallback) {
            onUnauthorizedCallback();
          }
          
          // Afficher un message à l'utilisateur
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Session expirée',
              'Votre session a expiré. Veuillez vous reconnecter.',
              [{ text: 'OK' }]
            );
          }
        }

        const MODULE_403_MSG = "Ce module n'est pas activé pour votre compte.";
        const isCheckInOut =
          requestUrl.includes('/checkin') || requestUrl.includes('/checkout');
        const errData = error.response?.data as { message?: string; error?: string } | undefined;
        const isModule403 =
          error.response?.status === 403 &&
          /module|not included|non inclus/i.test(
            String(errData?.message || errData?.error || ''),
          );
        if (isModule403 && !isCheckInOut) {
          if (Platform.OS === 'web') {
            window.alert(MODULE_403_MSG);
          } else {
            Alert.alert('Module non activé', MODULE_403_MSG, [{ text: 'OK' }]);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string) {
    await this.setStoredValue(TOKEN_KEY, token);
  }

  async getToken(): Promise<string | null> {
    return await this.getStoredValue(TOKEN_KEY);
  }

  async logout() {
    await this.deleteStoredValue(TOKEN_KEY);
    await this.deleteStoredValue(REFRESH_TOKEN_KEY);
  }

  async setRefreshToken(token: string) {
    await this.setStoredValue(REFRESH_TOKEN_KEY, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await this.getStoredValue(REFRESH_TOKEN_KEY);
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  get<T = any>(url: string, config?: Parameters<AxiosInstance['get']>[1]) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: Parameters<AxiosInstance['post']>[2]) {
    return this.client.post<T>(url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: Parameters<AxiosInstance['patch']>[2]) {
    return this.client.patch<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: Parameters<AxiosInstance['put']>[2]) {
    return this.client.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: Parameters<AxiosInstance['delete']>[1]) {
    return this.client.delete<T>(url, config);
  }
}

export const apiService = new ApiService();
export default apiService.getClient();

