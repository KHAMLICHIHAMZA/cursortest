import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard, ReadOnlyGuard, RolesGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('subscription/:subscriptionId/invoice')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Generate invoice for a subscription (SUPER_ADMIN only)' })
  async generateInvoice(@Param('subscriptionId') subscriptionId: string) {
    return this.billingService.generateInvoice(subscriptionId);
  }

  @Patch('payment/:paymentId/record')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Record a payment (SUPER_ADMIN only)' })
  async recordPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount: number; paidAt: Date; invoiceNumber?: string; invoiceUrl?: string },
  ) {
    return this.billingService.recordPayment(
      paymentId,
      body.amount,
      body.paidAt,
      body.invoiceNumber,
      body.invoiceUrl,
    );
  }

  @Get('company/:companyId/invoices')
  @ApiOperation({ summary: 'Get company invoices' })
  async getCompanyInvoices(@Param('companyId') companyId: string, @CurrentUser() user: any) {
    return this.billingService.getCompanyInvoices(companyId, user);
  }

  @Get('invoices/pending')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get pending invoices (SUPER_ADMIN only)' })
  async getPendingInvoices() {
    return this.billingService.getPendingInvoices();
  }
}


