import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequireModuleGuard } from './require-module.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleCode } from '@prisma/client';

describe('RequireModuleGuard', () => {
  let guard: RequireModuleGuard;
  let prismaService: PrismaService;
  let reflector: Reflector;

  const mockPrismaService = {
    companyModule: {
      findUnique: jest.fn(),
    },
    agency: {
      findUnique: jest.fn(),
    },
    agencyModule: {
      findUnique: jest.fn(),
    },
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequireModuleGuard,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RequireModuleGuard>(RequireModuleGuard);
    prismaService = module.get<PrismaService>(PrismaService);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any, params?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params: params || {}, body: {}, query: {} }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true if decorator is not set', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ companyId: 'company-1' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user has no companyId', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(ModuleCode.VEHICLES);
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if company module not active', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(ModuleCode.VEHICLES);
      mockPrismaService.companyModule.findUnique.mockResolvedValue(null);
      const context = createMockExecutionContext({ companyId: 'company-1' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.companyModule.findUnique).toHaveBeenCalledWith({
        where: {
          companyId_moduleCode: {
            companyId: 'company-1',
            moduleCode: ModuleCode.VEHICLES,
          },
        },
      });
    });

    it('should throw ForbiddenException if agency module not active', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(ModuleCode.VEHICLES);
      mockPrismaService.companyModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrismaService.agency.findUnique = jest.fn().mockResolvedValue({
        id: 'agency-1',
        companyId: 'company-1',
      });
      mockPrismaService.agencyModule.findUnique.mockResolvedValue({ isActive: false });
      const context = createMockExecutionContext(
        { companyId: 'company-1', role: 'COMPANY_ADMIN' },
        { agencyId: 'agency-1' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should return true if module is active (company level only)', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(ModuleCode.VEHICLES);
      mockPrismaService.companyModule.findUnique.mockResolvedValue({ isActive: true });
      const context = createMockExecutionContext({ companyId: 'company-1', role: 'COMPANY_ADMIN' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true if module is active (company and agency level)', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(ModuleCode.VEHICLES);
      mockPrismaService.companyModule.findUnique.mockResolvedValue({ isActive: true });
      mockPrismaService.agency.findUnique = jest.fn().mockResolvedValue({
        id: 'agency-1',
        companyId: 'company-1',
      });
      mockPrismaService.agencyModule.findUnique.mockResolvedValue({ isActive: true });
      const context = createMockExecutionContext(
        { companyId: 'company-1', role: 'COMPANY_ADMIN' },
        { agencyId: 'agency-1' },
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});

