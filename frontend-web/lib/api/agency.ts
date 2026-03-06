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
  preparationTimeMinutes?: number;
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
  preparationTimeMinutes?: number;
}

export interface AgencyLookup {
  id: string;
  name: string;
}

export interface PaginatedAgenciesResponse {
  items: Agency[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const agencyApi = {
  getAll: async (): Promise<Agency[]> => {
    const { data } = await apiClient.get<Agency[]>('/agencies');
    return data;
  },

  getLookup: async (companyId?: string): Promise<AgencyLookup[]> => {
    const { data } = await apiClient.get<AgencyLookup[]>('/agencies/lookup', {
      params: { companyId: companyId || undefined },
    });
    return data;
  },

  getLight: async (page = 1, pageSize = 25, q?: string): Promise<PaginatedAgenciesResponse> => {
    const { data } = await apiClient.get<PaginatedAgenciesResponse>('/agencies/light', {
      params: { page, pageSize, q: q || undefined },
    });
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



