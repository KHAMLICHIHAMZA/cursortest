import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { CmiService } from './cmi.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [PrismaModule, BookingModule],
  controllers: [PaymentController],
  providers: [PaymentService, CmiService],
  exports: [PaymentService],
})
export class PaymentModule {}





