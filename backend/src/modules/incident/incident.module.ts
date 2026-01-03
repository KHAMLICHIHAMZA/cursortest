import { Module } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { BusinessEventLogModule } from '../business-event-log/business-event-log.module';
import { ServicesModule } from '../../common/services/services.module';

@Module({
  imports: [PrismaModule, AuditModule, BusinessEventLogModule, ServicesModule],
  controllers: [IncidentController],
  providers: [IncidentService],
  exports: [IncidentService],
})
export class IncidentModule {}

