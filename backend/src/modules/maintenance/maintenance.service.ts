import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { PlanningService } from '../planning/planning.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { MaintenanceStatus, BusinessEventType } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private permissionService: PermissionService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
    private planningService: PlanningService,
  ) {}

  async findAll(user: any, filters?: { agencyId?: string; vehicleId?: string; status?: MaintenanceStatus }) {
    let where: any = {};

    if (user.role === 'SUPER_ADMIN') {
      if (filters?.agencyId) where.agencyId = filters.agencyId;
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.status) where.status = filters.status;
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
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.status) where.status = filters.status;
    } else if (user.agencyIds && user.agencyIds.length > 0) {
      where.agencyId = { in: user.agencyIds };
      if (filters?.agencyId && user.agencyIds.includes(filters.agencyId)) {
        where.agencyId = filters.agencyId;
      } else if (filters?.agencyId) {
        return [];
      }
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.status) where.status = filters.status;
    } else {
      return [];
    }

    const maintenances = await this.prisma.maintenance.findMany({
      where,
      include: {
        agency: {
          include: { company: true },
        },
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove audit fields from public responses
    return this.auditService.removeAuditFieldsFromArray(maintenances);
  }

  async findOne(id: string, user: any) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
      include: {
        agency: {
          include: { company: true },
        },
        vehicle: true,
      },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(maintenance.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(maintenance);
  }

  async create(createMaintenanceDto: CreateMaintenanceDto, user: any) {
    const { agencyId, vehicleId, description, plannedAt, cost, status, documentUrl } = createMaintenanceDto;

    if (!agencyId || !vehicleId || !description) {
      throw new BadRequestException('Missing required fields');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }

    // Check if vehicle exists and belongs to agency
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.agencyId !== agencyId) {
      throw new BadRequestException('Vehicle not found or does not belong to this agency');
    }

    // Vérifier qu'il n'y a pas de location en cours pour ce véhicule
    if (plannedAt) {
      const maintenanceStart = new Date(plannedAt);
      const maintenanceEnd = new Date(plannedAt);
      maintenanceEnd.setHours(maintenanceEnd.getHours() + 4); // Durée par défaut 4h

      const isAvailable = await this.planningService.getVehicleAvailability(
        vehicleId,
        maintenanceStart,
        maintenanceEnd,
      );

      if (!isAvailable) {
        const conflicts = await this.planningService.detectConflicts(
          vehicleId,
          maintenanceStart,
          maintenanceEnd,
        );
        
        const bookingConflicts = conflicts.filter((c) => c.type === 'BOOKING');
        if (bookingConflicts.length > 0) {
          throw new ConflictException({
            message: 'Le véhicule est en location pendant cette période. Impossible de planifier une maintenance.',
            conflicts: bookingConflicts,
          });
        }
      }
    } else if (status === MaintenanceStatus.IN_PROGRESS) {
      // Si la maintenance est en cours sans date planifiée, vérifier qu'il n'y a pas de location active
      const activeBookings = await this.prisma.booking.findMany({
        where: {
          vehicleId,
          deletedAt: null,
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      });

      if (activeBookings.length > 0) {
        throw new ConflictException({
          message: 'Le véhicule est actuellement en location. Impossible de démarrer une maintenance.',
          conflicts: activeBookings.map((b) => ({
            type: 'BOOKING',
            id: b.id,
            startDate: b.startDate,
            endDate: b.endDate,
          })),
        });
      }
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        agencyId,
        vehicleId,
        description,
        plannedAt: plannedAt ? new Date(plannedAt) : null,
        cost: cost ? parseFloat(cost.toString()) : null,
        status: status || MaintenanceStatus.PLANNED,
        documentUrl: documentUrl || null,
      },
      user.id,
    );

    const maintenance = await this.prisma.maintenance.create({
      data: dataWithAudit,
      include: {
        agency: {
          include: { company: true },
        },
        vehicle: true,
      },
    });

    // Update vehicle status if maintenance is in progress
    if (maintenance.status === MaintenanceStatus.IN_PROGRESS) {
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'MAINTENANCE' },
      });
    }

    // Log business event (async, non-blocking)
    this.businessEventLogService
      .logEvent(
        maintenance.agencyId,
        'Maintenance',
        maintenance.id,
        BusinessEventType.MAINTENANCE_CREATED,
        null,
        maintenance,
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.auditService.removeAuditFields(maintenance);
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto, user: any) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(maintenance.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Store previous state for event log
    const previousState = { ...maintenance };

    const oldStatus = maintenance.status;
    const updateData: any = {
      description: updateMaintenanceDto.description || maintenance.description,
      status: updateMaintenanceDto.status || maintenance.status,
    };

    if (updateMaintenanceDto.plannedAt !== undefined) {
      updateData.plannedAt = updateMaintenanceDto.plannedAt ? new Date(updateMaintenanceDto.plannedAt) : null;
    } else {
      updateData.plannedAt = maintenance.plannedAt;
    }

    if (updateMaintenanceDto.cost !== undefined) {
      updateData.cost = updateMaintenanceDto.cost ? parseFloat(updateMaintenanceDto.cost.toString()) : null;
    } else {
      updateData.cost = maintenance.cost;
    }

    if (updateMaintenanceDto.documentUrl !== undefined) {
      updateData.documentUrl = updateMaintenanceDto.documentUrl || null;
    } else {
      updateData.documentUrl = maintenance.documentUrl;
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(updateData, user.id);

    const updatedMaintenance = await this.prisma.maintenance.update({
      where: { id },
      data: dataWithAudit,
      include: {
        agency: {
          include: { company: true },
        },
        vehicle: true,
      },
    });

    // Update vehicle status based on maintenance status
    if (updatedMaintenance.status === MaintenanceStatus.IN_PROGRESS && oldStatus !== MaintenanceStatus.IN_PROGRESS) {
      await this.prisma.vehicle.update({
        where: { id: maintenance.vehicleId },
        data: { status: 'MAINTENANCE' },
      });
    } else if (
      (updatedMaintenance.status === MaintenanceStatus.COMPLETED ||
        updatedMaintenance.status === MaintenanceStatus.CANCELLED) &&
      oldStatus === MaintenanceStatus.IN_PROGRESS
    ) {
      await this.prisma.vehicle.update({
        where: { id: maintenance.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    // Log business event
    const eventType = updateMaintenanceDto.status && updateMaintenanceDto.status !== oldStatus
      ? BusinessEventType.MAINTENANCE_STATUS_CHANGED
      : BusinessEventType.MAINTENANCE_UPDATED;

    this.businessEventLogService
      .logEvent(
        updatedMaintenance.agencyId,
        'Maintenance',
        updatedMaintenance.id,
        eventType,
        previousState,
        updatedMaintenance,
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.auditService.removeAuditFields(updatedMaintenance);
  }

  async remove(id: string, user: any, reason?: string) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(maintenance.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Store previous state for event log
    const previousState = { ...maintenance };

    // Add audit fields for soft delete
    const deleteData = this.auditService.addDeleteAuditFields({}, user.id, reason);

    await this.prisma.maintenance.update({
      where: { id },
      data: deleteData,
    });

    // Restore vehicle to available if maintenance was in progress
    if (maintenance.status === MaintenanceStatus.IN_PROGRESS) {
      await this.prisma.vehicle.update({
        where: { id: maintenance.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    return { message: 'Maintenance deleted successfully' };
  }
}
