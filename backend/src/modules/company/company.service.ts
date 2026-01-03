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
      throw new NotFoundException('Company not found');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(company);
  }

  async create(createCompanyDto: CreateCompanyDto, user: any) {
    const { name, phone, address, adminEmail, adminName } = createCompanyDto;

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const slug = this.generateSlug(name);

    // Check if slug already exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { slug },
    });

    if (existingCompany) {
      throw new BadRequestException('Company with this name already exists');
    }

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        name,
        slug,
        phone,
        address,
        isActive: true,
      },
      user?.id || user?.userId || user?.sub,
    );

    const company = await this.prisma.company.create({
      data: dataWithAudit,
    });

    // Create admin user if provided
    if (adminEmail && adminName) {
      try {
        const resetToken = this.generateResetToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        const tempPassword = 'temp-password-' + Date.now();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const adminUser = await this.prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            role: 'COMPANY_ADMIN',
            companyId: company.id,
            isActive: true,
          },
        });

        await this.prisma.passwordResetToken.create({
          data: {
            userId: adminUser.id,
            token: resetToken,
            expiresAt,
          },
        });

        await sendWelcomeEmail(adminEmail, adminName, resetToken);
      } catch (emailError) {
        console.error('Error creating admin user or sending email:', emailError);
        // Continue even if email fails
      }
    }

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
      throw new NotFoundException('Company not found');
    }

    // Store previous state for event log
    const previousState = { ...company };

    const updateData: any = {};
    if (updateCompanyDto.name !== undefined) updateData.name = updateCompanyDto.name;
    if (updateCompanyDto.phone !== undefined) updateData.phone = updateCompanyDto.phone;
    if (updateCompanyDto.address !== undefined) updateData.address = updateCompanyDto.address;
    if (updateCompanyDto.isActive !== undefined) updateData.isActive = updateCompanyDto.isActive;

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
      throw new NotFoundException('Company not found');
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

    return { message: 'Company deleted successfully' };
  }
}
