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
  phone?: string;
  address?: string;
  adminEmail?: string;
  adminName?: string;
  planId?: string;
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

export const companyApi = {
  getAll: async (): Promise<Company[]> => {
    const { data } = await apiClient.get<Company[]>('/companies');
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

  update: async (id: string, dto: UpdateCompanyDto): Promise<Company> => {
    const { data } = await apiClient.patch<Company>(`/companies/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },
};



