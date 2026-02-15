import { apiClient } from './client';

export type FineStatus = 'RECUE' | 'CLIENT_IDENTIFIE' | 'TRANSMISE' | 'CONTESTEE' | 'CLOTUREE';

export const FINE_STATUS_LABELS: Record<FineStatus, string> = {
  RECUE: 'Reçue',
  CLIENT_IDENTIFIE: 'Client identifié',
  TRANSMISE: 'Transmise',
  CONTESTEE: 'Contestée',
  CLOTUREE: 'Clôturée',
};

export interface Fine {
  id: string;
  agencyId: string;
  bookingId?: string | null;
  amount: number;
  description: string;
  number?: string;
  location?: string;
  infractionDate?: string;
  registrationNumber?: string;
  status: FineStatus;
  clientId?: string | null;
  createdAt: string;
  agency?: {
    id: string;
    name: string;
    company?: {
      id: string;
      name: string;
    };
  };
  booking?: {
    id: string;
    vehicle?: {
      id: string;
      brand: string;
      model: string;
      registrationNumber: string;
    };
    client?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateFineDto {
  agencyId: string;
  bookingId?: string;
  amount: number;
  description: string;
  number?: string;
  location?: string;
  infractionDate?: string;
  registrationNumber?: string;
}

export interface UpdateFineDto {
  bookingId?: string;
  amount?: number;
  description?: string;
  status?: FineStatus;
  number?: string;
  location?: string;
}

export const fineApi = {
  getAll: async (filters?: { agencyId?: string; bookingId?: string }): Promise<Fine[]> => {
    const response = await apiClient.get('/fines', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Fine> => {
    const response = await apiClient.get(`/fines/${id}`);
    return response.data;
  },

  create: async (dto: CreateFineDto): Promise<Fine> => {
    const response = await apiClient.post('/fines', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateFineDto): Promise<Fine> => {
    const response = await apiClient.patch(`/fines/${id}`, dto);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/fines/${id}`);
  },
};

