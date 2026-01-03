import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaSoftDeleteService } from '../../common/prisma/prisma-soft-delete.service';
import { AuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { sendWelcomeEmail } from '../../services/email.service';
import { BusinessEventType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private softDeleteService: PrismaSoftDeleteService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  async findAll(user: any) {
    let users;
    if (user.role === 'SUPER_ADMIN') {
      users = await this.prisma.user.findMany({
        where: this.softDeleteService.addSoftDeleteFilter(),
        include: {
          company: true,
          userAgencies: {
            include: {
              agency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      users = await this.prisma.user.findMany({
        where: this.softDeleteService.addSoftDeleteFilter({ companyId: user.companyId }),
        include: {
          company: true,
          userAgencies: {
            include: {
              agency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Remove audit fields from public responses
    return this.auditService.removeAuditFieldsFromArray(users);
  }

  async findOne(id: string, user: any) {
    // Users can see their own profile
    if (id === user.userId || id === user.sub) {
      return this.prisma.user.findUnique({
        where: { id },
        include: {
          company: true,
          userAgencies: {
            include: {
              agency: true,
            },
          },
        },
      });
    }

    // Check permissions for other users
    if (user.role === 'SUPER_ADMIN') {
      return this.prisma.user.findUnique({
        where: { id },
        include: {
          company: true,
          userAgencies: {
            include: {
              agency: true,
            },
          },
        },
      });
    }

    if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied');
      }

      const userWithRelations = await this.prisma.user.findUnique({
        where: { id },
        include: {
          company: true,
          userAgencies: {
            include: {
              agency: true,
            },
          },
        },
      });

      if (!userWithRelations) {
        throw new NotFoundException('User not found');
      }

      // Remove audit fields from public responses
      return this.auditService.removeAuditFields(userWithRelations);
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async create(createUserDto: CreateUserDto, user: any) {
    const { email, name, role, companyId, agencyIds } = createUserDto;

    if (!email || !name || !role) {
      throw new BadRequestException('Email, name, and role are required');
    }

    const validRoles = ['COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT'];
    if (user.role !== 'SUPER_ADMIN' && !validRoles.includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    let targetCompanyId = companyId || user.companyId;

    if (user.role === 'COMPANY_ADMIN') {
      if (companyId && companyId !== user.companyId) {
        throw new ForbiddenException('Cannot create user for another company');
      }
      targetCompanyId = user.companyId!;
    }

    if (targetCompanyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: targetCompanyId },
      });

      if (!company || !company.isActive) {
        throw new BadRequestException('Company not found or inactive');
      }
    }

    if (agencyIds && agencyIds.length > 0 && targetCompanyId) {
      const agencies = await this.prisma.agency.findMany({
        where: {
          id: { in: agencyIds },
          companyId: targetCompanyId,
        },
      });

      if (agencies.length !== agencyIds.length) {
        throw new BadRequestException('Some agencies do not belong to the company');
      }
    }

    const tempPassword = 'temp-password-' + Date.now();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Add audit fields
    const dataWithAudit = this.auditService.addCreateAuditFields(
      {
        email,
        password: hashedPassword,
        name,
        role,
        companyId: targetCompanyId || null,
        isActive: true,
      },
      user?.id || user?.userId || user?.sub,
    );

    const newUser = await this.prisma.user.create({
      data: dataWithAudit,
    });

    if (agencyIds && agencyIds.length > 0) {
      await this.prisma.userAgency.createMany({
        data: agencyIds.map((agencyId: string) => ({
          userId: newUser.id,
          agencyId,
        })),
      });
    }

    const resetToken = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: newUser.id,
        token: resetToken,
        expiresAt,
      },
    });

    try {
      await sendWelcomeEmail(email, name, resetToken);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    const userWithRelations = await this.prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        company: true,
        userAgencies: {
          include: {
            agency: true,
          },
        },
      },
    });

    if (!userWithRelations) {
      throw new Error('Failed to retrieve created user');
    }

    // Log business event (User doesn't have agencyId, so we use null)
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for User
        'User',
        newUser.id,
        BusinessEventType.USER_CREATED,
        null,
        userWithRelations,
        user?.id || user?.userId || user?.sub,
        newUser.companyId || null, // companyId
      )
      .catch((err) => console.error('Error logging user creation event:', err));

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(userWithRelations);
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: any) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userAgencies: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'COMPANY_ADMIN' && targetUser.companyId !== user.companyId) {
      throw new ForbiddenException('Cannot update user from another company');
    }

    // Store previous state for event log
    const previousState = { ...targetUser };

    const updateData: any = {};
    if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
    if (updateUserDto.role !== undefined && user.role === 'SUPER_ADMIN') {
      updateData.role = updateUserDto.role;
    }
    if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;

    // Add audit fields
    const dataWithAudit = this.auditService.addUpdateAuditFields(updateData, user?.id || user?.userId || user?.sub);

    await this.prisma.user.update({
      where: { id },
      data: dataWithAudit,
    });

    if (updateUserDto.agencyIds !== undefined) {
      await this.prisma.userAgency.deleteMany({
        where: { userId: id },
      });

      if (updateUserDto.agencyIds.length > 0) {
        await this.prisma.userAgency.createMany({
          data: updateUserDto.agencyIds.map((agencyId: string) => ({
            userId: id,
            agencyId,
          })),
        });
      }
    }

    const updatedUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        userAgencies: {
          include: {
            agency: true,
          },
        },
      },
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    // Log business event
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for User
        'User',
        updatedUser.id,
        BusinessEventType.USER_UPDATED,
        previousState,
        updatedUser,
        user?.id || user?.userId || user?.sub,
        updatedUser.companyId || null, // companyId
      )
      .catch((err) => console.error('Error logging user update event:', err));

    // Remove audit fields from public responses
    return this.auditService.removeAuditFields(updatedUser);
  }

  async resetPassword(id: string, user: any) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'COMPANY_ADMIN' && targetUser.companyId !== user.companyId) {
      throw new ForbiddenException('Cannot reset password for user from another company');
    }

    const resetToken = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: targetUser.id,
        token: resetToken,
        expiresAt,
      },
    });

    try {
      await sendWelcomeEmail(targetUser.email, targetUser.name, resetToken);
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
    }

    return { message: 'Password reset email sent' };
  }

  async remove(id: string, user: any, reason?: string) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can delete users');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Store previous state for event log
    const previousState = { ...targetUser };

    // Add delete audit fields
    const deleteData = this.auditService.addDeleteAuditFields(
      {
        isActive: false,
      },
      user?.id || user?.userId || user?.sub,
      reason,
    );

    await this.prisma.user.update({
      where: { id },
      data: deleteData,
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        null, // No agencyId for User
        'User',
        targetUser.id,
        BusinessEventType.USER_DELETED,
        previousState,
        { ...targetUser, ...deleteData },
        user?.id || user?.userId || user?.sub,
        targetUser.companyId || null, // companyId
      )
      .catch((err) => console.error('Error logging user deletion event:', err));

    return { message: 'User deleted successfully' };
  }
}
