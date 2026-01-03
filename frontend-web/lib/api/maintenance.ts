import { apiClient } from './client';

export interface Maintenance {
  id: string;
  agencyId: string;
  vehicleId: string;
  description: string;
  plannedAt?: string;
  cost?: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  agency?: {
    id: string;
    name: string;
    company?: {
      id: string;
      name: string;
    };
  };
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    registrationNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceDto {
  agencyId: string;
  vehicleId: string;
  description: string;
  plannedAt?: string;
  cost?: number;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateMaintenanceDto {
  description?: string;
  plannedAt?: string;
  cost?: number;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export const maintenanceApi = {
  getAll: async (filters?: { agencyId?: string; vehicleId?: string; status?: string }): Promise<Maintenance[]> => {
    const response = await apiClient.get('/maintenance', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Maintenance> => {
    const response = await apiClient.get(`/maintenance/${id}`);
    return response.data;
  },

  create: async (dto: CreateMaintenanceDto): Promise<Maintenance> => {
    const response = await apiClient.post('/maintenance', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateMaintenanceDto): Promise<Maintenance> => {
    const response = await apiClient.patch(`/maintenance/${id}`, dto);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance/${id}`);
  },
};



