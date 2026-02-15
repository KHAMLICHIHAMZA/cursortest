import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionStatus, BillingPeriod, CompanyStatus } from '@prisma/client';
import { AuditService } from '../../common/services/audit.service';

/**
 * Service de gestion des abonnements SaaS
 * 
 * Gère :
 * - CRUD des abonnements
 * - Changement de statut (ACTIVE, SUSPENDED, EXPIRED, CANCELLED)
 * - Renouvellement automatique
 * - Calcul des dates d'expiration
 */
@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Créer un nouvel abonnement pour une Company
   * Une Company ne peut avoir qu'un seul abonnement actif
   */
  async create(createSubscriptionDto: CreateSubscriptionDto, user: any) {
    const { companyId, planId, billingPeriod, startDate, amount } = createSubscriptionDto;

    // Vérifier que la Company existe
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    // Vérifier qu'il n'y a pas déjà un abonnement actif
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { companyId },
    });

    if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('La société a déjà un abonnement actif');
    }

    // Vérifier que le Plan existe
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        planModules: true,
      },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan tarifaire introuvable ou inactif. Veuillez sélectionner un plan valide.');
    }

    // Calculer la date de fin selon la périodicité
    const endDate = this.calculateEndDate(startDate, billingPeriod);

    // Créer l'abonnement
    const subscription = await this.prisma.subscription.create({
      data: {
        companyId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        billingPeriod,
        startDate,
        endDate,
        amount: amount || plan.price,
        createdByUserId: user?.userId || user?.id,
      },
    });

    // Créer les SubscriptionModules à partir du Plan
    const subscriptionModules = plan.planModules.map((pm) => ({
      subscriptionId: subscription.id,
      moduleCode: pm.moduleCode,
    }));

    await this.prisma.subscriptionModule.createMany({
      data: subscriptionModules,
    });

    // Créer les CompanyModules (modules payés)
    const companyModules = plan.planModules.map((pm) => ({
      companyId,
      moduleCode: pm.moduleCode,
      isActive: true,
    }));

    await this.prisma.companyModule.createMany({
      data: companyModules,
      skipDuplicates: true, // Éviter les doublons si déjà existants
    });

    return this.findOne(subscription.id, user);
  }

  /**
   * Récupérer tous les abonnements (filtrés par rôle)
   */
  async findAll(user: any) {
    if (user.role === 'SUPER_ADMIN') {
      return this.prisma.subscription.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          subscriptionModules: {
            include: {
              // Note: subscriptionModules n'a pas de relation directe avec ModuleCode
              // On retourne juste le moduleCode
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      return this.prisma.subscription.findMany({
        where: { companyId: user.companyId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          subscriptionModules: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('Permissions insuffisantes pour consulter les abonnements. Seuls SUPER_ADMIN et COMPANY_ADMIN y ont accès.');
  }

  /**
   * Récupérer un abonnement par ID
   */
  async findOne(id: string, user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        plan: {
          include: {
            planModules: true,
            planQuotas: true,
          },
        },
        subscriptionModules: true,
        paymentsSaas: {
          orderBy: { dueDate: 'desc' },
          take: 10, // Derniers 10 paiements
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement introuvable. Vérifiez l\'identifiant de l\'abonnement.');
    }

    // Vérifier les permissions
    if (user.role !== 'SUPER_ADMIN' && subscription.companyId !== user.companyId) {
      throw new ForbiddenException('Accès refusé : cet abonnement appartient à une autre société');
    }

    return subscription;
  }

  /**
   * Mettre à jour un abonnement
   */
  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto, user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement introuvable. Vérifiez l\'identifiant de l\'abonnement.');
    }

    // Vérifier les permissions (SUPER_ADMIN uniquement)
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut mettre à jour les abonnements');
    }

    // Note: Subscription model does not have updatedByUserId field,
    // so we pass the DTO directly without audit fields
    return this.prisma.subscription.update({
      where: { id },
      data: updateSubscriptionDto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        subscriptionModules: true,
      },
    });
  }

  /**
   * Suspendre un abonnement
   */
  async suspend(id: string, reason: string, user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement introuvable. Vérifiez l\'identifiant de l\'abonnement.');
    }

    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut suspendre les abonnements');
    }

    // Mettre à jour l'abonnement
    await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.SUSPENDED,
      },
    });

    // Suspendre la Company
    await this.prisma.company.update({
      where: { id: subscription.companyId },
      data: {
        status: CompanyStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspendedReason: reason,
      },
    });

    return this.findOne(id, user);
  }

  /**
   * Restaurer un abonnement suspendu
   */
  async restore(id: string, user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement introuvable. Vérifiez l\'identifiant de l\'abonnement.');
    }

    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut restaurer les abonnements');
    }

    if (subscription.status !== SubscriptionStatus.SUSPENDED) {
      throw new BadRequestException('Cet abonnement n\'est pas suspendu. Seuls les abonnements suspendus peuvent être restaurés.');
    }

    // Vérifier que la suspension date de moins de 90 jours
    if (subscription.company.suspendedAt) {
      const daysSinceSuspension = Math.floor(
        (new Date().getTime() - subscription.company.suspendedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceSuspension > 90) {
        throw new BadRequestException(
          'L\'abonnement ne peut pas être restauré. La période de suspension a dépassé 90 jours.',
        );
      }
    }

    // Restaurer l'abonnement
    await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    });

    // Restaurer la Company
    await this.prisma.company.update({
      where: { id: subscription.companyId },
      data: {
        status: CompanyStatus.ACTIVE,
        suspendedAt: null,
        suspendedReason: null,
      },
    });

    return this.findOne(id, user);
  }

  /**
   * Renouveler un abonnement
   */
  async renew(id: string, user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement introuvable. Vérifiez l\'identifiant de l\'abonnement.');
    }

    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut renouveler les abonnements');
    }

    const newStartDate = new Date();
    const newEndDate = this.calculateEndDate(newStartDate, subscription.billingPeriod);

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        startDate: newStartDate,
        endDate: newEndDate,
        renewedAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
  }

  /**
   * Annuler un abonnement
   */
  async cancel(id: string, user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement introuvable. Vérifiez l\'identifiant de l\'abonnement.');
    }

    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut annuler les abonnements');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
  }

  /**
   * Calculer la date de fin selon la périodicité
   */
  private calculateEndDate(startDate: Date, billingPeriod: BillingPeriod): Date {
    const endDate = new Date(startDate);

    switch (billingPeriod) {
      case BillingPeriod.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case BillingPeriod.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BillingPeriod.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return endDate;
  }

  /**
   * Vérifier et mettre à jour les abonnements expirés
   * À appeler par un cron job
   */
  async checkExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lt: now,
        },
      },
      include: {
        company: true,
      },
    });

    for (const subscription of expiredSubscriptions) {
      // Marquer comme expiré
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      });

      // Suspendre la Company si pas encore suspendue
      if (subscription.company.status === CompanyStatus.ACTIVE) {
        await this.prisma.company.update({
          where: { id: subscription.companyId },
          data: {
            status: CompanyStatus.SUSPENDED,
            suspendedAt: now,
            suspendedReason: 'Abonnement expiré',
          },
        });
      }
    }

    return expiredSubscriptions.length;
  }
}

