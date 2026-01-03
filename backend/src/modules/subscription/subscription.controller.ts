import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, ReadOnlyGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new subscription (SUPER_ADMIN only)' })
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionService.create(createSubscriptionDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions (filtered by role)' })
  async findAll(@CurrentUser() user: any) {
    return this.subscriptionService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subscriptionService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a subscription (SUPER_ADMIN only)' })
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionService.update(id, updateSubscriptionDto, user);
  }

  @Post(':id/suspend')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Suspend a subscription (SUPER_ADMIN only)' })
  async suspend(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionService.suspend(id, reason, user);
  }

  @Post(':id/restore')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Restore a suspended subscription (SUPER_ADMIN only)' })
  async restore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subscriptionService.restore(id, user);
  }

  @Post(':id/renew')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Renew a subscription (SUPER_ADMIN only)' })
  async renew(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subscriptionService.renew(id, user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Cancel a subscription (SUPER_ADMIN only)' })
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subscriptionService.cancel(id, user);
  }
}


