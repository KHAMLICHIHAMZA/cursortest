import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { PushService } from './push.service';
import { PushNotificationService } from './push-notification.service';
import { EmailNotificationService } from './email-notification.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    WhatsAppService,
    PushService,
    PushNotificationService,
    EmailNotificationService,
  ],
  exports: [NotificationService, PushNotificationService, EmailNotificationService],
})
export class NotificationModule {}





