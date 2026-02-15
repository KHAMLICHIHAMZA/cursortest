import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgencyStatus } from '@prisma/client';

/**
 * Guard qui vérifie que l'Agency est ACTIVE
 * 
 * Bloque l'accès si :
 * - Agency.status !== ACTIVE
 * - Agency n'existe pas
 * - Agency n'appartient pas à la Company de l'utilisateur (sauf SUPER_ADMIN)
 * 
 * SUPER_ADMIN : Bypass (pas de vérification)
 * 
 * L'agencyId peut être fourni via :
 * - @Param('agencyId') dans l'URL
 * - @Body() dans le payload
 * - @Query('agencyId') dans les query params
 * 
 * @example
 * @UseGuards(JwtAuthGuard, RequireActiveAgencyGuard)
 * @Get(':agencyId/vehicles')
 * findAll(@Param('agencyId') agencyId: string) { ... }
 */
@Injectable()
export class RequireActiveAgencyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // SUPER_ADMIN bypass
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Extraire l'agencyId depuis différentes sources
    let agencyId =
      request.params?.agencyId ||
      request.body?.agencyId ||
      request.query?.agencyId;

    // Si pas d'agencyId explicite mais que l'utilisateur a des agencies, utiliser la première
    // (pour les endpoints GET qui listent les données de l'utilisateur)
    if (!agencyId && user.agencyIds && user.agencyIds.length > 0) {
      agencyId = user.agencyIds[0];
    }

    if (!agencyId) {
      // Si pas d'agencyId, on ne bloque pas (peut être un endpoint qui liste toutes les agences)
      return true;
    }

    // Vérifier le statut de l'Agency
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        status: true,
        companyId: true,
        deletedAt: true,
      },
    });

    if (!agency || agency.deletedAt) {
      throw new BadRequestException('Agence introuvable');
    }

    // Vérifier que l'agence appartient à la Company de l'utilisateur (sauf SUPER_ADMIN)
    if (user.role !== 'SUPER_ADMIN' && user.companyId) {
      if (agency.companyId !== user.companyId) {
        throw new ForbiddenException('Cette agence n\'appartient pas à votre société');
      }
    }

    // Vérifier le statut SaaS
    if (agency.status !== AgencyStatus.ACTIVE) {
      const reason =
        agency.status === AgencyStatus.SUSPENDED
          ? 'L\'agence est suspendue. Veuillez contacter le support.'
          : 'L\'agence n\'est pas active';
      throw new ForbiddenException(reason);
    }

    return true;
  }
}

