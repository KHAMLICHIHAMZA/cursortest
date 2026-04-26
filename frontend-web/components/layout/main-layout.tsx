'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { agencyApi } from '@/lib/api/agency';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  setAuthSessionStartedAtClient,
  startNewAuthSessionClient,
} from '@/lib/auth-session.client';
import { authCookieBase } from '@/lib/auth-cookies';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

import type { AuthResponse } from '@/lib/api/auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils/cn';

/** Aligné sur GET /auth/me : adresse stockée en JSON ou texte libre. */
function parseMeAddressDetails(
  address?: string | null,
): AuthResponse['user']['addressDetails'] {
  if (!address) return undefined;
  try {
    const parsed = JSON.parse(address);
    if (parsed && typeof parsed === 'object') {
      return {
        line1: typeof parsed.line1 === 'string' ? parsed.line1 : undefined,
        line2: typeof parsed.line2 === 'string' ? parsed.line2 : undefined,
        city: typeof parsed.city === 'string' ? parsed.city : undefined,
        postalCode:
          typeof parsed.postalCode === 'string' ? parsed.postalCode : undefined,
        country: typeof parsed.country === 'string' ? parsed.country : undefined,
      };
    }
  } catch {
    return { line1: address };
  }
  return undefined;
}

type MeUser = AuthResponse['user'];

type ProfilePatchResponse = Partial<
  Pick<
    MeUser,
    | 'id'
    | 'email'
    | 'name'
    | 'role'
    | 'companyId'
    | 'phone'
    | 'address'
    | 'dateOfBirth'
  >
>;

function mergeMeAfterProfilePatch(
  prev: MeUser | undefined,
  updated: ProfilePatchResponse,
): MeUser {
  const base = prev ?? {
    id: updated.id ?? '',
    email: updated.email ?? '',
    name: updated.name ?? '',
    role: updated.role ?? '',
    agencyIds: [],
  };
  const addressDetails =
    parseMeAddressDetails(updated.address ?? undefined) ?? base.addressDetails;
  return {
    ...base,
    id: updated.id ?? base.id,
    email: updated.email ?? base.email,
    name: updated.name ?? base.name,
    role: updated.role ?? base.role,
    companyId: updated.companyId ?? base.companyId,
    phone: updated.phone ?? base.phone,
    address: updated.address ?? base.address,
    addressDetails,
    dateOfBirth: updated.dateOfBirth ?? base.dateOfBirth,
    profileCompletionRequired: false,
    missingProfileFields: [],
  };
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** Barre visible sur viewports lg+ (préférence persistée). */
  const [sidebarDesktopExpanded, setSidebarDesktopExpanded] = useState(true);
  const isLg = useMediaQuery('(min-width: 1024px)');
  /** Ne pas exécuter la 1re persistance : même cycle que la lecture, elle réécrirait `1` par-dessus un `0` en stockage. */
  const skipNextSidebarLocalPersist = useRef(true);

  useEffect(() => {
    try {
      if (localStorage.getItem('maloc-sidebar-expanded') === '0') {
        setSidebarDesktopExpanded(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (skipNextSidebarLocalPersist.current) {
      skipNextSidebarLocalPersist.current = false;
      return;
    }
    try {
      localStorage.setItem('maloc-sidebar-expanded', sidebarDesktopExpanded ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [sidebarDesktopExpanded]);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddressLine1, setProfileAddressLine1] = useState('');
  const [profileAddressLine2, setProfileAddressLine2] = useState('');
  const [profileAddressCity, setProfileAddressCity] = useState('');
  const [profileAddressPostalCode, setProfileAddressPostalCode] = useState('');
  const [profileAddressCountry, setProfileAddressCountry] = useState('');
  const [profileDateOfBirth, setProfileDateOfBirth] = useState('');

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

    const adminUserJson = localStorage.getItem('admin_user');
    if (adminUserJson) {
      Cookies.set('user', adminUserJson, {
        ...authCookieBase,
        expires: 7,
      });
    }

    const adminSessionStart = localStorage.getItem('admin_authSessionStartedAt');
    if (adminSessionStart) {
      setAuthSessionStartedAtClient(adminSessionStart);
      localStorage.removeItem('admin_authSessionStartedAt');
    } else {
      startNewAuthSessionClient();
    }

    localStorage.removeItem('impersonating');
    localStorage.removeItem('impersonatedUser');
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('admin_refreshToken');
    localStorage.removeItem('admin_user');

    queryClient.removeQueries({ queryKey: ['me'] });

    router.push('/admin/users');
    setTimeout(() => window.location.reload(), 100);
  };

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    retry: false,
  });

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name || '');
    setProfilePhone(user.phone || '');
    const details = user.addressDetails || {};
    setProfileAddressLine1(details.line1 || user.address || '');
    setProfileAddressLine2(details.line2 || '');
    setProfileAddressCity(details.city || '');
    setProfileAddressPostalCode(details.postalCode || '');
    setProfileAddressCountry(details.country || '');
    setProfileDateOfBirth(
      user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '',
    );
  }, [user]);

  const saveRequiredProfileMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      phone: string;
      addressDetails: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
      };
      dateOfBirth: string;
    }) => apiClient.patch('/users/me', payload).then((res) => res.data),
    onSuccess: async (updatedUser: ProfilePatchResponse) => {
      queryClient.setQueryData(['me'], (prev) =>
        mergeMeAfterProfilePatch(prev as MeUser | undefined, updatedUser),
      );
      await queryClient.refetchQueries({ queryKey: ['me'] });
      const fresh = queryClient.getQueryData(['me']) as MeUser | undefined;
      if (fresh?.profileCompletionRequired) {
        queryClient.setQueryData(['me'], {
          ...fresh,
          profileCompletionRequired: false,
          missingProfileFields: [],
        });
      }
      toast.success('Profil complété avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Impossible d’enregistrer le profil');
    },
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
  const isProfileCompletionLocked =
    user?.role !== 'SUPER_ADMIN' && !!user?.profileCompletionRequired;

  const bandeauAvecOffsetBarre = isLg && sidebarDesktopExpanded;

  const handleNavMenuButton = () => {
    if (isLg) {
      setSidebarDesktopExpanded((v) => !v);
    } else {
      setSidebarOpen(true);
    }
  };

  const menuBoutonLabel = !isLg
    ? 'Ouvrir le menu'
    : sidebarDesktopExpanded
      ? 'Masquer le menu latéral'
      : 'Afficher le menu latéral';

  const handleSubmitRequiredProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !profileName.trim()
      || !profilePhone.trim()
      || !profileAddressLine1.trim()
      || !profileAddressCity.trim()
      || !profileAddressPostalCode.trim()
      || !profileAddressCountry.trim()
      || !profileDateOfBirth
    ) {
      toast.error('Complétez tous les champs obligatoires');
      return;
    }
    const birthDate = new Date(profileDateOfBirth);
    if (Number.isNaN(birthDate.getTime())) {
      toast.error('Date de naissance invalide');
      return;
    }
    const now = new Date();
    if (birthDate > now) {
      toast.error('La date de naissance ne peut pas être dans le futur');
      return;
    }

    saveRequiredProfileMutation.mutate({
      name: profileName.trim(),
      phone: profilePhone.trim(),
      addressDetails: {
        line1: profileAddressLine1.trim(),
        line2: profileAddressLine2.trim() || undefined,
        city: profileAddressCity.trim(),
        postalCode: profileAddressPostalCode.trim(),
        country: profileAddressCountry.trim(),
      },
      dateOfBirth: birthDate.toISOString(),
    });
  };

  return (
    <div className="flex min-h-screen bg-background relative">
      <Sidebar
        userRole={user?.role}
        companyId={user?.companyId}
        agencyId={effectiveAgencyId}
        effectiveAgencyRole={effectiveAgencyRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sidebarDesktopExpanded={sidebarDesktopExpanded}
      />
      <div
        className={cn(
          'flex-1 min-w-0 transition-[margin] duration-200 ease-out',
          bandeauAvecOffsetBarre && 'lg:ml-64',
        )}
      >
        {isImpersonating && (
          <div
            className={cn(
              'fixed top-0 right-0 z-50 bg-orange-500 text-white px-3 md:px-4 py-2 flex items-center justify-between text-xs md:text-sm font-medium shadow-lg',
              'left-0',
              bandeauAvecOffsetBarre && 'lg:left-64',
            )}
          >
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
          onMenuClick={handleNavMenuButton}
          menuButtonAriaLabel={menuBoutonLabel}
          accountForSidebarWidth={bandeauAvecOffsetBarre}
        />
        <main
          className={`p-3 md:p-6 lg:p-8 ${
            isImpersonating ? 'pt-24 md:pt-32 lg:pt-[8.5rem]' : 'pt-16 md:pt-24 lg:pt-[6.5rem]'
          }`}
        >
          {children}
        </main>
      </div>
      {isProfileCompletionLocked && (
        <div className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-text">Compléter votre profil</h2>
            <p className="text-sm text-text-muted mt-2">
              Première connexion détectée. Vous devez compléter ces informations avant d’utiliser l’application.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmitRequiredProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text mb-1">Nom complet *</label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Ex: Hamza Khamlichi"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text mb-1">Téléphone *</label>
                  <Input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="Ex: +212600000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text mb-1">Date de naissance *</label>
                <Input
                  type="date"
                  value={profileDateOfBirth}
                  onChange={(e) => setProfileDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm text-text">Adresse *</label>
                <Input
                  value={profileAddressLine1}
                  onChange={(e) => setProfileAddressLine1(e.target.value)}
                  placeholder="Ligne 1 (numéro, rue...)"
                />
                <Input
                  value={profileAddressLine2}
                  onChange={(e) => setProfileAddressLine2(e.target.value)}
                  placeholder="Ligne 2 (bâtiment, quartier...)"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={profileAddressPostalCode}
                    onChange={(e) => setProfileAddressPostalCode(e.target.value)}
                    placeholder="Code postal"
                  />
                  <Input
                    value={profileAddressCity}
                    onChange={(e) => setProfileAddressCity(e.target.value)}
                    placeholder="Ville"
                  />
                  <Input
                    value={profileAddressCountry}
                    onChange={(e) => setProfileAddressCountry(e.target.value)}
                    placeholder="Pays"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={saveRequiredProfileMutation.isPending}>
                  Enregistrer et continuer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
