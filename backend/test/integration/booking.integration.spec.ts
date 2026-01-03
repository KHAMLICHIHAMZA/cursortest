/**
 * Tests d'intégration pour les réservations
 * 
 * Ces tests vérifient l'intégration complète du flux de réservations
 * avec la base de données et les services
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Booking Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let agencyId: string;
  let vehicleId: string;
  let clientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Login pour obtenir le token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'agent1@autolocation.fr',
        password: 'agent123',
      });

    accessToken = loginResponse.body.access_token;

    // Récupérer les données de test depuis la base
    const agency = await prisma.agency.findFirst();
    const vehicle = await prisma.vehicle.findFirst({ where: { agencyId: agency?.id } });
    const client = await prisma.client.findFirst({ where: { agencyId: agency?.id } });

    agencyId = agency?.id || '';
    vehicleId = vehicle?.id || '';
    clientId = client?.id || '';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/bookings', () => {
    it('should get bookings for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter bookings by agency', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/bookings?agencyId=${agencyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .expect(401);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    let bookingId: string;

    beforeAll(async () => {
      const booking = await prisma.booking.findFirst();
      bookingId = booking?.id || '';
    });

    it('should get booking details', async () => {
      if (!bookingId) {
        console.warn('Aucune réservation trouvée, skip du test');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
    });

    it('should reject request for non-existent booking', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/bookings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/bookings/:id/checkin', () => {
    let bookingId: string;

    beforeAll(async () => {
      // Trouver une réservation CONFIRMED
      const booking = await prisma.booking.findFirst({
        where: { status: 'CONFIRMED' },
      });
      bookingId = booking?.id || '';
    });

    it('should perform check-in for CONFIRMED booking', async () => {
      if (!bookingId) {
        console.warn('Aucune réservation CONFIRMED trouvée, skip du test');
        return;
      }

      const checkInData = {
        odometerStart: 10000,
        fuelLevelStart: 'FULL',
        photosBefore: [],
        driverLicensePhoto: 'base64-image',
        driverLicenseExpiry: '2025-12-31',
        signature: 'base64-signature',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/bookings/${bookingId}/checkin`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(checkInData)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('IN_PROGRESS');
    });
  });
});




