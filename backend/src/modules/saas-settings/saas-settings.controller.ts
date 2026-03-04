import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SaasSettingsService } from './saas-settings.service';
import { UpdateSaasSettingsDto } from './dto/update-saas-settings.dto';

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

  @Patch()
  @ApiOperation({ summary: 'Update global SaaS settings (SUPER_ADMIN)' })
  async updateSettings(@Body() dto: UpdateSaasSettingsDto) {
    return this.saasSettingsService.updateSettings(dto);
  }
}

