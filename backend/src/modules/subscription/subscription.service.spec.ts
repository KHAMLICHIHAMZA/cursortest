import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { SubscriptionStatus, BillingPeriod, CompanyStatus } from '@prisma/client';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
    subscriptionModule: {
      createMany: jest.fn(),
    },
    companyModule: {
      createMany: jest.fn(),
    },
  };

  const mockAuditService = {
    addUpdateAuditFields: jest.fn((data, userId) => ({ ...data, updatedBy: userId })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      companyId: 'company-1',
      planId: 'plan-1',
      billingPeriod: BillingPeriod.MONTHLY,
      startDate: new Date('2024-01-01'),
      amount: 1000,
    };

    const mockUser = { userId: 'user-1', role: 'SUPER_ADMIN' };

    it('should throw NotFoundException if company not found', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if company already has active subscription', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: 'company-1' });
      mockPrismaService.subscription.findUnique.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
      });

      await expect(service.create(createDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if plan not found', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: 'company-1' });
      mockPrismaService.subscription.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should create subscription successfully', async () => {
      const mockPlan = {
        id: 'plan-1',
        price: 1000,
        isActive: true,
        planModules: [
          { moduleCode: 'VEHICLES' },
          { moduleCode: 'BOOKINGS' },
        ],
      };

      mockPrismaService.company.findUnique.mockResolvedValue({ id: 'company-1' });
      mockPrismaService.subscription.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaService.subscription.create.mockResolvedValue({
        id: 'sub-1',
        ...createDto,
        status: SubscriptionStatus.ACTIVE,
        endDate: new Date('2024-02-01'),
      });
      mockPrismaService.subscriptionModule.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.companyModule.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        company: { id: 'company-1', name: 'Company 1' },
        plan: { id: 'plan-1', name: 'Plan 1' },
        subscriptionModules: [],
      });

      const result = await service.create(createDto, mockUser);

      expect(result).toBeDefined();
      expect(mockPrismaService.subscription.create).toHaveBeenCalled();
      expect(mockPrismaService.subscriptionModule.createMany).toHaveBeenCalled();
      expect(mockPrismaService.companyModule.createMany).toHaveBeenCalled();
    });
  });

  describe('suspend', () => {
    it('should throw ForbiddenException if user is not SUPER_ADMIN', async () => {
      const mockUser = { userId: 'user-1', role: 'COMPANY_ADMIN' };

      await expect(service.suspend('sub-1', 'Reason', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should suspend subscription and company', async () => {
      const mockUser = { userId: 'user-1', role: 'SUPER_ADMIN' };
      const mockSubscription = {
        id: 'sub-1',
        companyId: 'company-1',
        company: { id: 'company-1' },
      };

      const mockSubscriptionForFindOne = {
        id: 'sub-1',
        companyId: 'company-1',
        company: { 
          id: 'company-1', 
          name: 'Company 1',
          status: CompanyStatus.SUSPENDED,
        },
        plan: { 
          id: 'plan-1', 
          name: 'Plan 1',
          planModules: [],
          planQuotas: [],
        },
        subscriptionModules: [],
        paymentsSaas: [],
      };

      // Premier appel dans suspend (avec include company)
      mockPrismaService.subscription.findUnique.mockResolvedValueOnce(mockSubscription);
      // Deuxième appel dans findOne (avec plus d'includes)
      mockPrismaService.subscription.findUnique.mockResolvedValueOnce(mockSubscriptionForFindOne);
      
      mockPrismaService.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.SUSPENDED,
      });
      mockPrismaService.company.update.mockResolvedValue({
        id: 'company-1',
        status: CompanyStatus.SUSPENDED,
      });

      await service.suspend('sub-1', 'Reason', mockUser);

      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: SubscriptionStatus.SUSPENDED },
      });
      expect(mockPrismaService.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: {
          status: CompanyStatus.SUSPENDED,
          suspendedAt: expect.any(Date),
          suspendedReason: 'Reason',
        },
      });
    });
  });

  describe('restore', () => {
    it('should throw BadRequestException if subscription is not suspended', async () => {
      const mockUser = { userId: 'user-1', role: 'SUPER_ADMIN' };
      const mockSubscription = {
        id: 'sub-1',
        status: SubscriptionStatus.ACTIVE,
        company: { suspendedAt: null },
      };

      mockPrismaService.subscription.findUnique.mockResolvedValue(mockSubscription);

      await expect(service.restore('sub-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if suspension period exceeded 90 days', async () => {
      const mockUser = { userId: 'user-1', role: 'SUPER_ADMIN' };
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 91);
      const mockSubscription = {
        id: 'sub-1',
        status: SubscriptionStatus.SUSPENDED,
        company: { suspendedAt: oldDate },
      };

      mockPrismaService.subscription.findUnique.mockResolvedValue(mockSubscription);

      await expect(service.restore('sub-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should restore subscription and company', async () => {
      const mockUser = { userId: 'user-1', role: 'SUPER_ADMIN' };
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      const mockSubscription = {
        id: 'sub-1',
        status: SubscriptionStatus.SUSPENDED,
        companyId: 'company-1',
        company: { 
          id: 'company-1',
          suspendedAt: recentDate,
        },
      };

      const mockSubscriptionForFindOne = {
        id: 'sub-1',
        companyId: 'company-1',
        status: SubscriptionStatus.ACTIVE,
        company: { 
          id: 'company-1', 
          name: 'Company 1',
          status: CompanyStatus.ACTIVE,
        },
        plan: { 
          id: 'plan-1', 
          name: 'Plan 1',
          planModules: [],
          planQuotas: [],
        },
        subscriptionModules: [],
        paymentsSaas: [],
      };

      // Premier appel dans restore (avec include company)
      mockPrismaService.subscription.findUnique.mockResolvedValueOnce(mockSubscription);
      // Deuxième appel dans findOne (avec plus d'includes)
      mockPrismaService.subscription.findUnique.mockResolvedValueOnce(mockSubscriptionForFindOne);
      
      mockPrismaService.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      });
      mockPrismaService.company.update.mockResolvedValue({
        id: 'company-1',
        status: CompanyStatus.ACTIVE,
      });

      await service.restore('sub-1', mockUser);

      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: SubscriptionStatus.ACTIVE },
      });
      expect(mockPrismaService.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: {
          status: CompanyStatus.ACTIVE,
          suspendedAt: null,
          suspendedReason: null,
        },
      });
    });
  });
});

