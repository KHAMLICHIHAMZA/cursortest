import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permissions } from '../../common/guards/permission.guard';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { RequireModuleGuard } from '../../common/guards/require-module.guard';
import { RequireActiveCompanyGuard } from '../../common/guards/require-active-company.guard';
import { RequireActiveAgencyGuard } from '../../common/guards/require-active-agency.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { ModuleCode, UserAgencyPermission } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModule } from '../../common/guards/require-module.guard';

@ApiTags('Incidents')
@Controller('incidents')
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  RequireActiveAgencyGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.BOOKINGS) // Utiliser BOOKINGS car les incidents sont liés aux bookings
@ApiBearerAuth()
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('incidents:create')
  @ApiOperation({ summary: 'Create an incident (damage, fine, etc.)' })
  async create(@Body() createIncidentDto: CreateIncidentDto, @CurrentUser() user: any) {
    return this.incidentService.create(createIncidentDto, user.userId);
  }

  @Get()
  @Permissions('incidents:read')
  @ApiOperation({ summary: 'Get all incidents for an agency' })
  async findAll(@Query('agencyId') agencyId: string, @Query('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.incidentService.findAll(agencyId || user.agencyIds?.[0], bookingId, user);
  }

  @Get(':id')
  @Permissions('incidents:read')
  @ApiOperation({ summary: 'Get an incident by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.incidentService.findOne(id, user);
  }

  @Patch(':id/status')
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('incidents:update')
  @ApiOperation({ summary: 'Update incident status (si DISPUTED → bloque clôture financière)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateIncidentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.incidentService.updateStatus(id, updateDto, user.userId);
  }
}


