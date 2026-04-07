import { apiClient } from './client';

export interface Booking {
  id: string;
  agencyId: string;
  vehicleId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  totalAmount?: number;
  totalPrice?: number; // Alias for totalAmount
  status: string;
  bookingNumber?: string;
  // Champs caution (R3)
  depositRequired?: boolean;
  depositAmount?: number;
  depositDecisionSource?: 'COMPANY' | 'AGENCY';
  depositStatusCheckIn?: 'PENDING' | 'COLLECTED';
  depositStatusFinal?: 'REFUNDED' | 'PARTIAL' | 'FORFEITED' | 'DISPUTED';
  // Frais de retard (R4)
  lateFeeAmount?: number;
  lateFeeCalculatedAt?: string;
  lateFeeOverride?: boolean;
  lateFeeOverrideJustification?: string;
  // Temps de préparation (R2.2)
  computedEndWithPreparation?: string;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    registrationNumber: string;
    dailyRate?: number;
    mileage?: number;
  };
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    licenseExpiryDate?: string;
  };
  agency?: {
    id: string;
    name: string;
    preparationTimeMinutes?: number;
  };
  /** Pièces liées à la réservation (check-in / check-out, etc.) — renvoyées par GET /bookings/:id */
  documents?: Array<{
    id: string;
    type: string;
    title: string;
    description?: string | null;
    url: string;
    key: string;
    mimeType?: string | null;
  }>;
}

export interface CreateBookingDto {
  agencyId: string;
  vehicleId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  totalAmount?: number;
  totalPrice?: number; // Alias for totalAmount
  status?: string;
  // Champs caution (R3)
  depositRequired?: boolean;
  depositAmount?: number;
  depositDecisionSource?: 'COMPANY' | 'AGENCY';
}

export interface PaginatedBookingsResponse {
  items: Booking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type BookingFuelLevel =
  | 'EMPTY'
  | 'QUARTER'
  | 'HALF'
  | 'THREE_QUARTERS'
  | 'FULL';

export type TerrainDamageZone =
  | 'FRONT'
  | 'REAR'
  | 'LEFT'
  | 'RIGHT'
  | 'ROOF'
  | 'INTERIOR'
  | 'WHEELS'
  | 'WINDOWS';

export type TerrainDamageType =
  | 'SCRATCH'
  | 'DENT'
  | 'BROKEN'
  | 'PAINT'
  | 'GLASS'
  | 'OTHER';

export type TerrainDamageSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export const TERRAIN_DAMAGE_ZONES: TerrainDamageZone[] = [
  'FRONT',
  'REAR',
  'LEFT',
  'RIGHT',
  'ROOF',
  'INTERIOR',
  'WHEELS',
  'WINDOWS',
];

export const TERRAIN_DAMAGE_TYPES: TerrainDamageType[] = [
  'SCRATCH',
  'DENT',
  'BROKEN',
  'PAINT',
  'GLASS',
  'OTHER',
];

export const TERRAIN_DAMAGE_SEVERITIES: TerrainDamageSeverity[] = ['LOW', 'MEDIUM', 'HIGH'];

/** Aligné sur le DTO backend DamageDto (check-in / check-out). */
export interface TerrainDamagePayload {
  zone: TerrainDamageZone;
  type: TerrainDamageType;
  severity: TerrainDamageSeverity;
  description?: string;
  photos: string[];
}

export interface CheckInPayload {
  odometerStart: number;
  fuelLevelStart: BookingFuelLevel;
  photosBefore: string[];
  notesStart?: string;
  existingDamages?: TerrainDamagePayload[];
  driverLicensePhoto: string;
  driverLicenseExpiry: string;
  identityDocument?: string;
  extractionStatus?: 'OK' | 'TO_VERIFY';
  depositStatusCheckIn?: 'PENDING' | 'COLLECTED';
  signature: string;
}

export interface CheckOutPayload {
  odometerEnd: number;
  fuelLevelEnd: BookingFuelLevel;
  photosAfter: string[];
  notesEnd?: string;
  newDamages?: TerrainDamagePayload[];
  extraFees?: number;
  lateFee?: number;
  damageFee?: number;
  cashCollected?: boolean;
  cashAmount?: number;
  cashReceipt?: string;
  returnSignature: string;
}

export interface BookingSummary {
  total: number;
  active: number;
  completed: number;
  late: number;
  cancelled: number;
  estimatedRevenue: number;
  topAgencies?: Array<{
    agencyId: string;
    agencyName: string;
    bookings: number;
  }>;
}

export const bookingApi = {
  getAll: async (filters?: any): Promise<Booking[]> => {
    const response = await apiClient.get('/bookings', { params: filters });
    return response.data;
  },

  getLight: async (params?: {
    page?: number;
    pageSize?: number;
    agencyId?: string;
    vehicleId?: string;
    clientId?: string;
    status?: string;
    bookingNumber?: string;
  }): Promise<PaginatedBookingsResponse> => {
    const response = await apiClient.get('/bookings/light', { params });
    return response.data;
  },

  getSummary: async (params?: {
    agencyId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BookingSummary> => {
    const response = await apiClient.get('/bookings/summary', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  create: async (data: CreateBookingDto): Promise<Booking> => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateBookingDto>): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/bookings/${id}`);
  },

  // Override frais de retard (Agency Manager uniquement)
  overrideLateFee: async (id: string, data: { newAmount: number; justification: string }): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${id}/late-fee`, data);
    return response.data;
  },

  // Clôture financière
  financialClosure: async (id: string): Promise<Booking> => {
    const response = await apiClient.post(`/bookings/${id}/financial-closure`);
    return response.data;
  },

  // Génération manuelle de facture (rattrapage)
  generateInvoice: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/invoices/booking/${id}/generate`);
    return response.data;
  },

  /** Départ client (équivalent app agent) — réservation CONFIRMED */
  checkIn: async (id: string, payload: CheckInPayload): Promise<Booking> => {
    const response = await apiClient.post(`/bookings/${id}/checkin`, payload);
    return response.data;
  },

  /** Retour véhicule — réservation IN_PROGRESS ou LATE */
  checkOut: async (id: string, payload: CheckOutPayload): Promise<Booking> => {
    const response = await apiClient.post(`/bookings/${id}/checkout`, payload);
    return response.data;
  },
};



