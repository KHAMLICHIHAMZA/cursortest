'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { authApi } from '@/lib/api/auth';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

      // Prime shared cache to avoid extra user-fetch/loading flash just after redirect.
      queryClient.setQueryData(['me'], response.user);

      // Rediriger selon le rôle
      const role = response.user.role;
      let targetRoute = '/';
      if (role === 'SUPER_ADMIN') {
        targetRoute = '/admin';
      } else if (role === 'COMPANY_ADMIN') {
        targetRoute = '/company';
      } else if (role === 'AGENCY_MANAGER' || role === 'AGENT') {
        targetRoute = '/agency';
      }

      // Prefetch + replace keeps auth navigation smoother and cleaner in history.
      router.prefetch(targetRoute);
      router.replace(targetRoute);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle className="border border-border bg-card" />
      </div>
      <div className="w-full max-w-md">
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle className="text-center text-3xl">MalocAuto</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous à votre compte
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-sm text-error">
                  {error}
                </div>
              )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text mb-2"
              >
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text mb-2"
              >
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
                className="w-full"
                isLoading={isLoading}
              >
                Se connecter
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm text-text-muted hover:text-text"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



