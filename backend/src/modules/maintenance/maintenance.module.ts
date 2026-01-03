import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PlanningModule } from '../planning/planning.module';
import { BusinessEventLogModule } from '../business-event-log/business-event-log.module';

@Module({
  imports: [PrismaModule, PlanningModule, BusinessEventLogModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}





