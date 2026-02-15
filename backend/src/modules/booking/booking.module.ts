import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PlanningModule } from '../planning/planning.module';
import { BusinessEventLogModule } from '../business-event-log/business-event-log.module';
import { AuditModule } from '../audit/audit.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { ServicesModule } from '../../common/services/services.module';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [PrismaModule, PlanningModule, BusinessEventLogModule, AuditModule, InvoiceModule, ServicesModule, ContractModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
