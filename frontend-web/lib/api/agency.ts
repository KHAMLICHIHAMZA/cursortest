import { apiClient } from './client';

export interface Agency {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  companyId: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  timezone?: string;
  capacity?: number;
  suspendedAt?: string;
  suspendedReason?: string;
  company?: {
    id: string;
    name: string;
  };
  _count?: {
    vehicles: number;
    bookings: number;
    userAgencies: number;
  };
}

export interface CreateAgencyDto {
  name: string;
  phone?: string;
  address?: string;
  companyId?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  timezone?: string;
  capacity?: number;
}

export interface UpdateAgencyDto {
  name?: string;
  phone?: string;
  address?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  timezone?: string;
  capacity?: number;
}

export const agencyApi = {
  getAll: async (): Promise<Agency[]> => {
    const { data } = await apiClient.get<Agency[]>('/agencies');
    return data;
  },

  getById: async (id: string): Promise<Agency> => {
    const { data } = await apiClient.get<Agency>(`/agencies/${id}`);
    return data;
  },

  create: async (dto: CreateAgencyDto): Promise<Agency> => {
    const { data } = await apiClient.post<Agency>('/agencies', dto);
    return data;
  },

  update: async (id: string, dto: UpdateAgencyDto): Promise<Agency> => {
    const { data } = await apiClient.patch<Agency>(`/agencies/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/agencies/${id}`);
  },
};



