import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENCY_MANAGER' | 'AGENT';
  companyId?: string;
  isActive: boolean;
  company?: {
    id: string;
    name: string;
  };
  userAgencies?: Array<{
    agency: {
      id: string;
      name: string;
    };
    permission?: 'READ' | 'WRITE' | 'FULL';
  }>;
}

export interface CreateUserDto {
  email: string;
  name: string;
  role: 'COMPANY_ADMIN' | 'AGENCY_MANAGER' | 'AGENT';
  companyId?: string;
  agencyIds?: string[];
}

export interface UpdateUserDto {
  name?: string;
  role?: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENCY_MANAGER' | 'AGENT';
  isActive?: boolean;
  agencyIds?: string[];
  agencyPermissions?: Array<{
    agencyId: string;
    permission: 'READ' | 'WRITE' | 'FULL';
  }>;
}

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  create: async (dto: CreateUserDto): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', dto);
    return data;
  },

  update: async (id: string, dto: UpdateUserDto): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/users/${id}`, dto);
    return data;
  },

  resetPassword: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(`/users/${id}/reset-password`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

