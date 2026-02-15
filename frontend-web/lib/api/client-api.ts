import { apiClient } from './client';

export interface Client {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  licenseNumber?: string;
  licenseImageUrl?: string;
  isMoroccan?: boolean;
  countryOfOrigin?: string;
  licenseExpiryDate?: string;
  isForeignLicense?: boolean;
  idCardNumber?: string;
  idCardExpiryDate?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  agencyId: string;
  agency?: {
    id: string;
    name: string;
    company?: {
      id: string;
      name: string;
    };
  };
  _count?: {
    bookings: number;
  };
}

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agencyId: string;
  dateOfBirth?: string;
  address?: string;
  licenseNumber?: string;
  licenseImageUrl?: string;
  isMoroccan?: boolean;
  countryOfOrigin?: string;
  licenseExpiryDate?: string;
  isForeignLicense?: boolean;
  idCardNumber?: string;
  idCardExpiryDate?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
}

export interface UpdateClientDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  licenseNumber?: string;
  licenseImageUrl?: string;
  isMoroccan?: boolean;
  countryOfOrigin?: string;
  licenseExpiryDate?: string;
  isForeignLicense?: boolean;
  idCardNumber?: string;
  idCardExpiryDate?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
}

export const clientApi = {
  getAll: async (agencyId?: string): Promise<Client[]> => {
    const params = agencyId ? { agencyId } : {};
    const { data } = await apiClient.get<Client[]>('/clients', { params });
    return data;
  },

  getById: async (id: string): Promise<Client> => {
    const { data } = await apiClient.get<Client>(`/clients/${id}`);
    return data;
  },

  create: async (dto: CreateClientDto): Promise<Client> => {
    const { data } = await apiClient.post<Client>('/clients', dto);
    return data;
  },

  update: async (id: string, dto: UpdateClientDto): Promise<Client> => {
    const { data } = await apiClient.patch<Client>(`/clients/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },

  uploadLicenseImage: async (file: File): Promise<{ imageUrl: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const { data } = await apiClient.post<{ imageUrl: string; filename: string }>(
      '/clients/upload-license',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
};


