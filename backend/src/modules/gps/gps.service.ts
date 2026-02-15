import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

// GPS Snapshot Reason (mirroring Prisma enum)
const GpsSnapshotReason = {
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',
  INCIDENT: 'INCIDENT',
  MANUAL: 'MANUAL',
} as const;

type GpsSnapshotReasonType = (typeof GpsSnapshotReason)[keyof typeof GpsSnapshotReason];

export interface CreateGpsSnapshotDto {
  agencyId: string;
  bookingId?: string;
  vehicleId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  reason: GpsSnapshotReasonType;
  deviceInfo?: string;
  mileage?: number;
}

export interface CreateGpsSnapshotMissingDto {
  agencyId: string;
  bookingId?: string;
  vehicleId?: string;
  reason: GpsSnapshotReasonType;
  gpsMissingReason: 'permissionDenied' | 'offline' | 'deviceUnsupported';
  mileage?: number;
}

// Roles allowed to create manual snapshots
const MANUAL_SNAPSHOT_ROLES: string[] = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER'];

@Injectable()
export class GpsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * V2: Capture a GPS snapshot
   * For CHECK_IN, CHECK_OUT, INCIDENT - any role can capture
   * For MANUAL - only managers can capture
   */
  async captureSnapshot(
    dto: CreateGpsSnapshotDto,
    userId: string,
    userRole: string,
  ): Promise<any> {
    // Check permissions for manual snapshots
    if (dto.reason === GpsSnapshotReason.MANUAL) {
      if (!MANUAL_SNAPSHOT_ROLES.includes(userRole)) {
        throw new ForbiddenException(
          'Seuls les managers peuvent créer des snapshots GPS manuels',
        );
      }
    }

    const snapshot = await (this.prisma as any).gpsSnapshot.create({
      data: {
        agencyId: dto.agencyId,
        bookingId: dto.bookingId || null,
        vehicleId: dto.vehicleId || null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy || null,
        altitude: dto.altitude || null,
        reason: dto.reason,
        capturedByUserId: userId,
        capturedByRole: userRole,
        deviceInfo: dto.deviceInfo || null,
        mileage: dto.mileage || null,
        isGpsMissing: false,
      },
    });

    // Audit log for manual snapshots
    if (dto.reason === GpsSnapshotReason.MANUAL) {
      await this.auditService.log({
        userId,
        agencyId: dto.agencyId,
        action: AuditAction.CREATE,
        entityType: 'GpsSnapshot',
        entityId: snapshot.id,
        description: `Snapshot GPS manuel créé`,
        metadata: {
          latitude: dto.latitude,
          longitude: dto.longitude,
          bookingId: dto.bookingId,
          vehicleId: dto.vehicleId,
        },
      });
    }

    return snapshot;
  }

  /**
   * V2: Record GPS missing (when GPS is unavailable)
   * This allows the action to proceed but records that GPS was unavailable
   */
  async recordGpsMissing(
    dto: CreateGpsSnapshotMissingDto,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const snapshot = await (this.prisma as any).gpsSnapshot.create({
      data: {
        agencyId: dto.agencyId,
        bookingId: dto.bookingId || null,
        vehicleId: dto.vehicleId || null,
        latitude: 0, // Default values for missing GPS
        longitude: 0,
        reason: dto.reason,
        capturedByUserId: userId,
        capturedByRole: userRole,
        isGpsMissing: true,
        gpsMissingReason: dto.gpsMissingReason,
        mileage: dto.mileage || null,
      },
    });

    return snapshot;
  }

  /**
   * V2: Get snapshots for a booking
   */
  async findByBooking(bookingId: string): Promise<any[]> {
    return (this.prisma as any).gpsSnapshot.findMany({
      where: { bookingId },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, registrationNumber: true, status: true } },
        booking: { select: { id: true, bookingNumber: true, client: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * V2: Get snapshots for a vehicle
   */
  async findByVehicle(vehicleId: string): Promise<any[]> {
    return (this.prisma as any).gpsSnapshot.findMany({
      where: { vehicleId },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, registrationNumber: true, status: true } },
        booking: { select: { id: true, bookingNumber: true, client: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * V2: Get snapshots for an agency
   */
  async findByAgency(
    agencyId: string,
    options?: {
      dateFrom?: Date;
      dateTo?: Date;
      reason?: GpsSnapshotReasonType;
      limit?: number;
    },
  ): Promise<any[]> {
    const where: any = { agencyId };

    if (options?.reason) {
      where.reason = options.reason;
    }

    if (options?.dateFrom || options?.dateTo) {
      where.createdAt = {};
      if (options.dateFrom) where.createdAt.gte = options.dateFrom;
      if (options.dateTo) where.createdAt.lte = options.dateTo;
    }

    return (this.prisma as any).gpsSnapshot.findMany({
      where,
      include: {
        vehicle: { select: { id: true, brand: true, model: true, registrationNumber: true, status: true } },
        booking: { select: { id: true, bookingNumber: true, client: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 500,
    });
  }

  /**
   * V2: Get a single snapshot
   */
  async findOne(id: string): Promise<any> {
    const snapshot = await (this.prisma as any).gpsSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot GPS non trouvé');
    }

    return snapshot;
  }
}
