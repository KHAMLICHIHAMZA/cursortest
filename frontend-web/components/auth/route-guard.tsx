'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import Cookies from 'js-cookie';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const token = isClient ? Cookies.get('accessToken') : undefined;
  const [guardTimeoutReached, setGuardTimeoutReached] = useState(false);
  const cachedUser = useMemo(() => {
    if (!isClient) return null;
    const raw = Cookies.get('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [isClient]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const me = await authApi.getMe();
      // Sync user cookie pour useModuleAccess et autres hooks
      if (me) {
        Cookies.set('user', JSON.stringify(me), {
          expires: 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
      return me;
    },
    enabled: isClient && !!token,
    initialData: cachedUser || undefined,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isClient || !token || cachedUser || !isLoading) {
      setGuardTimeoutReached(false);
      return;
    }

    const timer = setTimeout(() => {
      setGuardTimeoutReached(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [isClient, token, cachedUser, isLoading]);

  useEffect(() => {
    if (!isClient) return;

    if (!token) {
      router.replace('/login');
      return;
    }

    if (error) {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      router.replace('/login');
      return;
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect based on role
      if (user.role === 'SUPER_ADMIN') {
        router.replace('/admin');
      } else if (user.role === 'COMPANY_ADMIN') {
        router.replace('/company');
      } else {
        router.replace('/agency');
      }
    }
  }, [isClient, token, user, error, allowedRoles, router]);

  // Keep first paint identical between server and client to avoid hydration mismatch.
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-text-muted">Chargement...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-text-muted">Chargement...</div>
      </div>
    );
  }

  if (guardTimeoutReached && !cachedUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-text">
            La verification de session prend trop de temps.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Verifiez la connexion API puis reessayez.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-2 text-sm text-text"
              onClick={() => window.location.reload()}
            >
              Reessayer
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-sm text-white"
              onClick={() => {
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
                Cookies.remove('user');
                router.replace('/login');
              }}
            >
              Se reconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !cachedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-text-muted">Chargement...</div>
      </div>
    );
  }

  if (error || !user) {
    return null; // Will redirect
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null; // Will redirect
  }

  return <>{children}</>;
}



