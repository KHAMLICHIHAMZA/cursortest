import { Test, TestingModule } from '@nestjs/testing';
import { GpsService } from './gps.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('GpsService', () => {
  let service: GpsService;
  let prismaService: any;

  const mockPrismaService = {
    gpsSnapshot: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GpsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<GpsService>(GpsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('captureSnapshot', () => {
    it('should capture CHECK_IN snapshot for any role', async () => {
      mockPrismaService.gpsSnapshot.create.mockResolvedValue({
        id: 'snap-1',
        reason: 'CHECK_IN',
        latitude: 33.5731,
        longitude: -7.5898,
        isGpsMissing: false,
      });

      const result = await service.captureSnapshot(
        {
          agencyId: 'agency-1',
          bookingId: 'booking-1',
          vehicleId: 'vehicle-1',
          latitude: 33.5731,
          longitude: -7.5898,
          accuracy: 10,
          reason: 'CHECK_IN',
        },
        'user-1',
        Role.AGENT,
      );

      expect(result.reason).toBe('CHECK_IN');
      expect(result.isGpsMissing).toBe(false);
    });

    it('should allow MANUAL snapshot for AGENCY_MANAGER', async () => {
      mockPrismaService.gpsSnapshot.create.mockResolvedValue({
        id: 'snap-2',
        reason: 'MANUAL',
      });

      const result = await service.captureSnapshot(
        {
          agencyId: 'agency-1',
          latitude: 33.5731,
          longitude: -7.5898,
          reason: 'MANUAL',
        },
        'user-1',
        Role.AGENCY_MANAGER,
      );

      expect(result.reason).toBe('MANUAL');
    });

    it('should reject MANUAL snapshot for AGENT role', async () => {
      await expect(
        service.captureSnapshot(
          {
            agencyId: 'agency-1',
            latitude: 33.5731,
            longitude: -7.5898,
            reason: 'MANUAL',
          },
          'user-1',
          Role.AGENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow MANUAL snapshot for SUPER_ADMIN', async () => {
      mockPrismaService.gpsSnapshot.create.mockResolvedValue({
        id: 'snap-3',
        reason: 'MANUAL',
      });

      const result = await service.captureSnapshot(
        {
          agencyId: 'agency-1',
          latitude: 33.5731,
          longitude: -7.5898,
          reason: 'MANUAL',
        },
        'user-1',
        Role.SUPER_ADMIN,
      );

      expect(result).toBeDefined();
    });

    it('should allow MANUAL snapshot for COMPANY_ADMIN', async () => {
      mockPrismaService.gpsSnapshot.create.mockResolvedValue({
        id: 'snap-4',
        reason: 'MANUAL',
      });

      const result = await service.captureSnapshot(
        {
          agencyId: 'agency-1',
          latitude: 33.5731,
          longitude: -7.5898,
          reason: 'MANUAL',
        },
        'user-1',
        Role.COMPANY_ADMIN,
      );

      expect(result).toBeDefined();
    });
  });

  describe('recordGpsMissing', () => {
    it('should record GPS missing with reason', async () => {
      mockPrismaService.gpsSnapshot.create.mockResolvedValue({
        id: 'snap-5',
        reason: 'CHECK_IN',
        isGpsMissing: true,
        gpsMissingReason: 'permissionDenied',
        latitude: 0,
        longitude: 0,
      });

      const result = await service.recordGpsMissing(
        {
          agencyId: 'agency-1',
          bookingId: 'booking-1',
          reason: 'CHECK_IN',
          gpsMissingReason: 'permissionDenied',
        },
        'user-1',
        Role.AGENT,
      );

      expect(result.isGpsMissing).toBe(true);
      expect(result.gpsMissingReason).toBe('permissionDenied');
    });

    it('should allow recording GPS missing for any reason type', async () => {
      mockPrismaService.gpsSnapshot.create.mockResolvedValue({
        id: 'snap-6',
        isGpsMissing: true,
        gpsMissingReason: 'offline',
      });

      const result = await service.recordGpsMissing(
        {
          agencyId: 'agency-1',
          reason: 'CHECK_OUT',
          gpsMissingReason: 'offline',
        },
        'user-1',
        Role.AGENT,
      );

      expect(result.isGpsMissing).toBe(true);
    });
  });

  describe('findByBooking', () => {
    it('should return snapshots for a booking', async () => {
      mockPrismaService.gpsSnapshot.findMany.mockResolvedValue([
        { id: 's1', reason: 'CHECK_IN' },
        { id: 's2', reason: 'CHECK_OUT' },
      ]);

      const result = await service.findByBooking('booking-1');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.gpsSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bookingId: 'booking-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findByVehicle', () => {
    it('should return snapshots for a vehicle with limit', async () => {
      mockPrismaService.gpsSnapshot.findMany.mockResolvedValue([]);

      await service.findByVehicle('vehicle-1');

      expect(mockPrismaService.gpsSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vehicleId: 'vehicle-1' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
      );
    });
  });

  describe('findByAgency', () => {
    it('should filter by reason', async () => {
      mockPrismaService.gpsSnapshot.findMany.mockResolvedValue([]);

      await service.findByAgency('agency-1', { reason: 'CHECK_IN' });

      expect(mockPrismaService.gpsSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reason: 'CHECK_IN' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.gpsSnapshot.findMany.mockResolvedValue([]);

      const dateFrom = new Date('2026-01-01');
      const dateTo = new Date('2026-01-31');

      await service.findByAgency('agency-1', { dateFrom, dateTo });

      expect(mockPrismaService.gpsSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: dateFrom, lte: dateTo },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return snapshot by id', async () => {
      mockPrismaService.gpsSnapshot.findUnique.mockResolvedValue({
        id: 'snap-1',
        latitude: 33.5731,
        longitude: -7.5898,
      });

      const result = await service.findOne('snap-1');

      expect(result.id).toBe('snap-1');
    });

    it('should throw if snapshot not found', async () => {
      mockPrismaService.gpsSnapshot.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
