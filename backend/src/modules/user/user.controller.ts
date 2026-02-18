import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, ReadOnlyGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Get all users (filtered by role)' })
  async findAll(@CurrentUser() user: any) {
    return this.userService.findAll(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  async updateMe(
    @Body() body: { name?: string },
    @CurrentUser() user: any,
  ) {
    return this.userService.updateProfile(user.userId, body);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @CurrentUser() user: any,
  ) {
    return this.userService.changePassword(user.userId, body.currentPassword, body.newPassword);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.findOne(id, user);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    return this.userService.create(createUserDto, user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.userService.update(id, updateUserDto, user);
  }

  @Post(':id/reset-password')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Reset user password (send reset email)' })
  async resetPassword(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.resetPassword(id, user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a user' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.remove(id, user);
  }
}
