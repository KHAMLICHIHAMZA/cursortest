import { apiClient } from './client';

export interface Company {
  id: string;
  name: string;
  slug: string;
  raisonSociale: string;
  identifiantLegal?: string;
  formeJuridique: string;
  maxAgencies?: number | null;
  status?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    agencies: number;
    users: number;
  };
}

export interface CreateCompanyDto {
  name: string;
  raisonSociale: string;
  identifiantLegal: string;
  formeJuridique: string;
  maxAgencies?: number | null;
  bookingNumberMode?: string;
  phone?: string;
  address?: string;
  planId?: string;
  additionalModuleCodes?: string[];
}

export interface UpdateCompanyDto {
  name?: string;
  raisonSociale?: string;
  identifiantLegal?: string;
  formeJuridique?: string;
  maxAgencies?: number | null;
  bookingNumberMode?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export interface InitializeCompanySubscriptionDto {
  planId: string;
  maxAgencies?: number;
  additionalModuleCodes?: string[];
}

export interface UpdateCompanySubscriptionDto {
  planId?: string;
  maxAgencies?: number;
  additionalModuleCodes?: string[];
}

export interface AdminDashboardStats {
  companies: number;
  agencies: number;
  users: number;
}

export interface CompanyLookup {
  id: string;
  name: string;
}

export interface PaginatedCompaniesResponse {
  items: Company[];
  total: number;
  activeTotal: number;
  inactiveTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const companyApi = {
  getAll: async (): Promise<Company[]> => {
    const { data } = await apiClient.get<Company[]>('/companies');
    return data;
  },

  getRecent: async (limit = 5): Promise<Company[]> => {
    const { data } = await apiClient.get<Company[]>('/companies/recent', {
      params: { limit },
    });
    return data;
  },

  getAdminStats: async (): Promise<AdminDashboardStats> => {
    const { data } = await apiClient.get<AdminDashboardStats>('/companies/admin-stats');
    return data;
  },

  getLookup: async (): Promise<CompanyLookup[]> => {
    const { data } = await apiClient.get<CompanyLookup[]>('/companies/lookup');
    return data;
  },

  getLight: async (page = 1, pageSize = 25, q?: string): Promise<PaginatedCompaniesResponse> => {
    const { data } = await apiClient.get<PaginatedCompaniesResponse>('/companies/light', {
      params: { page, pageSize, q: q || undefined },
    });
    return data;
  },

  getById: async (id: string): Promise<Company> => {
    const { data } = await apiClient.get<Company>(`/companies/${id}`);
    return data;
  },

  getMyCompany: async (): Promise<Company> => {
    const { data } = await apiClient.get<Company>('/companies/me');
    return data;
  },

  create: async (dto: CreateCompanyDto): Promise<Company> => {
    const { data } = await apiClient.post<Company>('/companies', dto);
    return data;
  },

  initializeSubscription: async (
    id: string,
    dto: InitializeCompanySubscriptionDto,
  ): Promise<{ companyId: string; subscription: any }> => {
    const { data } = await apiClient.post<{ companyId: string; subscription: any }>(
      `/companies/${id}/initial-subscription`,
      dto,
    );
    return data;
  },

  updateSubscriptionConfig: async (
    id: string,
    dto: UpdateCompanySubscriptionDto,
  ): Promise<{ companyId: string; subscription: any }> => {
    const { data } = await apiClient.patch<{ companyId: string; subscription: any }>(
      `/companies/${id}/subscription-config`,
      dto,
    );
    return data;
  },

  update: async (id: string, dto: UpdateCompanyDto): Promise<Company> => {
    const { data } = await apiClient.patch<Company>(`/companies/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },
};



