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
import { FineService } from './fine.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { UpdateFineDto } from './dto/update-fine.dto';
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
  fineAttachmentStorage,
  fineAttachmentFilter,
} from './interceptors/file-upload.interceptor';

@ApiTags('Fines')
@Controller('fines')
@UseGuards(
  JwtAuthGuard,
  ReadOnlyGuard,
  RequireActiveCompanyGuard,
  RequireModuleGuard,
  RequireActiveAgencyGuard,
  PermissionGuard,
)
@RequireModule(ModuleCode.FINES)
@ApiBearerAuth()
export class FineController {
  constructor(private readonly fineService: FineService) {}

  @Get()
  @Permissions('fines:read')
  @ApiOperation({ summary: 'Get all fines (filtered by agency access)' })
  async findAll(
    @Query('agencyId') agencyId?: string,
    @Query('bookingId') bookingId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.fineService.findAll(user, { agencyId, bookingId });
  }

  @Get(':id')
  @Permissions('fines:read')
  @ApiOperation({ summary: 'Get fine by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.fineService.findOne(id, user);
  }

  @Post()
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('fines:create')
  @ApiOperation({ summary: 'Create a new fine' })
  async create(@Body() createFineDto: CreateFineDto, @CurrentUser() user: any) {
    return this.fineService.create(createFineDto, user);
  }

  @Patch(':id')
  @RequirePermission(UserAgencyPermission.WRITE)
  @Permissions('fines:update')
  @ApiOperation({ summary: 'Update a fine' })
  async update(
    @Param('id') id: string,
    @Body() updateFineDto: UpdateFineDto,
    @CurrentUser() user: any,
  ) {
    return this.fineService.update(id, updateFineDto, user);
  }

  @Delete(':id')
  @Permissions('fines:delete')
  @ApiOperation({ summary: 'Delete a fine' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.fineService.remove(id, user);
  }

  @Post('upload-attachment')
  @Permissions('fines:create', 'fines:update')
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: fineAttachmentStorage,
      fileFilter: fineAttachmentFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  @ApiOperation({ summary: 'Upload fine attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        attachment: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Retourner l'URL relative de la pièce jointe
    const attachmentUrl = `/uploads/fines/${file.filename}`;
    return { attachmentUrl, filename: file.filename };
  }
}



