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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { VehicleSearchService } from './vehicle-search.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permissions } from '../../common/guards/permission.guard';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { RequireModuleGuard } from '../../common/guards/require-module.guard';
import { RequireActiveCompanyGuard } from '../../common/guards/require-active-company.guard';
import { RequireActiveAgencyGuard } from '../../common/guards/require-active-agency.guard';
import { RequirePermissionGuard } from '../../common/guards/require-permission.guard';
import { RequireModule } from '../../common/guards/require-module.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { ModuleCode, UserAgencyPermission } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  vehicleImageStorage,
  vehicleImageFilter,
} from './interceptors/file-upload.interceptor';

@ApiTags('Vehicles')
@Controller('vehicles')
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  RequireActiveAgencyGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.VEHICLES)
@ApiBearerAuth()
export class VehicleController {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly vehicleSearchService: VehicleSearchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all vehicles (filtered by agency access)' })
  async findAll(@Query('agencyId') agencyId: string, @CurrentUser() user: any) {
    return this.vehicleService.findAll(user, agencyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vehicleService.findOne(id, user);
  }

  @Post()
  @Permissions('vehicles:create')
  @ApiOperation({ summary: 'Create a new vehicle' })
  async create(@Body() createVehicleDto: CreateVehicleDto, @CurrentUser() user: any) {
    return this.vehicleService.create(createVehicleDto, user);
  }

  @Patch(':id')
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('vehicles:update')
  @ApiOperation({ summary: 'Update a vehicle' })
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @CurrentUser() user: any,
  ) {
    return this.vehicleService.update(id, updateVehicleDto, user);
  }

  @Delete(':id')
  @RequirePermission(UserAgencyPermission.FULL)
  @Permissions('vehicles:delete')
  @ApiOperation({ summary: 'Delete a vehicle' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vehicleService.remove(id, user);
  }

  @Get('search/brands')
  @ApiOperation({ summary: 'Search vehicle brands' })
  async searchBrands(@Query('q') query: string) {
    return this.vehicleSearchService.searchBrands(query || '');
  }

  @Get('search/models')
  @ApiOperation({ summary: 'Search vehicle models' })
  async searchModels(
    @Query('brand') brand: string,
    @Query('q') query?: string,
  ) {
    return this.vehicleSearchService.searchModels(brand || '', query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search vehicles (brand + model)' })
  async searchVehicles(
    @Query('brand') brandQuery?: string,
    @Query('model') modelQuery?: string,
  ) {
    return this.vehicleSearchService.searchVehicles(brandQuery, modelQuery);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: vehicleImageStorage,
      fileFilter: vehicleImageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  )
  @ApiOperation({ summary: 'Upload vehicle image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Retourner l'URL relative de l'image
    const imageUrl = `/uploads/vehicles/${file.filename}`;
    return { imageUrl, filename: file.filename };
  }
}
