import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionScheduler } from './subscription.scheduler';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionScheduler],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

