import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { sendPasswordResetEmail } from '../../services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        userAgencies: {
          include: {
            agency: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email introuvable');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte inactif');
    }

    // Vérifier que la company est active (vérifier isActive ET status SaaS)
    if (user.companyId && user.company) {
      if (!user.company.isActive) {
        throw new UnauthorizedException('Société inactive');
      }
      // Vérifier aussi le statut SaaS (si défini)
      if (user.company.status && user.company.status !== 'ACTIVE') {
        throw new UnauthorizedException('Société suspendue ou supprimée');
      }
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    const agencyIds = user.userAgencies.map(ua => ua.agencyId);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
      agencyIds,
    };

    // Générer des tokens avec un jti (JWT ID) unique pour éviter les collisions
    const jti = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const payloadWithJti = {
      ...payload,
      jti, // JWT ID unique
    };

    const accessToken = this.jwtService.sign(payloadWithJti);
    let refreshToken = this.jwtService.sign(payloadWithJti, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Stocker le refresh token avec retry en cas de collision
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    let retries = 0;
    const maxRetries = 5;
    while (retries < maxRetries) {
      try {
        await this.prisma.refreshToken.create({
          data: {
            userId: user.id,
            token: refreshToken,
            expiresAt,
          },
        });
        break; // Succès, sortir de la boucle
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('token')) {
          // Collision détectée, générer un nouveau token
          retries++;
          if (retries >= maxRetries) {
            throw new UnauthorizedException('Failed to generate unique refresh token');
          }
          // Générer un nouveau token avec un jti différent
          const newJti = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          const newPayloadWithJti = {
            ...payload,
            jti: newJti,
          };
          refreshToken = this.jwtService.sign(newPayloadWithJti, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
          });
        } else {
          // Autre erreur, la propager
          throw error;
        }
      }
    }

    // Récupérer les agences avec leurs détails
    const agencies = user.userAgencies.map((ua) => ({
      id: ua.agency.id,
      name: ua.agency.name,
      isActive: !ua.agency.deletedAt && ua.agency.status === 'ACTIVE',
      status: ua.agency.status,
    }));

    // Récupérer les permissions (basées sur le rôle et les permissions d'agence)
    const permissions: Array<{ resource: string; action: string }> = [];
    
    // Permissions basiques selon le rôle
    if (user.role === 'AGENCY_MANAGER') {
      permissions.push(
        { resource: 'bookings', action: 'create' },
        { resource: 'bookings', action: 'read' },
        { resource: 'bookings', action: 'update' },
        { resource: 'bookings', action: 'delete' },
      );
    } else if (user.role === 'AGENT') {
      permissions.push(
        { resource: 'bookings', action: 'read' },
        { resource: 'bookings', action: 'update' },
      );
    }

    // Ajouter les permissions spécifiques des agences
    for (const ua of user.userAgencies) {
      if (ua.permission === 'FULL') {
        permissions.push(
          { resource: 'bookings', action: 'create' },
          { resource: 'bookings', action: 'read' },
          { resource: 'bookings', action: 'update' },
          { resource: 'bookings', action: 'delete' },
        );
      } else if (ua.permission === 'WRITE') {
        permissions.push(
          { resource: 'bookings', action: 'create' },
          { resource: 'bookings', action: 'read' },
          { resource: 'bookings', action: 'update' },
        );
      } else if (ua.permission === 'READ') {
        permissions.push({ resource: 'bookings', action: 'read' });
      }
    }

    // Dédupliquer les permissions
    const uniquePermissions = Array.from(
      new Map(permissions.map((p) => [`${p.resource}:${p.action}`, p])).values(),
    );

    // Récupérer les modules actifs de la company
    const modules: Array<{ id: string; name: string; isActive: boolean }> = [];
    if (user.companyId) {
      const companyModules = await this.prisma.companyModule.findMany({
        where: {
          companyId: user.companyId,
          isActive: true,
        },
      });

      // CompanyModule utilise moduleCode (enum), pas de relation Module
      modules.push(
        ...companyModules.map((cm) => ({
          id: cm.moduleCode, // Utiliser le code du module comme ID
          name: cm.moduleCode, // Utiliser le code comme nom
          isActive: cm.isActive,
        })),
      );
    }

    // Log de connexion
    await this.auditService.logLogin(user.id, user.email);

    // Retourner le format attendu par le mobile
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.name.split(' ')[0] || '',
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        role: user.role,
        companyId: user.companyId,
        company: user.company
          ? {
              id: user.company.id,
              name: user.company.name,
              isActive: user.company.isActive,
              status: user.company.status,
            }
          : undefined,
        agencyIds,
      },
      agencies,
      permissions: uniquePermissions,
      modules,
    };
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  private getResetBaseUrl(client?: string): string {
    if (client === 'admin') {
      return (
        this.configService.get<string>('FRONTEND_ADMIN_URL') ||
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:5173'
      );
    }
    if (client === 'agency') {
      return (
        this.configService.get<string>('FRONTEND_AGENCY_URL') ||
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:8080'
      );
    }
    if (client === 'web') {
      return (
        this.configService.get<string>('FRONTEND_WEB_URL') ||
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001'
      );
    }
    return (
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3001'
    );
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email, client } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      return { message: 'Si un compte existe, un email a été envoyé' };
    }

    if (user.companyId && user.company) {
      if (!user.company.isActive || (user.company.status && user.company.status !== 'ACTIVE')) {
        return { message: 'Si un compte existe, un email a été envoyé' };
      }
    }

    const resetToken = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    const resetBaseUrl = this.getResetBaseUrl(client);
    await sendPasswordResetEmail(user.email, user.name, resetToken, resetBaseUrl);

    return { message: 'Email de réinitialisation envoyé' };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // Vérifier le refresh token dans la base de données
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Vérifier que l'utilisateur est toujours actif
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      include: {
        company: true,
        userAgencies: {
          include: {
            agency: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      // Révoquer le token si l'utilisateur est inactif
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException('User is inactive');
    }

    // Vérifier que la company est active
    if (user.companyId && user.company && !user.company.isActive) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException('Company is inactive');
    }

    const agencyIds = user.userAgencies.map(ua => ua.agencyId);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || undefined,
      agencyIds,
    };

    // Générer de nouveaux tokens avec un jti (JWT ID) unique pour éviter les collisions
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    // Fonction helper pour générer un token unique
    const generateRefreshToken = () => {
      const jti = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
      const payloadWithJti = {
        ...payload,
        jti, // JWT ID unique
      };
      return this.jwtService.sign(payloadWithJti, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      });
    };

    const jti = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
    const payloadWithJti = {
      ...payload,
      jti,
    };
    const newAccessToken = this.jwtService.sign(payloadWithJti);
    let newRefreshToken = generateRefreshToken();

    // Retry en cas de collision de token (très rare mais possible)
    let retries = 0;
    const maxRetries = 5;
    while (retries < maxRetries) {
      try {
        await this.prisma.$transaction([
          // Révoquer l'ancien token
          this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true, revokedAt: new Date() },
          }),
          // Créer le nouveau refresh token
          this.prisma.refreshToken.create({
            data: {
              userId: user.id,
              token: newRefreshToken,
              expiresAt,
            },
          }),
        ]);
        break; // Succès, sortir de la boucle
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('token')) {
          // Collision détectée, générer un nouveau token
          retries++;
          if (retries >= maxRetries) {
            throw new UnauthorizedException('Failed to generate unique refresh token');
          }
          newRefreshToken = generateRefreshToken();
        } else {
          // Autre erreur, la propager
          throw error;
        }
      }
    }

    // Nettoyer les anciens tokens révoqués (optionnel, peut être fait via cron)
    // On garde les tokens révoqués pour audit, mais on peut supprimer ceux expirés depuis plus de 30 jours

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        agencyIds,
      },
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // Find the password reset token
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and delete the token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    // Log password reset
    await this.auditService.log({
      userId: resetToken.userId,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: resetToken.userId,
      description: 'User reset password',
      metadata: { userId: resetToken.userId },
    });

    return { message: 'Password reset successfully' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        userAgencies: {
          include: {
            agency: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}

