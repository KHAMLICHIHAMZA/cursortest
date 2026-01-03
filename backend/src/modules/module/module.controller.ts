import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModuleService } from './module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { ModuleCode } from '@prisma/client';

@ApiTags('Modules')
@Controller('modules')
@UseGuards(JwtAuthGuard, ReadOnlyGuard, RolesGuard)
@ApiBearerAuth()
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get company modules' })
  async getCompanyModules(@Param('companyId') companyId: string, @CurrentUser() user: any) {
    return this.moduleService.getCompanyModules(companyId, user);
  }

  @Get('agency/:agencyId')
  @ApiOperation({ summary: 'Get agency modules' })
  async getAgencyModules(@Param('agencyId') agencyId: string, @CurrentUser() user: any) {
    return this.moduleService.getAgencyModules(agencyId, user);
  }

  @Post('company/:companyId/:moduleCode/activate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Activate a module for a company (SUPER_ADMIN only)' })
  async activateCompanyModule(
    @Param('companyId') companyId: string,
    @Param('moduleCode') moduleCode: ModuleCode,
    @CurrentUser() user: any,
  ) {
    return this.moduleService.activateCompanyModule(companyId, moduleCode, user);
  }

  @Delete('company/:companyId/:moduleCode')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate a module for a company (SUPER_ADMIN only)' })
  async deactivateCompanyModule(
    @Param('companyId') companyId: string,
    @Param('moduleCode') moduleCode: ModuleCode,
    @CurrentUser() user: any,
  ) {
    return this.moduleService.deactivateCompanyModule(companyId, moduleCode, user);
  }

  @Post('agency/:agencyId/:moduleCode/activate')
  @Roles('COMPANY_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Activate a module for an agency' })
  async activateAgencyModule(
    @Param('agencyId') agencyId: string,
    @Param('moduleCode') moduleCode: ModuleCode,
    @CurrentUser() user: any,
  ) {
    return this.moduleService.activateAgencyModule(agencyId, moduleCode, user);
  }

  @Delete('agency/:agencyId/:moduleCode')
  @Roles('COMPANY_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate a module for an agency' })
  async deactivateAgencyModule(
    @Param('agencyId') agencyId: string,
    @Param('moduleCode') moduleCode: ModuleCode,
    @CurrentUser() user: any,
  ) {
    return this.moduleService.deactivateAgencyModule(agencyId, moduleCode, user);
  }
}


