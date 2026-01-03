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
import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';

@ApiTags('Agencies')
@Controller('agencies')
@UseGuards(JwtAuthGuard, ReadOnlyGuard)
@ApiBearerAuth()
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all agencies (filtered by role)' })
  async findAll(@CurrentUser() user: any) {
    return this.agencyService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.agencyService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  async create(@Body() createAgencyDto: CreateAgencyDto, @CurrentUser() user: any) {
    return this.agencyService.create(createAgencyDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an agency' })
  async update(
    @Param('id') id: string,
    @Body() updateAgencyDto: UpdateAgencyDto,
    @CurrentUser() user: any,
  ) {
    return this.agencyService.update(id, updateAgencyDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an agency' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.agencyService.remove(id, user);
  }
}
