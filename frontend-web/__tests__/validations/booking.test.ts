import { describe, it, expect } from 'vitest';
import { createBookingSchema, updateBookingSchema } from '@/lib/validations/booking';

describe('Booking validations', () => {
  describe('createBookingSchema', () => {
    it('should validate a valid booking', () => {
      const validData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
        clientId: 'client-123',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        totalAmount: 500,
        status: 'CONFIRMED',
      };

      const result = createBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require agencyId', () => {
      const invalidData = {
        vehicleId: 'vehicle-123',
        clientId: 'client-123',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require vehicleId', () => {
      const invalidData = {
        agencyId: 'agency-123',
        clientId: 'client-123',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require clientId', () => {
      const invalidData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require startDate', () => {
      const invalidData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
        clientId: 'client-123',
        endDate: '2024-01-05',
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require endDate', () => {
      const invalidData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
        clientId: 'client-123',
        startDate: '2024-01-01',
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate that endDate is after startDate', () => {
      const invalidData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
        clientId: 'client-123',
        startDate: '2024-01-05',
        endDate: '2024-01-01',
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('La date de fin doit être après la date de début');
      }
    });

    it('should validate totalAmount is positive', () => {
      const invalidData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
        clientId: 'client-123',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        totalAmount: -100,
      };

      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid status enum values', () => {
      const statuses = ['DRAFT', 'PENDING', 'CONFIRMED'];
      
      statuses.forEach(status => {
        const data = {
          agencyId: 'agency-123',
          vehicleId: 'vehicle-123',
          clientId: 'client-123',
          startDate: '2024-01-01',
          endDate: '2024-01-05',
          status,
        };
        const result = createBookingSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateBookingSchema', () => {
    it('should validate a valid update', () => {
      const validData = {
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        totalAmount: 500,
        status: 'IN_PROGRESS',
      };

      const result = updateBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        status: 'RETURNED',
      };

      const result = updateBookingSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should validate that endDate is after startDate when both provided', () => {
      const invalidData = {
        startDate: '2024-01-05',
        endDate: '2024-01-01',
      };

      const result = updateBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid status enum values', () => {
      const statuses = ['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'RETURNED', 'CANCELLED', 'LATE', 'NO_SHOW'];
      
      statuses.forEach(status => {
        const data = { status };
        const result = updateBookingSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});


