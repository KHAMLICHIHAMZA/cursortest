export interface SaasSettings {
  extraAgencyPriceMad: number;
  extraModulePriceMad: number;
  allowAgencyOverageOnCreate: boolean;
  allowAdditionalModulesOnCreate: boolean;
}

export const SAAS_SETTINGS_RULE_KEYS = {
  EXTRA_AGENCY_PRICE_MAD: 'saas.extra_agency_price_mad',
  EXTRA_MODULE_PRICE_MAD: 'saas.extra_module_price_mad',
  ALLOW_AGENCY_OVERAGE_ON_CREATE: 'saas.allow_agency_overage_on_create',
  ALLOW_ADDITIONAL_MODULES_ON_CREATE: 'saas.allow_additional_modules_on_create',
} as const;

export const DEFAULT_SAAS_SETTINGS: SaasSettings = {
  extraAgencyPriceMad: 0,
  extraModulePriceMad: 0,
  allowAgencyOverageOnCreate: true,
  allowAdditionalModulesOnCreate: true,
};

