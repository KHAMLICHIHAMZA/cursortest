import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { PushService } from './push.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, EmailService, WhatsAppService, PushService],
  exports: [NotificationService],
})
export class NotificationModule {}





