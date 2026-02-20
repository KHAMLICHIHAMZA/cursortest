'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { agencyApi } from '@/lib/api/agency';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const imp = localStorage.getItem('impersonating');
    if (imp === 'true') {
      setIsImpersonating(true);
      try {
        const userData = localStorage.getItem('impersonatedUser');
        if (userData) setImpersonatedUser(JSON.parse(userData));
      } catch {}
    }
  }, []);

  const handleStopImpersonation = () => {
    const adminAccessToken = localStorage.getItem('admin_accessToken');
    const adminRefreshToken = localStorage.getItem('admin_refreshToken');

    if (adminAccessToken) {
      Cookies.set('accessToken', adminAccessToken, { expires: 7 });
    }
    if (adminRefreshToken) {
      Cookies.set('refreshToken', adminRefreshToken, { expires: 7 });
    }

    localStorage.removeItem('impersonating');
    localStorage.removeItem('impersonatedUser');
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('admin_refreshToken');

    router.push('/admin/users');
    setTimeout(() => window.location.reload(), 100);
  };

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    retry: false,
  });

  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN';
  const { data: companyAgencies } = useQuery({
    queryKey: ['company-agencies', user?.companyId],
    queryFn: () => agencyApi.getAll(),
    enabled: !!isCompanyAdmin && !!user?.companyId,
    retry: false,
  });
  const getEffectiveAgencyRole = (): 'AGENCY_MANAGER' | 'AGENT' | 'BOTH' | null => {
    if (!isCompanyAdmin) return null;
    return 'BOTH';
  };

  const effectiveAgencyRole = getEffectiveAgencyRole();
  const effectiveAgencyId = user?.agencyIds?.[0] 
    || (effectiveAgencyRole && companyAgencies?.[0]?.id) 
    || undefined;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userRole={user?.role}
        companyId={user?.companyId}
        agencyId={effectiveAgencyId}
        effectiveAgencyRole={effectiveAgencyRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 lg:ml-64 min-w-0">
        {isImpersonating && (
          <div className="fixed top-0 left-0 lg:left-64 right-0 z-50 bg-warning/10 border-b border-warning/20 text-warning px-4 py-2 flex items-center justify-between text-xs font-medium backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {'Impersonation  — '}
                <strong className="text-foreground">{impersonatedUser?.email || 'utilisateur'}</strong>
                {impersonatedUser?.role && (
                  <span className="ml-1 text-foreground-muted">({impersonatedUser.role})</span>
                )}
              </span>
            </div>
            <button
              onClick={handleStopImpersonation}
              className="flex items-center gap-1.5 rounded-md bg-warning/10 hover:bg-warning/20 px-3 py-1 transition-colors flex-shrink-0 text-xs text-warning"
            >
              <ArrowLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Revenir en Super Admin</span>
              <span className="sm:hidden">Retour</span>
            </button>
          </div>
        )}
        <Header
          userName={user?.name}
          userRole={user?.role}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className={`pt-14 px-4 pb-8 md:px-6 lg:px-8 ${isImpersonating ? 'mt-10' : ''}`}>
          <div className="mx-auto max-w-7xl pt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
