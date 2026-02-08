import { apiService } from './api.service';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface GpsSnapshot {
  id: string;
  agencyId: string;
  bookingId: string | null;
  vehicleId: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  reason: 'CHECK_IN' | 'CHECK_OUT' | 'INCIDENT' | 'MANUAL';
  isGpsMissing: boolean;
  gpsMissingReason: string | null;
  mileage: number | null;
  createdAt: string;
}

export interface CaptureGpsInput {
  agencyId: string;
  bookingId?: string;
  vehicleId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  reason: 'CHECK_IN' | 'CHECK_OUT' | 'INCIDENT' | 'MANUAL';
  deviceInfo?: string;
  mileage?: number;
}

export interface GpsMissingInput {
  agencyId: string;
  bookingId?: string;
  vehicleId?: string;
  reason: 'CHECK_IN' | 'CHECK_OUT' | 'INCIDENT' | 'MANUAL';
  gpsMissingReason: 'permissionDenied' | 'offline' | 'deviceUnsupported';
  mileage?: number;
}

class GpsService {
  /**
   * Request location permission and get current position
   */
  async getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
  } | null> {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Capture GPS snapshot and send to backend
   */
  async captureSnapshot(
    data: Omit<CaptureGpsInput, 'latitude' | 'longitude' | 'accuracy' | 'altitude'> & {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      altitude?: number;
    },
  ): Promise<GpsSnapshot | { isMissing: true; reason: string }> {
    // Try to get current position if not provided
    let position = data.latitude && data.longitude
      ? { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy || null, altitude: data.altitude || null }
      : await this.getCurrentPosition();

    if (!position) {
      // Record GPS missing
      const response = await apiService.post('/gps/missing', {
        agencyId: data.agencyId,
        bookingId: data.bookingId,
        vehicleId: data.vehicleId,
        reason: data.reason,
        gpsMissingReason: 'permissionDenied',
        mileage: data.mileage,
      });
      return { isMissing: true, reason: 'permissionDenied' };
    }

    const response = await apiService.post('/gps', {
      ...data,
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      altitude: position.altitude,
      deviceInfo: `${Platform.OS} ${Platform.Version}`,
    });
    return response.data;
  }

  /**
   * Get GPS snapshots for a booking
   */
  async getByBooking(bookingId: string): Promise<GpsSnapshot[]> {
    const response = await apiService.get(`/gps/booking/${bookingId}`);
    return response.data;
  }

  /**
   * Record GPS missing (when location is unavailable)
   */
  async recordMissing(data: GpsMissingInput): Promise<GpsSnapshot> {
    const response = await apiService.post('/gps/missing', data);
    return response.data;
  }
}

export const gpsService = new GpsService();
