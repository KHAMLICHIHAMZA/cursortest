'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { authApi } from '@/lib/api/auth';
import {
  getResolvedApiUrl,
  isProductionApiUrlPointingToLocalhost,
} from '@/lib/api/client';
import { getLoginErrorMessage } from '@/lib/utils/api-error';
import Cookies from 'js-cookie';
import { authCookieBase } from '@/lib/auth-cookies';

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

      Cookies.set('accessToken', response.accessToken, {
        ...authCookieBase,
        expires: 7,
      });
      Cookies.set('refreshToken', response.refreshToken, {
        ...authCookieBase,
        expires: 30,
      });
      Cookies.set('user', JSON.stringify(response.user), {
        ...authCookieBase,
        expires: 7,
      });

      queryClient.setQueryData(['me'], response.user);

      const role = response.user.role;
      let targetRoute = '/';
      if (role === 'SUPER_ADMIN') {
        targetRoute = '/admin';
      } else if (role === 'COMPANY_ADMIN') {
        targetRoute = '/company';
      } else if (role === 'AGENCY_MANAGER' || role === 'AGENT') {
        targetRoute = '/agency';
      }

      // Navigation complète : le middleware lit les cookies sur la requête document.
      // router.replace (RSC) peut partir avant que les cookies soient visibles — surtout en navigation privée.
      window.location.assign(targetRoute);
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
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
              {isProductionApiUrlPointingToLocalhost() && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
                  Configuration API invalide en production :{' '}
                  <code className="rounded bg-background/80 px-1 py-0.5 text-xs">
                    {getResolvedApiUrl()}
                  </code>
                  . Définissez{' '}
                  <code className="rounded bg-background/80 px-1 py-0.5 text-xs">
                    NEXT_PUBLIC_API_URL
                  </code>{' '}
                  (URL HTTPS du backend, ex.{' '}
                  <code className="rounded bg-background/80 px-1 py-0.5 text-xs">
                    …/api/v1
                  </code>
                  ) dans les variables d&apos;environnement Vercel, puis redéployez.
                </div>
              )}
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
