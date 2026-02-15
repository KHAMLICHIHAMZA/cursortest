import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GpsService, CreateGpsSnapshotDto, CreateGpsSnapshotMissingDto } from './gps.service';
import { GpsKpiService } from './gps-kpi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permissions } from '../../common/guards/permission.guard';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { RequireActiveCompanyGuard } from '../../common/guards/require-active-company.guard';
import { RequireActiveAgencyGuard } from '../../common/guards/require-active-agency.guard';
import { RequireModuleGuard, RequireModule } from '../../common/guards/require-module.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ModuleCode, UserAgencyPermission, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('GPS')
@Controller('gps')
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  RequireActiveAgencyGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.VEHICLES)
@ApiBearerAuth()
export class GpsController {
  constructor(
    private readonly gpsService: GpsService,
    private readonly gpsKpiService: GpsKpiService,
  ) {}

  @Get()
  @Permissions('gps:read')
  @ApiOperation({ summary: 'Get GPS snapshots for an agency' })
  async findByAgency(
    @Query('agencyId') agencyId: string,
    @Query('reason') reason: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('limit') limit: string,
    @CurrentUser() user: any,
  ) {
    return this.gpsService.findByAgency(
      agencyId || user.agencyIds?.[0],
      {
        reason: reason as any,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      user,
    );
  }

  @Get(':id')
  @Permissions('gps:read')
  @ApiOperation({ summary: 'Get a GPS snapshot by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.gpsService.findOne(id, user);
  }

  @Get('booking/:bookingId')
  @Permissions('gps:read')
  @ApiOperation({ summary: 'Get GPS snapshots for a booking' })
  async findByBooking(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.gpsService.findByBooking(bookingId, user);
  }

  @Get('vehicle/:vehicleId')
  @Permissions('gps:read')
  @ApiOperation({ summary: 'Get GPS snapshots for a vehicle' })
  async findByVehicle(@Param('vehicleId') vehicleId: string, @CurrentUser() user: any) {
    return this.gpsService.findByVehicle(vehicleId, user);
  }

  @Post()
  @Permissions('gps:create')
  @ApiOperation({ summary: 'Capture a GPS snapshot' })
  async capture(@Body() dto: CreateGpsSnapshotDto, @CurrentUser() user: any) {
    return this.gpsService.captureSnapshot(dto, user.userId, user.role);
  }

  @Post('manual')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.AGENCY_MANAGER)
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('gps:create')
  @ApiOperation({ summary: 'Capture a manual GPS snapshot (managers only)' })
  async captureManual(@Body() dto: CreateGpsSnapshotDto, @CurrentUser() user: any) {
    return this.gpsService.captureSnapshot(
      { ...dto, reason: 'MANUAL' as any },
      user.userId,
      user.role,
    );
  }

  @Post('missing')
  @Permissions('gps:create')
  @ApiOperation({ summary: 'Record GPS missing (when GPS is unavailable)' })
  async recordMissing(@Body() dto: CreateGpsSnapshotMissingDto, @CurrentUser() user: any) {
    return this.gpsService.recordGpsMissing(dto, user.userId, user.role);
  }

  @Get('kpi/eco')
  @Permissions('gps:read')
  @ApiOperation({ summary: 'V2.1: GPS eco-friendly KPIs (distance, consistency, stats)' })
  async getEcoKpi(
    @CurrentUser() user: any,
    @Query('agencyId') agencyId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = endDate || now.toISOString().slice(0, 10);
    return this.gpsKpiService.computeKpi(user.companyId, {
      agencyId,
      vehicleId,
      startDate: start,
      endDate: end,
    });
  }
}
