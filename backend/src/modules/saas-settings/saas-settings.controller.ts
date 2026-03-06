import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SaasSettingsService } from './saas-settings.service';
import { UpdateSaasSettingsDto } from './dto/update-saas-settings.dto';
import { SimulateSaasPricingDto } from './dto/simulate-saas-pricing.dto';

@ApiTags('SaaS Settings')
@Controller('saas-settings')
@UseGuards(JwtAuthGuard, ReadOnlyGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class SaasSettingsController {
  constructor(private readonly saasSettingsService: SaasSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get global SaaS settings (SUPER_ADMIN)' })
  async getSettings() {
    return this.saasSettingsService.getSettings();
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get SaaS settings audit trail (SUPER_ADMIN)' })
  async getSettingsAudit() {
    return this.saasSettingsService.getSettingsAudit();
  }

  @Patch()
  @ApiOperation({ summary: 'Update global SaaS settings (SUPER_ADMIN)' })
  async updateSettings(@Body() dto: UpdateSaasSettingsDto) {
    return this.saasSettingsService.updateSettings(dto);
  }

  @Post('simulate-pricing')
  @ApiOperation({ summary: 'Simulate pricing and rules application (SUPER_ADMIN)' })
  async simulatePricing(@Body() dto: SimulateSaasPricingDto) {
    return this.saasSettingsService.simulatePricing(dto);
  }
}

