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

  /**
   * Strip sensitive fields (password, reset tokens) from user objects before returning to client.
   */
  private sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, 'password' | 'resetToken' | 'resetTokenExpiry'> {
    if (!user) return user;
    const { password, resetToken, resetTokenExpiry, ...safe } = user;
    return safe as any;
  }

  private sanitizeUsers<T extends Record<string, any>>(users: T[]): Array<Omit<T, 'password' | 'resetToken' | 'resetTokenExpiry'>> {
    return users.map((u) => this.sanitizeUser(u));
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
      throw new ForbiddenException('Permissions insuffisantes : seuls SUPER_ADMIN et COMPANY_ADMIN peuvent lister les utilisateurs');
    }

    // Remove sensitive and audit fields from public responses
    return this.sanitizeUsers(this.auditService.removeAuditFieldsFromArray(users));
  }

  async findOne(id: string, user: any) {
    const includeRelations = {
      company: true,
      userAgencies: { include: { agency: true } },
    };

    // Users can see their own profile
    if (id === user.userId || id === user.sub) {
      const self = await this.prisma.user.findUnique({ where: { id }, include: includeRelations });
      return self ? this.sanitizeUser(self) : null;
    }

    // Check permissions for other users
    if (user.role === 'SUPER_ADMIN') {
      const found = await this.prisma.user.findUnique({ where: { id }, include: includeRelations });
      return found ? this.sanitizeUser(found) : null;
    }

    if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      const targetUser = await this.prisma.user.findUnique({ where: { id } });
      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Accès refusé');
      }

      const userWithRelations = await this.prisma.user.findUnique({ where: { id }, include: includeRelations });
      if (!userWithRelations) {
        throw new NotFoundException('Utilisateur introuvable');
      }

      return this.sanitizeUser(this.auditService.removeAuditFields(userWithRelations));
    }

    throw new ForbiddenException('Permissions insuffisantes');
  }

  async create(createUserDto: CreateUserDto, user: any) {
    const { email, name, role, companyId, agencyIds } = createUserDto;

    if (!email || !name || !role) {
      throw new BadRequestException('L\'email, le nom et le rôle sont requis');
    }

    const validRoles = ['COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT'];
    if (user.role !== 'SUPER_ADMIN' && !validRoles.includes(role)) {
      throw new BadRequestException('Rôle invalide');
    }

    if (user.role === 'COMPANY_ADMIN' && !['AGENCY_MANAGER', 'AGENT'].includes(role)) {
      throw new ForbiddenException('L\'administrateur de société ne peut pas créer ce rôle');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    let targetCompanyId = companyId || user.companyId;

    if (user.role === 'COMPANY_ADMIN') {
      if (companyId && companyId !== user.companyId) {
        throw new ForbiddenException('Impossible de créer un utilisateur pour une autre société');
      }
      targetCompanyId = user.companyId!;
    }

    if (targetCompanyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: targetCompanyId },
      });

      if (!company || !company.isActive) {
        throw new BadRequestException('Société introuvable ou inactive');
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
        throw new BadRequestException('Certaines agences n\'appartiennent pas à la société');
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

    sendWelcomeEmail(email, name, resetToken).catch((emailError) =>
      console.error('Error sending welcome email:', emailError),
    );

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
      throw new Error('Impossible de récupérer l\'utilisateur après création. Veuillez réessayer.');
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
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (user.role === 'COMPANY_ADMIN' && targetUser.companyId !== user.companyId) {
      throw new ForbiddenException('Impossible de mettre à jour un utilisateur d\'une autre société');
    }

    // --- Self-modification protections ---
    const currentUserId = user.id || user.userId || user.sub;
    const isSelf = currentUserId === id;

    if (isSelf) {
      // Prevent self role change
      if (updateUserDto.role !== undefined && updateUserDto.role !== targetUser.role) {
        throw new ForbiddenException(
          'Vous ne pouvez pas modifier votre propre rôle. Contactez un administrateur supérieur.',
        );
      }
      // Prevent self deactivation
      if (updateUserDto.isActive === false) {
        throw new ForbiddenException(
          'Vous ne pouvez pas désactiver votre propre compte.',
        );
      }
    }

    // Store previous state for event log
    const previousState = { ...targetUser };

    const updateData: any = {};
    if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
    if (updateUserDto.role !== undefined) {
      if (user.role === 'COMPANY_ADMIN') {
        // Si le rôle envoyé est le même que l'actuel, on ignore (pas de changement)
        if (updateUserDto.role === targetUser.role) {
          // Pas de changement de rôle, on ne fait rien
        } else if (!['AGENCY_MANAGER', 'AGENT'].includes(updateUserDto.role)) {
          throw new ForbiddenException(
            `Vous ne pouvez pas attribuer le rôle "${updateUserDto.role}". ` +
            `Les rôles autorisés sont : Gestionnaire d'agence (AGENCY_MANAGER) et Agent (AGENT).`
          );
        } else {
          updateData.role = updateUserDto.role;
        }
      } else if (user.role === 'SUPER_ADMIN') {
        updateData.role = updateUserDto.role;
      }
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
      throw new NotFoundException('Utilisateur introuvable');
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
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (user.role === 'COMPANY_ADMIN' && targetUser.companyId !== user.companyId) {
      throw new ForbiddenException('Impossible de réinitialiser le mot de passe pour un utilisateur d\'une autre société');
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

    sendWelcomeEmail(targetUser.email, targetUser.name, resetToken).catch((emailError) =>
      console.error('Error sending reset email:', emailError),
    );

    return { message: 'Email de réinitialisation du mot de passe envoyé' };
  }

  async remove(id: string, user: any, reason?: string) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul SUPER_ADMIN peut supprimer des utilisateurs');
    }

    // Prevent self-deletion
    const currentUserId = user.id || user.userId || user.sub;
    if (currentUserId === id) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: this.softDeleteService.addSoftDeleteFilter({ id }),
    });

    if (!targetUser) {
      throw new NotFoundException('Utilisateur introuvable');
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

    return { message: 'Utilisateur supprimé avec succès' };
  }
}
