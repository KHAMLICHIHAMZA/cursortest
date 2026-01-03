import { describe, it, expect } from 'vitest';
import { createFineSchema, updateFineSchema } from '@/lib/validations/fine';

describe('Fine validations', () => {
  describe('createFineSchema', () => {
    it('should validate a valid fine', () => {
      const validData = {
        agencyId: 'agency-123',
        bookingId: 'booking-123',
        amount: 150.50,
        description: 'Amende stationnement',
      };

      const result = createFineSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require agencyId', () => {
      const invalidData = {
        bookingId: 'booking-123',
        amount: 150,
        description: 'Amende',
      };

      const result = createFineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require bookingId', () => {
      const invalidData = {
        agencyId: 'agency-123',
        amount: 150,
        description: 'Amende',
      };

      const result = createFineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require amount', () => {
      const invalidData = {
        agencyId: 'agency-123',
        bookingId: 'booking-123',
        description: 'Amende',
      };

      const result = createFineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate amount is greater than 0', () => {
      const invalidData = {
        agencyId: 'agency-123',
        bookingId: 'booking-123',
        amount: 0,
        description: 'Amende',
      };

      const result = createFineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require description', () => {
      const invalidData = {
        agencyId: 'agency-123',
        bookingId: 'booking-123',
        amount: 150,
      };

      const result = createFineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateFineSchema', () => {
    it('should validate a valid update', () => {
      const validData = {
        amount: 200,
        description: 'Amende mise à jour',
        isPaid: true,
      };

      const result = updateFineSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        isPaid: true,
      };

      const result = updateFineSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should validate amount when provided', () => {
      const invalidData = {
        amount: 0,
      };

      const result = updateFineSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});


