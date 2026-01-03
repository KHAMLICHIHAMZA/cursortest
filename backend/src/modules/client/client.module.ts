import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BusinessEventLogModule } from '../business-event-log/business-event-log.module';

@Module({
  imports: [PrismaModule, ConfigModule, BusinessEventLogModule],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}



