'use client';

import { useQuery } from '@tanstack/react-query';
import { moduleApi, ModuleCode } from '@/lib/api/module';
import Cookies from 'js-cookie';

/**
 * Récupérer l'utilisateur depuis les cookies
 */
function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const userStr = Cookies.get('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Hook pour vérifier si un module est activé pour l'utilisateur actuel
 */
export function useModuleAccess(moduleCode: ModuleCode, agencyId?: string) {
  const user = getCurrentUser();

  // Récupérer les modules selon le contexte
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['modules', user?.companyId, agencyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      if (agencyId && user.role !== 'SUPER_ADMIN') {
        // Pour les agences, récupérer les modules Agency (avec héritage)
        return moduleApi.getAgencyModules(agencyId);
      } else {
        // Pour les companies, récupérer les modules Company
        return moduleApi.getCompanyModules(user.companyId);
      }
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Vérifier si le module est activé
  const isModuleActive = modules?.some(
    (m) => m.moduleCode === moduleCode && m.isActive
  ) ?? false;

  return {
    isModuleActive,
    isLoading,
    error,
    modules,
  };
}

/**
 * Hook pour vérifier plusieurs modules à la fois
 */
export function useModulesAccess(moduleCodes: ModuleCode[], agencyId?: string) {
  const user = getCurrentUser();

  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['modules', user?.companyId, agencyId],
    queryFn: async () => {
      if (!user?.companyId) return [];

      if (agencyId && user.role !== 'SUPER_ADMIN') {
        return moduleApi.getAgencyModules(agencyId);
      } else {
        return moduleApi.getCompanyModules(user.companyId);
      }
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000,
  });

  const moduleAccess: Record<ModuleCode, boolean> = {} as Record<ModuleCode, boolean>;
  
  moduleCodes.forEach((code) => {
    moduleAccess[code] = modules?.some(
      (m) => m.moduleCode === code && m.isActive
    ) ?? false;
  });

  return {
    moduleAccess,
    isLoading,
    error,
    modules,
  };
}

