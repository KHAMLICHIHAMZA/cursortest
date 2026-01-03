import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleCode } from '@prisma/client';

/**
 * Metadata key pour les modules requis
 */
export const REQUIRED_MODULE_KEY = 'requiredModule';

/**
 * Decorator pour spécifier le module requis sur un endpoint
 * 
 * @example
 * @RequireModule(ModuleCode.BOOKINGS)
 * @Get()
 * findAll() { ... }
 */
export const RequireModule = (moduleCode: ModuleCode) =>
  SetMetadata(REQUIRED_MODULE_KEY, moduleCode);

/**
 * Guard qui vérifie que le module est activé pour la Company/Agency
 * 
 * Logique :
 * - CompanyModule = modules payés (hérités par toutes les agences)
 * - AgencyModule = modules actifs (peut désactiver un module Company, mais pas activer un module non payé)
 * 
 * Vérification :
 * 1. Le module doit être payé au niveau Company (CompanyModule.isActive = true)
 * 2. Le module doit être actif au niveau Agency (AgencyModule.isActive = true, ou pas de record = hérite de Company)
 * 
 * SUPER_ADMIN : Bypass (pas de vérification)
 * 
 * @example
 * @UseGuards(JwtAuthGuard, RequireModuleGuard)
 * @RequireModule(ModuleCode.BOOKINGS)
 * @Get()
 * findAll() { ... }
 */
@Injectable()
export class RequireModuleGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<ModuleCode>(
      REQUIRED_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si pas de module requis, autoriser
    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN bypass
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Si pas de companyId, pas de vérification possible
    if (!user.companyId) {
      throw new ForbiddenException('User is not associated with a company');
    }

    // Vérifier que le module est payé au niveau Company
    const companyModule = await this.prisma.companyModule.findUnique({
      where: {
        companyId_moduleCode: {
          companyId: user.companyId,
          moduleCode: requiredModule,
        },
      },
    });

    if (!companyModule || !companyModule.isActive) {
      throw new ForbiddenException(
        `Module ${requiredModule} is not included in your subscription. Please contact support to upgrade your plan.`,
      );
    }

    // Si on a un agencyId, vérifier aussi au niveau Agency
    // Pour les endpoints GET sans agencyId, on utilise les agencies de l'utilisateur
    let agencyId =
      request.params?.agencyId ||
      request.body?.agencyId ||
      request.query?.agencyId;

    // Si pas d'agencyId explicite mais que l'utilisateur a des agencies, vérifier la première
    // (pour les endpoints GET qui listent les données de l'utilisateur)
    if (!agencyId && user.agencyIds && user.agencyIds.length > 0) {
      // Pour les endpoints de liste, on vérifie que l'utilisateur a au moins une agence avec le module activé
      // On prend la première agence comme référence
      agencyId = user.agencyIds[0];
    }

    if (agencyId) {
      // Vérifier que l'agence appartient à la Company
      const agency = await this.prisma.agency.findUnique({
        where: { id: agencyId },
        select: { id: true, companyId: true },
      });

      if (!agency || agency.companyId !== user.companyId) {
        throw new ForbiddenException('Agency not found or does not belong to your company');
      }

      // Vérifier le module au niveau Agency
      const agencyModule = await this.prisma.agencyModule.findUnique({
        where: {
          agencyId_moduleCode: {
            agencyId: agencyId,
            moduleCode: requiredModule,
          },
        },
      });

      // Si un record existe et est désactivé, bloquer
      if (agencyModule && !agencyModule.isActive) {
        throw new ForbiddenException(
          `Module ${requiredModule} is disabled for this agency. Please contact your company admin.`,
        );
      }
      // Si pas de record, le module hérite de Company (déjà vérifié ci-dessus)
    }

    return true;
  }
}

