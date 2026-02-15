import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AuditService } from '../../common/services/audit.service';

/**
 * Service de gestion des Plans d'abonnement
 * 
 * Gère :
 * - CRUD des plans (Starter, Pro, Enterprise)
 * - Modules inclus dans chaque plan
 * - Quotas par plan
 */
@Injectable()
export class PlanService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Créer un nouveau plan
   */
  async create(createPlanDto: CreatePlanDto, user: any) {
    const { name, description, price, moduleCodes, quotas } = createPlanDto;

    // Vérifier que le nom est unique
    const existing = await this.prisma.plan.findUnique({
      where: { name },
    });

    if (existing) {
      throw new BadRequestException('Un plan avec ce nom existe déjà');
    }

    // Créer le plan
    const plan = await this.prisma.plan.create({
      data: {
        name,
        description,
        price,
        isActive: true,
      },
    });

    // Créer les PlanModules
    if (moduleCodes && moduleCodes.length > 0) {
      await this.prisma.planModule.createMany({
        data: moduleCodes.map((moduleCode) => ({
          planId: plan.id,
          moduleCode,
        })),
      });
    }

    // Créer les PlanQuotas
    if (quotas && Object.keys(quotas).length > 0) {
      await this.prisma.planQuota.createMany({
        data: Object.entries(quotas).map(([quotaKey, quotaValue]) => ({
          planId: plan.id,
          quotaKey,
          quotaValue: quotaValue as number,
        })),
      });
    }

    return this.findOne(plan.id);
  }

  /**
   * Récupérer tous les plans
   */
  async findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      include: {
        planModules: true,
        planQuotas: true,
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Récupérer un plan par ID
   */
  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        planModules: true,
        planQuotas: true,
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan introuvable');
    }

    return plan;
  }

  /**
   * Mettre à jour un plan
   */
  async update(id: string, updatePlanDto: UpdatePlanDto, user: any) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan introuvable');
    }

    const dataWithAudit = this.auditService.addUpdateAuditFields(
      updatePlanDto,
      user?.userId || user?.id,
    );

    return this.prisma.plan.update({
      where: { id },
      data: dataWithAudit,
      include: {
        planModules: true,
        planQuotas: true,
      },
    });
  }

  /**
   * Supprimer (désactiver) un plan
   */
  async remove(id: string, user: any) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan introuvable');
    }

    // Vérifier qu'aucun abonnement n'utilise ce plan
    if (plan._count.subscriptions > 0) {
      throw new BadRequestException(
        'Impossible de supprimer un plan utilisé par des abonnements actifs',
      );
    }

    // Désactiver au lieu de supprimer
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
  }
}


