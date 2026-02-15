import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { UpdateFineDto } from './dto/update-fine.dto';
import { BookingStatus, BusinessEventType, FineStatus } from '@prisma/client';

@Injectable()
export class FineService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private permissionService: PermissionService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  async findAll(user: any, filters?: { agencyId?: string; bookingId?: string }) {
    let where: any = {};

    if (user.role === 'SUPER_ADMIN') {
      if (filters?.agencyId) where.agencyId = filters.agencyId;
      if (filters?.bookingId) where.bookingId = filters.bookingId;
    } else if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      where.agency = { companyId: user.companyId };
      if (filters?.agencyId) {
        const agency = await this.prisma.agency.findFirst({
          where: { id: filters.agencyId, companyId: user.companyId },
        });
        if (agency) {
          where.agencyId = filters.agencyId;
        } else {
          return [];
        }
      }
      if (filters?.bookingId) where.bookingId = filters.bookingId;
    } else if (user.agencyIds && user.agencyIds.length > 0) {
      where.agencyId = { in: user.agencyIds };
      if (filters?.agencyId && user.agencyIds.includes(filters.agencyId)) {
        where.agencyId = filters.agencyId;
      } else if (filters?.agencyId) {
        return [];
      }
      if (filters?.bookingId) where.bookingId = filters.bookingId;
    } else {
      return [];
    }

    const fines = await this.prisma.fine.findMany({
      where,
      include: {
        agency: {
          include: { company: true },
        },
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove audit fields from public responses
    return this.auditService.removeAuditFieldsFromArray(fines);
  }

  async findOne(id: string, user: any) {
    const fine = await this.prisma.fine.findUnique({
      where: { id },
      include: {
        agency: {
          include: { company: true },
        },
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    if (!fine) {
      throw new NotFoundException('Amende introuvable');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(fine.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Accès refusé : vous n\'avez pas les droits pour consulter cette amende');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(fine);
  }

  async create(createFineDto: CreateFineDto, user: any) {
    const {
      agencyId,
      bookingId,
      amount,
      description,
      number,
      location,
      attachmentUrl,
      infractionDate: infractionDateStr,
      registrationNumber,
      status: statusStr,
    } = createFineDto;

    if (!agencyId || !amount || !description) {
      throw new BadRequestException('Champs requis manquants : l\'identifiant agence, le montant et la description sont obligatoires');
    }

    if (!bookingId && !registrationNumber) {
      throw new BadRequestException('Le bookingId ou le numéro d\'immatriculation doit être fourni');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Accès refusé à cette agence');
    }

    let resolvedBookingId: string | null = bookingId || null;
    let resolvedClientId: string | null = null;
    let resolvedStatus: FineStatus =
      (statusStr as FineStatus) || FineStatus.RECUE;

    const infractionDate = infractionDateStr
      ? new Date(infractionDateStr)
      : null;

    // Auto-identification: registrationNumber provided but no bookingId
    if (registrationNumber && !bookingId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          agencyId,
          registrationNumber: { equals: registrationNumber, mode: 'insensitive' },
          deletedAt: null,
        },
      });

      if (vehicle && infractionDate) {
        const activeBooking = await this.prisma.booking.findFirst({
          where: {
            agencyId,
            vehicleId: vehicle.id,
            startDate: { lte: infractionDate },
            endDate: { gte: infractionDate },
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.RETURNED] },
            deletedAt: null,
          },
          include: { client: true },
          orderBy: { startDate: 'desc' },
        });

        if (activeBooking) {
          resolvedBookingId = activeBooking.id;
          resolvedClientId = activeBooking.clientId;
          resolvedStatus = FineStatus.CLIENT_IDENTIFIE;
        }
      }
    }

    // If bookingId provided (or resolved), validate it exists
    if (resolvedBookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: resolvedBookingId },
      });

      if (!booking || booking.agencyId !== agencyId) {
        throw new BadRequestException('Réservation introuvable ou n\'appartient pas à cette agence');
      }

      if (!resolvedClientId) {
        resolvedClientId = booking.clientId;
      }
    }

    const createData = {
      agencyId,
      bookingId: resolvedBookingId,
      amount: parseFloat(amount.toString()),
      description,
      number: number || null,
      location: location || null,
      attachmentUrl: attachmentUrl || null,
      infractionDate,
      registrationNumber: registrationNumber || null,
      status: resolvedStatus,
      clientId: resolvedClientId,
    };

    const dataWithAudit = this.auditService.addCreateAuditFields(
      createData,
      user.userId || user.id,
    );

    const fine = await this.prisma.fine.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: dataWithAudit as any,
      include: {
        agency: {
          include: { company: true },
        },
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    this.businessEventLogService
      .logEvent(
        fine.agencyId,
        'Fine',
        fine.id,
        BusinessEventType.FINE_CREATED,
        null,
        fine,
        user.userId || user.id,
      )
      .catch(() => {});

    return this.auditService.removeAuditFields(fine);
  }

  async update(id: string, updateFineDto: UpdateFineDto, user: any) {
    const fine = await this.prisma.fine.findUnique({
      where: { id },
    });

    if (!fine) {
      throw new NotFoundException('Amende introuvable');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(fine.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Accès refusé : vous n\'avez pas les droits pour modifier cette amende');
    }

    // Store previous state for event log
    const previousState = { ...fine };

    const updateData: any = {};
    if (updateFineDto.amount !== undefined) {
      updateData.amount = parseFloat(updateFineDto.amount.toString());
    }
    if (updateFineDto.description !== undefined) {
      updateData.description = updateFineDto.description;
    }
    if (updateFineDto.number !== undefined) {
      updateData.number = updateFineDto.number || null;
    }
    if (updateFineDto.location !== undefined) {
      updateData.location = updateFineDto.location || null;
    }
    if (updateFineDto.attachmentUrl !== undefined) {
      updateData.attachmentUrl = updateFineDto.attachmentUrl || null;
    }
    if (updateFineDto.status !== undefined) {
      updateData.status = updateFineDto.status as FineStatus;
    }
    if (updateFineDto.infractionDate !== undefined) {
      updateData.infractionDate = updateFineDto.infractionDate
        ? new Date(updateFineDto.infractionDate)
        : null;
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(updateData, user.userId || user.id);

    const updatedFine = await this.prisma.fine.update({
      where: { id },
      data: dataWithAudit,
      include: {
        agency: {
          include: { company: true },
        },
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        updatedFine.agencyId,
        'Fine',
        updatedFine.id,
        BusinessEventType.FINE_UPDATED,
        previousState,
        updatedFine,
        user.userId || user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.auditService.removeAuditFields(updatedFine);
  }

  async remove(id: string, user: any, reason?: string) {
    const fine = await this.prisma.fine.findFirst({
      where: { id },
    });

    if (!fine) {
      throw new NotFoundException('Amende introuvable');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(fine.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Accès refusé : vous n\'avez pas les droits pour supprimer cette amende');
    }

    // Store previous state for event log
    const previousState = { ...fine };

    // Fine model does not support soft delete (no deletedAt field)
    // Perform hard delete
    await this.prisma.fine.delete({
      where: { id },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        fine.agencyId,
        'Fine',
        fine.id,
        BusinessEventType.FINE_DELETED,
        previousState,
        { deleted: true },
        user.userId || user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    return { message: 'Amende supprimée avec succès' };
  }
}

