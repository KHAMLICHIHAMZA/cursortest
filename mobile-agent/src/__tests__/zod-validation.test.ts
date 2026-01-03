/**
 * Tests de validation Zod isolés (sans dépendances Expo)
 * Ces tests peuvent s'exécuter même si Expo SDK 54 a des problèmes
 */

import { z } from 'zod';

// Copie du schema de login pour test isolé
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

describe('Zod Validation Tests (Isolated)', () => {
  describe('loginSchema', () => {
    it('should validate correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should accept agent credentials', () => {
      const result = loginSchema.safeParse({
        email: 'agent1@autolocation.fr',
        password: 'agent123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('agent1@autolocation.fr');
        expect(result.data.password).toBe('agent123');
      }
    });
  });

  describe('Email validation patterns', () => {
    const emailSchema = z.string().email();

    it('should accept various valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'agent1@autolocation.fr',
        'user+tag@example.com',
        'test123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user space@example.com',
        '',
      ];

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('Password validation', () => {
    const passwordSchema = z.string().min(8);

    it('should accept passwords with 8+ characters', () => {
      const validPasswords = [
        'password123',
        'agent123',
        'verylongpassword',
        '12345678',
      ];

      validPasswords.forEach((password) => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject passwords shorter than 8 characters', () => {
      const invalidPasswords = [
        'short',
        '1234567',
        '',
        'abc',
      ];

      invalidPasswords.forEach((password) => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('UUID validation', () => {
    const uuidSchema = z.string().uuid();

    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
      ];

      validUUIDs.forEach((uuid) => {
        expect(() => uuidSchema.parse(uuid)).not.toThrow();
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '550e8400-e29b-41d4-a716-44665544000',
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(() => uuidSchema.parse(uuid)).toThrow();
      });
    });
  });

  describe('Date validation', () => {
    const dateSchema = z.string().datetime();

    it('should validate ISO datetime strings', () => {
      const validDates = [
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59Z',
        '2024-01-01T12:30:45.123Z',
      ];

      validDates.forEach((date) => {
        expect(() => dateSchema.parse(date)).not.toThrow();
      });
    });

    it('should reject invalid dates', () => {
      const invalidDates = [
        '2024-01-01',
        '01/01/2024',
        'not-a-date',
      ];

      invalidDates.forEach((date) => {
        expect(() => dateSchema.parse(date)).toThrow();
      });
    });
  });
});




