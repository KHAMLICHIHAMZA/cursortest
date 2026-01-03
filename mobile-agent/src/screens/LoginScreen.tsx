import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { authService, loginSchema } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const loginMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 [LoginScreen] mutationFn appelée');
      console.log('📧 Email reçu:', email);
      console.log('🔑 Password reçu (length):', password.length);
      try {
        console.log('✅ [LoginScreen] Validation Zod...');
        const data = loginSchema.parse({ email, password });
        console.log('✅ [LoginScreen] Validation réussie, appel authService.login...');
        const result = await authService.login(data);
        console.log('✅ [LoginScreen] authService.login réussi');
        return result;
      } catch (error) {
        console.error('❌ [LoginScreen] Erreur dans mutationFn:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      login(data);
    },
    onError: (error: any) => {
      console.error('[LoginScreen] onError:', error);
      console.error('[LoginScreen] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request,
        errors: error.errors,
      });
      
      if (error.errors) {
        // Zod validation errors
        const zodErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err: any) => {
          if (err.path[0] === 'email') {
            zodErrors.email = t(`auth.${err.message}`);
          } else if (err.path[0] === 'password') {
            zodErrors.password = t(`auth.${err.message}`);
          }
        });
        setErrors(zodErrors);
      } else {
        const message =
          error.response?.data?.message ||
          error.message ||
          error.code ||
          t('auth.loginError');
        console.error('[LoginScreen] Showing error alert:', message);
        Alert.alert(t('common.error'), message);
      }
    },
  });

  const handleLogin = () => {
    console.log('🔐 [LoginScreen] handleLogin appelé');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);
    setErrors({});
    try {
      console.log('🚀 [LoginScreen] Démarrage de la mutation...');
      loginMutation.mutate();
    } catch (error) {
      console.error('❌ [LoginScreen] Erreur dans handleLogin:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>MalocAuto</Text>
          <Text style={styles.subtitle}>{t('auth.login')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            required
          />

          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            error={errors.password}
            required
          />

          <Button
            title={t('auth.login')}
            onPress={handleLogin}
            loading={loginMutation.isPending}
            style={styles.loginButton}
          />
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
    marginBottom: 48,
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
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: 8,
  },
});

