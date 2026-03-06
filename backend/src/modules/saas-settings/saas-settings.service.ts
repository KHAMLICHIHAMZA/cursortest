import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSaasSettingsDto } from './dto/update-saas-settings.dto';
import { SimulateSaasPricingDto } from './dto/simulate-saas-pricing.dto';
import {
  DEFAULT_SAAS_SETTINGS,
  SAAS_SETTINGS_RULE_KEYS,
  SaasSettings,
} from './saas-settings.types';

@Injectable()
export class SaasSettingsService {
  constructor(private prisma: PrismaService) {}

  private parseNumber(value: string | null | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseBoolean(value: string | null | undefined, fallback: boolean): boolean {
    if (value === undefined || value === null) return fallback;
    return value === 'true' || value === '1';
  }

  async getSettings(): Promise<SaasSettings> {
    const keys = Object.values(SAAS_SETTINGS_RULE_KEYS);
    const rules = await this.prisma.businessRule.findMany({
      where: {
        key: { in: keys },
        companyId: null,
        agencyId: null,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const latestByKey = new Map<string, string>();
    rules.forEach((r) => {
      if (!latestByKey.has(r.key)) {
        latestByKey.set(r.key, r.value);
      }
    });

    return {
      extraAgencyPriceMad: this.parseNumber(
        latestByKey.get(SAAS_SETTINGS_RULE_KEYS.EXTRA_AGENCY_PRICE_MAD),
        DEFAULT_SAAS_SETTINGS.extraAgencyPriceMad,
      ),
      extraModulePriceMad: this.parseNumber(
        latestByKey.get(SAAS_SETTINGS_RULE_KEYS.EXTRA_MODULE_PRICE_MAD),
        DEFAULT_SAAS_SETTINGS.extraModulePriceMad,
      ),
      allowAgencyOverageOnCreate: this.parseBoolean(
        latestByKey.get(SAAS_SETTINGS_RULE_KEYS.ALLOW_AGENCY_OVERAGE_ON_CREATE),
        DEFAULT_SAAS_SETTINGS.allowAgencyOverageOnCreate,
      ),
      allowAdditionalModulesOnCreate: this.parseBoolean(
        latestByKey.get(SAAS_SETTINGS_RULE_KEYS.ALLOW_ADDITIONAL_MODULES_ON_CREATE),
        DEFAULT_SAAS_SETTINGS.allowAdditionalModulesOnCreate,
      ),
    };
  }

  async updateSettings(dto: UpdateSaasSettingsDto): Promise<SaasSettings> {
    const updates: Array<{ key: string; value: string; description: string }> = [];

    if (dto.extraAgencyPriceMad !== undefined) {
      updates.push({
        key: SAAS_SETTINGS_RULE_KEYS.EXTRA_AGENCY_PRICE_MAD,
        value: String(dto.extraAgencyPriceMad),
        description: 'Prix agence supplementaire en MAD/mois',
      });
    }
    if (dto.extraModulePriceMad !== undefined) {
      updates.push({
        key: SAAS_SETTINGS_RULE_KEYS.EXTRA_MODULE_PRICE_MAD,
        value: String(dto.extraModulePriceMad),
        description: 'Prix module supplementaire en MAD/mois',
      });
    }
    if (dto.allowAgencyOverageOnCreate !== undefined) {
      updates.push({
        key: SAAS_SETTINGS_RULE_KEYS.ALLOW_AGENCY_OVERAGE_ON_CREATE,
        value: String(dto.allowAgencyOverageOnCreate),
        description: 'Autoriser depassement quota agences a la creation',
      });
    }
    if (dto.allowAdditionalModulesOnCreate !== undefined) {
      updates.push({
        key: SAAS_SETTINGS_RULE_KEYS.ALLOW_ADDITIONAL_MODULES_ON_CREATE,
        value: String(dto.allowAdditionalModulesOnCreate),
        description: 'Autoriser modules additionnels a la creation',
      });
    }

    for (const item of updates) {
      const existing = await this.prisma.businessRule.findFirst({
        where: {
          key: item.key,
          companyId: null,
          agencyId: null,
          isActive: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        await this.prisma.businessRule.update({
          where: { id: existing.id },
          data: {
            value: item.value,
            description: item.description,
            version: existing.version + 1,
          },
        });
      } else {
        await this.prisma.businessRule.create({
          data: {
            key: item.key,
            value: item.value,
            description: item.description,
            isActive: true,
          },
        });
      }
    }

    return this.getSettings();
  }

  async getSettingsAudit() {
    const keys = Object.values(SAAS_SETTINGS_RULE_KEYS);
    return this.prisma.businessRule.findMany({
      where: {
        key: { in: keys },
        companyId: null,
        agencyId: null,
      },
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        version: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async simulatePricing(dto: SimulateSaasPricingDto) {
    const settings = await this.getSettings();

    const selectedPlan = dto.planId
      ? await this.prisma.plan.findUnique({
          where: { id: dto.planId },
          include: { planModules: true, planQuotas: true, pricingRule: true },
        })
      : null;

    if (dto.planId && !selectedPlan) {
      throw new NotFoundException('Plan introuvable');
    }

    if (selectedPlan && !selectedPlan.isActive) {
      throw new BadRequestException('Le plan selectionne est inactif');
    }

    const uniqueAdditionalModules = Array.from(new Set(dto.additionalModuleCodes || []));
    const planModuleCodes = selectedPlan?.planModules.map((pm) => pm.moduleCode) || [];
    const extraModuleCodes = uniqueAdditionalModules.filter(
      (code) => !planModuleCodes.includes(code),
    );
    const allModuleCodes = Array.from(new Set([...planModuleCodes, ...extraModuleCodes]));

    const effectiveExtraAgencyPriceMad =
      selectedPlan?.pricingRule?.extraAgencyPriceMad ?? settings.extraAgencyPriceMad;
    const effectiveExtraModulePriceMad =
      selectedPlan?.pricingRule?.extraModulePriceMad ?? settings.extraModulePriceMad;
    const effectiveAllowAgencyOverageOnCreate =
      selectedPlan?.pricingRule?.allowAgencyOverageOnCreate ??
      settings.allowAgencyOverageOnCreate;
    const effectiveAllowAdditionalModulesOnCreate =
      selectedPlan?.pricingRule?.allowAdditionalModulesOnCreate ??
      settings.allowAdditionalModulesOnCreate;

    const planAgencyQuota = selectedPlan?.planQuotas.find(
      (q) =>
        q.quotaKey === 'agencies' ||
        q.quotaKey === 'max_agencies' ||
        q.quotaKey === 'maxAgencies',
    );
    const baseQuota = planAgencyQuota?.quotaValue;
    const requestedMaxAgencies =
      dto.maxAgencies ??
      (baseQuota !== undefined && baseQuota >= 0 ? baseQuota : undefined);

    const extraAgenciesCount =
      requestedMaxAgencies !== undefined && baseQuota !== undefined && baseQuota >= 0
        ? Math.max(0, requestedMaxAgencies - baseQuota)
        : 0;

    const validationErrors: string[] = [];
    if (!effectiveAllowAgencyOverageOnCreate && extraAgenciesCount > 0) {
      validationErrors.push(
        "Le depassement du quota d'agences est desactive par la regle active.",
      );
    }
    if (!effectiveAllowAdditionalModulesOnCreate && extraModuleCodes.length > 0) {
      validationErrors.push(
        "L'ajout de modules hors pack est desactive par la regle active.",
      );
    }

    if (allModuleCodes.length > 0) {
      const dependencies = await this.prisma.moduleDependency.findMany({
        where: { moduleCode: { in: allModuleCodes } },
      });
      for (const dep of dependencies) {
        if (!allModuleCodes.includes(dep.dependsOnCode)) {
          validationErrors.push(
            `Le module ${dep.moduleCode} requiert ${dep.dependsOnCode}.`,
          );
        }
      }
    }

    const basePlanPrice = selectedPlan?.price ?? 0;
    const monthlyAmount =
      basePlanPrice +
      extraAgenciesCount * effectiveExtraAgencyPriceMad +
      extraModuleCodes.length * effectiveExtraModulePriceMad;

    return {
      input: {
        planId: dto.planId ?? null,
        maxAgencies: requestedMaxAgencies ?? null,
        additionalModuleCodes: uniqueAdditionalModules,
      },
      appliedRules: {
        source: {
          extraAgencyPriceMad: selectedPlan?.pricingRule?.extraAgencyPriceMad !== undefined ? 'plan' : 'global',
          extraModulePriceMad: selectedPlan?.pricingRule?.extraModulePriceMad !== undefined ? 'plan' : 'global',
          allowAgencyOverageOnCreate:
            selectedPlan?.pricingRule?.allowAgencyOverageOnCreate !== undefined
              ? 'plan'
              : 'global',
          allowAdditionalModulesOnCreate:
            selectedPlan?.pricingRule?.allowAdditionalModulesOnCreate !== undefined
              ? 'plan'
              : 'global',
        },
        values: {
          extraAgencyPriceMad: effectiveExtraAgencyPriceMad,
          extraModulePriceMad: effectiveExtraModulePriceMad,
          allowAgencyOverageOnCreate: effectiveAllowAgencyOverageOnCreate,
          allowAdditionalModulesOnCreate: effectiveAllowAdditionalModulesOnCreate,
        },
      },
      breakdown: {
        basePlanPrice,
        includedModules: planModuleCodes,
        extraModules: extraModuleCodes,
        requestedMaxAgencies: requestedMaxAgencies ?? null,
        includedAgenciesQuota: baseQuota ?? null,
        extraAgenciesCount,
      },
      monthlyAmount,
      canProceed: validationErrors.length === 0,
      validationErrors,
    };
  }
}

