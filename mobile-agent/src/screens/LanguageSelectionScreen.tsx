import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { getStoredLanguage, setStoredLanguage } from '../i18n';
import i18n from '../i18n';

export const LanguageSelectionScreen: React.FC = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const navigation = useNavigation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if language is already selected BEFORE rendering the screen
    getStoredLanguage().then((lang) => {
      if (lang) {
        i18nInstance.changeLanguage(lang);
        // @ts-ignore
        navigation.replace('Login'); // Use replace instead of navigate to avoid back navigation
      } else {
        setIsChecking(false); // Show language selection if no language stored
      }
    });
  }, []);

  const selectLanguage = async (lang: string) => {
    await setStoredLanguage(lang);
    i18nInstance.changeLanguage(lang);
    // @ts-ignore
    navigation.replace('Login'); // Use replace instead of navigate
  };

  // Show loading while checking for stored language
  if (isChecking) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('languageSelection.title') || 'Sélectionnez votre langue'}</Text>
      <Text style={styles.subtitle}>{t('languageSelection.subtitle') || 'Select your language'}</Text>
      <Text style={styles.subtitle}>{t('languageSelection.subtitleDarija') || 'Khtar lughatek'}</Text>

      <View style={styles.languages}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => selectLanguage('fr')}
        >
          <Text style={styles.languageText}>{t('languageSelection.french') || 'Français'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => selectLanguage('en')}
        >
          <Text style={styles.languageText}>{t('languageSelection.english') || 'English'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => selectLanguage('darija')}
        >
          <Text style={styles.languageText}>{t('languageSelection.darija') || 'Darija'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
  },
  languages: {
    width: '100%',
    maxWidth: 300,
  },
  languageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  languageText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

