import { authService, loginSchema } from '../auth.service';
import * as SecureStore from 'expo-secure-store';
import api, { apiService } from '../api';

// Mock dependencies
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
  apiService: {
    setToken: jest.fn(),
    getToken: jest.fn(),
  },
}));
jest.mock('expo-secure-store');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginSchema', () => {
    it('should validate correct email and password', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('login', () => {
    it('should store token and user data after successful login', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token',
          refresh_token: 'refresh-token',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'AGENT',
            companyId: 'company-1',
            agencyIds: ['agency-1'],
          },
          agencies: [{ id: 'agency-1', name: 'Agency 1', isActive: true }],
          permissions: [{ resource: 'bookings', action: 'read' }],
          modules: [{ id: 'BOOKINGS', name: 'Bookings', isActive: true }],
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      (apiService.setToken as jest.Mock).mockResolvedValue(undefined);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('test-token');
      expect(result.user.email).toBe('test@example.com');
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', async () => {
      (apiService.getToken as jest.Mock).mockResolvedValue('test-token');
      const result = await authService.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false if no token', async () => {
      (apiService.getToken as jest.Mock).mockResolvedValue(null);
      const result = await authService.isAuthenticated();
      expect(result).toBe(false);
    });
  });
});

