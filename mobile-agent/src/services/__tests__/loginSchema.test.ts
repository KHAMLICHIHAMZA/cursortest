import { loginSchema } from '../auth.service';

describe('loginSchema Validation', () => {
  describe('Email validation', () => {
    it('should accept valid email', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('email');
      }
    });

    it('should reject empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Password validation', () => {
    it('should accept password with 8+ characters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('password');
      }
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Complete validation', () => {
    it('should accept valid login data', () => {
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

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
    });
  });
});




