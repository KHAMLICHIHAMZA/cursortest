import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSaasSettingsDto } from './dto/update-saas-settings.dto';
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
}

