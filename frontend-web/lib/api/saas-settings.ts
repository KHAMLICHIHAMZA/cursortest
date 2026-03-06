import { apiClient } from './client';
import { ModuleCode } from './module';

export interface SaasSettings {
  extraAgencyPriceMad: number;
  extraModulePriceMad: number;
  allowAgencyOverageOnCreate: boolean;
  allowAdditionalModulesOnCreate: boolean;
}

export interface UpdateSaasSettingsDto {
  extraAgencyPriceMad?: number;
  extraModulePriceMad?: number;
  allowAgencyOverageOnCreate?: boolean;
  allowAdditionalModulesOnCreate?: boolean;
}

export interface SimulateSaasPricingDto {
  planId?: string;
  maxAgencies?: number;
  additionalModuleCodes?: ModuleCode[];
}

export interface SimulateSaasPricingResponse {
  input: {
    planId: string | null;
    maxAgencies: number | null;
    additionalModuleCodes: ModuleCode[];
  };
  appliedRules: {
    source: {
      extraAgencyPriceMad: 'plan' | 'global';
      extraModulePriceMad: 'plan' | 'global';
      allowAgencyOverageOnCreate: 'plan' | 'global';
      allowAdditionalModulesOnCreate: 'plan' | 'global';
    };
    values: {
      extraAgencyPriceMad: number;
      extraModulePriceMad: number;
      allowAgencyOverageOnCreate: boolean;
      allowAdditionalModulesOnCreate: boolean;
    };
  };
  breakdown: {
    basePlanPrice: number;
    includedModules: ModuleCode[];
    extraModules: ModuleCode[];
    requestedMaxAgencies: number | null;
    includedAgenciesQuota: number | null;
    extraAgenciesCount: number;
  };
  monthlyAmount: number;
  canProceed: boolean;
  validationErrors: string[];
}

export interface SaasSettingsAuditItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const saasSettingsApi = {
  get: async (): Promise<SaasSettings> => {
    const { data } = await apiClient.get<SaasSettings>('/saas-settings');
    return data;
  },

  update: async (dto: UpdateSaasSettingsDto): Promise<SaasSettings> => {
    const { data } = await apiClient.patch<SaasSettings>('/saas-settings', dto);
    return data;
  },

  simulatePricing: async (
    dto: SimulateSaasPricingDto,
  ): Promise<SimulateSaasPricingResponse> => {
    const { data } = await apiClient.post<SimulateSaasPricingResponse>(
      '/saas-settings/simulate-pricing',
      dto,
    );
    return data;
  },

  getAudit: async (): Promise<SaasSettingsAuditItem[]> => {
    const { data } = await apiClient.get<SaasSettingsAuditItem[]>('/saas-settings/audit');
    return data;
  },
};

