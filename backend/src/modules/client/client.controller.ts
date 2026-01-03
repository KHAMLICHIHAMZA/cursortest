import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permissions } from '../../common/guards/permission.guard';
import { ReadOnlyGuard } from '../../common/guards/read-only.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { licenseImageStorage, licenseImageFilter } from './interceptors/license-upload.interceptor';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, ReadOnlyGuard, PermissionGuard)
@ApiBearerAuth()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Get all clients' })
  async findAll(@CurrentUser() user: any, @Query('agencyId') agencyId?: string) {
    const clients = await this.clientService.findAll(user, agencyId);
    // Adapter pour transformer name en firstName/lastName pour le frontend
    return clients.map((client) => {
      const nameParts = client.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      return {
        ...client,
        firstName,
        lastName,
        dateOfBirth: undefined,
        address: client.note?.includes('Adresse:') 
          ? client.note.split('Adresse:')[1]?.split(',')[0]?.trim() 
          : undefined,
        licenseNumber: client.licenseNumber || (client.note?.includes('Permis:') 
          ? client.note.split('Permis:')[1]?.split(',')[0]?.trim() 
          : undefined),
        licenseType: client.note?.includes('Type permis:') 
          ? client.note.split('Type permis:')[1]?.trim() 
          : undefined,
        licenseImageUrl: client.licenseImageUrl,
        isMoroccan: client.isMoroccan,
        countryOfOrigin: client.countryOfOrigin,
        licenseExpiryDate: client.licenseExpiryDate.toISOString().split('T')[0],
        isForeignLicense: client.isForeignLicense,
        idCardNumber: client.idCardNumber,
        idCardExpiryDate: client.idCardExpiryDate?.toISOString().split('T')[0],
        passportNumber: client.passportNumber,
        passportExpiryDate: client.passportExpiryDate?.toISOString().split('T')[0],
      };
    });
  }

  @Get(':id')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Get client by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const client = await this.clientService.findOne(id, user);
    const nameParts = client.name.split(' ');
    return {
      ...client,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      dateOfBirth: undefined,
      address: client.note?.includes('Adresse:') 
        ? client.note.split('Adresse:')[1]?.split(',')[0]?.trim() 
        : undefined,
      licenseNumber: client.licenseNumber || (client.note?.includes('Permis:') 
        ? client.note.split('Permis:')[1]?.split(',')[0]?.trim() 
        : undefined),
      licenseType: client.note?.includes('Type permis:') 
        ? client.note.split('Type permis:')[1]?.trim() 
        : undefined,
      licenseImageUrl: client.licenseImageUrl,
      isMoroccan: client.isMoroccan,
      countryOfOrigin: client.countryOfOrigin,
      licenseExpiryDate: client.licenseExpiryDate?.toISOString().split('T')[0],
      isForeignLicense: client.isForeignLicense,
      idCardNumber: client.idCardNumber,
      idCardExpiryDate: client.idCardExpiryDate?.toISOString().split('T')[0],
      passportNumber: client.passportNumber,
      passportExpiryDate: client.passportExpiryDate?.toISOString().split('T')[0],
    };
  }

  @Post()
  @Permissions('clients:create')
  @ApiOperation({ summary: 'Create a new client' })
  async create(@Body() createClientDto: CreateClientDto, @CurrentUser() user: any) {
    console.log('Données reçues pour création client:', JSON.stringify(createClientDto, null, 2));
    try {
      const client = await this.clientService.create(createClientDto, user);
      console.log('Client créé avec succès:', client.id);
      const nameParts = client.name.split(' ');
      return {
        ...client,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        licenseImageUrl: client.licenseImageUrl,
      };
    } catch (error: any) {
      console.error('Erreur lors de la création du client:', error.message || error);
      throw error;
    }
  }

  @Patch(':id')
  @Permissions('clients:update')
  @ApiOperation({ summary: 'Update a client' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentUser() user: any,
  ) {
    const client = await this.clientService.update(id, updateClientDto, user);
    const nameParts = client.name.split(' ');
    return {
      ...client,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      licenseImageUrl: client.licenseImageUrl,
      isMoroccan: client.isMoroccan,
      countryOfOrigin: client.countryOfOrigin,
      licenseExpiryDate: client.licenseExpiryDate?.toISOString().split('T')[0],
      isForeignLicense: client.isForeignLicense,
      idCardNumber: client.idCardNumber,
      idCardExpiryDate: client.idCardExpiryDate?.toISOString().split('T')[0],
      passportNumber: client.passportNumber,
      passportExpiryDate: client.passportExpiryDate?.toISOString().split('T')[0],
    };
  }

  @Delete(':id')
  @Permissions('clients:delete')
  @ApiOperation({ summary: 'Delete a client' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientService.remove(id, user);
  }

  @Post('upload-license')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: licenseImageStorage,
      fileFilter: licenseImageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  )
  @ApiOperation({ summary: 'Upload client license image' })
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
  async uploadLicenseImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Retourner l'URL relative de l'image
    const imageUrl = `/uploads/licenses/${file.filename}`;
    return { imageUrl, filename: file.filename };
  }

  @Post('analyze-license')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: licenseImageStorage,
      fileFilter: licenseImageFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  )
  @ApiOperation({ summary: 'Analyze license image and extract data' })
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
  async analyzeLicense(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Construire l'URL complète de l'image
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/licenses/${file.filename}`;

    // Analyser le permis avec l'IA
    return await this.clientService.analyzeLicenseImage(imageUrl);
  }
}
