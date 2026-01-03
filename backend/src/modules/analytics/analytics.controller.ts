import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permissions } from '../../common/guards/permission.guard';
import { ReadOnlyGuard, ReadOnlySafe } from '../../common/guards/read-only.guard';
import { RequireModuleGuard } from '../../common/guards/require-module.guard';
import { RequireActiveCompanyGuard } from '../../common/guards/require-active-company.guard';
import { RequireModule } from '../../common/guards/require-module.guard';
import { ModuleCode } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.ANALYTICS)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('global/kpis')
  @Permissions('analytics:read')
  @ReadOnlySafe() // Analytics are read-only, safe even in read-only mode
  @ApiOperation({ summary: 'Get global KPIs (SUPER_ADMIN only)' })
  async getGlobalKPIs(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getGlobalKPIs(user, start, end);
  }

  @Get('agency/:agencyId/kpis')
  @Permissions('analytics:read')
  @ReadOnlySafe() // Analytics are read-only, safe even in read-only mode
  @ApiOperation({ summary: 'Get KPIs for an agency' })
  async getAgencyKPIs(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getAgencyKPIs(agencyId, user, start, end);
  }
}

