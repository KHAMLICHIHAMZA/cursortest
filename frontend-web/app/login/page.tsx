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
        router.push('/dashboard');
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



