import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, ReadOnlyGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all companies (SUPER_ADMIN only)' })
  async findAll() {
    return this.companyService.findAll();
  }

  @Get('me')
  @Roles('COMPANY_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get my company (Company Admin)' })
  async findMyCompany(@CurrentUser() user: any) {
    return this.companyService.findMyCompany(user);
  }

  @Patch('me/settings')
  @Roles('COMPANY_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update my company settings (V2)' })
  async updateMyCompanySettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.companyService.updateMyCompanySettings(user, dto);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get company by ID' })
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new company' })
  async create(@Body() createCompanyDto: CreateCompanyDto, @CurrentUser() user: any) {
    return this.companyService.create(createCompanyDto, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a company' })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.update(id, updateCompanyDto, user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a company' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.companyService.remove(id, user);
  }
}
