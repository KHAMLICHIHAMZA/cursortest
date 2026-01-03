import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { ModuleCode } from '@prisma/client';

describe('PlanService', () => {
  let service: PlanService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    plan: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    planModule: {
      createMany: jest.fn(),
    },
    planQuota: {
      createMany: jest.fn(),
    },
  };

  const mockAuditService = {
    addUpdateAuditFields: jest.fn((data, userId) => ({ ...data, updatedBy: userId })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<PlanService>(PlanService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Pro Plan',
      description: 'Professional plan',
      price: 1000,
      moduleCodes: [ModuleCode.VEHICLES, ModuleCode.BOOKINGS],
      quotas: {
        agencies: 10,
        users: 50,
        vehicles: 100,
      },
    };

    const mockUser = { userId: 'user-1' };

    it('should throw BadRequestException if plan name already exists', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({ id: 'plan-1', name: 'Pro Plan' });

      await expect(service.create(createDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should create plan with modules and quotas', async () => {
      const mockPlan = {
        id: 'plan-1',
        name: 'Pro Plan',
        description: 'Professional plan',
        price: 1000,
        isActive: true,
      };

      mockPrismaService.plan.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.create.mockResolvedValue(mockPlan);
      mockPrismaService.plan.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...mockPlan,
        planModules: [
          { planId: 'plan-1', moduleCode: ModuleCode.VEHICLES },
          { planId: 'plan-1', moduleCode: ModuleCode.BOOKINGS },
        ],
        planQuotas: [
          { planId: 'plan-1', quotaKey: 'agencies', quotaValue: 10 },
          { planId: 'plan-1', quotaKey: 'users', quotaValue: 50 },
          { planId: 'plan-1', quotaKey: 'vehicles', quotaValue: 100 },
        ],
        _count: { subscriptions: 0 },
      });

      const result = await service.create(createDto, mockUser);

      expect(result).toBeDefined();
      expect(mockPrismaService.plan.create).toHaveBeenCalledWith({
        data: {
          name: 'Pro Plan',
          description: 'Professional plan',
          price: 1000,
          isActive: true,
        },
      });
      expect(mockPrismaService.planModule.createMany).toHaveBeenCalledWith({
        data: [
          { planId: 'plan-1', moduleCode: ModuleCode.VEHICLES },
          { planId: 'plan-1', moduleCode: ModuleCode.BOOKINGS },
        ],
      });
      expect(mockPrismaService.planQuota.createMany).toHaveBeenCalledWith({
        data: [
          { planId: 'plan-1', quotaKey: 'agencies', quotaValue: 10 },
          { planId: 'plan-1', quotaKey: 'users', quotaValue: 50 },
          { planId: 'plan-1', quotaKey: 'vehicles', quotaValue: 100 },
        ],
      });
    });

    it('should create plan without modules and quotas if not provided', async () => {
      const createDtoWithoutModules = {
        name: 'Basic Plan',
        description: 'Basic plan',
        price: 500,
      };

      const mockPlan = {
        id: 'plan-2',
        ...createDtoWithoutModules,
        isActive: true,
      };

      mockPrismaService.plan.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.create.mockResolvedValue(mockPlan);
      mockPrismaService.plan.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...mockPlan,
        planModules: [],
        planQuotas: [],
        _count: { subscriptions: 0 },
      });

      await service.create(createDtoWithoutModules, mockUser);

      expect(mockPrismaService.planModule.createMany).not.toHaveBeenCalled();
      expect(mockPrismaService.planQuota.createMany).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active plans', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Starter',
          price: 500,
          isActive: true,
          planModules: [],
          planQuotas: [],
          _count: { subscriptions: 5 },
        },
        {
          id: 'plan-2',
          name: 'Pro',
          price: 1000,
          isActive: true,
          planModules: [],
          planQuotas: [],
          _count: { subscriptions: 10 },
        },
      ];

      mockPrismaService.plan.findMany.mockResolvedValue(mockPlans);

      const result = await service.findAll();

      expect(result).toEqual(mockPlans);
      expect(mockPrismaService.plan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          planModules: true,
          planQuotas: true,
          _count: {
            select: {
              subscriptions: true,
            },
          },
        },
        orderBy: { price: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    const planId = 'plan-1';

    it('should throw NotFoundException if plan not found', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.findOne(planId)).rejects.toThrow(NotFoundException);
    });

    it('should return plan with modules and quotas', async () => {
      const mockPlan = {
        id: planId,
        name: 'Pro',
        price: 1000,
        planModules: [
          { planId, moduleCode: ModuleCode.VEHICLES },
          { planId, moduleCode: ModuleCode.BOOKINGS },
        ],
        planQuotas: [
          { planId, quotaKey: 'agencies', quotaValue: 10 },
        ],
        _count: { subscriptions: 5 },
      };

      mockPrismaService.plan.findUnique.mockResolvedValue(mockPlan);

      const result = await service.findOne(planId);

      expect(result).toEqual(mockPlan);
    });
  });

  describe('update', () => {
    const planId = 'plan-1';
    const updateDto = {
      description: 'Updated description',
      price: 1200,
    };
    const mockUser = { userId: 'user-1' };

    it('should throw NotFoundException if plan not found', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.update(planId, updateDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update plan successfully', async () => {
      const mockPlan = {
        id: planId,
        name: 'Pro',
        description: 'Professional plan',
        price: 1000,
      };

      mockPrismaService.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaService.plan.update.mockResolvedValue({
        ...mockPlan,
        ...updateDto,
        planModules: [],
        planQuotas: [],
      });

      const result = await service.update(planId, updateDto, mockUser);

      expect(result).toBeDefined();
      expect(mockAuditService.addUpdateAuditFields).toHaveBeenCalledWith(updateDto, 'user-1');
      expect(mockPrismaService.plan.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const planId = 'plan-1';
    const mockUser = { userId: 'user-1' };

    it('should throw NotFoundException if plan not found', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      await expect(service.remove(planId, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if plan has active subscriptions', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        id: planId,
        _count: { subscriptions: 5 },
      });

      await expect(service.remove(planId, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should deactivate plan if no subscriptions', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue({
        id: planId,
        _count: { subscriptions: 0 },
      });
      mockPrismaService.plan.update.mockResolvedValue({
        id: planId,
        isActive: false,
      });

      const result = await service.remove(planId, mockUser);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.plan.update).toHaveBeenCalledWith({
        where: { id: planId },
        data: { isActive: false },
      });
    });
  });
});


