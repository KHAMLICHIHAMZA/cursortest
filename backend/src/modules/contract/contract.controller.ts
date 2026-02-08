import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractService } from './contract.service';
import { CreateContractDto, SignContractDto } from './dto/create-contract.dto';
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

@ApiTags('Contracts')
@Controller('contracts')
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  RequireActiveAgencyGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.BOOKINGS)
@ApiBearerAuth()
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Get all contracts for an agency' })
  async findAll(@Query('agencyId') agencyId: string, @CurrentUser() user: any) {
    return this.contractService.findAll(agencyId || user.agencyIds?.[0]);
  }

  @Get(':id')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Get a contract by ID' })
  async findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Get(':id/payload')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'V2: Get frozen contract payload for PDF rendering' })
  async getPayload(@Param('id') id: string) {
    return this.contractService.getContractPayload(id);
  }

  @Get('booking/:bookingId')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Get current contract for a booking' })
  async findByBooking(@Param('bookingId') bookingId: string) {
    return this.contractService.findByBookingId(bookingId);
  }

  @Post()
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('contracts:create')
  @ApiOperation({ summary: 'Create a new contract for a booking' })
  async create(@Body() dto: CreateContractDto, @CurrentUser() user: any) {
    return this.contractService.createContract(dto, user.userId);
  }

  @Post(':id/sign')
  @Permissions('contracts:update')
  @ApiOperation({ summary: 'Sign a contract (client or agent)' })
  async sign(
    @Param('id') id: string,
    @Body() dto: SignContractDto,
    @CurrentUser() user: any,
  ) {
    return this.contractService.signContract(id, dto, user.userId, user.role);
  }

  @Post(':id/new-version')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.AGENCY_MANAGER)
  @RequirePermission(UserAgencyPermission.FULL)
  @Permissions('contracts:create')
  @ApiOperation({ summary: 'Create a new version of a contract' })
  async createNewVersion(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.contractService.createNewVersion(id, body.reason, user.userId);
  }

  @Patch(':id/effective')
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('contracts:update')
  @ApiOperation({ summary: 'Make a contract effective (at check-in)' })
  async makeEffective(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contractService.makeEffective(id, user.userId);
  }
}
