import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChargeService, CreateChargeDto } from './charge.service';
import { Role } from '@prisma/client';

@ApiTags('Charges & KPI')
@Controller('charges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.AGENCY_MANAGER) // Spec: Manager/Gérant uniquement
@ApiBearerAuth()
export class ChargeController {
  constructor(private readonly chargeService: ChargeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a charge' })
  async create(@Body() dto: CreateChargeDto, @CurrentUser() user: any) {
    return this.chargeService.create(user.companyId, dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List charges' })
  async findAll(
    @CurrentUser() user: any,
    @Query('agencyId') agencyId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.chargeService.findAll(user.companyId, { agencyId, vehicleId, category, startDate, endDate });
  }

  @Get('kpi')
  @ApiOperation({ summary: 'Get KPI (revenue, margin, occupancy rate)' })
  async getKpi(
    @CurrentUser() user: any,
    @Query('agencyId') agencyId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = endDate || now.toISOString().slice(0, 10);
    return this.chargeService.computeKpi(user.companyId, { agencyId, vehicleId, startDate: start, endDate: end });
  }

  @Get('kpi/vehicles')
  @ApiOperation({ summary: 'Vehicle profitability ranking' })
  async vehicleProfitability(
    @CurrentUser() user: any,
    @Query('agencyId') agencyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = endDate || now.toISOString().slice(0, 10);
    return this.chargeService.vehicleProfitability(user.companyId, { agencyId, startDate: start, endDate: end });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a charge' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chargeService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a charge' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateChargeDto>, @CurrentUser() user: any) {
    return this.chargeService.update(id, user.companyId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a charge' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chargeService.delete(id, user.companyId);
  }
}
