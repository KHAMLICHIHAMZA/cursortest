import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getDevHost = (): string | null => {
  // Expo dev host is often available as "ip:port"
  const candidates: Array<unknown> = [
    (Constants as any)?.expoConfig?.hostUri,
    (Constants as any)?.expoConfig?.debuggerHost,
    (Constants as any)?.manifest?.debuggerHost,
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri,
  ];

  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    // hostUri/debuggerHost can be "192.168.x.x:19000" or "192.168.x.x:8081"
    const host = trimmed.split(':')[0];
    if (host && host !== 'localhost') return host;
  }
  return null;
};

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
    // Sur mobile, essayer de dériver l'IP du host Expo (même machine) pour éviter les IP hardcodées
    const host = getDevHost();
    if (host) {
      return `http://${host}:3000/api/v1`;
    }
    // Fallback (à éviter): ancien comportement hardcodé
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

