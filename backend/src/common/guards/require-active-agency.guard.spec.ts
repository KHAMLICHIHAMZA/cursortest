import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RequireActiveAgencyGuard } from './require-active-agency.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AgencyStatus } from '@prisma/client';

describe('RequireActiveAgencyGuard', () => {
  let guard: RequireActiveAgencyGuard;
  let prismaService: PrismaService;

  const mockPrismaService = {
    agency: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequireActiveAgencyGuard,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<RequireActiveAgencyGuard>(RequireActiveAgencyGuard);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any, params?: any, body?: any, query?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params: params || {}, body: body || {}, query: query || {} }),
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
      expect(mockPrismaService.agency.findUnique).not.toHaveBeenCalled();
    });

    it('should return true if no agencyId provided', async () => {
      const context = createMockExecutionContext({ userId: 'user-1' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrismaService.agency.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user not authenticated', async () => {
      const context = createMockExecutionContext(null, { agencyId: 'agency-1' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should use agencyId from params', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: 'agency-1',
        status: AgencyStatus.ACTIVE,
        companyId: 'company-1',
        deletedAt: null,
      });
      const context = createMockExecutionContext(
        { userId: 'user-1', companyId: 'company-1', role: 'COMPANY_ADMIN' },
        { agencyId: 'agency-1' },
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrismaService.agency.findUnique).toHaveBeenCalledWith({
        where: { id: 'agency-1' },
        select: { id: true, status: true, companyId: true, deletedAt: true },
      });
    });

    it('should throw BadRequestException if agency not found', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue(null);
      const context = createMockExecutionContext(
        { userId: 'user-1', companyId: 'company-1' },
        { agencyId: 'agency-1' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if agency is not active', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: 'agency-1',
        status: AgencyStatus.SUSPENDED,
        companyId: 'company-1',
        deletedAt: null,
      });
      const context = createMockExecutionContext(
        { userId: 'user-1', companyId: 'company-1' },
        { agencyId: 'agency-1' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if agency does not belong to company', async () => {
      mockPrismaService.agency.findUnique.mockResolvedValue({
        id: 'agency-1',
        status: AgencyStatus.ACTIVE,
        companyId: 'company-2',
        deletedAt: null,
      });
      const context = createMockExecutionContext(
        { userId: 'user-1', companyId: 'company-1', role: 'COMPANY_ADMIN' },
        { agencyId: 'agency-1' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});

