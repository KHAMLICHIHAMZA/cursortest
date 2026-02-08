import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permissions } from '../../common/guards/permission.guard';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { RequireModuleGuard } from '../../common/guards/require-module.guard';
import { RequireActiveCompanyGuard } from '../../common/guards/require-active-company.guard';
import { RequireActiveAgencyGuard } from '../../common/guards/require-active-agency.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { ModuleCode, UserAgencyPermission, InvoiceStatus, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModule } from '../../common/guards/require-module.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  RequireActiveAgencyGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.BOOKINGS) // Utiliser BOOKINGS car les factures sont liées aux bookings
@ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get all invoices for an agency' })
  async findAll(@Query('agencyId') agencyId: string, @CurrentUser() user: any) {
    return this.invoiceService.findAll(agencyId || user.agencyIds?.[0], user);
  }

  @Get(':id')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoiceService.findOne(id, user);
  }

  @Get(':id/payload')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'V2: Get frozen invoice payload for PDF rendering' })
  async getPayload(@Param('id') id: string) {
    return this.invoiceService.getInvoicePayload(id);
  }

  @Post('booking/:bookingId/generate')
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('invoices:create')
  @ApiOperation({ summary: 'Generate an invoice for a booking' })
  async generateInvoice(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.invoiceService.generateInvoice(bookingId, user.userId);
  }

  @Post(':id/credit-note')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.AGENCY_MANAGER)
  @RequirePermission(UserAgencyPermission.FULL)
  @Permissions('invoices:create')
  @ApiOperation({ summary: 'V2: Generate a credit note (avoir) for an existing invoice' })
  async generateCreditNote(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.invoiceService.generateCreditNote(id, user.userId, body.reason);
  }

  @Patch(':id/status')
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('invoices:update')
  @ApiOperation({ summary: 'Update invoice status (PAID, CANCELLED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: InvoiceStatus },
    @CurrentUser() user: any,
  ) {
    return this.invoiceService.updateStatus(id, body.status, user.userId);
  }
}


