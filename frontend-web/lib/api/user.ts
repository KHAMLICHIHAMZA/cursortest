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

export interface PaginatedUsersResponse {
  items: User[];
  total: number;
  activeTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  getLight: async (
    page = 1,
    pageSize = 25,
    q?: string,
    agencyId?: string,
  ): Promise<PaginatedUsersResponse> => {
    const { data } = await apiClient.get<PaginatedUsersResponse>('/users/light', {
      params: { page, pageSize, q: q || undefined, agencyId: agencyId || undefined },
    });
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

  /** Mot de passe défini par l'admin (immédiat). */
  adminSetPassword: async (
    id: string,
    body: { password?: string; sendEmail: boolean },
  ): Promise<{
    message: string;
    emailed?: boolean;
    temporaryPassword?: string;
  }> => {
    const { data } = await apiClient.post<{
      message: string;
      emailed?: boolean;
      temporaryPassword?: string;
    }>(`/users/${id}/set-password`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

