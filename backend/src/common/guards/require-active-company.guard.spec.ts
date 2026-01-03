import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RequireActiveCompanyGuard } from './require-active-company.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyStatus } from '@prisma/client';

describe('RequireActiveCompanyGuard', () => {
  let guard: RequireActiveCompanyGuard;
  let prismaService: PrismaService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequireActiveCompanyGuard,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<RequireActiveCompanyGuard>(RequireActiveCompanyGuard);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true if user is SUPER_ADMIN', async () => {
      const context = createMockExecutionContext({ role: 'SUPER_ADMIN' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrismaService.company.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user not authenticated', async () => {
      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has no companyId', async () => {
      const context = createMockExecutionContext({ role: 'COMPANY_ADMIN' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.company.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if company not found', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);
      const context = createMockExecutionContext({ companyId: 'company-1', role: 'COMPANY_ADMIN' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        select: { id: true, status: true, isActive: true },
      });
    });

    it('should throw ForbiddenException if company is suspended', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({
        id: 'company-1',
        status: CompanyStatus.SUSPENDED,
        isActive: true,
      });
      const context = createMockExecutionContext({ companyId: 'company-1', role: 'COMPANY_ADMIN' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if company isActive is false', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({
        id: 'company-1',
        status: CompanyStatus.ACTIVE,
        isActive: false,
      });
      const context = createMockExecutionContext({ companyId: 'company-1', role: 'COMPANY_ADMIN' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should return true if company is active', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({
        id: 'company-1',
        status: CompanyStatus.ACTIVE,
        isActive: true,
      });
      const context = createMockExecutionContext({ companyId: 'company-1', role: 'COMPANY_ADMIN' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        select: { id: true, status: true, isActive: true },
      });
    });
  });
});

