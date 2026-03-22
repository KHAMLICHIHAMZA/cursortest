import { apiClient } from './client';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  year?: number;
  color?: string;
  dailyRate?: number;
  depositAmount?: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';
  agencyId: string;
  imageUrl?: string;
  horsepower?: number;
  fuel?: string;
  gearbox?: string;
  purchasePrice?: number;
  acquisitionDate?: string;
  amortizationYears?: number;
  financingType?: string;
  downPayment?: number;
  monthlyPayment?: number;
  financingDurationMonths?: number;
  creditStartDate?: string;
  gpsTrackerId?: string;
  gpsTrackerLabel?: string;
  maintenanceAlertIntervalKm?: number;
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
    maintenance: number;
  };
}

export interface CreateVehicleDto {
  brand: string;
  model: string;
  registrationNumber: string;
  agencyId: string;
  year?: number;
  color?: string;
  dailyRate?: number;
  depositAmount?: number;
  status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';
  imageUrl?: string;
  horsepower?: number;
  fuel?: string;
  gearbox?: string;
  purchasePrice?: number;
  acquisitionDate?: string;
  amortizationYears?: number;
  financingType?: string;
  downPayment?: number;
  monthlyPayment?: number;
  financingDurationMonths?: number;
  creditStartDate?: string;
  maintenanceAlertIntervalKm?: number;
}

export interface UpdateVehicleDto {
  agencyId?: string;
  brand?: string;
  model?: string;
  registrationNumber?: string;
  year?: number;
  color?: string;
  dailyRate?: number;
  depositAmount?: number;
  status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';
  imageUrl?: string;
  horsepower?: number;
  fuel?: string;
  gearbox?: string;
  purchasePrice?: number;
  acquisitionDate?: string;
  amortizationYears?: number;
  financingType?: string;
  downPayment?: number;
  monthlyPayment?: number;
  financingDurationMonths?: number;
  creditStartDate?: string;
  maintenanceAlertIntervalKm?: number;
}

export const vehicleApi = {
  getAll: async (agencyId?: string): Promise<Vehicle[]> => {
    const params = agencyId ? { agencyId } : {};
    const { data } = await apiClient.get<Vehicle[]>('/vehicles', { params });
    return data;
  },

  getById: async (id: string): Promise<Vehicle> => {
    const { data } = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return data;
  },

  create: async (dto: CreateVehicleDto): Promise<Vehicle> => {
    const { data } = await apiClient.post<Vehicle>('/vehicles', dto);
    return data;
  },

  update: async (id: string, dto: UpdateVehicleDto): Promise<Vehicle> => {
    const { data } = await apiClient.patch<Vehicle>(`/vehicles/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  },

  // Recherche de marques
  searchBrands: async (query: string): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>(`/vehicles/search/brands?q=${encodeURIComponent(query)}`);
    return data;
  },

  // Recherche de modèles
  searchModels: async (brand: string, query?: string): Promise<any[]> => {
    const params = new URLSearchParams({ brand });
    if (query) params.append('q', query);
    const { data } = await apiClient.get<any[]>(`/vehicles/search/models?${params.toString()}`);
    return data;
  },

  // Recherche complète
  searchVehicles: async (brandQuery?: string, modelQuery?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (brandQuery) params.append('brand', brandQuery);
    if (modelQuery) params.append('model', modelQuery);
    const { data } = await apiClient.get<any[]>(`/vehicles/search?${params.toString()}`);
    return data;
  },

  // Upload d'image
  uploadImage: async (file: File): Promise<{ imageUrl: string; filename: string }> => {
    // Validation côté client avant l'upload
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(
        `Fichier trop volumineux: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 5MB`,
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non supporté: ${file.type}`);
    }

    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const { data } = await apiClient.post<{ imageUrl: string; filename: string }>(
        '/vehicles/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 secondes timeout
        },
      );
      return data;
    } catch (error: any) {
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           `Erreur serveur: ${error.response.status} ${error.response.statusText}`;
        
        const detailedError = new Error(errorMessage);
        (detailedError as any).status = error.response.status;
        (detailedError as any).response = error.response.data;
        throw detailedError;
      } else if (error.request) {
        throw new Error('Aucune réponse du serveur. Vérifiez votre connexion internet.');
      } else {
        throw new Error(`Erreur de configuration: ${error.message}`);
      }
    }
  },
};

