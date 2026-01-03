import { bookingService } from '../booking.service';
import api from '../api';
import { syncService } from '../sync.service';
import { offlineService } from '../offline.service';

jest.mock('../api');
jest.mock('../sync.service');
jest.mock('../offline.service');

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBookings', () => {
    it('should fetch and map booking statuses correctly', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          status: 'IN_PROGRESS',
          price: 100,
          startDate: '2024-01-01',
          endDate: '2024-01-02',
        },
        {
          id: 'booking-2',
          status: 'RETURNED',
          price: 200,
          startDate: '2024-01-03',
          endDate: '2024-01-04',
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({ data: mockBookings });

      const result = await bookingService.getBookings();

      expect(result[0].status).toBe('ACTIVE'); // IN_PROGRESS → ACTIVE
      expect(result[1].status).toBe('COMPLETED'); // RETURNED → COMPLETED
    });
  });

  describe('createBooking', () => {
    it('should create booking when online', async () => {
      (syncService.isOnline as jest.Mock).mockResolvedValue(true);
      (api.post as jest.Mock).mockResolvedValue({
        data: { id: 'booking-1', status: 'PENDING' },
      });

      const result = await bookingService.createBooking({
        agencyId: 'agency-1',
        clientId: 'client-1',
        vehicleId: 'vehicle-1',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-02T00:00:00Z',
      });

      expect(result.id).toBe('booking-1');
      expect(api.post).toHaveBeenCalled();
    });

    it('should queue booking when offline', async () => {
      (syncService.isOnline as jest.Mock).mockResolvedValue(false);
      (offlineService.addAction as jest.Mock).mockResolvedValue('action-id');

      await expect(
        bookingService.createBooking({
          agencyId: 'agency-1',
          clientId: 'client-1',
          vehicleId: 'vehicle-1',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-02T00:00:00Z',
        })
      ).rejects.toThrow('OFFLINE_QUEUED');

      expect(offlineService.addAction).toHaveBeenCalledWith(
        'BOOKING_CREATE',
        expect.any(Object)
      );
    });
  });

  describe('checkIn', () => {
    it('should upload files before check-in', async () => {
      (syncService.isOnline as jest.Mock).mockResolvedValue(true);
      (syncService.uploadFile as jest.Mock).mockResolvedValue('http://uploaded.jpg');
      (api.post as jest.Mock).mockResolvedValue({
        data: { id: 'booking-1', status: 'IN_PROGRESS' },
      });

      await bookingService.checkIn({
        bookingId: 'booking-1',
        odometerStart: 1000,
        fuelLevelStart: 'FULL',
        photosBefore: ['file://photo1.jpg', 'file://photo2.jpg'],
        driverLicensePhoto: 'file://license.jpg',
        driverLicenseExpiry: '2025-12-31',
        signature: 'base64-signature',
      });

      expect(syncService.uploadFile).toHaveBeenCalledTimes(3); // 2 photos + license
      expect(api.post).toHaveBeenCalledWith(
        '/bookings/booking-1/checkin',
        expect.objectContaining({
          photosBefore: ['http://uploaded.jpg', 'http://uploaded.jpg'],
          driverLicensePhoto: 'http://uploaded.jpg',
        })
      );
    });
  });
});

