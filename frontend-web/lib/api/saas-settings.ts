import { apiClient } from './client';

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

export const saasSettingsApi = {
  get: async (): Promise<SaasSettings> => {
    const { data } = await apiClient.get<SaasSettings>('/saas-settings');
    return data;
  },

  update: async (dto: UpdateSaasSettingsDto): Promise<SaasSettings> => {
    const { data } = await apiClient.patch<SaasSettings>('/saas-settings', dto);
    return data;
  },
};

