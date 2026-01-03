import { Module } from '@nestjs/common';
import { FineController } from './fine.controller';
import { FineService } from './fine.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BusinessEventLogModule } from '../business-event-log/business-event-log.module';

@Module({
  imports: [PrismaModule, BusinessEventLogModule],
  controllers: [FineController],
  providers: [FineService],
  exports: [FineService],
})
export class FineModule {}



