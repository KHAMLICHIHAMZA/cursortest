import { describe, it, expect } from 'vitest';
import { createVehicleSchema, updateVehicleSchema } from '@/lib/validations/vehicle';

describe('Vehicle validations', () => {
  describe('createVehicleSchema', () => {
    it('should validate a valid vehicle', () => {
      const validData = {
        brand: 'Toyota',
        model: 'Corolla',
        registrationNumber: 'AB-123-CD',
        agencyId: 'agency-123',
        year: 2020,
        color: 'Rouge',
        dailyRate: 50,
        status: 'AVAILABLE',
        imageUrl: '/uploads/vehicles/image.jpg',
      };

      const result = createVehicleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require brand', () => {
      const invalidData = {
        model: 'Corolla',
        registrationNumber: 'AB-123-CD',
        agencyId: 'agency-123',
      };

      const result = createVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require model', () => {
      const invalidData = {
        brand: 'Toyota',
        registrationNumber: 'AB-123-CD',
        agencyId: 'agency-123',
      };

      const result = createVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require registrationNumber', () => {
      const invalidData = {
        brand: 'Toyota',
        model: 'Corolla',
        agencyId: 'agency-123',
      };

      const result = createVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require agencyId', () => {
      const invalidData = {
        brand: 'Toyota',
        model: 'Corolla',
        registrationNumber: 'AB-123-CD',
      };

      const result = createVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate year range', () => {
      const invalidData = {
        brand: 'Toyota',
        model: 'Corolla',
        registrationNumber: 'AB-123-CD',
        agencyId: 'agency-123',
        year: 1800,
      };

      const result = createVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate dailyRate is positive', () => {
      const invalidData = {
        brand: 'Toyota',
        model: 'Corolla',
        registrationNumber: 'AB-123-CD',
        agencyId: 'agency-123',
        dailyRate: -50,
      };

      const result = createVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid status enum values', () => {
      const statuses = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE'];
      
      statuses.forEach(status => {
        const data = {
          brand: 'Toyota',
          model: 'Corolla',
          registrationNumber: 'AB-123-CD',
          agencyId: 'agency-123',
          status,
        };
        const result = createVehicleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate imageUrl format', () => {
      const validUrls = [
        'http://example.com/image.jpg',
        'https://example.com/image.jpg',
        '/uploads/vehicles/image.jpg',
        '',
      ];

      validUrls.forEach(url => {
        const data = {
          brand: 'Toyota',
          model: 'Corolla',
          registrationNumber: 'AB-123-CD',
          agencyId: 'agency-123',
          imageUrl: url,
        };
        const result = createVehicleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid imageUrl format', () => {
      const invalidData = {
        brand: 'Toyota',
        model: 'Corolla',
        registrationNumber: 'AB-123-CD',
        agencyId: 'agency-123',
        imageUrl: 'invalid-url',
      };

      const result = createVehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateVehicleSchema', () => {
    it('should validate a valid update', () => {
      const validData = {
        brand: 'Honda',
        dailyRate: 60,
        status: 'RENTED',
      };

      const result = updateVehicleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        status: 'AVAILABLE',
      };

      const result = updateVehicleSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const emptyData = {};

      const result = updateVehicleSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });
  });
});


