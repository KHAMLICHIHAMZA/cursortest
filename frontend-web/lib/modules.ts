import { apiClient } from './api/client';

export type ModuleCode = 'VEHICLES' | 'BOOKINGS' | 'INVOICES' | 'MAINTENANCE' | 'FINES' | 'ANALYTICS';

export interface ActiveModule {
  moduleCode: ModuleCode;
  isActive: boolean;
  activatedAt?: string;
}

// Cache des modules
let modulesCache: Map<string, { modules: ActiveModule[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchAgencyModules = async (agencyId: string): Promise<ActiveModule[]> => {
  const cached = modulesCache.get(`agency-${agencyId}`);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.modules;
  }

  try {
    const response = await apiClient.get(`/modules/agency/${agencyId}`);
    const modules = response.data;
    modulesCache.set(`agency-${agencyId}`, { modules, timestamp: Date.now() });
    return modules;
  } catch (error) {
    console.error('Erreur lors de la récupération des modules agence:', error);
    return [];
  }
};

export const fetchCompanyModules = async (companyId: string): Promise<ActiveModule[]> => {
  const cached = modulesCache.get(`company-${companyId}`);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.modules;
  }

  try {
    const response = await apiClient.get(`/modules/company/${companyId}`);
    const modules = response.data;
    modulesCache.set(`company-${companyId}`, { modules, timestamp: Date.now() });
    return modules;
  } catch (error) {
    console.error('Erreur lors de la récupération des modules company:', error);
    return [];
  }
};

export const isModuleActive = (modules: ActiveModule[], code: ModuleCode): boolean => {
  const found = modules.find(m => m.moduleCode === code);
  return found?.isActive ?? false;
};

export const clearModulesCache = (): void => {
  modulesCache.clear();
};

// Mapping des routes agence vers les modules requis
export const agencyRouteModuleMap: Record<string, ModuleCode | null> = {
  '/agency': null, // Dashboard
  '/agency/vehicles': 'VEHICLES',
  '/agency/clients': null,
  '/agency/bookings': 'BOOKINGS',
  '/agency/planning': 'BOOKINGS',
  '/agency/invoices': 'INVOICES',
  '/agency/contracts': 'BOOKINGS', // Contrats liés aux réservations
  '/agency/journal': null, // Journal toujours visible
  '/agency/maintenance': 'MAINTENANCE',
  '/agency/fines': 'FINES',
  '/agency/notifications': null, // Notifications toujours visibles
};

// Mapping des routes company vers les modules requis
export const companyRouteModuleMap: Record<string, ModuleCode | null> = {
  '/company': null,
  '/company/agencies': null,
  '/company/users': null,
  '/company/analytics': 'ANALYTICS',
  '/company/planning': 'BOOKINGS',
};
