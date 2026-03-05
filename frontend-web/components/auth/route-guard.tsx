'use client';

import { useEffect, useMemo } from 'react';
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
  const token = Cookies.get('accessToken');
  const cachedUser = useMemo(() => {
    const raw = Cookies.get('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
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
    enabled: !!token,
    initialData: cachedUser || undefined,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
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
  }, [token, user, error, allowedRoles, router]);

  if (!token || (isLoading && !cachedUser)) {
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



