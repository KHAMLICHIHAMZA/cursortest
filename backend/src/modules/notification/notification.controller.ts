import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
}





