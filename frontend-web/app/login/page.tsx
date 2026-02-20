'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });

      // Stocker les tokens avec les bonnes options pour Next.js
      Cookies.set('accessToken', response.accessToken, { 
        expires: 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      Cookies.set('refreshToken', response.refreshToken, { 
        expires: 30,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      // Stocker les infos utilisateur (nécessaire pour useModuleAccess, sidebar, etc.)
      Cookies.set('user', JSON.stringify(response.user), {
        expires: 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      
      console.log('Tokens stored successfully');

      // Rediriger selon le rôle
      const role = response.user.role;
      if (role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (role === 'COMPANY_ADMIN') {
        router.push('/company');
      } else if (role === 'AGENCY_MANAGER' || role === 'AGENT') {
        router.push('/agency');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      {/* Background subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(245,166,35,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,166,35,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow mb-4">
            <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0L5 9l3-3h8l3 3-3 4" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">MalocAuto</h1>
          <p className="mt-1 text-sm text-foreground-subtle">Connectez-vous a votre compte</p>
        </div>

        {/* Login card */}
        <div className="rounded-lg border border-border bg-surface-1 p-6 shadow-elevation-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-error/10 border border-error/20 px-3 py-2.5 text-xs text-error">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground-muted">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground-muted">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-1"
              isLoading={isLoading}
            >
              Se connecter
            </Button>
          </form>
        </div>

        {/* Forgot password link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            className="text-xs text-foreground-subtle hover:text-primary transition-colors"
          >
            Mot de passe oublie ?
          </button>
        </div>
      </div>
    </div>
  );
}



