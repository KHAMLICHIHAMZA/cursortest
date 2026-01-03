'use client';

import { useEffect } from 'react';
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

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (error) {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      router.push('/login');
      return;
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect based on role
      if (user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (user.role === 'COMPANY_ADMIN') {
        router.push('/company');
      } else {
        router.push('/agency');
      }
    }
  }, [token, user, error, allowedRoles, router]);

  if (!token || isLoading) {
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



