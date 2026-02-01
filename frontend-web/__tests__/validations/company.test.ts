import { describe, it, expect } from 'vitest';
import { createCompanySchema, updateCompanySchema } from '@/lib/validations/company';

describe('Company validations', () => {
  describe('createCompanySchema', () => {
    it('should validate a valid company', () => {
      const validData = {
        name: 'Test Company',
        raisonSociale: 'Test Company SARL',
        identifiantLegal: '001234567000089',
        formeJuridique: 'SARL',
        phone: '+33123456789',
        address: '123 Test Street',
        adminEmail: 'admin@test.com',
        adminName: 'Admin Name',
      };

      const result = createCompanySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const invalidData = {
        phone: '+33123456789',
      };

      const result = createCompanySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod returns "Required" when field is missing, or custom message when empty string
        const errorMessage = result.error.errors[0].message;
        expect(errorMessage === 'Required' || errorMessage === 'Le nom est requis').toBe(true);
      }
    });

    it('should validate email format when provided', () => {
      const invalidData = {
        name: 'Test Company',
        raisonSociale: 'Test Company SARL',
        identifiantLegal: '001234567000089',
        formeJuridique: 'SARL',
        adminEmail: 'invalid-email',
      };

      const result = createCompanySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email invalide');
      }
    });

    it('should accept empty email string', () => {
      const validData = {
        name: 'Test Company',
        raisonSociale: 'Test Company SARL',
        identifiantLegal: '001234567000089',
        formeJuridique: 'SARL',
        adminEmail: '',
      };

      const result = createCompanySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const minimalData = {
        name: 'Test Company',
        raisonSociale: 'Test Company SARL',
        identifiantLegal: '001234567000089',
        formeJuridique: 'SARL',
      };

      const result = createCompanySchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateCompanySchema', () => {
    it('should validate a valid update', () => {
      const validData = {
        name: 'Updated Company',
        phone: '+33987654321',
        address: '456 Updated Street',
        isActive: true,
      };

      const result = updateCompanySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        name: 'Updated Company',
      };

      const result = updateCompanySchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should validate name when provided', () => {
      const invalidData = {
        name: '',
      };

      const result = updateCompanySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Le nom est requis');
      }
    });

    it('should allow empty object', () => {
      const emptyData = {};

      const result = updateCompanySchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });
  });
});

