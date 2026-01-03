import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
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
    } else {
      console.warn('No access token found in cookies for request:', config.url);
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
    const originalRequest = error.config;

    // Si erreur 401 et pas déjà retenté
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('401 error detected, attempting token refresh...');
      
      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          console.error('No refresh token found');
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        console.log('Refreshing token...');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        Cookies.set('accessToken', accessToken, {
          expires: 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });

        console.log('Token refreshed successfully');
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh échoué, rediriger vers login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Gérer les erreurs 403 (Module non activé / Permission insuffisante)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error;
      
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


