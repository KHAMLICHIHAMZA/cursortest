/**
 * Booking Service - Service de gestion des réservations
 * 
 * IMPORTANT (Spécifications MALOC) :
 * - Ce service fait des appels API uniquement (pas de logique métier lourde)
 * - Toute logique métier est dans le backend
 * - Le mobile est un outil d'exécution terrain
 * - Support offline : queue SQLite pour actions différées
 * 
 * Conformité : SPECIFICATIONS_FONCTIONNELLES.md
 */

import api from './api';
import { Booking, CreateBookingInput, CheckInInput, CheckOutInput, BookingStatus } from '../types';
import { offlineService } from './offline.service';
import { syncService } from './sync.service';

// Helper to map backend status to mobile status
const mapBookingStatus = (status: string): BookingStatus => {
  const statusMap: Record<string, BookingStatus> = {
    'IN_PROGRESS': 'ACTIVE',
    'RETURNED': 'COMPLETED',
    'COMPLETED': 'COMPLETED', // Backend might return COMPLETED directly
  };
  return (statusMap[status] || status) as BookingStatus;
};

export const bookingService = {
  async getBookings(agencyId?: string): Promise<Booking[]> {
    // Si agencyId n'est pas fourni, ne pas l'envoyer en paramètre
    // Le backend filtrera automatiquement par user.agencyIds du token JWT
    const params = agencyId ? { agencyId } : {};
    const response = await api.get<any[]>('/bookings', { params });
    
    // Log pour debug
    console.log('🔍 API Response - Nombre de réservations:', response.data?.length || 0);
    
    // Map backend statuses to mobile statuses and totalPrice to price
    return response.data.map((booking) => ({
      ...booking,
      price: booking.totalPrice || booking.price || 0,
      status: mapBookingStatus(booking.status),
    }));
  },

  async getBooking(id: string): Promise<Booking & { client?: any; vehicle?: any }> {
    const response = await api.get<any>(`/bookings/${id}`);
    // Map backend status to mobile status and totalPrice to price
    return {
      ...response.data,
      price: response.data.totalPrice || response.data.price || 0,
      status: mapBookingStatus(response.data.status),
      client: response.data.client,
      vehicle: response.data.vehicle,
    };
  },

  async createBooking(data: CreateBookingInput): Promise<Booking> {
    const isOnline = await syncService.isOnline();

    if (isOnline) {
      try {
        const response = await api.post<any>('/bookings', data);
        // Map backend response to mobile format
        return {
          ...response.data,
          price: response.data.totalPrice || response.data.price || 0,
          status: mapBookingStatus(response.data.status),
        } as Booking;
      } catch (error) {
        // If online request fails, queue it
        await offlineService.addAction('BOOKING_CREATE', data);
        throw error;
      }
    } else {
      // Queue for offline sync
      await offlineService.addAction('BOOKING_CREATE', data);
      throw new Error('OFFLINE_QUEUED');
    }
  },

  async checkIn(data: CheckInInput): Promise<Booking> {
    const isOnline = await syncService.isOnline();

    if (isOnline) {
      try {
        // Upload files first
        const uploadedPhotosBefore = await Promise.all(
          data.photosBefore.map(async (uri) => {
            if (uri.startsWith('http')) return uri; // Already uploaded
            return await syncService.uploadFile(uri);
          })
        );

        const uploadedDriverLicense = data.driverLicensePhoto.startsWith('http')
          ? data.driverLicensePhoto
          : await syncService.uploadFile(data.driverLicensePhoto);

        const uploadedIdentityDoc = data.identityDocument && !data.identityDocument.startsWith('http')
          ? await syncService.uploadFile(data.identityDocument)
          : data.identityDocument;

        const uploadedDepositDoc = data.depositDocument && !data.depositDocument.startsWith('http')
          ? await syncService.uploadFile(data.depositDocument)
          : data.depositDocument;

        // Prepare payload with uploaded URLs
        const payload = {
          ...data,
          photosBefore: uploadedPhotosBefore,
          driverLicensePhoto: uploadedDriverLicense,
          identityDocument: uploadedIdentityDoc,
          depositDocument: uploadedDepositDoc,
        };

        const response = await api.post<any>(
          `/bookings/${data.bookingId}/checkin`,
          payload
        );
        
        // Map backend status (IN_PROGRESS) to mobile status (ACTIVE) and totalPrice to price
        const booking = {
          ...response.data,
          price: response.data.totalPrice || response.data.price || 0,
          status: mapBookingStatus(response.data.status),
        };
        
        return booking as Booking;
      } catch (error) {
        // If online request fails, queue it
        const files = [
          ...data.photosBefore,
          data.driverLicensePhoto,
          ...(data.identityDocument ? [data.identityDocument] : []),
          ...(data.depositDocument ? [data.depositDocument] : []),
        ];
        await offlineService.addAction('BOOKING_CHECKIN', data, files);
        throw error;
      }
    } else {
      // Queue for offline sync
      const files = [
        ...data.photosBefore,
        data.driverLicensePhoto,
        ...(data.identityDocument ? [data.identityDocument] : []),
        ...(data.depositDocument ? [data.depositDocument] : []),
      ];
      await offlineService.addAction('BOOKING_CHECKIN', data, files);
      throw new Error('OFFLINE_QUEUED');
    }
  },

  async checkOut(data: CheckOutInput): Promise<Booking> {
    const isOnline = await syncService.isOnline();

    if (isOnline) {
      try {
        // Upload files first
        const uploadedPhotosAfter = await Promise.all(
          data.photosAfter.map(async (uri) => {
            if (uri.startsWith('http')) return uri; // Already uploaded
            return await syncService.uploadFile(uri);
          })
        );

        const uploadedCashReceipt = data.cashReceipt && !data.cashReceipt.startsWith('http')
          ? await syncService.uploadFile(data.cashReceipt)
          : data.cashReceipt;

        // Upload damage photos if any
        const uploadedNewDamages = data.newDamages
          ? await Promise.all(
              data.newDamages.map(async (damage) => ({
                ...damage,
                photos: await Promise.all(
                  damage.photos.map(async (uri) => {
                    if (uri.startsWith('http')) return uri;
                    return await syncService.uploadFile(uri);
                  })
                ),
              }))
            )
          : undefined;

        // Prepare payload with uploaded URLs
        const payload = {
          ...data,
          photosAfter: uploadedPhotosAfter,
          cashReceipt: uploadedCashReceipt,
          newDamages: uploadedNewDamages,
        };

        const response = await api.post<any>(
          `/bookings/${data.bookingId}/checkout`,
          payload
        );
        
        // Map backend status (RETURNED) to mobile status (COMPLETED) and totalPrice to price
        const booking = {
          ...response.data,
          price: response.data.totalPrice || response.data.price || 0,
          status: mapBookingStatus(response.data.status),
        };
        
        return booking as Booking;
      } catch (error) {
        // If online request fails, queue it
        const files = [
          ...data.photosAfter,
          ...(data.cashReceipt ? [data.cashReceipt] : []),
        ];
        await offlineService.addAction('BOOKING_CHECKOUT', data, files);
        throw error;
      }
    } else {
      // Queue for offline sync
      const files = [
        ...data.photosAfter,
        ...(data.cashReceipt ? [data.cashReceipt] : []),
      ];
      await offlineService.addAction('BOOKING_CHECKOUT', data, files);
      throw new Error('OFFLINE_QUEUED');
    }
  },
};

