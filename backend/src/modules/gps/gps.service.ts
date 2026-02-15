import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, GpsSnapshotReason as PrismaGpsSnapshotReason } from '@prisma/client';

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

/**
 * Helper: enforce that the user can access the given agencyId.
 * COMPANY_ADMIN: agency must belong to their company.
 * AGENCY_MANAGER / AGENT: must be assigned to the agency.
 */
async function enforceAgencyAccess(prisma: PrismaService, user: any, agencyId?: string): Promise<void> {
  if (!agencyId) return;
  if (user.role === 'SUPER_ADMIN') return;
  if (user.role === 'COMPANY_ADMIN') {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { companyId: true },
    });
    if (!agency || agency.companyId !== user.companyId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette agence');
    }
    return;
  }
  if (!user.agencyIds || !user.agencyIds.includes(agencyId)) {
    throw new ForbiddenException('Vous n\'avez pas accès à cette agence');
  }
}

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
    user?: any,
  ): Promise<any> {
    // Enforce agency access
    if (user) {
      await enforceAgencyAccess(this.prisma, user, dto.agencyId);
    }

    // Check permissions for manual snapshots
    if (dto.reason === GpsSnapshotReason.MANUAL) {
      if (!MANUAL_SNAPSHOT_ROLES.includes(userRole)) {
        throw new ForbiddenException(
          'Seuls les managers peuvent créer des snapshots GPS manuels',
        );
      }
    }

    const snapshot = await this.prisma.gpsSnapshot.create({
      data: {
        agencyId: dto.agencyId,
        bookingId: dto.bookingId || null,
        vehicleId: dto.vehicleId || null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy || null,
        altitude: dto.altitude || null,
        reason: dto.reason as PrismaGpsSnapshotReason,
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
   */
  async recordGpsMissing(
    dto: CreateGpsSnapshotMissingDto,
    userId: string,
    userRole: string,
    user?: any,
  ): Promise<any> {
    // Enforce agency access
    if (user) {
      await enforceAgencyAccess(this.prisma, user, dto.agencyId);
    }

    const snapshot = await this.prisma.gpsSnapshot.create({
      data: {
        agencyId: dto.agencyId,
        bookingId: dto.bookingId || null,
        vehicleId: dto.vehicleId || null,
        latitude: 0,
        longitude: 0,
        reason: dto.reason as PrismaGpsSnapshotReason,
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
   * V2: Get snapshots for a booking (scoped by user)
   */
  async findByBooking(bookingId: string, user?: any): Promise<any[]> {
    // If user provided, verify the booking belongs to their company/agency
    if (user && user.role !== 'SUPER_ADMIN') {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { agencyId: true, companyId: true },
      });
      if (!booking) throw new NotFoundException('Réservation introuvable');
      if (booking.companyId !== user.companyId) throw new ForbiddenException('Accès refusé');
      await enforceAgencyAccess(this.prisma, user, booking.agencyId);
    }

    return this.prisma.gpsSnapshot.findMany({
      where: { bookingId },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, registrationNumber: true, status: true } },
        booking: { select: { id: true, bookingNumber: true, client: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * V2: Get snapshots for a vehicle (scoped by user)
   */
  async findByVehicle(vehicleId: string, user?: any): Promise<any[]> {
    // If user provided, verify the vehicle belongs to their company/agency
    if (user && user.role !== 'SUPER_ADMIN') {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { agencyId: true, agency: { select: { companyId: true } } },
      });
      if (!vehicle) throw new NotFoundException('Véhicule introuvable');
      if (vehicle.agency.companyId !== user.companyId) throw new ForbiddenException('Accès refusé');
      await enforceAgencyAccess(this.prisma, user, vehicle.agencyId);
    }

    return this.prisma.gpsSnapshot.findMany({
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
   * V2: Get snapshots for an agency (scoped by user)
   */
  async findByAgency(
    agencyId: string,
    options?: {
      dateFrom?: Date;
      dateTo?: Date;
      reason?: GpsSnapshotReasonType;
      limit?: number;
    },
    user?: any,
  ): Promise<any[]> {
    if (user) {
      await enforceAgencyAccess(this.prisma, user, agencyId);
    }

    const where: any = { agencyId };

    if (options?.reason) {
      where.reason = options.reason;
    }

    if (options?.dateFrom || options?.dateTo) {
      where.createdAt = {};
      if (options.dateFrom) where.createdAt.gte = options.dateFrom;
      if (options.dateTo) where.createdAt.lte = options.dateTo;
    }

    return this.prisma.gpsSnapshot.findMany({
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
   * V2: Get a single snapshot (scoped by user)
   */
  async findOne(id: string, user?: any): Promise<any> {
    const snapshot = await this.prisma.gpsSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot GPS non trouvé');
    }

    // If user provided, verify agency access
    if (user && user.role !== 'SUPER_ADMIN') {
      await enforceAgencyAccess(this.prisma, user, snapshot.agencyId);
    }

    return snapshot;
  }
}
