import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JournalService, CreateManualNoteDto, UpdateManualNoteDto } from './journal.service';
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

@ApiTags('Journal')
@Controller('journal')
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
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  @Permissions('journal:read')
  @ApiOperation({ summary: 'Get journal entries with filters' })
  async findAll(
    @Query('agencyId') agencyId: string,
    @Query('type') type: string,
    @Query('bookingId') bookingId: string,
    @Query('bookingNumber') bookingNumber: string,
    @Query('vehicleId') vehicleId: string,
    @Query('userId') userId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('isManualNote') isManualNote: string,
    @CurrentUser() user: any,
  ) {
    return this.journalService.findAll({
      agencyId: agencyId || user.agencyIds?.[0],
      companyId: user.companyId,
      type: type as any,
      bookingId,
      bookingNumber,
      vehicleId,
      userId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      isManualNote: isManualNote === 'true' ? true : isManualNote === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @Permissions('journal:read')
  @ApiOperation({ summary: 'Get a journal entry by ID' })
  async findOne(@Param('id') id: string) {
    return this.journalService.findOne(id);
  }

  @Post('notes')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.AGENCY_MANAGER)
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('journal:create')
  @ApiOperation({ summary: 'Create a manual note (managers only)' })
  async createNote(@Body() dto: CreateManualNoteDto, @CurrentUser() user: any) {
    return this.journalService.createManualNote(
      dto,
      user.userId,
      user.role,
      user.companyId,
    );
  }

  @Patch('notes/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.AGENCY_MANAGER)
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('journal:update')
  @ApiOperation({ summary: 'Update a manual note (managers only)' })
  async updateNote(
    @Param('id') id: string,
    @Body() dto: UpdateManualNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.journalService.updateManualNote(id, dto, user.userId, user.role);
  }

  @Delete('notes/:id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.AGENCY_MANAGER)
  @RequirePermission(UserAgencyPermission.FULL)
  @Permissions('journal:delete')
  @ApiOperation({ summary: 'Delete a manual note (managers only)' })
  async deleteNote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.journalService.deleteManualNote(id, user.userId, user.role);
  }
}
