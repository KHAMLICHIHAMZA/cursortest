import { apiClient } from './client';

export type ChargeCategory =
  | 'INSURANCE'
  | 'GENERAL_INSURANCE'
  | 'VIGNETTE'
  | 'BANK_INSTALLMENT'
  | 'PREVENTIVE_MAINTENANCE'
  | 'CORRECTIVE_MAINTENANCE'
  | 'FUEL'
  | 'SALARY'
  | 'OFFICE_RENT'
  | 'TAX'
  | 'ADMIN_EXPENSE'
  | 'MARKETING_EXPENSE'
  | 'UTILITIES_EXPENSE'
  | 'EXTERNAL_SERVICE'
  | 'EXCEPTIONAL'
  | 'OTHER';

export type ChargeScope = 'VEHICLE' | 'AGENCY' | 'COMPANY';
export type CostCenter =
  | 'SALAIRES'
  | 'LOYER_BUREAU'
  | 'ADMINISTRATIF'
  | 'MARKETING'
  | 'UTILITIES'
  | 'SERVICES_EXTERNES'
  | 'ASSURANCES_GENERALES'
  | 'FISCALITE'
  | 'AUTRE';

export const CATEGORY_LABELS: Record<ChargeCategory, string> = {
  BANK_INSTALLMENT: 'Mensualité bancaire',
  INSURANCE: 'Assurance',
  GENERAL_INSURANCE: 'Assurance générale',
  VIGNETTE: 'Vignette / Dariba',
  FUEL: 'Carburant',
  PREVENTIVE_MAINTENANCE: 'Maintenance préventive',
  CORRECTIVE_MAINTENANCE: 'Réparation / Maintenance corrective',
  SALARY: 'Salaires',
  OFFICE_RENT: 'Loyer bureau',
  TAX: 'Fiscalité',
  ADMIN_EXPENSE: 'Charge administrative',
  MARKETING_EXPENSE: 'Dépense marketing',
  UTILITIES_EXPENSE: 'Charge utilitaire',
  EXTERNAL_SERVICE: 'Service externe',
  EXCEPTIONAL: 'Charge exceptionnelle',
  OTHER: 'Autre',
};

export const CATEGORY_OPTIONS: { value: ChargeCategory; label: string }[] = Object.entries(
  CATEGORY_LABELS
).map(([value, label]) => ({ value: value as ChargeCategory, label }));

export const COST_CENTER_LABELS: Record<CostCenter, string> = {
  SALAIRES: 'Salaires',
  LOYER_BUREAU: 'Loyer bureau',
  ADMINISTRATIF: 'Administratif',
  MARKETING: 'Marketing',
  UTILITIES: 'Charges utilitaires',
  SERVICES_EXTERNES: 'Services externes',
  ASSURANCES_GENERALES: 'Assurances générales',
  FISCALITE: 'Fiscalité',
  AUTRE: 'Autre',
};

export const COST_CENTER_OPTIONS: { value: CostCenter; label: string }[] = Object.entries(
  COST_CENTER_LABELS
).map(([value, label]) => ({ value: value as CostCenter, label }));

export interface Charge {
  id: string;
  companyId: string;
  agencyId: string;
  vehicleId: string | null;
  bookingId: string | null;
  scope: ChargeScope;
  costCenter: CostCenter | null;
  category: ChargeCategory;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
  recurrencePeriod: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    registrationNumber: string;
  };
}

export interface CreateChargeDto {
  agencyId: string;
  vehicleId?: string;
  bookingId?: string;
  scope?: ChargeScope;
  costCenter?: CostCenter;
  category: ChargeCategory;
  description: string;
  amount: number;
  date: string;
  recurring?: boolean;
  recurrencePeriod?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

export interface ChargeFilters {
  agencyId?: string;
  vehicleId?: string;
  scope?: ChargeScope;
  costCenter?: CostCenter;
  category?: ChargeCategory;
  startDate?: string;
  endDate?: string;
}

export const chargeApi = {
  getAll: async (filters: ChargeFilters = {}): Promise<Charge[]> => {
    const params = new URLSearchParams();
    if (filters.agencyId) params.append('agencyId', filters.agencyId);
    if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters.scope) params.append('scope', filters.scope);
    if (filters.costCenter) params.append('costCenter', filters.costCenter);
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const res = await apiClient.get(`/charges?${params.toString()}`);
    return res.data;
  },

  getById: async (id: string): Promise<Charge> => {
    const res = await apiClient.get(`/charges/${id}`);
    return res.data;
  },

  create: async (data: CreateChargeDto): Promise<Charge> => {
    const res = await apiClient.post('/charges', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateChargeDto>): Promise<Charge> => {
    const res = await apiClient.patch(`/charges/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/charges/${id}`);
  },
};
