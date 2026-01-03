import { describe, it, expect } from 'vitest';
import { createAgencySchema, updateAgencySchema } from '@/lib/validations/agency';

describe('Agency validations', () => {
  describe('createAgencySchema', () => {
    it('should validate a valid agency', () => {
      const validData = {
        name: 'Test Agency',
        phone: '+33123456789',
        address: '123 Test Street',
        companyId: 'company-123',
      };

      const result = createAgencySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const invalidData = {
        phone: '+33123456789',
        companyId: 'company-123',
      };

      const result = createAgencySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod returns "Required" when field is missing, or custom message when empty string
        const errorMessage = result.error.errors[0].message;
        expect(errorMessage === 'Required' || errorMessage === 'Le nom est requis').toBe(true);
      }
    });

    it('should require companyId', () => {
      const invalidData = {
        name: 'Test Agency',
        phone: '+33123456789',
      };

      const result = createAgencySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod returns "Required" when field is missing, or custom message when empty string
        const errorMessage = result.error.errors[0].message;
        expect(errorMessage === 'Required' || errorMessage === "L'entreprise est requise").toBe(true);
      }
    });

    it('should accept optional phone and address', () => {
      const minimalData = {
        name: 'Test Agency',
        companyId: 'company-123',
      };

      const result = createAgencySchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateAgencySchema', () => {
    it('should validate a valid update', () => {
      const validData = {
        name: 'Updated Agency',
        phone: '+33987654321',
        address: '456 Updated Street',
        companyId: 'company-456',
      };

      const result = updateAgencySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        name: 'Updated Agency',
      };

      const result = updateAgencySchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const emptyData = {};

      const result = updateAgencySchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it('should validate name when provided', () => {
      const invalidData = {
        name: '',
      };

      const result = updateAgencySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Le nom est requis');
      }
    });
  });
});

