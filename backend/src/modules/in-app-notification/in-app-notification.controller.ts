import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InAppNotificationService } from './in-app-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('In-App Notifications')
@Controller('notifications/in-app')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InAppNotificationController {
  constructor(private readonly notificationService: InAppNotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  async findAll(
    @Query('status') status: string,
    @Query('type') type: string,
    @Query('unreadOnly') unreadOnly: string,
    @Query('limit') limit: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationService.findByUser(user.userId, {
      status: status as any,
      type: type as any,
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationService.getUnreadCount(user.userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationService.findOne(id, user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: any) {
    const count = await this.notificationService.markAllAsRead(user.userId);
    return { markedAsRead: count };
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast notification to company or all companies (Super Admin / Company Admin)' })
  async broadcast(
    @Body() body: { title: string; message: string; companyId?: string; actionUrl?: string; scheduledAt?: string },
    @CurrentUser() user: any,
  ) {
    // Only SUPER_ADMIN and COMPANY_ADMIN can broadcast
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_ADMIN') {
      throw new ForbiddenException('Seuls les administrateurs peuvent envoyer des notifications');
    }

    // COMPANY_ADMIN can only send to their own company
    let targetCompanyId = body.companyId || undefined;
    if (user.role === 'COMPANY_ADMIN') {
      targetCompanyId = user.companyId;
    }

    const result = await this.notificationService.broadcastNotification({
      title: body.title,
      message: body.message,
      companyId: targetCompanyId,
      actionUrl: body.actionUrl,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      senderId: user.userId,
    });

    return { success: true, notificationsSent: result.count };
  }
}
