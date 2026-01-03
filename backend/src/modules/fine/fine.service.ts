import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { UpdateFineDto } from './dto/update-fine.dto';
import { BusinessEventType } from '@prisma/client';

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
      throw new NotFoundException('Fine not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(fine.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(fine);
  }

  async create(createFineDto: CreateFineDto, user: any) {
    const { agencyId, bookingId, amount, description, number, location, attachmentUrl } = createFineDto;

    if (!agencyId || !bookingId || !amount || !description) {
      throw new BadRequestException('Missing required fields');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }

    // Check if booking exists and belongs to agency
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.agencyId !== agencyId) {
      throw new BadRequestException('Booking not found or does not belong to this agency');
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        agencyId,
        bookingId,
        amount: parseFloat(amount.toString()),
        description,
        number: number || null,
        location: location || null,
        attachmentUrl: attachmentUrl || null,
      },
      user.id,
    );

    const fine = await this.prisma.fine.create({
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

    // Log business event (async, non-blocking)
    this.businessEventLogService
      .logEvent(
        fine.agencyId,
        'Fine',
        fine.id,
        BusinessEventType.FINE_CREATED,
        null,
        fine,
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.auditService.removeAuditFields(fine);
  }

  async update(id: string, updateFineDto: UpdateFineDto, user: any) {
    const fine = await this.prisma.fine.findUnique({
      where: { id },
    });

    if (!fine) {
      throw new NotFoundException('Fine not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(fine.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
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

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(updateData, user.id);

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
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.auditService.removeAuditFields(updatedFine);
  }

  async remove(id: string, user: any, reason?: string) {
    const fine = await this.prisma.fine.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!fine) {
      throw new NotFoundException('Fine not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(fine.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Store previous state for event log
    const previousState = { ...fine };

    // Add audit fields for soft delete
    const deleteData = this.auditService.addDeleteAuditFields({}, user.id, reason);

    await this.prisma.fine.update({
      where: { id },
      data: deleteData,
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        fine.agencyId,
        'Fine',
        fine.id,
        BusinessEventType.FINE_DELETED,
        previousState,
        { ...fine, ...deleteData },
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    return { message: 'Fine deleted successfully' };
  }
}

