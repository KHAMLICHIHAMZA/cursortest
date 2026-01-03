import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyStatus } from '@prisma/client';

/**
 * Guard qui vérifie que la Company de l'utilisateur est ACTIVE
 * 
 * Bloque l'accès si :
 * - Company.status !== ACTIVE
 * - Company n'existe pas
 * 
 * SUPER_ADMIN : Bypass (pas de vérification)
 * 
 * @example
 * @UseGuards(JwtAuthGuard, RequireActiveCompanyGuard)
 * @Get()
 * findAll() { ... }
 */
@Injectable()
export class RequireActiveCompanyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    // Vérifier le statut de la Company
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, status: true, isActive: true }, // Optimisation
    });

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    // Vérifier le statut SaaS (priorité sur isActive pour rétrocompatibilité)
    if (company.status !== CompanyStatus.ACTIVE) {
      const reason =
        company.status === CompanyStatus.SUSPENDED
          ? 'Company is suspended. Please contact support.'
          : 'Company is not active';
      throw new ForbiddenException(reason);
    }

    // Rétrocompatibilité : vérifier aussi isActive (Boolean)
    if (!company.isActive) {
      throw new ForbiddenException('Company is not active');
    }

    return true;
  }
}


