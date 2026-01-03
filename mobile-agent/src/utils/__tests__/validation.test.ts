import { z } from 'zod';

// Tests de validation génériques
describe('Validation Utils', () => {
  describe('Email validation', () => {
    const emailSchema = z.string().email();

    it('should validate correct emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'agent1@autolocation.fr',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user space@example.com',
      ];

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).toThrow();
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
        '2024-13-01T00:00:00Z', // Invalid month
      ];

      invalidDates.forEach((date) => {
        expect(() => dateSchema.parse(date)).toThrow();
      });
    });
  });
});




