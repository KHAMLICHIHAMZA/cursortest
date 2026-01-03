import { apiClient } from './client';

export type ModuleCode = 'VEHICLES' | 'BOOKINGS' | 'INVOICES' | 'MAINTENANCE' | 'FINES' | 'ANALYTICS';

export interface CompanyModule {
  companyId: string;
  moduleCode: ModuleCode;
  isActive: boolean;
}

export interface AgencyModule {
  agencyId: string;
  moduleCode: ModuleCode;
  isActive: boolean;
}

export interface ActiveModule {
  moduleCode: ModuleCode;
  isActive: boolean;
  source: 'company';
}

export const moduleApi = {
  /**
   * Récupérer les modules activés pour une Company
   */
  getCompanyModules: async (companyId: string): Promise<CompanyModule[]> => {
    const { data } = await apiClient.get<CompanyModule[]>(`/modules/company/${companyId}`);
    return data;
  },

  /**
   * Récupérer les modules activés pour une Agency (avec héritage Company)
   */
  getAgencyModules: async (agencyId: string): Promise<ActiveModule[]> => {
    const { data } = await apiClient.get<ActiveModule[]>(`/modules/agency/${agencyId}`);
    return data;
  },

  /**
   * Activer un module au niveau Company (SUPER_ADMIN uniquement)
   */
  activateCompanyModule: async (companyId: string, moduleCode: ModuleCode): Promise<CompanyModule> => {
    const { data } = await apiClient.post<CompanyModule>(
      `/modules/company/${companyId}/${moduleCode}/activate`
    );
    return data;
  },

  /**
   * Désactiver un module au niveau Company (SUPER_ADMIN uniquement)
   */
  deactivateCompanyModule: async (companyId: string, moduleCode: ModuleCode): Promise<void> => {
    await apiClient.delete(`/modules/company/${companyId}/${moduleCode}`);
  },

  /**
   * Activer un module au niveau Agency
   */
  activateAgencyModule: async (agencyId: string, moduleCode: ModuleCode): Promise<AgencyModule> => {
    const { data } = await apiClient.post<AgencyModule>(
      `/modules/agency/${agencyId}/${moduleCode}/activate`
    );
    return data;
  },

  /**
   * Désactiver un module au niveau Agency
   */
  deactivateAgencyModule: async (agencyId: string, moduleCode: ModuleCode): Promise<void> => {
    await apiClient.delete(`/modules/agency/${agencyId}/${moduleCode}`);
  },
};
