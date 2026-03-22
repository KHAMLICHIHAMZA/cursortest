import { apiClient } from './api/client';

export type ModuleCode =
  | 'VEHICLES'
  | 'BOOKINGS'
  | 'INVOICES'
  | 'MAINTENANCE'
  | 'FINES'
  | 'ANALYTICS'
  | 'GPS'
  | 'CONTRACTS'
  | 'JOURNAL'
  | 'CHARGES'
  | 'NOTIFICATIONS';

export interface ActiveModule {
  moduleCode: ModuleCode;
  isActive: boolean;
  activatedAt?: string;
}

type FetchModulesOptions = {
  forceRefresh?: boolean;
};

// Cache des modules
let modulesCache: Map<string, { modules: ActiveModule[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchAgencyModules = async (
  agencyId: string,
  options: FetchModulesOptions = {},
): Promise<ActiveModule[]> => {
  const forceRefresh = !!options.forceRefresh;
  const cached = modulesCache.get(`agency-${agencyId}`);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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

export const fetchCompanyModules = async (
  companyId: string,
  options: FetchModulesOptions = {},
): Promise<ActiveModule[]> => {
  const forceRefresh = !!options.forceRefresh;
  const cached = modulesCache.get(`company-${companyId}`);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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
  if (modules.length === 0) return false;
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
  '/agency/contracts': 'CONTRACTS',
  '/agency/journal': 'JOURNAL',
  '/agency/maintenance': 'MAINTENANCE',
  '/agency/fines': 'FINES',
  '/agency/charges': 'CHARGES',
  '/agency/kpi': 'BOOKINGS', // KPI necessite au minimum le module Bookings
  '/agency/gps': 'GPS',
  '/agency/notifications': 'NOTIFICATIONS',
};

// Mapping des routes company vers les modules requis
export const companyRouteModuleMap: Record<string, ModuleCode | null> = {
  '/company': null,
  '/company/agencies': null,
  '/company/users': null,
  '/company/analytics': 'ANALYTICS',
  '/company/planning': 'BOOKINGS',
  '/company/notifications': 'NOTIFICATIONS',
};
