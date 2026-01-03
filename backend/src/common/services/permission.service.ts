import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service centralisé pour la gestion des permissions et accès
 * Évite la duplication de code dans tous les services
 */
@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vérifie l'accès à une agence selon le rôle de l'utilisateur
   */
  async checkAgencyAccess(agencyId: string, user: any): Promise<boolean> {
    if (user.role === 'SUPER_ADMIN') return true;

    if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      const agency = await this.prisma.agency.findFirst({
        where: {
          id: agencyId,
          companyId: user.companyId,
          deletedAt: null,
        },
        select: { id: true }, // Optimisation : on ne récupère que l'ID
      });
      return !!agency;
    }

    if (user.agencyIds && user.agencyIds.includes(agencyId)) return true;

    return false;
  }

  /**
   * Construit un filtre where pour les requêtes selon le rôle
   */
  buildAgencyFilter(user: any, agencyId?: string): any {
    const filter: any = {};

    if (user.role === 'SUPER_ADMIN') {
      if (agencyId) filter.agencyId = agencyId;
    } else if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      filter.agency = { companyId: user.companyId, deletedAt: null };
      if (agencyId) filter.agencyId = agencyId;
    } else if (user.agencyIds && user.agencyIds.length > 0) {
      filter.agencyId = agencyId && user.agencyIds.includes(agencyId) 
        ? agencyId 
        : { in: user.agencyIds };
    } else {
      return null; // Pas d'accès
    }

    return filter;
  }

  /**
   * Récupère les IDs d'agences accessibles par l'utilisateur
   */
  async getAccessibleAgencyIds(user: any): Promise<string[]> {
    if (user.role === 'SUPER_ADMIN') {
      const agencies = await this.prisma.agency.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });
      return agencies.map((a) => a.id);
    }

    if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      const agencies = await this.prisma.agency.findMany({
        where: {
          companyId: user.companyId,
          deletedAt: null,
        },
        select: { id: true },
      });
      return agencies.map((a) => a.id);
    }

    return user.agencyIds || [];
  }
}



