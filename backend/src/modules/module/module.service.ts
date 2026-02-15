import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ModuleCode } from '@prisma/client';

/**
 * Service de gestion des modules SaaS
 * 
 * Gère :
 * - Activation/désactivation des modules au niveau Company
 * - Activation/désactivation des modules au niveau Agency
 * - Vérification des dépendances entre modules
 * - Validation qu'un module est payé avant activation
 */
@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Activer un module au niveau Company (modules payés)
   * SUPER_ADMIN uniquement
   */
  async activateCompanyModule(companyId: string, moduleCode: ModuleCode, user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut activer les modules de société');
    }

    // Vérifier que la Company existe
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    // Vérifier les dépendances
    await this.checkModuleDependencies(moduleCode, companyId);

    // Activer ou créer le CompanyModule
    return this.prisma.companyModule.upsert({
      where: {
        companyId_moduleCode: {
          companyId,
          moduleCode,
        },
      },
      create: {
        companyId,
        moduleCode,
        isActive: true,
      },
      update: {
        isActive: true,
      },
    });
  }

  /**
   * Désactiver un module au niveau Company
   * SUPER_ADMIN uniquement
   */
  async deactivateCompanyModule(companyId: string, moduleCode: ModuleCode, user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut désactiver les modules de société');
    }

    const companyModule = await this.prisma.companyModule.findUnique({
      where: {
        companyId_moduleCode: {
          companyId,
          moduleCode,
        },
      },
    });

    if (!companyModule) {
      throw new NotFoundException('Module de société introuvable');
    }

    // Vérifier qu'aucun autre module ne dépend de celui-ci
    await this.checkReverseDependencies(moduleCode, companyId);

    return this.prisma.companyModule.update({
      where: {
        companyId_moduleCode: {
          companyId,
          moduleCode,
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Activer un module au niveau Agency (modules actifs)
   * COMPANY_ADMIN uniquement
   * 
   * Règle : Ne peut activer que si le module est payé au niveau Company
   */
  async activateAgencyModule(agencyId: string, moduleCode: ModuleCode, user: any) {
    // Vérifier que l'agence existe et appartient à la Company de l'utilisateur
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: { company: true },
    });

    if (!agency) {
      throw new NotFoundException('Agence introuvable');
    }

    if (user.role !== 'SUPER_ADMIN' && agency.companyId !== user.companyId) {
      throw new ForbiddenException('L\'agence n\'appartient pas à votre société');
    }

    // Vérifier que le module est payé au niveau Company
    const companyModule = await this.prisma.companyModule.findUnique({
      where: {
        companyId_moduleCode: {
          companyId: agency.companyId,
          moduleCode,
        },
      },
    });

    if (!companyModule || !companyModule.isActive) {
      throw new BadRequestException(
        `Le module ${moduleCode} n'est pas inclus dans votre abonnement. Veuillez contacter le support pour mettre à niveau votre plan.`,
      );
    }

    // Vérifier les dépendances
    await this.checkModuleDependencies(moduleCode, agency.companyId, agencyId);

    // Activer ou créer l'AgencyModule
    return this.prisma.agencyModule.upsert({
      where: {
        agencyId_moduleCode: {
          agencyId,
          moduleCode,
        },
      },
      create: {
        agencyId,
        moduleCode,
        isActive: true,
      },
      update: {
        isActive: true,
      },
    });
  }

  /**
   * Désactiver un module au niveau Agency
   * COMPANY_ADMIN uniquement
   */
  async deactivateAgencyModule(agencyId: string, moduleCode: ModuleCode, user: any) {
    // Vérifier que l'agence existe et appartient à la Company de l'utilisateur
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agence introuvable');
    }

    if (user.role !== 'SUPER_ADMIN' && agency.companyId !== user.companyId) {
      throw new ForbiddenException('L\'agence n\'appartient pas à votre société');
    }

    const agencyModule = await this.prisma.agencyModule.findUnique({
      where: {
        agencyId_moduleCode: {
          agencyId,
          moduleCode,
        },
      },
    });

    if (!agencyModule) {
      throw new NotFoundException('Module d\'agence introuvable');
    }

    // Vérifier les dépendances inverses
    await this.checkReverseDependencies(moduleCode, agency.companyId, agencyId);

    return this.prisma.agencyModule.update({
      where: {
        agencyId_moduleCode: {
          agencyId,
          moduleCode,
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Récupérer les modules activés pour une Company
   */
  async getCompanyModules(companyId: string, user: any) {
    // Vérifier les permissions
    if (user.role !== 'SUPER_ADMIN' && user.companyId !== companyId) {
      throw new ForbiddenException('Accès refusé : vous ne pouvez consulter que les modules de votre propre société');
    }

    return this.prisma.companyModule.findMany({
      where: { companyId },
      orderBy: { moduleCode: 'asc' },
    });
  }

  /**
   * Récupérer les modules activés pour une Agency
   */
  async getAgencyModules(agencyId: string, user: any) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agence introuvable');
    }

    // Vérifier les permissions
    if (user.role !== 'SUPER_ADMIN' && agency.companyId !== user.companyId) {
      throw new ForbiddenException('Accès refusé : cette agence n\'appartient pas à votre société');
    }

    // Récupérer les modules Company (payés)
    const companyModules = await this.prisma.companyModule.findMany({
      where: {
        companyId: agency.companyId,
        isActive: true,
      },
    });

    // Récupérer les modules Agency (actifs)
    const agencyModules = await this.prisma.agencyModule.findMany({
      where: { agencyId },
    });

    // Combiner : un module est actif si :
    // 1. Il est payé au niveau Company (companyModules)
    // 2. Il n'est pas désactivé au niveau Agency (agencyModules.isActive !== false)
    const activeModules = companyModules
      .filter((cm) => {
        const am = agencyModules.find((a) => a.moduleCode === cm.moduleCode);
        return !am || am.isActive; // Actif si pas de record Agency ou isActive = true
      })
      .map((cm) => ({
        moduleCode: cm.moduleCode,
        isActive: true,
        source: 'company' as const,
      }));

    return activeModules;
  }

  /**
   * Récupérer les dépendances entre modules
   */
  async getModuleDependencies(user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut consulter les dépendances des modules');
    }

    return this.prisma.moduleDependency.findMany({
      orderBy: { moduleCode: 'asc' },
    });
  }

  /**
   * Vérifier les dépendances d'un module
   */
  private async checkModuleDependencies(
    moduleCode: ModuleCode,
    companyId: string,
    agencyId?: string,
  ) {
    const dependencies = await this.prisma.moduleDependency.findMany({
      where: { moduleCode },
    });

    for (const dep of dependencies) {
      // Vérifier au niveau Company
      const companyModule = await this.prisma.companyModule.findUnique({
        where: {
          companyId_moduleCode: {
            companyId,
            moduleCode: dep.dependsOnCode,
          },
        },
      });

      if (!companyModule || !companyModule.isActive) {
        throw new BadRequestException(
          `Le module ${moduleCode} nécessite que le module ${dep.dependsOnCode} soit activé au préalable.`,
        );
      }

      // Si agencyId fourni, vérifier aussi au niveau Agency
      if (agencyId) {
        const agencyModule = await this.prisma.agencyModule.findUnique({
          where: {
            agencyId_moduleCode: {
              agencyId,
              moduleCode: dep.dependsOnCode,
            },
          },
        });

        if (agencyModule && !agencyModule.isActive) {
          throw new BadRequestException(
            `Le module ${moduleCode} nécessite que le module ${dep.dependsOnCode} soit activé pour cette agence.`,
          );
        }
      }
    }
  }

  /**
   * Vérifier les dépendances inverses (modules qui dépendent de celui-ci)
   */
  private async checkReverseDependencies(
    moduleCode: ModuleCode,
    companyId: string,
    agencyId?: string,
  ) {
    const reverseDeps = await this.prisma.moduleDependency.findMany({
      where: { dependsOnCode: moduleCode },
    });

    if (reverseDeps.length === 0) {
      return; // Aucune dépendance inverse
    }

    // Vérifier au niveau Company
    const dependentModules = await this.prisma.companyModule.findMany({
      where: {
        companyId,
        moduleCode: {
          in: reverseDeps.map((d) => d.moduleCode),
        },
        isActive: true,
      },
    });

    if (dependentModules.length > 0) {
      throw new BadRequestException(
        `Impossible de désactiver le module ${moduleCode}. Les modules suivants en dépendent : ${dependentModules.map((m) => m.moduleCode).join(', ')}`,
      );
    }

    // Si agencyId fourni, vérifier aussi au niveau Agency
    if (agencyId) {
      const dependentAgencyModules = await this.prisma.agencyModule.findMany({
        where: {
          agencyId,
          moduleCode: {
            in: reverseDeps.map((d) => d.moduleCode),
          },
          isActive: true,
        },
      });

      if (dependentAgencyModules.length > 0) {
        throw new BadRequestException(
          `Impossible de désactiver le module ${moduleCode} pour cette agence. Les modules suivants en dépendent : ${dependentAgencyModules.map((m) => m.moduleCode).join(', ')}`,
        );
      }
    }
  }
}


