'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { agencyApi } from '@/lib/api/agency';
import { userApi } from '@/lib/api/user';
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
  const { data: companyUsers } = useQuery({
    queryKey: ['company-users', user?.companyId],
    queryFn: () => userApi.getAll(),
    enabled: !!isCompanyAdmin && !!user?.companyId,
    retry: false,
  });

  const getEffectiveAgencyRole = (): 'AGENCY_MANAGER' | 'AGENT' | 'BOTH' | null => {
    if (!isCompanyAdmin || !companyUsers) return null;

    const otherUsers = companyUsers.filter((u: any) => u.id !== user?.id);
    const hasManager = otherUsers.some((u: any) => u.role === 'AGENCY_MANAGER');
    const hasAgent = otherUsers.some((u: any) => u.role === 'AGENT');

    if (!hasManager && !hasAgent) return 'BOTH';
    if (hasAgent && !hasManager) return 'AGENCY_MANAGER';
    if (hasManager && !hasAgent) return 'AGENT';
    return null;
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
          <div className="fixed top-0 left-0 lg:left-64 right-0 z-50 bg-orange-500 text-white px-3 md:px-4 py-2 flex items-center justify-between text-xs md:text-sm font-medium shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                Impersonation — <strong>{impersonatedUser?.email || 'utilisateur'}</strong>
                {impersonatedUser?.role && (
                  <span className="ml-1 opacity-80">({impersonatedUser.role})</span>
                )}
              </span>
            </div>
            <button
              onClick={handleStopImpersonation}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-2 md:px-3 py-1 transition-colors flex-shrink-0 text-xs md:text-sm"
            >
              <ArrowLeft className="w-3 h-3" />
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
        <main className={`pt-14 md:pt-16 p-3 md:p-6 lg:p-8 ${isImpersonating ? 'mt-10' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
