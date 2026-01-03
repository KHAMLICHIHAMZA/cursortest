import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { getStoredLanguage, setStoredLanguage } from '../i18n';
import i18n from '../i18n';
import { Button } from '../components/Button';

export const SettingsScreen: React.FC = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, logout } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(i18nInstance.language);

  const handleLanguageChange = async (lang: string) => {
    await setStoredLanguage(lang);
    i18nInstance.changeLanguage(lang);
    setSelectedLanguage(lang);
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedLanguage}
            onValueChange={handleLanguageChange}
            style={styles.picker}
          >
            <Picker.Item label="Français" value="fr" />
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Darija" value="darija" />
          </Picker>
        </View>
      </View>

      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.userInfo') || 'User Information'}</Text>
          <Text style={styles.infoText}>
            {t('settings.email') || 'Email'}: {user.email}
          </Text>
          <Text style={styles.infoText}>
            {t('settings.role') || 'Role'}: {user.role}
          </Text>
        </View>
      )}

      <Button
        title={t('settings.logout')}
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: '#FFF',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 24,
  },
});

