import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService: any = {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((operations: any[]) => {
      return Promise.all(operations);
    }),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      if (key === 'JWT_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return null;
    }),
  };

  const mockAuditService = {
    log: jest.fn(),
    logLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'AGENT',
        isActive: true,
        companyId: null,
        userAgencies: [],
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access and refresh tokens on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password', 10);
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'AGENT',
        isActive: true,
        companyId: null,
        company: null,
        userAgencies: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: '1',
        token: 'refresh-token',
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if refresh token not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is revoked', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: '1',
        token: 'token',
        revoked: true,
        expiresAt: new Date(Date.now() + 1000000),
        user: {
          id: '1',
          isActive: true,
          companyId: null,
          company: null,
          userAgencies: [],
        },
      });

      await expect(
        service.refreshToken({ refreshToken: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens on successful refresh', async () => {
      const mockToken = {
        id: '1',
        token: 'old-refresh-token',
        revoked: false,
        expiresAt: new Date(Date.now() + 1000000),
        userId: '1',
        user: {
          id: '1',
          email: 'test@example.com',
          isActive: true,
          companyId: null,
          company: null,
          userAgencies: [],
        },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockToken);
      mockJwtService.sign.mockReturnValue('new-token');
      mockPrismaService.refreshToken.update.mockResolvedValue(mockToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: '2',
        token: 'new-refresh-token',
      });

      const result = await service.refreshToken({
        refreshToken: 'old-refresh-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });
  });
});



