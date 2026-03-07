import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { InitializeCompanySubscriptionDto } from './dto/initialize-company-subscription.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { sendWelcomeEmail } from '../../services/email.service';
import { BusinessEventType, CompanyStatus, AgencyStatus, ModuleCode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import {
  DEFAULT_SAAS_SETTINGS,
  SAAS_SETTINGS_RULE_KEYS,
} from '../saas-settings/saas-settings.types';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Legacy safeguard: when surcharge config is 0, derive a non-zero overage
   * price from plan economics so extra agencies are never silently free.
   */
  private resolveFallbackExtraAgencyPrice(planPrice: number, includedAgenciesQuota?: number): number {
    if (includedAgenciesQuota !== undefined && includedAgenciesQuota > 0) {
      return Math.max(1, Math.ceil(planPrice / includedAgenciesQuota));
    }
    return Math.max(1, planPrice);
  }

  private async getGlobalSaasPricingContext(tx: any) {
    const settingsRules = await tx.businessRule.findMany({
      where: {
        key: { in: Object.values(SAAS_SETTINGS_RULE_KEYS) },
        companyId: null,
        agencyId: null,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    const latestRuleValueByKey = new Map<string, string>();
    settingsRules.forEach((r: { key: string; value: string }) => {
      if (!latestRuleValueByKey.has(r.key)) {
        latestRuleValueByKey.set(r.key, r.value);
      }
    });

    const extraAgencyPriceMad = Number(
      latestRuleValueByKey.get(SAAS_SETTINGS_RULE_KEYS.EXTRA_AGENCY_PRICE_MAD) ??
        DEFAULT_SAAS_SETTINGS.extraAgencyPriceMad,
    );
    const extraModulePriceMad = Number(
      latestRuleValueByKey.get(SAAS_SETTINGS_RULE_KEYS.EXTRA_MODULE_PRICE_MAD) ??
        DEFAULT_SAAS_SETTINGS.extraModulePriceMad,
    );

    return {
      extraAgencyPriceMad: Number.isFinite(extraAgencyPriceMad)
        ? extraAgencyPriceMad
        : DEFAULT_SAAS_SETTINGS.extraAgencyPriceMad,
      extraModulePriceMad: Number.isFinite(extraModulePriceMad)
        ? extraModulePriceMad
        : DEFAULT_SAAS_SETTINGS.extraModulePriceMad,
      allowAgencyOverageOnCreate:
        (latestRuleValueByKey.get(
          SAAS_SETTINGS_RULE_KEYS.ALLOW_AGENCY_OVERAGE_ON_CREATE,
        ) ?? String(DEFAULT_SAAS_SETTINGS.allowAgencyOverageOnCreate)) === 'true',
      allowAdditionalModulesOnCreate:
        (latestRuleValueByKey.get(
          SAAS_SETTINGS_RULE_KEYS.ALLOW_ADDITIONAL_MODULES_ON_CREATE,
        ) ?? String(DEFAULT_SAAS_SETTINGS.allowAdditionalModulesOnCreate)) === 'true',
    };
  }

  private async expandModuleCodesWithDependencies(
    tx: any,
    moduleCodes: ModuleCode[],
  ): Promise<ModuleCode[]> {
    const expanded = new Set<ModuleCode>(moduleCodes);
    const queue = [...expanded];

    while (queue.length > 0) {
      const current = queue.pop();
      if (!current) continue;
      const deps = await tx.moduleDependency.findMany({
        where: { moduleCode: current },
        select: { dependsOnCode: true },
      });
      for (const dep of deps) {
        const depCode = dep.dependsOnCode as ModuleCode;
        if (!expanded.has(depCode)) {
          expanded.add(depCode);
          queue.push(depCode);
        }
      }
    }

    return Array.from(expanded);
  }

  private async applyInitialSubscription(
    tx: any,
    params: {
      companyId: string;
      planId: string;
      maxAgencies?: number;
      additionalModuleCodes?: ModuleCode[];
      actorId?: string;
      strictPlanValidation?: boolean;
    },
  ) {
    const {
      companyId,
      planId,
      maxAgencies,
      additionalModuleCodes,
      actorId,
      strictPlanValidation = false,
    } = params;

    const plan = await tx.plan.findUnique({
      where: { id: planId },
      include: { planModules: true, planQuotas: true, pricingRule: true },
    });

    if (!plan || !plan.isActive) {
      if (strictPlanValidation) {
        throw new BadRequestException('Plan introuvable ou inactif');
      }
      return null;
    }

    const globalContext = await this.getGlobalSaasPricingContext(tx);
    const configuredExtraAgencyPriceMad =
      plan.pricingRule && plan.pricingRule.extraAgencyPriceMad > 0
        ? plan.pricingRule.extraAgencyPriceMad
        : globalContext.extraAgencyPriceMad;
    const configuredExtraModulePriceMad =
      plan.pricingRule && plan.pricingRule.extraModulePriceMad > 0
        ? plan.pricingRule.extraModulePriceMad
        : globalContext.extraModulePriceMad;
    const effectiveAllowAgencyOverageOnCreate =
      plan.pricingRule?.allowAgencyOverageOnCreate ??
      globalContext.allowAgencyOverageOnCreate;
    const effectiveAllowAdditionalModulesOnCreate =
      plan.pricingRule?.allowAdditionalModulesOnCreate ??
      globalContext.allowAdditionalModulesOnCreate;

    const planModuleCodes = plan.planModules.map((pm: { moduleCode: ModuleCode }) => pm.moduleCode);
    const extraModuleCodes =
      (additionalModuleCodes || []).filter((code) => !planModuleCodes.includes(code)) || [];
    if (!effectiveAllowAdditionalModulesOnCreate && extraModuleCodes.length > 0) {
      throw new BadRequestException(
        "L'ajout de modules additionnels a la creation est desactive par la configuration SaaS.",
      );
    }

    const planAgencyQuota = plan.planQuotas.find(
      (q: { quotaKey: string; quotaValue: number }) =>
        q.quotaKey === 'agencies' ||
        q.quotaKey === 'max_agencies' ||
        q.quotaKey === 'maxAgencies',
    );
    const fallbackExtraAgencyPriceMad = this.resolveFallbackExtraAgencyPrice(
      plan.price,
      planAgencyQuota?.quotaValue,
    );
    const effectiveExtraAgencyPriceMad =
      configuredExtraAgencyPriceMad > 0
        ? configuredExtraAgencyPriceMad
        : fallbackExtraAgencyPriceMad;
    const effectiveExtraModulePriceMad =
      configuredExtraModulePriceMad > 0 ? configuredExtraModulePriceMad : 0;

    const resolvedMaxAgencies =
      maxAgencies ??
      (planAgencyQuota && planAgencyQuota.quotaValue >= 0
        ? planAgencyQuota.quotaValue
        : undefined);
    const extraAgenciesCount =
      resolvedMaxAgencies !== undefined &&
      planAgencyQuota &&
      planAgencyQuota.quotaValue >= 0
        ? Math.max(0, resolvedMaxAgencies - planAgencyQuota.quotaValue)
        : 0;
    if (!effectiveAllowAgencyOverageOnCreate && extraAgenciesCount > 0) {
      throw new BadRequestException(
        "Le depassement du quota agences a la creation est desactive par la configuration SaaS.",
      );
    }

    if (maxAgencies === undefined && planAgencyQuota && planAgencyQuota.quotaValue >= 0) {
      await tx.company.update({
        where: { id: companyId },
        data: { maxAgencies: planAgencyQuota.quotaValue },
      });
    } else if (maxAgencies !== undefined) {
      await tx.company.update({
        where: { id: companyId },
        data: { maxAgencies },
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const requestedAllModuleCodes = Array.from(
      new Set([...planModuleCodes, ...extraModuleCodes]),
    ) as ModuleCode[];
    const allModuleCodes = await this.expandModuleCodesWithDependencies(
      tx,
      requestedAllModuleCodes,
    );

    const subscription = await tx.subscription.create({
      data: {
        companyId,
        planId: plan.id,
        status: 'ACTIVE',
        billingPeriod: 'MONTHLY',
        startDate,
        endDate,
        amount:
          plan.price +
          extraAgenciesCount * effectiveExtraAgencyPriceMad +
          extraModuleCodes.length * effectiveExtraModulePriceMad,
        createdByUserId: actorId,
      },
    });

    if (allModuleCodes.length > 0) {
      await tx.subscriptionModule.createMany({
        data: allModuleCodes.map((moduleCode) => ({
          subscriptionId: subscription.id,
          moduleCode,
        })),
      });

      await tx.companyModule.createMany({
        data: allModuleCodes.map((moduleCode) => ({
          companyId,
          moduleCode,
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }

    return subscription;
  }

  async findAll() {
    const companies = await this.prisma.company.findMany({
      where: this.softDeleteService.addSoftDeleteFilter(),
      include: {
        _count: {
          select: {
            agencies: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove audit fields from public responses
    return this.auditService.removeAuditFieldsFromArray(companies);
  }

  async findAllLight(page = 1, pageSize = 25, q?: string) {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize) ? Math.min(Math.max(1, Math.floor(pageSize)), 100) : 25;
    const skip = (safePage - 1) * safePageSize;
    const search = q?.trim();
    const where = this.softDeleteService.addSoftDeleteFilter({
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    });

    const [itemsRaw, total, activeTotal] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          _count: {
            select: {
              agencies: true,
              users: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safePageSize,
      }),
      this.prisma.company.count({ where }),
      this.prisma.company.count({ where: { ...where, isActive: true } }),
    ]);

    const items = this.auditService.removeAuditFieldsFromArray(itemsRaw);
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));

    return {
      items,
      total,
      activeTotal,
      inactiveTotal: total - activeTotal,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    };
  }

  async findRecent(limit = 5) {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 5;
    const companies = await this.prisma.company.findMany({
      where: this.softDeleteService.addSoftDeleteFilter(),
      include: {
        _count: {
          select: {
            agencies: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    return this.auditService.removeAuditFieldsFromArray(companies);
  }

  async getAdminStats() {
    const [companies, agencies, users] = await Promise.all([
      this.prisma.company.count({
        where: this.softDeleteService.addSoftDeleteFilter(),
      }),
      this.prisma.agency.count({
        where: this.softDeleteService.addSoftDeleteFilter(),
      }),
      this.prisma.user.count({
        where: this.softDeleteService.addSoftDeleteFilter(),
      }),
    ]);

    return { companies, agencies, users };
  }

  async findAllLookup() {
    return this.prisma.company.findMany({
      where: this.softDeleteService.addSoftDeleteFilter(),
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findSummary(id: string) {
    const company = await this.prisma.company.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      select: {
        id: true,
        name: true,
        status: true,
        currency: true,
        suspendedAt: true,
        suspendedReason: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    return company;
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
      include: {
        agencies: true,
        users: {
          include: {
            userAgencies: {
              include: {
                agency: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(company);
  }

  async findMyCompany(user: any) {
    const companyId = user?.companyId;
    if (!companyId) {
      throw new NotFoundException('Société introuvable');
    }

    const company = await this.prisma.company.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id: companyId }),
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    return this.auditService.removeAuditFields(company);
  }

  async updateMyCompanySettings(user: any, dto: UpdateCompanySettingsDto) {
    const companyId = user?.companyId;
    if (!companyId) {
      throw new NotFoundException('Société introuvable');
    }

    const company = await this.prisma.company.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id: companyId }),
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    const previousState = { ...company };

    const updateData: any = {};
    if (dto.bookingNumberMode !== undefined) updateData.bookingNumberMode = dto.bookingNumberMode;

    const dataWithAudit = this.auditService.addUpdateAuditFields(
      updateData,
      user?.id || user?.userId || user?.sub,
    );

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: dataWithAudit,
    });

    this.businessEventLogService
      .logEvent(
        null,
        'Company',
        updatedCompany.id,
        BusinessEventType.COMPANY_UPDATED,
        previousState,
        updatedCompany,
        user?.id || user?.userId || user?.sub,
        updatedCompany.id,
      )
      .catch((err) => console.error('Error logging company settings update event:', err));

    return this.auditService.removeAuditFields(updatedCompany);
  }

  async create(createCompanyDto: CreateCompanyDto, user: any) {
    const {
      name,
      raisonSociale,
      identifiantLegal,
      formeJuridique,
      maxAgencies,
      bookingNumberMode,
      phone,
      address,
      adminEmail,
      adminName,
      planId,
      additionalModuleCodes,
    } = createCompanyDto;

    if (!name) {
      throw new BadRequestException('Le nom est requis');
    }

    if (!raisonSociale || !identifiantLegal || !formeJuridique) {
      throw new BadRequestException('Les champs légaux sont requis');
    }

    const slug = this.generateSlug(name);

    // Check if slug already exists (exclure les companies supprimées)
    const existingCompany = await this.prisma.company.findFirst({
      where: { slug, deletedAt: null },
    });

    if (existingCompany) {
      throw new BadRequestException('Une société avec ce nom existe déjà');
    }

    // Check identifiant légal (exclure les companies supprimées)
    const existingLegalId = await this.prisma.company.findFirst({
      where: { identifiantLegal, deletedAt: null },
    });

    if (existingLegalId) {
      throw new BadRequestException('L\'identifiant légal existe déjà');
    }

    if (adminEmail) {
      // Check admin email (exclure les users supprimés)
      const existingAdmin = await this.prisma.user.findFirst({
        where: { email: adminEmail, deletedAt: null },
      });

      if (existingAdmin) {
        throw new BadRequestException('L\'email administrateur existe déjà');
      }
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        name,
        slug,
        raisonSociale,
        identifiantLegal,
        formeJuridique,
        maxAgencies,
        bookingNumberMode,
        phone,
        address,
        isActive: true,
      },
      user?.id || user?.userId || user?.sub,
    );

    const company = await this.prisma.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({
        data: dataWithAudit,
      });

      // Create admin user if provided
      if (adminEmail && adminName) {
        const resetToken = this.generateResetToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        const tempPassword = 'temp-password-' + Date.now();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const adminUser = await tx.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            role: 'COMPANY_ADMIN',
            companyId: createdCompany.id,
            isActive: true,
          },
        });

        await tx.passwordResetToken.create({
          data: {
            userId: adminUser.id,
            token: resetToken,
            expiresAt,
          },
        });

        sendWelcomeEmail(adminEmail, adminName, resetToken).catch((emailError) =>
          console.error('Error sending welcome email:', emailError),
        );
      }

      if (planId) {
        await this.applyInitialSubscription(tx, {
          companyId: createdCompany.id,
          planId,
          maxAgencies: maxAgencies ?? undefined,
          additionalModuleCodes: additionalModuleCodes as ModuleCode[] | undefined,
          actorId: user?.id || user?.userId || user?.sub,
          strictPlanValidation: false,
        });
      }

      return createdCompany;
    });

    // Log business event (Company doesn't have agencyId, so we use null)
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for Company
        'Company',
        company.id,
        BusinessEventType.COMPANY_CREATED,
        null,
        company,
        user?.id || user?.userId || user?.sub,
        company.id, // companyId
      )
      .catch((err) => console.error('Error logging company creation event:', err));

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(company);
  }

  async initializeSubscription(
    id: string,
    dto: InitializeCompanySubscriptionDto,
    user: any,
  ) {
    const company = await this.prisma.company.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
      const existingSubscription = await tx.subscription.findUnique({
        where: { companyId: id },
      });

      if (existingSubscription) {
        throw new BadRequestException(
          "Cette entreprise a deja un abonnement. L'initialisation n'est possible qu'une seule fois.",
        );
      }

      const subscription = await this.applyInitialSubscription(tx, {
        companyId: id,
        planId: dto.planId,
        maxAgencies: dto.maxAgencies,
        additionalModuleCodes: dto.additionalModuleCodes,
        actorId: user?.id || user?.userId || user?.sub,
        strictPlanValidation: true,
      });

      return {
        companyId: id,
        subscription,
      };
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: any) {
    const company = await this.prisma.company.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    // Store previous state for event log
    const previousState = { ...company };

    const updateData: any = {};
    if (updateCompanyDto.name !== undefined) updateData.name = updateCompanyDto.name;
    if (updateCompanyDto.phone !== undefined) updateData.phone = updateCompanyDto.phone;
    if (updateCompanyDto.address !== undefined) updateData.address = updateCompanyDto.address;
    if (updateCompanyDto.isActive !== undefined) updateData.isActive = updateCompanyDto.isActive;
    if (updateCompanyDto.raisonSociale !== undefined) updateData.raisonSociale = updateCompanyDto.raisonSociale;
    if (updateCompanyDto.identifiantLegal !== undefined) updateData.identifiantLegal = updateCompanyDto.identifiantLegal;
    if (updateCompanyDto.formeJuridique !== undefined) updateData.formeJuridique = updateCompanyDto.formeJuridique;
    if (updateCompanyDto.maxAgencies !== undefined) updateData.maxAgencies = updateCompanyDto.maxAgencies;
    if (updateCompanyDto.bookingNumberMode !== undefined) updateData.bookingNumberMode = updateCompanyDto.bookingNumberMode;

    // Regenerate slug if name changed
    if (updateCompanyDto.name && updateCompanyDto.name !== company.name) {
      const slug = this.generateSlug(updateCompanyDto.name);

      const existingCompany = await this.prisma.company.findUnique({
        where: { slug },
      });

      if (!existingCompany || existingCompany.id === company.id) {
        updateData.slug = slug;
      }
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(updateData, user?.id || user?.userId || user?.sub);

    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: dataWithAudit,
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for Company
        'Company',
        updatedCompany.id,
        BusinessEventType.COMPANY_UPDATED,
        previousState,
        updatedCompany,
        user?.id || user?.userId || user?.sub,
        updatedCompany.id, // companyId
      )
      .catch((err) => console.error('Error logging company update event:', err));

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(updatedCompany);
  }

  async remove(id: string, user: any, reason?: string) {
    const company = await this.prisma.company.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!company) {
      throw new NotFoundException('Société introuvable');
    }

    // Store previous state for event log
    const previousState = { ...company };

    const actorId = user?.id || user?.userId || user?.sub;

    // Add delete audit fields (company)
    const companyDeleteData = this.auditService.addDeleteAuditFields(
      {
        isActive: false,
        status: CompanyStatus.DELETED,
      },
      actorId,
      reason,
    );

    // Soft-delete cascade: disable related users and agencies immediately
    // so existing sessions are blocked on next request.
    const userDeleteData = this.auditService.addDeleteAuditFields(
      {
        isActive: false,
      },
      actorId,
      reason || 'Suppression de la société par administrateur',
    );

    const agencyDeleteData = this.auditService.addDeleteAuditFields(
      {
        status: AgencyStatus.DELETED,
      },
      actorId,
      reason || 'Suppression de la société par administrateur',
    );

    await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: {
          companyId: id,
          deletedAt: null,
        },
        data: userDeleteData,
      }),
      this.prisma.agency.updateMany({
        where: {
          companyId: id,
          deletedAt: null,
        },
        data: agencyDeleteData,
      }),
      this.prisma.company.update({
        where: { id },
        data: companyDeleteData,
      }),
    ]);

    // Log business event
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for Company
        'Company',
        company.id,
        BusinessEventType.COMPANY_DELETED,
        previousState,
        { ...company, ...companyDeleteData },
        user?.id || user?.userId || user?.sub,
        company.id, // companyId
      )
      .catch((err) => console.error('Error logging company deletion event:', err));

    return { message: 'Société supprimée avec succès' };
  }
}
