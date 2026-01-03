import { Module } from '@nestjs/common';
import { BusinessEventLogService } from './business-event-log.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BusinessEventLogService],
  exports: [BusinessEventLogService],
})
export class BusinessEventLogModule {}



