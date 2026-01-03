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
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
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
import { MaintenanceStatus } from '@prisma/client';
import {
  maintenanceDocumentStorage,
  maintenanceDocumentFilter,
} from './interceptors/file-upload.interceptor';

@ApiTags('Maintenance')
@Controller('maintenance')
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  RequireActiveAgencyGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.MAINTENANCE)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @Permissions('maintenance:read')
  @ApiOperation({ summary: 'Get all maintenance records (filtered by agency access)' })
  async findAll(
    @Query('agencyId') agencyId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: MaintenanceStatus,
    @CurrentUser() user?: any,
  ) {
    return this.maintenanceService.findAll(user, { agencyId, vehicleId, status });
  }

  @Get(':id')
  @Permissions('maintenance:read')
  @ApiOperation({ summary: 'Get maintenance by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.maintenanceService.findOne(id, user);
  }

  @Post()
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('maintenance:create')
  @ApiOperation({ summary: 'Create a new maintenance record' })
  async create(@Body() createMaintenanceDto: CreateMaintenanceDto, @CurrentUser() user: any) {
    return this.maintenanceService.create(createMaintenanceDto, user);
  }

  @Patch(':id')
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('maintenance:update')
  @ApiOperation({ summary: 'Update a maintenance record' })
  async update(
    @Param('id') id: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.update(id, updateMaintenanceDto, user);
  }

  @Delete(':id')
  @Permissions('maintenance:delete')
  @ApiOperation({ summary: 'Delete a maintenance record' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.maintenanceService.remove(id, user);
  }

  @Post('upload-document')
  @Permissions('maintenance:update')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: maintenanceDocumentStorage,
      fileFilter: maintenanceDocumentFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @ApiOperation({ summary: 'Upload maintenance document (invoice or quote)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        document: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Retourner l'URL relative du document
    const documentUrl = `/uploads/maintenance/${file.filename}`;
    return { documentUrl, filename: file.filename };
  }
}
