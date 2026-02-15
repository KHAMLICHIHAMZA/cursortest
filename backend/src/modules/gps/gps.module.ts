import { Module } from '@nestjs/common';
import { GpsService } from './gps.service';
import { GpsKpiService } from './gps-kpi.service';
import { GpsController } from './gps.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GpsController],
  providers: [GpsService, GpsKpiService],
  exports: [GpsService, GpsKpiService],
})
export class GpsModule {}
