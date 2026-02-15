/**
 * Tests d'intégration pour les services mobile
 * 
 * Ces tests vérifient l'intégration entre le mobile et le backend
 * Nécessitent un backend en cours d'exécution
 */

import { authService } from '../auth.service';
import { bookingService } from '../booking.service';
import api from '../api';

// Mock de l'API pour les tests d'intégration
// En production, ces tests utilisent un vrai backend
jest.mock('../api', () => {
  const axios = require('axios');
  return axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000/api/v1',
    timeout: 10000,
  });
});

const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';

(runIntegration ? describe : describe.skip)('Integration Tests - Mobile Agent', () => {
  const testCredentials = {
    email: 'agent1@autolocation.fr',
    password: 'agent123',
  };

  let authToken: string | null = null;

  beforeAll(async () => {
    // Attendre que le backend soit prêt
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  describe('Authentication Integration', () => {
    it('should login successfully and get token', async () => {
      try {
        const response = await authService.login(testCredentials);
        expect(response.access_token).toBeDefined();
        expect(response.user).toBeDefined();
        expect(response.agencies).toBeDefined();
        authToken = response.access_token;
      } catch (error: any) {
        // Si le backend n'est pas disponible, skip le test
        if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
          console.warn('Backend non disponible, skip des tests d\'intégration');
          return;
        }
        throw error;
      }
    });

    it('should store user data after login', async () => {
      if (!authToken) {
        console.warn('Pas de token, skip du test');
        return;
      }

      const user = await authService.getUser();
      expect(user).toBeDefined();
      expect(user?.email).toBe(testCredentials.email);
    });

    it('should get agencies after login', async () => {
      if (!authToken) {
        console.warn('Pas de token, skip du test');
        return;
      }

      const agencies = await authService.getAgencies();
      expect(agencies).toBeDefined();
      expect(Array.isArray(agencies)).toBe(true);
    });
  });

  describe('Booking Integration', () => {
    let agencyId: string | undefined;

    beforeAll(async () => {
      if (!authToken) {
        return;
      }
      const agencies = await authService.getAgencies();
      agencyId = agencies[0]?.id;
    });

    it('should fetch bookings for an agency', async () => {
      if (!authToken || !agencyId) {
        console.warn('Pas de token ou agence, skip du test');
        return;
      }

      try {
        const bookings = await bookingService.getBookings(agencyId);
        expect(Array.isArray(bookings)).toBe(true);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
          console.warn('Backend non disponible, skip du test');
          return;
        }
        throw error;
      }
    });

    it('should handle offline mode gracefully', async () => {
      // Simuler un mode offline
      const originalGet = api.get;
      api.get = jest.fn().mockRejectedValue(new Error('Network Error'));

      try {
        // Le service devrait gérer l'erreur gracieusement
        await expect(bookingService.getBookings(agencyId)).rejects.toThrow();
      } finally {
        api.get = originalGet;
      }
    });
  });

  afterAll(async () => {
    if (authToken) {
      await authService.logout();
    }
  });
});




