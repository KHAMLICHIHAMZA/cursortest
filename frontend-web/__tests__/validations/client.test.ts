import { describe, it, expect } from 'vitest';
import { createClientSchema, updateClientSchema } from '@/lib/validations/client';

describe('Client validations', () => {
  describe('createClientSchema', () => {
    it('should validate a valid client', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+33123456789',
        agencyId: 'agency-123',
        dateOfBirth: '1990-01-01',
        address: '123 Test Street',
        licenseNumber: '123456789',
        isMoroccan: true,
      };

      const result = createClientSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require firstName', () => {
      const invalidData = {
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+33123456789',
        agencyId: 'agency-123',
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require lastName', () => {
      const invalidData = {
        firstName: 'John',
        email: 'john.doe@example.com',
        phone: '+33123456789',
        agencyId: 'agency-123',
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require email', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33123456789',
        agencyId: 'agency-123',
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '+33123456789',
        agencyId: 'agency-123',
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require phone', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        agencyId: 'agency-123',
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require agencyId', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+33123456789',
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate dateOfBirth is in the past', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+33123456789',
        agencyId: 'agency-123',
        dateOfBirth: tomorrow.toISOString().split('T')[0],
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate licenseExpiryDate is in the future', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+33123456789',
        agencyId: 'agency-123',
        licenseExpiryDate: yesterday.toISOString().split('T')[0],
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate licenseImageUrl format', () => {
      const validUrls = [
        'http://example.com/image.jpg',
        'https://example.com/image.jpg',
        '/uploads/license.jpg',
        '',
      ];

      validUrls.forEach(url => {
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+33123456789',
          agencyId: 'agency-123',
          licenseImageUrl: url,
        };
        const result = createClientSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate max length constraints', () => {
      const invalidData = {
        firstName: 'A'.repeat(101), // Exceeds max length
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+33123456789',
        agencyId: 'agency-123',
      };

      const result = createClientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateClientSchema', () => {
    it('should validate a valid update', () => {
      const validData = {
        firstName: 'Jane',
        phone: '+33987654321',
      };

      const result = updateClientSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        email: 'newemail@example.com',
      };

      const result = updateClientSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const emptyData = {};

      const result = updateClientSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });
  });
});


