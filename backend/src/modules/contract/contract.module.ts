import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ServicesModule } from '../../common/services/services.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, ServicesModule, AuditModule],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
