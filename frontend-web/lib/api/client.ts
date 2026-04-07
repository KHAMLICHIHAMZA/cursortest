import axios from 'axios';
import Cookies from 'js-cookie';
import { authCookieBase } from '../auth-cookies';
import { clearAllAuthCookiesClient } from '../auth-session.client';
import { getApiErrorMessage } from '../utils/api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/** URL résolue au build (NEXT_PUBLIC_*). Utile pour diagnostics UI. */
export function getResolvedApiUrl(): string {
  return API_URL;
}

/** True si le bundle de prod appelle encore localhost — la connexion échouera côté navigateur. */
export function isProductionApiUrlPointingToLocalhost(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    (API_URL.includes('localhost') || API_URL.includes('127.0.0.1'))
  );
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor pour gérer les erreurs et refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Skip message parsing for blob responses (PDF downloads etc.)
    const isBlob = error?.config?.responseType === 'blob';
    const data = error?.response?.data;
    if (
      !isBlob &&
      data &&
      typeof data === 'object' &&
      !Array.isArray(data)
    ) {
      try {
        (data as Record<string, unknown>).message = getApiErrorMessage(
          error,
          'Erreur serveur',
        );
      } catch {
        /* ignore: données figées ou forme inattendue */
      }
    }
    const originalRequest = error.config;

    // Si erreur 401 et pas déjà retenté
    // Ne PAS tenter de refresh pour les endpoints d'auth (login, register, forgot-password)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/forgot-password') ||
                           originalRequest.url?.includes('/auth/reset-password');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          Cookies.remove('accessToken', { path: '/' });
          Cookies.remove('refreshToken', { path: '/' });
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        Cookies.set('accessToken', accessToken, {
          ...authCookieBase,
          expires: 7,
        });

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAllAuthCookiesClient();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Gérer les erreurs 403 (Module non activé / Permission insuffisante)
    if (error.response?.status === 403) {
      const raw = error.response?.data?.message ?? error.response?.data?.error;
      const errorMessage =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
            ? raw.filter((x) => typeof x === 'string').join(' • ')
            : raw != null
              ? String(raw)
              : '';

      // Créer une erreur enrichie avec le code d'erreur
      const enhancedError = new Error(errorMessage || 'Accès refusé');
      (enhancedError as any).status = 403;
      (enhancedError as any).response = error.response?.data;
      (enhancedError as any).isModuleError = errorMessage?.includes('module') || 
                                            errorMessage?.includes('Module') ||
                                            errorMessage?.includes('not included') ||
                                            errorMessage?.includes('non inclus');
      
      return Promise.reject(enhancedError);
    }

    return Promise.reject(error);
  },
);


