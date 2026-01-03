import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Détecter automatiquement l'URL de l'API selon la plateforme
const getApiUrl = () => {
  // Si une URL est définie dans la config, l'utiliser
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // En développement
  if (__DEV__) {
    // Sur web, utiliser localhost
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api/v1';
    }
    // Sur mobile, utiliser l'IP locale
    return 'http://172.20.10.12:3000/api/v1';
  }

  // En production
  return 'https://api.malocauto.com/api/v1';
};

const API_BASE_URL = getApiUrl();

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour CORS avec credentials
};

export default API_CONFIG;

