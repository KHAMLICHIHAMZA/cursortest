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
    // Restaurer les tokens admin
    const adminAccessToken = localStorage.getItem('admin_accessToken');
    const adminRefreshToken = localStorage.getItem('admin_refreshToken');

    if (adminAccessToken) {
      Cookies.set('accessToken', adminAccessToken, { expires: 7 });
    }
    if (adminRefreshToken) {
      Cookies.set('refreshToken', adminRefreshToken, { expires: 7 });
    }

    // Nettoyer
    localStorage.removeItem('impersonating');
    localStorage.removeItem('impersonatedUser');
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('admin_refreshToken');

    // Retour admin
    router.push('/admin/users');
    setTimeout(() => window.location.reload(), 100);
  };

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    retry: false,
  });

  // Pour COMPANY_ADMIN : déterminer dynamiquement son rôle agence hérité
  // Il comble les rôles manquants dans sa company :
  // - Seul (pas de manager, pas d'agent) → il fait TOUT (BOTH)
  // - Il a créé des agents mais pas de manager → il est le manager (AGENCY_MANAGER)
  // - Il a créé des managers mais pas d'agent → il est l'agent (AGENT)
  // - Il a créé manager + agent → tout est couvert, mode normal (null)
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

  // Calculer le rôle agence hérité
  const getEffectiveAgencyRole = (): 'AGENCY_MANAGER' | 'AGENT' | 'BOTH' | null => {
    if (!isCompanyAdmin || !companyUsers) return null;

    const otherUsers = companyUsers.filter((u: any) => u.id !== user?.id);
    const hasManager = otherUsers.some((u: any) => u.role === 'AGENCY_MANAGER');
    const hasAgent = otherUsers.some((u: any) => u.role === 'AGENT');

    if (!hasManager && !hasAgent) return 'BOTH';     // Solo : tout faire
    if (hasAgent && !hasManager) return 'AGENCY_MANAGER'; // Agent créé → il reste manager
    if (hasManager && !hasAgent) return 'AGENT';      // Manager créé → il fait l'agent
    return null;                                       // Tout couvert → mode normal
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
      />
      <div className="flex-1 ml-64">
        {isImpersonating && (
          <div className="fixed top-0 left-64 right-0 z-50 bg-orange-500 text-white px-4 py-2 flex items-center justify-between text-sm font-medium shadow-lg">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>
                Mode impersonation — Connecte en tant que{' '}
                <strong>{impersonatedUser?.email || 'utilisateur'}</strong>
                {impersonatedUser?.role && (
                  <span className="ml-1 opacity-80">({impersonatedUser.role})</span>
                )}
              </span>
            </div>
            <button
              onClick={handleStopImpersonation}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Revenir en Super Admin
            </button>
          </div>
        )}
        <Header userName={user?.name} userRole={user?.role} />
        <main className={`pt-16 p-8 ${isImpersonating ? 'mt-10' : ''}`}>{children}</main>
      </div>
    </div>
  );
}



