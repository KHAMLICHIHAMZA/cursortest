import { apiClient } from './client';

export type GpsSnapshotReason = 'CHECK_IN' | 'CHECK_OUT' | 'INCIDENT' | 'MANUAL';
export type GpsMissingReason = 'permissionDenied' | 'offline' | 'deviceUnsupported';

export interface GpsSnapshot {
  id: string;
  agencyId: string;
  bookingId: string | null;
  vehicleId: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  reason: GpsSnapshotReason;
  capturedByUserId: string | null;
  capturedByRole: string | null;
  isGpsMissing: boolean;
  gpsMissingReason: string | null;
  deviceInfo: string | null;
  mileage: number | null;
  createdAt: string;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    registrationNumber: string;
    status: string;
  };
  booking?: {
    id: string;
    bookingNumber: string;
    client?: { name: string };
  };
}

export interface CreateGpsSnapshotDto {
  agencyId: string;
  bookingId?: string;
  vehicleId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  reason: GpsSnapshotReason;
  deviceInfo?: string;
  mileage?: number;
}

export interface CreateGpsMissingDto {
  agencyId: string;
  bookingId?: string;
  vehicleId?: string;
  reason: GpsSnapshotReason;
  gpsMissingReason: GpsMissingReason;
  mileage?: number;
}

export interface GpsFilters {
  agencyId?: string;
  reason?: GpsSnapshotReason;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export const gpsApi = {
  getSnapshots: async (filters: GpsFilters = {}): Promise<GpsSnapshot[]> => {
    const params = new URLSearchParams();
    if (filters.agencyId) params.append('agencyId', filters.agencyId);
    if (filters.reason) params.append('reason', filters.reason);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.limit) params.append('limit', String(filters.limit));
    const res = await apiClient.get(`/gps?${params.toString()}`);
    return res.data;
  },

  getVehicleSnapshots: async (vehicleId: string): Promise<GpsSnapshot[]> => {
    const res = await apiClient.get(`/gps/vehicle/${vehicleId}`);
    return res.data;
  },

  getBookingSnapshots: async (bookingId: string): Promise<GpsSnapshot[]> => {
    const res = await apiClient.get(`/gps/booking/${bookingId}`);
    return res.data;
  },

  captureSnapshot: async (data: CreateGpsSnapshotDto): Promise<GpsSnapshot> => {
    const res = await apiClient.post('/gps', data);
    return res.data;
  },

  captureManual: async (data: CreateGpsSnapshotDto): Promise<GpsSnapshot> => {
    const res = await apiClient.post('/gps/manual', data);
    return res.data;
  },

  reportMissing: async (data: CreateGpsMissingDto): Promise<GpsSnapshot> => {
    const res = await apiClient.post('/gps/missing', data);
    return res.data;
  },
};
