import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequirePermissionGuard } from './require-permission.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UserAgencyPermission } from '@prisma/client';

describe('RequirePermissionGuard', () => {
  let guard: RequirePermissionGuard;
  let prismaService: PrismaService;
  let reflector: Reflector;

  const mockPrismaService = {
    userAgency: {
      findUnique: jest.fn(),
    },
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirePermissionGuard,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RequirePermissionGuard>(RequirePermissionGuard);
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
      const context = createMockExecutionContext({ userId: 'user-1' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true if user is SUPER_ADMIN', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserAgencyPermission.READ);
      const context = createMockExecutionContext({
        userId: 'user-1',
        role: 'SUPER_ADMIN',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrismaService.userAgency.findUnique).not.toHaveBeenCalled();
    });

    it('should return true if user is COMPANY_ADMIN', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserAgencyPermission.READ);
      const context = createMockExecutionContext({
        userId: 'user-1',
        role: 'COMPANY_ADMIN',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrismaService.userAgency.findUnique).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if agencyId not found', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserAgencyPermission.READ);
      const context = createMockExecutionContext({
        userId: 'user-1',
        role: 'AGENT',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user not associated with agency', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserAgencyPermission.READ);
      mockPrismaService.userAgency.findUnique.mockResolvedValue(null);
      const context = createMockExecutionContext(
        {
          userId: 'user-1',
          role: 'AGENT',
        },
        { agencyId: 'agency-1' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has insufficient permissions', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserAgencyPermission.WRITE);
      mockPrismaService.userAgency.findUnique.mockResolvedValue({
        permission: UserAgencyPermission.READ,
      });
      const context = createMockExecutionContext(
        {
          userId: 'user-1',
          role: 'AGENT',
        },
        { agencyId: 'agency-1' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should return true if user has sufficient permissions', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(UserAgencyPermission.READ);
      mockPrismaService.userAgency.findUnique.mockResolvedValue({
        permission: UserAgencyPermission.FULL,
      });
      const context = createMockExecutionContext(
        {
          userId: 'user-1',
          role: 'AGENT',
        },
        { agencyId: 'agency-1' },
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrismaService.userAgency.findUnique).toHaveBeenCalledWith({
        where: {
          userId_agencyId: {
            userId: 'user-1',
            agencyId: 'agency-1',
          },
        },
        select: { permission: true },
      });
    });
  });
});

