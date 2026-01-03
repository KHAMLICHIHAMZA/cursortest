import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { BusinessEventType } from '@prisma/client';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  private visionApiKey: string;
  private visionApiUrl: string;
  private visionProvider: 'openai' | 'google' | 'none';

  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private permissionService: PermissionService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
    private configService: ConfigService,
  ) {
    this.visionApiKey = this.configService.get<string>('VISION_API_KEY') || '';
    this.visionProvider = (this.configService.get<string>('VISION_PROVIDER') || 'openai') as 'openai' | 'google' | 'none';
    
    if (this.visionProvider === 'openai') {
      this.visionApiUrl = this.configService.get<string>('OPENAI_API_URL') || 'https://api.openai.com/v1/chat/completions';
    } else if (this.visionProvider === 'google') {
      this.visionApiUrl = this.configService.get<string>('GOOGLE_VISION_API_URL') || 'https://vision.googleapis.com/v1/images:annotate';
    } else {
      this.visionApiUrl = '';
    }
  }

  async findAll(user: any, agencyId?: string) {
    const agencyFilter = this.permissionService.buildAgencyFilter(user, agencyId);
    if (!agencyFilter) return [];

    const where = this.softDeleteService.addSoftDeleteFilter({
      ...agencyFilter,
    });

    const clients = await this.prisma.client.findMany({
      where,
      select: {
        // Optimisation : sélectionner uniquement les champs nécessaires
        id: true,
        name: true,
        email: true,
        phone: true,
        note: true,
        licenseImageUrl: true,
        isMoroccan: true,
        countryOfOrigin: true,
        licenseNumber: true,
        licenseExpiryDate: true,
        isForeignLicense: true,
        idCardNumber: true,
        idCardExpiryDate: true,
        passportNumber: true,
        passportExpiryDate: true,
        agencyId: true,
        createdAt: true,
        updatedAt: true,
        agency: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove audit fields from public responses
    return this.auditService.removeAuditFieldsFromArray(clients);
  }

  async findOne(id: string, user: any) {
    const client = await this.prisma.client.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      include: {
        agency: {
          include: { company: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(client.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(client);
  }

  async create(createClientDto: CreateClientDto, user: any) {
    const hasAccess = await this.permissionService.checkAgencyAccess(createClientDto.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }

    // Vérifier les doublons par email (si email fourni)
    if (createClientDto.email) {
      const existingClientByEmail = await this.prisma.client.findFirst({
        where: this.softDeleteService.addSoftDeleteFilter({
          email: createClientDto.email,
          agencyId: createClientDto.agencyId,
        }),
      });

      if (existingClientByEmail) {
        throw new BadRequestException('Un client avec cet email existe déjà dans cette agence');
      }
    }

    // Vérifier les doublons par nom + prénom + numéro de permis
    const clientName = `${createClientDto.firstName} ${createClientDto.lastName}`.trim();
    
    // Validation stricte : nom + prénom + numéro de permis
    if (!createClientDto.licenseNumber) {
      throw new BadRequestException('Le numéro de permis est requis pour créer un client');
    }

    const existingClient = await this.prisma.client.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({
        name: clientName,
        licenseNumber: createClientDto.licenseNumber,
      }),
    });

    if (existingClient) {
      throw new BadRequestException(
        `Un client avec le même nom (${clientName}) et le même numéro de permis (${createClientDto.licenseNumber}) existe déjà`
      );
    }

    return this.prisma.client.create({
      data: {
        name: `${createClientDto.firstName} ${createClientDto.lastName}`,
        email: createClientDto.email,
        phone: createClientDto.phone,
        agencyId: createClientDto.agencyId,
        licenseImageUrl: createClientDto.licenseImageUrl,
        isMoroccan: createClientDto.isMoroccan ?? true,
        countryOfOrigin: createClientDto.countryOfOrigin,
        licenseNumber: createClientDto.licenseNumber,
        licenseExpiryDate: new Date(createClientDto.licenseExpiryDate),
        isForeignLicense: createClientDto.isForeignLicense ?? false,
        idCardNumber: createClientDto.idCardNumber,
        idCardExpiryDate: createClientDto.idCardExpiryDate ? new Date(createClientDto.idCardExpiryDate) : null,
        passportNumber: createClientDto.passportNumber,
        passportExpiryDate: createClientDto.passportExpiryDate ? new Date(createClientDto.passportExpiryDate) : null,
        note: createClientDto.note || null,
      },
      include: {
        agency: {
          include: { company: true },
        },
      },
    });
  }

  async update(id: string, updateClientDto: UpdateClientDto, user: any) {
    const client = await this.prisma.client.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(client.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = {};
    if (updateClientDto.firstName || updateClientDto.lastName) {
      const currentName = client.name ? client.name.split(' ') : [];
      const firstName = updateClientDto.firstName || currentName[0] || '';
      const lastName = updateClientDto.lastName || currentName.slice(1).join(' ') || '';
      updateData.name = `${firstName} ${lastName}`.trim();
    }
    if (updateClientDto.email !== undefined) updateData.email = updateClientDto.email;
    if (updateClientDto.phone !== undefined) updateData.phone = updateClientDto.phone;
    if (updateClientDto.licenseImageUrl !== undefined) updateData.licenseImageUrl = updateClientDto.licenseImageUrl;
    if (updateClientDto.isMoroccan !== undefined) updateData.isMoroccan = updateClientDto.isMoroccan;
    if (updateClientDto.countryOfOrigin !== undefined) updateData.countryOfOrigin = updateClientDto.countryOfOrigin;
    if (updateClientDto.licenseNumber !== undefined) updateData.licenseNumber = updateClientDto.licenseNumber;
    if (updateClientDto.licenseExpiryDate !== undefined) {
      // licenseExpiryDate est maintenant obligatoire (NOT NULL), donc on ne peut pas le mettre à null
      updateData.licenseExpiryDate = new Date(updateClientDto.licenseExpiryDate);
    }
    if (updateClientDto.isForeignLicense !== undefined) updateData.isForeignLicense = updateClientDto.isForeignLicense;
    if (updateClientDto.idCardNumber !== undefined) updateData.idCardNumber = updateClientDto.idCardNumber;
    if (updateClientDto.idCardExpiryDate !== undefined) {
      updateData.idCardExpiryDate = updateClientDto.idCardExpiryDate ? new Date(updateClientDto.idCardExpiryDate) : null;
    }
    if (updateClientDto.passportNumber !== undefined) updateData.passportNumber = updateClientDto.passportNumber;
    if (updateClientDto.passportExpiryDate !== undefined) {
      updateData.passportExpiryDate = updateClientDto.passportExpiryDate ? new Date(updateClientDto.passportExpiryDate) : null;
    }
    if (updateClientDto.address || updateClientDto.licenseNumber) {
      const noteParts = [];
      if (updateClientDto.address) noteParts.push(`Adresse: ${updateClientDto.address}`);
      if (updateClientDto.licenseNumber) noteParts.push(`Permis: ${updateClientDto.licenseNumber}`);
      updateData.note = noteParts.length > 0 ? noteParts.join(', ') : null;
    }

    // Store previous state for event log
    const previousState = { ...client };

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(updateData, user.id);

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: dataWithAudit,
      include: {
        agency: {
          include: { company: true },
        },
      },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        updatedClient.agencyId,
        'Client',
        updatedClient.id,
        BusinessEventType.CLIENT_UPDATED,
        previousState,
        updatedClient,
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.auditService.removeAuditFields(updatedClient);
  }

  async remove(id: string, user: any, reason?: string) {
    const client = await this.prisma.client.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(client.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    // Store previous state for event log
    const previousState = { ...client };

    // Add audit fields for soft delete
    const deleteData = this.auditService.addDeleteAuditFields({}, user.id, reason);

    await this.prisma.client.update({
      where: { id },
      data: deleteData,
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        client.agencyId,
        'Client',
        client.id,
        BusinessEventType.CLIENT_DELETED,
        previousState,
        { ...client, ...deleteData },
        user.id,
      )
      .catch(() => {
        // Error already logged in service
      });

    return { message: 'Client deleted successfully' };
  }

  async analyzeLicenseImage(imageUrl: string): Promise<{
    isValid: boolean;
    isMoroccan: boolean;
    licenseNumber?: string;
    licenseExpiryDate?: string;
    licenseType?: string;
    extractedData?: {
      name?: string;
      dateOfBirth?: string;
      address?: string;
    };
    confidence: number;
    message: string;
  }> {
    if (!this.visionApiKey || this.visionProvider === 'none') {
      return {
        isValid: false,
        isMoroccan: true,
        confidence: 0,
        message: 'Service d\'analyse non configuré - Vérification manuelle requise',
      };
    }

    try {
      if (this.visionProvider === 'openai') {
        return await this.analyzeLicenseWithOpenAI(imageUrl);
      } else {
        return {
          isValid: false,
          isMoroccan: true,
          confidence: 0,
          message: 'Service d\'analyse non disponible',
        };
      }
    } catch (error: any) {
      this.logger.error('License analysis error:', error);
      return {
        isValid: false,
        isMoroccan: true,
        confidence: 0,
        message: 'Erreur lors de l\'analyse - Vérification manuelle requise',
      };
    }
  }

  private async analyzeLicenseWithOpenAI(imageUrl: string): Promise<{
    isValid: boolean;
    isMoroccan: boolean;
    licenseNumber?: string;
    licenseExpiryDate?: string;
    licenseType?: string;
    extractedData?: {
      name?: string;
      dateOfBirth?: string;
      address?: string;
    };
    confidence: number;
    message: string;
  }> {
    const response = await fetch(this.visionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.visionApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyse cette photo de permis de conduite et extrais les informations suivantes. Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "isValid": boolean (true si c'est un permis valide),
  "isMoroccan": boolean (true si c'est un permis marocain, false si étranger),
  "licenseNumber": string (numéro du permis si visible),
  "licenseExpiryDate": string (date d'expiration au format YYYY-MM-DD si visible),
  "licenseType": string (type de permis: A, B, C, D, etc.),
  "extractedData": {
    "name": string (nom complet si visible),
    "dateOfBirth": string (date de naissance au format YYYY-MM-DD si visible),
    "address": string (adresse si visible)
  },
  "confidence": number (0-1, niveau de confiance de l'analyse),
  "message": string (message descriptif)
}

Si certaines informations ne sont pas visibles, utilise null ou une chaîne vide.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Vision API');
    }

    // Parser le JSON de la réponse
    try {
      const analysis = JSON.parse(content);
      return {
        isValid: analysis.isValid ?? false,
        isMoroccan: analysis.isMoroccan ?? true,
        licenseNumber: analysis.licenseNumber || undefined,
        licenseExpiryDate: analysis.licenseExpiryDate || undefined,
        licenseType: analysis.licenseType || undefined,
        extractedData: analysis.extractedData || undefined,
        confidence: analysis.confidence ?? 0,
        message: analysis.message || 'Analyse terminée',
      };
    } catch (parseError) {
      this.logger.error('Failed to parse Vision API response:', parseError);
      return {
        isValid: false,
        isMoroccan: true,
        confidence: 0,
        message: 'Erreur lors de l\'analyse de la réponse',
      };
    }
  }
}
