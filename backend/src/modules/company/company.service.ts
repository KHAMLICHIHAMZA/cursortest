import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { sendWelcomeEmail } from '../../services/email.service';
import { BusinessEventType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

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
        const plan = await tx.plan.findUnique({
          where: { id: planId },
          include: { planModules: true },
        });

        if (plan && plan.isActive) {
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);

          const subscription = await tx.subscription.create({
            data: {
              companyId: createdCompany.id,
              planId: plan.id,
              status: 'ACTIVE',
              billingPeriod: 'MONTHLY',
              startDate,
              endDate,
              amount: plan.price,
              createdByUserId: user?.id || user?.userId || user?.sub,
            },
          });

          if (plan.planModules.length > 0) {
            await tx.subscriptionModule.createMany({
              data: plan.planModules.map((pm) => ({
                subscriptionId: subscription.id,
                moduleCode: pm.moduleCode,
              })),
            });

            await tx.companyModule.createMany({
              data: plan.planModules.map((pm) => ({
                companyId: createdCompany.id,
                moduleCode: pm.moduleCode,
                isActive: true,
              })),
              skipDuplicates: true,
            });
          }
        }
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

    // Add delete audit fields
    const deleteData = this.auditService.addDeleteAuditFields({}, user?.id || user?.userId || user?.sub, reason);

    await this.prisma.company.update({
      where: { id },
      data: deleteData,
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for Company
        'Company',
        company.id,
        BusinessEventType.COMPANY_DELETED,
        previousState,
        { ...company, ...deleteData },
        user?.id || user?.userId || user?.sub,
        company.id, // companyId
      )
      .catch((err) => console.error('Error logging company deletion event:', err));

    return { message: 'Société supprimée avec succès' };
  }
}
