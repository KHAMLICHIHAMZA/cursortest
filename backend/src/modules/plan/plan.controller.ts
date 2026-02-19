import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';

@ApiTags('Plans')
@Controller('plans')
@UseGuards(JwtAuthGuard, ReadOnlyGuard, RolesGuard)
@ApiBearerAuth()
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new plan (SUPER_ADMIN only)' })
  async create(@Body() createPlanDto: CreatePlanDto, @CurrentUser() user: any) {
    return this.planService.create(createPlanDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  @ApiQuery({ name: 'all', required: false, type: Boolean, description: 'Include inactive plans' })
  async findAll(@Query('all') all?: string) {
    return this.planService.findAll(all === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  async findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a plan (SUPER_ADMIN only)' })
  async update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @CurrentUser() user: any,
  ) {
    return this.planService.update(id, updatePlanDto, user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete (deactivate) a plan (SUPER_ADMIN only)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.planService.remove(id, user);
  }
}


