import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { BusinessEventType } from '@prisma/client';

@Injectable()
export class AgencyService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  async findAll(user: any) {
    let agencies;
    if (user.role === 'SUPER_ADMIN') {
      agencies = await this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter(),
        include: {
          company: true,
          _count: {
            select: {
              vehicles: true,
              bookings: true,
              userAgencies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      agencies = await this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter({ companyId: user.companyId }),
        include: {
          company: true,
          _count: {
            select: {
              vehicles: true,
              bookings: true,
              userAgencies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.agencyIds && user.agencyIds.length > 0) {
      agencies = await this.prisma.agency.findMany({
        where: this.softDeleteService.addSoftDeleteFilter({ id: { in: user.agencyIds } }),
        include: {
          company: true,
          _count: {
            select: {
              vehicles: true,
              bookings: true,
              userAgencies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return [];
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFieldsFromArray(agencies);
  }

  async findOne(id: string, user: any) {
    const agency = await this.prisma.agency.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      include: {
        company: true,
        vehicles: true,
        userAgencies: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // Check permissions
    if (user.role === 'COMPANY_ADMIN' && agency.companyId !== user.companyId) {
      throw new ForbiddenException('Access denied');
    }

    if ((user.role === 'AGENCY_MANAGER' || user.role === 'AGENT') && !user.agencyIds?.includes(id)) {
      throw new ForbiddenException('Access denied');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(agency);
  }

  async create(createAgencyDto: CreateAgencyDto, user: any) {
    const { name, phone, address, companyId } = createAgencyDto;

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    let targetCompanyId = companyId || user.companyId;

    if (user.role === 'SUPER_ADMIN') {
      if (!companyId) {
        throw new BadRequestException('Company ID required');
      }
      targetCompanyId = companyId;
    } else if (user.role === 'COMPANY_ADMIN') {
      if (companyId && companyId !== user.companyId) {
        throw new ForbiddenException('Cannot create agency for another company');
      }
      targetCompanyId = user.companyId!;
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: targetCompanyId },
    });

    if (!company || !company.isActive) {
      throw new BadRequestException('Company not found or inactive');
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        name,
        phone,
        address,
        companyId: targetCompanyId,
        preparationTimeMinutes: createAgencyDto.preparationTimeMinutes || 60, // Default 60 minutes
      },
      user?.id || user?.userId || user?.sub,
    );

    const agency = await this.prisma.agency.create({
      data: dataWithAudit,
      include: {
        company: true,
      },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        agency.id,
        'Agency',
        agency.id,
        BusinessEventType.AGENCY_CREATED,
        null,
        agency,
        user?.id || user?.userId || user?.sub,
        agency.companyId, // companyId
      )
      .catch((err) => console.error('Error logging agency creation event:', err));

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(agency);
  }

  async update(id: string, updateAgencyDto: UpdateAgencyDto, user: any) {
    const agency = await this.prisma.agency.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // Check permissions
    if (user.role === 'COMPANY_ADMIN' && agency.companyId !== user.companyId) {
      throw new ForbiddenException('Cannot update agency from another company');
    }

    if ((user.role === 'AGENCY_MANAGER' || user.role === 'AGENT') && !user.agencyIds?.includes(id)) {
      throw new ForbiddenException('Access denied');
    }

    // Store previous state for event log
    const previousState = { ...agency };

    const updateData: any = {};
    if (updateAgencyDto.name !== undefined) updateData.name = updateAgencyDto.name;
    if (updateAgencyDto.phone !== undefined) updateData.phone = updateAgencyDto.phone;
    if (updateAgencyDto.address !== undefined) updateData.address = updateAgencyDto.address;
    if (updateAgencyDto.preparationTimeMinutes !== undefined) {
      if (updateAgencyDto.preparationTimeMinutes < 1) {
        throw new BadRequestException('Le temps de préparation doit être supérieur à 0');
      }
      updateData.preparationTimeMinutes = updateAgencyDto.preparationTimeMinutes;
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(updateData, user?.id || user?.userId || user?.sub);

    const updatedAgency = await this.prisma.agency.update({
      where: { id },
      data: dataWithAudit,
      include: {
        company: true,
      },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        updatedAgency.id,
        'Agency',
        updatedAgency.id,
        BusinessEventType.AGENCY_UPDATED,
        previousState,
        updatedAgency,
        user?.id || user?.userId || user?.sub,
        updatedAgency.companyId, // companyId
      )
      .catch((err) => console.error('Error logging agency update event:', err));

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(updatedAgency);
  }

  async remove(id: string, user: any) {
    const agency = await this.prisma.agency.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      include: { company: true },
    });

    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    if (user.role === 'COMPANY_ADMIN' && agency.companyId !== user.companyId) {
      throw new ForbiddenException('Cannot delete agency from another company');
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Store previous state for event log
    const previousState = { ...agency };

    // Add delete audit fields
    const deleteData = this.auditService.addDeleteAuditFields({}, user?.id || user?.userId || user?.sub);

    await this.prisma.agency.update({
      where: { id },
      data: deleteData,
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        agency.id,
        'Agency',
        agency.id,
        BusinessEventType.AGENCY_DELETED,
        previousState,
        { ...agency, ...deleteData },
        user?.id || user?.userId || user?.sub,
        agency.companyId, // companyId
      )
      .catch((err) => console.error('Error logging agency deletion event:', err));

    return { message: 'Agency deleted successfully' };
  }
}
