import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import fr from './fr.json';
import en from './en.json';
import darija from './darija.json';

// Import expo-secure-store conditionally (not available on web)
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const LANGUAGE_KEY = 'app_language';

export const getStoredLanguage = async (): Promise<string> => {
  try {
    let lang: string | null = null;
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      lang = localStorage.getItem(LANGUAGE_KEY);
    } else if (SecureStore) {
      lang = await SecureStore.getItemAsync(LANGUAGE_KEY);
    }
    return lang || 'fr';
  } catch {
    return 'fr';
  }
};

export const setStoredLanguage = async (lang: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // Web fallback: use localStorage
      localStorage.setItem(LANGUAGE_KEY, lang);
    } else if (SecureStore) {
      await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
    }
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      darija: { translation: darija },
    },
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

