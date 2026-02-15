import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { EmailNotificationService } from './email-notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushNotificationService,
    private readonly emailService: EmailNotificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Send a notification' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    await this.notificationService.sendNotification(dto);
    return { success: true };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get notification history' })
  async getHistory(
    @Query('recipient') recipient?: string,
    @Query('channel') channel?: string,
  ) {
    return this.notificationService.getHistory(recipient, channel as any);
  }

  @Post('device-token')
  @ApiOperation({ summary: 'V2.1: Register device token for push notifications' })
  async registerDeviceToken(
    @Body() body: { token: string; platform: string },
    @CurrentUser() user: any,
  ) {
    const dt = await this.pushService.registerToken(user.userId, body.token, body.platform);
    return { success: true, id: dt.id };
  }

  @Delete('device-token')
  @ApiOperation({ summary: 'V2.1: Unregister a device token' })
  async unregisterDeviceToken(@Body() body: { token: string }) {
    await this.pushService.unregisterToken(body.token);
    return { success: true };
  }

  @Get('config')
  @ApiOperation({ summary: 'V2.1: Check notification configuration status' })
  async checkConfig() {
    return {
      push: { configured: this.pushService.isConfigured() },
      email: { configured: this.emailService.checkConfigured() },
    };
  }
}





