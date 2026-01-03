import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { HandleDepositDto } from './dto/handle-deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('online')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create online payment (CMI)' })
  async createOnlinePayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentService.createOnlinePayment(createPaymentDto, user.sub || user.userId);
  }

  @Post('cash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create cash payment' })
  async createCashPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentService.createCashPayment(createPaymentDto, user.sub || user.userId);
  }

  @Post('cmi/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'CMI payment callback (webhook)' })
  // Note: Pas de @UseGuards ici car c'est un webhook externe
  async handleCmiCallback(@Body() data: Record<string, any>) {
    return this.paymentService.handleCmiCallback(data);
  }

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Handle deposit (hold or return)' })
  async handleDeposit(@Body() handleDepositDto: HandleDepositDto, @CurrentUser() user: any) {
    return this.paymentService.handleDeposit(
      handleDepositDto.paymentId,
      handleDepositDto.action,
      handleDepositDto.amount,
    );
  }

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payments for a booking' })
  async getBookingPayments(@Param('bookingId') bookingId: string) {
    return this.paymentService.getBookingPayments(bookingId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a payment by ID' })
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }
}



