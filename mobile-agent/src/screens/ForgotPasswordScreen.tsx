import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { authService, forgotPasswordSchema } from '../services/auth.service';

export const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isValidEmail = useMemo(() => {
    try {
      forgotPasswordSchema.parse({ email });
      return true;
    } catch {
      return false;
    }
  }, [email]);

  const forgotMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      setSuccessMessage(null);
      const data = forgotPasswordSchema.parse({ email });
      return authService.forgotPassword(data);
    },
    onSuccess: () => {
      const msg = t('auth.resetEmailSent');
      setSuccessMessage(msg);
      if (Platform.OS !== 'web') {
        Alert.alert(t('common.success'), msg);
      }
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        t('auth.loginError');
      const normalized = Array.isArray(msg) ? msg.join('\n') : String(msg);
      setErrorMessage(normalized);
      if (Platform.OS !== 'web') {
        Alert.alert(t('common.error'), normalized);
      }
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>MalocAuto</Text>
          <Text style={styles.subtitle}>{t('auth.forgotPasswordTitle')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            required
          />

          {!!errorMessage && (
            <View style={[styles.messageBox, styles.errorBox]}>
              <Text style={styles.messageText}>{errorMessage}</Text>
            </View>
          )}

          {!!successMessage && (
            <View style={[styles.messageBox, styles.successBox]}>
              <Text style={styles.messageText}>{successMessage}</Text>
            </View>
          )}

          <Button
            title={t('auth.sendResetLink')}
            onPress={() => forgotMutation.mutate()}
            loading={forgotMutation.isPending}
            disabled={!email || !isValidEmail}
            style={styles.primaryButton}
          />

          <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  messageBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
    borderWidth: 1,
  },
  messageText: {
    color: '#111827',
  },
  primaryButton: {
    marginTop: 8,
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

