import { apiClient } from './client';

export type ChargeCategory =
  | 'INSURANCE'
  | 'VIGNETTE'
  | 'BANK_INSTALLMENT'
  | 'PREVENTIVE_MAINTENANCE'
  | 'CORRECTIVE_MAINTENANCE'
  | 'FUEL'
  | 'EXCEPTIONAL'
  | 'OTHER';

export const CATEGORY_LABELS: Record<ChargeCategory, string> = {
  BANK_INSTALLMENT: 'Mensualité bancaire',
  INSURANCE: 'Assurance',
  VIGNETTE: 'Vignette / Dariba',
  FUEL: 'Carburant',
  PREVENTIVE_MAINTENANCE: 'Maintenance préventive',
  CORRECTIVE_MAINTENANCE: 'Réparation / Maintenance corrective',
  EXCEPTIONAL: 'Charge exceptionnelle',
  OTHER: 'Autre',
};

export const CATEGORY_OPTIONS: { value: ChargeCategory; label: string }[] = Object.entries(
  CATEGORY_LABELS
).map(([value, label]) => ({ value: value as ChargeCategory, label }));

export interface Charge {
  id: string;
  companyId: string;
  agencyId: string;
  vehicleId: string;
  bookingId: string | null;
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
  vehicleId: string;
  bookingId?: string;
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
  category?: ChargeCategory;
  startDate?: string;
  endDate?: string;
}

export const chargeApi = {
  getAll: async (filters: ChargeFilters = {}): Promise<Charge[]> => {
    const params = new URLSearchParams();
    if (filters.agencyId) params.append('agencyId', filters.agencyId);
    if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);
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
