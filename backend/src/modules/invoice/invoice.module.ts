import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ServicesModule } from '../../common/services/services.module';
import { AuditModule } from '../audit/audit.module';
import { BusinessEventLogModule } from '../business-event-log/business-event-log.module';

@Module({
  imports: [PrismaModule, ServicesModule, AuditModule, BusinessEventLogModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService], // Exporter pour utilisation dans BookingModule
})
export class InvoiceModule {}
