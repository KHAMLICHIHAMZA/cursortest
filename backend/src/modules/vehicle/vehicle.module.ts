import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { VehicleSearchService } from './vehicle-search.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BusinessEventLogModule } from '../business-event-log/business-event-log.module';

@Module({
  imports: [PrismaModule, BusinessEventLogModule],
  controllers: [VehicleController],
  providers: [VehicleService, VehicleSearchService],
  exports: [VehicleService, VehicleSearchService],
})
export class VehicleModule {}



