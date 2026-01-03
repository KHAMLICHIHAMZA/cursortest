import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema } from '@/lib/validations/user';

describe('User validations', () => {
  describe('createUserSchema', () => {
    it('should validate a valid user', () => {
      const validData = {
        email: 'user@test.com',
        name: 'Test User',
        role: 'AGENCY_MANAGER',
        companyId: 'company-123',
        agencyIds: ['agency-1', 'agency-2'],
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const invalidData = {
        name: 'Test User',
        role: 'AGENCY_MANAGER',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod returns "Required" when field is missing, or custom message when invalid format
        const errorMessage = result.error.errors[0].message;
        expect(errorMessage === 'Required' || errorMessage === 'Email invalide').toBe(true);
      }
    });

    it('should validate email format', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Test User',
        role: 'AGENCY_MANAGER',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email invalide');
      }
    });

    it('should require name', () => {
      const invalidData = {
        email: 'user@test.com',
        role: 'AGENCY_MANAGER',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod returns "Required" when field is missing, or custom message when empty string
        const errorMessage = result.error.errors[0].message;
        expect(errorMessage === 'Required' || errorMessage === 'Le nom est requis').toBe(true);
      }
    });

    it('should require role', () => {
      const invalidData = {
        email: 'user@test.com',
        name: 'Test User',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate role enum', () => {
      const invalidData = {
        email: 'user@test.com',
        name: 'Test User',
        role: 'INVALID_ROLE',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid roles', () => {
      const roles = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT'];
      
      roles.forEach(role => {
        const data = {
          email: 'user@test.com',
          name: 'Test User',
          role,
        };
        const result = createUserSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should accept optional companyId and agencyIds', () => {
      const minimalData = {
        email: 'user@test.com',
        name: 'Test User',
        role: 'AGENCY_MANAGER',
      };

      const result = createUserSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateUserSchema', () => {
    it('should validate a valid update', () => {
      const validData = {
        name: 'Updated User',
        role: 'COMPANY_ADMIN',
        isActive: true,
        agencyIds: ['agency-1'],
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        name: 'Updated User',
      };

      const result = updateUserSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const emptyData = {};

      const result = updateUserSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it('should validate name when provided', () => {
      const invalidData = {
        name: '',
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Le nom est requis');
      }
    });

    it('should validate role enum when provided', () => {
      const invalidData = {
        role: 'INVALID_ROLE',
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

