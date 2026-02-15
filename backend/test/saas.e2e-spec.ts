import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { SubscriptionService } from '../src/modules/subscription/subscription.service';
import { hashPassword } from '../src/utils/bcrypt';
import { ModuleCode, SubscriptionStatus, CompanyStatus, AgencyStatus } from '@prisma/client';

describe('SaaS E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let subscriptionService: SubscriptionService;
  let superAdminToken: string;
  let companyAdminToken: string;
  let companyId: string;
  let agencyId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    subscriptionService = moduleFixture.get<SubscriptionService>(SubscriptionService);

    // Créer un SUPER_ADMIN pour les tests
    const superAdminPassword = await hashPassword('test123');
    const superAdmin = await prisma.user.create({
      data: {
        email: 'e2e-superadmin@test.com',
        password: superAdminPassword,
        name: 'E2E Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    // Créer une Company pour les tests
    const company = await prisma.company.create({
      data: {
        name: 'E2E Test Company',
        raisonSociale: 'E2E Test Company',
        identifiantLegal: 'ICE-TEST-0001',
        formeJuridique: 'SARL',
        maxAgencies: 5,
        slug: 'e2e-test-company',
        phone: '+33123456789',
        address: 'Test Address',
        isActive: true,
        status: 'ACTIVE',
        currency: 'MAD',
      },
    });
    companyId = company.id;

    // Créer un COMPANY_ADMIN
    const companyAdminPassword = await hashPassword('test123');
    const companyAdmin = await prisma.user.create({
      data: {
        email: 'e2e-companyadmin@test.com',
        password: companyAdminPassword,
        name: 'E2E Company Admin',
        role: 'COMPANY_ADMIN',
        companyId: company.id,
        isActive: true,
      },
    });

    // Créer une Agency
    const agency = await prisma.agency.create({
      data: {
        name: 'E2E Test Agency',
        companyId: company.id,
        phone: '+33123456790',
        address: 'Test Agency Address',
        status: 'ACTIVE',
        timezone: 'Africa/Casablanca',
      },
    });
    agencyId = agency.id;

    // Créer un Plan
    const plan = await prisma.plan.create({
      data: {
        name: 'E2E Test Plan',
        description: 'Plan pour tests E2E',
        price: 1000,
        isActive: true,
      },
    });

    // Créer un abonnement
    const subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        billingPeriod: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 1000,
        status: 'ACTIVE',
      },
    });
    subscriptionId = subscription.id;

    // Login pour obtenir les tokens
    const superAdminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'e2e-superadmin@test.com', password: 'test123' });
    superAdminToken = superAdminLogin.body.accessToken || superAdminLogin.body.access_token;

    const companyAdminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'e2e-companyadmin@test.com', password: 'test123' });
    companyAdminToken = companyAdminLogin.body.accessToken || companyAdminLogin.body.access_token;
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await prisma.paymentSaas.deleteMany({ where: { companyId } });
    await prisma.subscriptionModule.deleteMany({ where: { subscriptionId } });
    await prisma.subscription.deleteMany({ where: { companyId } });
    await prisma.agencyModule.deleteMany({ where: { agencyId } });
    await prisma.companyModule.deleteMany({ where: { companyId } });
    await prisma.userAgency.deleteMany({ where: { agencyId } });
    await prisma.agency.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.plan.deleteMany({ where: { name: 'E2E Test Plan' } });
    await prisma.user.deleteMany({ where: { email: 'e2e-superadmin@test.com' } });

    await app.close();
  });

  describe('Module Access Control', () => {
    it('should block access to VEHICLES endpoint when module is not activated', async () => {
      // S'assurer que le module VEHICLES n'est pas activé
      await prisma.companyModule.deleteMany({
        where: { companyId, moduleCode: 'VEHICLES' },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${companyAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/module|subscription|included/i);
    });

    it('should allow access to VEHICLES endpoint when module is activated', async () => {
      // Activer le module VEHICLES
      await prisma.companyModule.create({
        data: {
          companyId,
          moduleCode: 'VEHICLES',
          isActive: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${companyAdminToken}`);

      expect(response.status).toBe(200);
    });

    it('should block access to BOOKINGS endpoint when module is not activated', async () => {
      // S'assurer que le module BOOKINGS n'est pas activé
      await prisma.companyModule.deleteMany({
        where: { companyId, moduleCode: 'BOOKINGS' },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${companyAdminToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow access to BOOKINGS endpoint when module is activated', async () => {
      // Activer le module BOOKINGS
      await prisma.companyModule.create({
        data: {
          companyId,
          moduleCode: 'BOOKINGS',
          isActive: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${companyAdminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Subscription Lifecycle', () => {
    it('should suspend company when subscription expires', async () => {
      // Mettre à jour l'abonnement pour qu'il soit expiré (mais toujours ACTIVE pour que checkExpiredSubscriptions le détecte)
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
          status: SubscriptionStatus.ACTIVE, // Toujours ACTIVE pour que checkExpiredSubscriptions le détecte
        },
      });

      // Appeler manuellement le service pour suspendre
      await subscriptionService.checkExpiredSubscriptions();

      // Vérifier que la company est suspendue
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      expect(company?.status).toBe(CompanyStatus.SUSPENDED);
      expect(company?.suspendedAt).toBeDefined();
    });

    it('should block access when company is suspended', async () => {
      // Suspendre la company
      await prisma.company.update({
        where: { id: companyId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${companyAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('suspendue');
    });

    it('should restore company when subscription is renewed', async () => {
      // Restaurer l'abonnement
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          renewedAt: new Date(),
        },
      });

      // Restaurer la company
      await prisma.company.update({
        where: { id: companyId },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
          suspendedReason: null,
        },
      });

      // Vérifier que l'accès est restauré
      const response = await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${companyAdminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Company governance', () => {
    it('should block agency creation when maxAgencies limit is reached', async () => {
      await prisma.company.update({
        where: { id: companyId },
        data: { maxAgencies: 1 },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/agencies')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .send({ name: 'Blocked Agency' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Limite d’agences atteinte');

      const event = await prisma.businessEventLog.findFirst({
        where: {
          companyId,
          eventType: 'AGENCY_CREATE_BLOCKED_MAX_LIMIT',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(event).toBeTruthy();
    });

    it('should prevent Company Admin from creating COMPANY_ADMIN users', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .send({
          email: 'e2e-companyadmin2@test.com',
          name: 'Blocked Admin',
          role: 'COMPANY_ADMIN',
          companyId,
        });

      expect(response.status).toBe(403);
    });

    it('should prevent Company Admin from upgrading a user to COMPANY_ADMIN', async () => {
      const agent = await prisma.user.create({
        data: {
          email: 'e2e-agent-upgrade@test.com',
          password: await hashPassword('test123'),
          name: 'E2E Agent Upgrade',
          role: 'AGENT',
          companyId,
          isActive: true,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${agent.id}`)
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .send({ role: 'COMPANY_ADMIN' });

      expect(response.status).toBe(403);

      await prisma.user.delete({ where: { id: agent.id } });
    });
  });

  describe('Agency Module Inheritance', () => {
    it('should inherit company modules by default', async () => {
      // S'assurer que le module n'est pas désactivé au niveau Agency
      await prisma.agencyModule.deleteMany({
        where: { agencyId, moduleCode: 'VEHICLES' },
      });

      // Activer un module au niveau Company
      await prisma.companyModule.upsert({
        where: {
          companyId_moduleCode: {
            companyId,
            moduleCode: 'VEHICLES',
          },
        },
        create: {
          companyId,
          moduleCode: 'VEHICLES',
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });

      // L'agence devrait pouvoir utiliser le module même sans AgencyModule explicite
      // (car elle hérite des CompanyModules)
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vehicles?agencyId=${agencyId}`)
        .set('Authorization', `Bearer ${companyAdminToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow agency to deactivate inherited module', async () => {
      // Désactiver le module au niveau Agency
      await prisma.agencyModule.create({
        data: {
          agencyId,
          moduleCode: 'VEHICLES',
          isActive: false,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${companyAdminToken}`)
        .send({
          agencyId,
          brand: 'Test',
          model: 'Test',
          registrationNumber: 'TEST-123',
          year: 2023,
          dailyRate: 50.0,
          depositAmount: 500.0,
        });

      expect(response.status).toBe(403);
    });

    it('should prevent agency from activating non-paid module', async () => {
      // S'assurer que le module FINES n'est pas payé au niveau Company
      await prisma.companyModule.deleteMany({
        where: { companyId, moduleCode: 'FINES' },
      });

      // Essayer d'activer le module au niveau Agency (devrait échouer)
      const response = await request(app.getHttpServer())
        .post(`/api/v1/modules/agency/${agencyId}/FINES/activate`)
        .set('Authorization', `Bearer ${companyAdminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('pas inclus');
    });
  });

  describe('Permission Levels', () => {
    it('should allow READ permission to view but not modify', async () => {
      // S'assurer que le module VEHICLES est activé pour la company
      await prisma.companyModule.upsert({
        where: {
          companyId_moduleCode: {
            companyId,
            moduleCode: 'VEHICLES',
          },
        },
        create: {
          companyId,
          moduleCode: 'VEHICLES',
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });
      // S'assurer que l'agence n'a pas désactivé le module VEHICLES (override)
      await prisma.agencyModule.deleteMany({
        where: {
          agencyId,
          moduleCode: 'VEHICLES',
        },
      });

      // Créer un utilisateur avec permission READ
      const readUserPassword = await hashPassword('test123');
      const readUser = await prisma.user.create({
        data: {
          email: 'e2e-readuser@test.com',
          password: readUserPassword,
          name: 'E2E Read User',
          role: 'AGENT',
          companyId,
          isActive: true,
        },
      });

      await prisma.userAgency.create({
        data: {
          userId: readUser.id,
          agencyId,
          permission: 'READ',
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e-readuser@test.com', password: 'test123' });
      const readUserToken = loginResponse.body.accessToken || loginResponse.body.access_token;

      // Devrait pouvoir lire
      const getResponse = await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${readUserToken}`);
      expect(getResponse.status).toBe(200);

      // Ne devrait pas pouvoir créer
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${readUserToken}`)
        .send({
          agencyId,
          brand: 'Test',
          model: 'Test',
          registrationNumber: 'TEST-123',
          year: 2023,
          dailyRate: 50.0,
          depositAmount: 500.0,
        });
      expect(createResponse.status).toBe(403);

      // Nettoyer
      await prisma.userAgency.deleteMany({ where: { userId: readUser.id } });
      await prisma.user.delete({ where: { id: readUser.id } });
    });

    it('should allow WRITE permission to create but not delete', async () => {
      // Nettoyer tous les AgencyModules pour VEHICLES (des tests précédents)
      await prisma.agencyModule.deleteMany({
        where: {
          agencyId,
          moduleCode: 'VEHICLES',
        },
      });

      // S'assurer que le module VEHICLES est activé pour la company
      await prisma.companyModule.upsert({
        where: {
          companyId_moduleCode: {
            companyId,
            moduleCode: 'VEHICLES',
          },
        },
        create: {
          companyId,
          moduleCode: 'VEHICLES',
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });

      // Créer un utilisateur avec permission WRITE
      const writeUserPassword = await hashPassword('test123');
      const writeUser = await prisma.user.create({
        data: {
          email: 'e2e-writeuser@test.com',
          password: writeUserPassword,
          name: 'E2E Write User',
          role: 'AGENT',
          companyId,
          isActive: true,
        },
      });

      await prisma.userAgency.create({
        data: {
          userId: writeUser.id,
          agencyId,
          permission: 'WRITE',
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e-writeuser@test.com', password: 'test123' });
      const writeUserToken = loginResponse.body.accessToken || loginResponse.body.access_token;

      // Créer un véhicule pour tester la suppression
      const vehicle = await prisma.vehicle.create({
        data: {
          agencyId,
          brand: 'Test',
          model: 'Test',
          registrationNumber: 'TEST-DELETE',
          year: 2023,
          dailyRate: 50.0,
          depositAmount: 500.0,
          status: 'AVAILABLE',
        },
      });

      // Devrait pouvoir créer
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${writeUserToken}`)
        .send({
          agencyId,
          brand: 'Test',
          model: 'Test2',
          registrationNumber: 'TEST-456',
          year: 2023,
          dailyRate: 50.0,
          depositAmount: 500.0,
        });
      
      if (createResponse.status !== 201) {
        console.log('Error response:', createResponse.body);
      }
      
      expect(createResponse.status).toBe(201);

      // Ne devrait pas pouvoir supprimer
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/v1/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${writeUserToken}`);
      expect(deleteResponse.status).toBe(403);

      // Nettoyer
      await prisma.vehicle.deleteMany({ where: { agencyId } });
      await prisma.userAgency.deleteMany({ where: { userId: writeUser.id } });
      await prisma.user.delete({ where: { id: writeUser.id } });
    });
  });
});

