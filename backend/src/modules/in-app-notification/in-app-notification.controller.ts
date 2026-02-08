import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
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
}
