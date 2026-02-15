import { apiClient } from './client';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  year?: number;
  color?: string;
  dailyRate?: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';
  agencyId: string;
  imageUrl?: string;
  horsepower?: number;
  fuel?: string;
  gearbox?: string;
  gpsTrackerId?: string;
  gpsTrackerLabel?: string;
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
  status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';
  imageUrl?: string;
  horsepower?: number;
  fuel?: string;
  gearbox?: string;
}

export interface UpdateVehicleDto {
  brand?: string;
  model?: string;
  registrationNumber?: string;
  year?: number;
  color?: string;
  dailyRate?: number;
  status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';
  imageUrl?: string;
  horsepower?: number;
  fuel?: string;
  gearbox?: string;
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
    console.log('=== VEHICLE API CREATE ===');
    console.log('DTO to send:', JSON.stringify(dto, null, 2));
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api');
    console.log('Endpoint: POST /vehicles');
    
    try {
      const { data, status, statusText } = await apiClient.post<Vehicle>('/vehicles', dto);
      console.log('=== VEHICLE CREATE SUCCESS ===');
      console.log('Response status:', status, statusText);
      console.log('Response data:', data);
      return data;
    } catch (error: any) {
      console.error('=== VEHICLE CREATE ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      
      throw error;
    }
  },

  update: async (id: string, dto: UpdateVehicleDto): Promise<Vehicle> => {
    console.log('=== VEHICLE API UPDATE ===');
    console.log('Vehicle ID:', id);
    console.log('DTO to send:', JSON.stringify(dto, null, 2));
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api');
    console.log('Endpoint: PATCH /vehicles/' + id);
    
    try {
      const { data, status, statusText } = await apiClient.patch<Vehicle>(`/vehicles/${id}`, dto);
      console.log('=== VEHICLE UPDATE SUCCESS ===');
      console.log('Response status:', status, statusText);
      console.log('Response data:', data);
      return data;
    } catch (error: any) {
      console.error('=== VEHICLE UPDATE ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      
      throw error;
    }
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
    console.log('=== IMAGE UPLOAD START ===');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      lastModified: new Date(file.lastModified).toISOString(),
    });

    // Validation côté client avant l'upload
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const error = new Error(`Fichier trop volumineux: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 5MB`);
      console.error('Validation error:', error);
      throw error;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const error = new Error(`Type de fichier non supporté: ${file.type}`);
      console.error('Validation error:', error);
      throw error;
    }

    const formData = new FormData();
    formData.append('image', file);
    
    console.log('FormData created, sending request...');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api');
    console.log('Endpoint: /vehicles/upload-image');
    
    try {
      const startTime = Date.now();
      const { data, status, statusText } = await apiClient.post<{ imageUrl: string; filename: string }>(
        '/vehicles/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 secondes timeout
        },
      );
      const duration = Date.now() - startTime;
      
      console.log('=== IMAGE UPLOAD SUCCESS ===');
      console.log('Response status:', status, statusText);
      console.log('Response data:', data);
      console.log('Upload duration:', duration, 'ms');
      console.log('Image URL:', data.imageUrl);
      console.log('Filename:', data.filename);
      
      return data;
    } catch (error: any) {
      console.error('=== IMAGE UPLOAD ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        // Erreur de réponse du serveur
        console.error('Response status:', error.response.status);
        console.error('Response status text:', error.response.statusText);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
        
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           `Erreur serveur: ${error.response.status} ${error.response.statusText}`;
        
        const detailedError = new Error(errorMessage);
        (detailedError as any).status = error.response.status;
        (detailedError as any).response = error.response.data;
        throw detailedError;
      } else if (error.request) {
        // Pas de réponse du serveur
        console.error('No response received');
        console.error('Request:', error.request);
        throw new Error('Aucune réponse du serveur. Vérifiez votre connexion internet.');
      } else {
        // Erreur de configuration
        console.error('Request setup error:', error.message);
        throw new Error(`Erreur de configuration: ${error.message}`);
      }
    }
  },
};

