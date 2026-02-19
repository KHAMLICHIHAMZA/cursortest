import { apiClient } from './client';

export interface PlanModule {
  moduleCode: string;
}

export interface PlanQuota {
  quotaKey: string;
  quotaValue: number;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  planModules: PlanModule[];
  planQuotas: PlanQuota[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanDto {
  name: string;
  description?: string;
  price: number;
  moduleCodes?: string[];
  quotas?: Record<string, number>;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {
  isActive?: boolean;
}

export const planApi = {
  getAll: async (includeInactive = false): Promise<Plan[]> => {
    const res = await apiClient.get('/plans', {
      params: includeInactive ? { all: 'true' } : {},
    });
    return res.data;
  },

  getById: async (id: string): Promise<Plan> => {
    const res = await apiClient.get(`/plans/${id}`);
    return res.data;
  },

  create: async (data: CreatePlanDto): Promise<Plan> => {
    const res = await apiClient.post('/plans', data);
    return res.data;
  },

  update: async (id: string, data: UpdatePlanDto): Promise<Plan> => {
    const res = await apiClient.patch(`/plans/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/plans/${id}`);
  },
};
