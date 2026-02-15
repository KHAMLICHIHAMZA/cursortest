import { apiClient } from './client';

export interface Booking {
  id: string;
  agencyId: string;
  vehicleId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  totalAmount?: number;
  totalPrice?: number; // Alias for totalAmount
  status: string;
  bookingNumber?: string;
  // Champs caution (R3)
  depositRequired?: boolean;
  depositAmount?: number;
  depositDecisionSource?: 'COMPANY' | 'AGENCY';
  depositStatusCheckIn?: 'PENDING' | 'COLLECTED';
  depositStatusFinal?: 'REFUNDED' | 'PARTIAL' | 'FORFEITED' | 'DISPUTED';
  // Frais de retard (R4)
  lateFeeAmount?: number;
  lateFeeCalculatedAt?: string;
  lateFeeOverride?: boolean;
  lateFeeOverrideJustification?: string;
  // Temps de préparation (R2.2)
  computedEndWithPreparation?: string;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    registrationNumber: string;
    dailyRate?: number;
  };
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    licenseExpiryDate?: string;
  };
  agency?: {
    id: string;
    name: string;
    preparationTimeMinutes?: number;
  };
}

export interface CreateBookingDto {
  agencyId: string;
  vehicleId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  totalAmount?: number;
  totalPrice?: number; // Alias for totalAmount
  status?: string;
  // Champs caution (R3)
  depositRequired?: boolean;
  depositAmount?: number;
  depositDecisionSource?: 'COMPANY' | 'AGENCY';
}

export const bookingApi = {
  getAll: async (filters?: any): Promise<Booking[]> => {
    const response = await apiClient.get('/bookings', { params: filters });
    return response.data;
  },

  getOne: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  create: async (data: CreateBookingDto): Promise<Booking> => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateBookingDto>): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/bookings/${id}`);
  },

  // Override frais de retard (Agency Manager uniquement)
  overrideLateFee: async (id: string, data: { newAmount: number; justification: string }): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${id}/late-fee`, data);
    return response.data;
  },

  // Clôture financière
  financialClosure: async (id: string): Promise<Booking> => {
    const response = await apiClient.post(`/bookings/${id}/financial-closure`);
    return response.data;
  },
};



