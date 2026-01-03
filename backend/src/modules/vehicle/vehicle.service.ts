import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { BusinessEventType } from '@prisma/client';

@Injectable()
export class VehicleService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private permissionService: PermissionService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  async findAll(user: any, agencyId?: string) {
    const agencyFilter = this.permissionService.buildAgencyFilter(user, agencyId);
    if (!agencyFilter) return [];

    const where = this.softDeleteService.addSoftDeleteFilter({
      ...agencyFilter,
    });

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        agency: {
          include: { company: true },
        },
        _count: {
          select: {
            bookings: true,
            maintenance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove audit fields from public responses
    return this.auditService.removeAuditFieldsFromArray(vehicles);
  }

  async findOne(id: string, user: any) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      include: {
        agency: {
          include: { company: true },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(vehicle.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(vehicle);
  }

  async create(createVehicleDto: CreateVehicleDto, user: any) {
    const hasAccess = await this.permissionService.checkAgencyAccess(createVehicleDto.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }

    const existingVehicle = await this.prisma.vehicle.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({
        registrationNumber: createVehicleDto.registrationNumber,
      }),
    });

    if (existingVehicle) {
      throw new BadRequestException(
        `Un véhicule avec l'immatriculation ${createVehicleDto.registrationNumber} existe déjà`
      );
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        agencyId: createVehicleDto.agencyId,
        registrationNumber: createVehicleDto.registrationNumber,
        brand: createVehicleDto.brand,
        model: createVehicleDto.model,
        year: createVehicleDto.year || new Date().getFullYear(),
        mileage: createVehicleDto.mileage || 0,
        fuel: createVehicleDto.fuel,
        gearbox: createVehicleDto.gearbox,
        dailyRate: createVehicleDto.dailyRate || 0,
        depositAmount: createVehicleDto.depositAmount || 0,
        status: createVehicleDto.status || 'AVAILABLE',
        imageUrl: createVehicleDto.imageUrl,
        color: createVehicleDto.color,
        horsepower: createVehicleDto.horsepower,
      },
      user.id,
    );

    const vehicle = await this.prisma.vehicle.create({
      data: dataWithAudit,
      include: {
        agency: {
          include: { company: true },
        },
      },
    });

    // Log business event (async, non-blocking)
    this.businessEventLogService
      .logEvent(
        vehicle.agencyId,
        'Vehicle',
        vehicle.id,
        BusinessEventType.VEHICLE_CREATED,
        null,
        vehicle,
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.auditService.removeAuditFields(vehicle);
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto, user: any) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(vehicle.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    if (updateVehicleDto.registrationNumber && updateVehicleDto.registrationNumber !== vehicle.registrationNumber) {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: this.softDeleteService.addSoftDeleteFilter({
          registrationNumber: updateVehicleDto.registrationNumber,
        }),
      });

      if (existingVehicle) {
        throw new BadRequestException(
          `Un véhicule avec l'immatriculation ${updateVehicleDto.registrationNumber} existe déjà`
        );
      }
    }

    // Store previous state for event log
    const previousState = { ...vehicle };

    // Check if status changed
    const statusChanged = updateVehicleDto.status && updateVehicleDto.status !== vehicle.status;

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(updateVehicleDto, user.id);

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: dataWithAudit,
      include: {
        agency: {
          include: { company: true },
        },
      },
    });

    // Log business event
    const eventType = statusChanged
      ? BusinessEventType.VEHICLE_STATUS_CHANGED
      : BusinessEventType.VEHICLE_UPDATED;

    this.businessEventLogService
      .logEvent(
        updatedVehicle.agencyId,
        'Vehicle',
        updatedVehicle.id,
        eventType,
        previousState,
        updatedVehicle,
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.auditService.removeAuditFields(updatedVehicle);
  }

  async remove(id: string, user: any, reason?: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(vehicle.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Store previous state for event log
    const previousState = { ...vehicle };

    // Add audit fields for soft delete
    const deleteData = this.auditService.addDeleteAuditFields({}, user.id, reason);

    await this.prisma.vehicle.update({
      where: { id },
      data: deleteData,
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        vehicle.agencyId,
        'Vehicle',
        vehicle.id,
        BusinessEventType.VEHICLE_DELETED,
        previousState,
        { ...vehicle, ...deleteData },
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    return { message: 'Vehicle deleted successfully' };
  }
}
