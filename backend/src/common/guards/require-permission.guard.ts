import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { UserAgencyPermission } from '@prisma/client';

/**
 * Metadata key pour les permissions requises
 */
export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

/**
 * Decorator pour spécifier la permission requise sur un endpoint
 * 
 * @example
 * @RequirePermission(UserAgencyPermission.WRITE)
 * @Post()
 * create() { ... }
 */
export const RequirePermission = (permission: UserAgencyPermission) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);

/**
 * Guard qui vérifie les permissions User ↔ Agency (READ, WRITE, FULL)
 * 
 * Logique :
 * - READ : Lecture seule
 * - WRITE : Lecture + Écriture (pas de suppression)
 * - FULL : Lecture + Écriture + Suppression
 * 
 * Vérification :
 * 1. L'utilisateur doit être associé à l'agence via UserAgency
 * 2. La permission de l'utilisateur doit être >= permission requise
 * 
 * Hiérarchie : READ < WRITE < FULL
 * 
 * SUPER_ADMIN, COMPANY_ADMIN : Bypass (pas de vérification)
 * 
 * L'agencyId peut être fourni via :
 * - @Param('agencyId') dans l'URL
 * - @Body() dans le payload
 * - @Query('agencyId') dans les query params
 * 
 * @example
 * @UseGuards(JwtAuthGuard, RequirePermissionGuard)
 * @RequirePermission(UserAgencyPermission.WRITE)
 * @Post()
 * create(@Body() dto: CreateDto) { ... }
 */
@Injectable()
export class RequirePermissionGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<UserAgencyPermission>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si pas de permission requise, autoriser
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // SUPER_ADMIN et COMPANY_ADMIN bypass
    if (user.role === 'SUPER_ADMIN' || user.role === 'COMPANY_ADMIN') {
      return true;
    }

    // Extraire l'agencyId depuis différentes sources
    const agencyId =
      request.params?.agencyId ||
      request.body?.agencyId ||
      request.query?.agencyId;

    if (!agencyId) {
      throw new BadRequestException('L\'identifiant de l\'agence est requis pour la vérification des permissions');
    }

    // Vérifier que l'utilisateur a accès à cette agence
    const userAgency = await this.prisma.userAgency.findUnique({
      where: {
        userId_agencyId: {
          userId: user.userId || user.id,
          agencyId: agencyId,
        },
      },
      select: { permission: true },
    });

    if (!userAgency) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette agence. Vérifiez votre rattachement.');
    }

    // Vérifier la hiérarchie des permissions
    const hasPermission = this.checkPermission(userAgency.permission, requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permissions insuffisantes. Requis : ${requiredPermission}, Votre permission : ${userAgency.permission}`,
      );
    }

    return true;
  }

  /**
   * Vérifie si la permission de l'utilisateur est >= permission requise
   * Hiérarchie : READ < WRITE < FULL
   */
  private checkPermission(
    userPermission: UserAgencyPermission,
    requiredPermission: UserAgencyPermission,
  ): boolean {
    const permissionLevel = {
      READ: 1,
      WRITE: 2,
      FULL: 3,
    };

    return permissionLevel[userPermission] >= permissionLevel[requiredPermission];
  }
}


