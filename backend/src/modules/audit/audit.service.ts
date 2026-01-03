import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogData {
  userId?: string;
  companyId?: string;
  agencyId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuditService - Traçabilité complète des actions
 * 
 * Toutes les actions critiques sont enregistrées :
 * - Création, modification, suppression
 * - Connexions, déconnexions
 * - Paiements
 * - Changements de statut booking
 * - Exports, imports
 */
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un log d'audit
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          companyId: data.companyId,
          agencyId: data.agencyId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          description: data.description,
          metadata: data.metadata as any,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Ne pas faire échouer l'opération principale si l'audit échoue
      console.error('Audit log error:', error);
    }
  }

  /**
   * Log de création
   */
  async logCreate(
    userId: string,
    entityType: string,
    entityId: string,
    description: string,
    metadata?: Record<string, any>,
    companyId?: string,
    agencyId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      agencyId,
      action: AuditAction.CREATE,
      entityType,
      entityId,
      description,
      metadata,
    });
  }

  /**
   * Log de modification
   */
  async logUpdate(
    userId: string,
    entityType: string,
    entityId: string,
    description: string,
    before?: Record<string, any>,
    after?: Record<string, any>,
    companyId?: string,
    agencyId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      agencyId,
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      description,
      metadata: {
        before,
        after,
      },
    });
  }

  /**
   * Log de suppression
   */
  async logDelete(
    userId: string,
    entityType: string,
    entityId: string,
    description: string,
    companyId?: string,
    agencyId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      agencyId,
      action: AuditAction.DELETE,
      entityType,
      entityId,
      description,
    });
  }

  /**
   * Log de connexion
   */
  async logLogin(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.LOGIN,
      description: `User ${email} logged in`,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log de déconnexion
   */
  async logLogout(userId: string, email: string): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.LOGOUT,
      description: `User ${email} logged out`,
    });
  }

  /**
   * Log de paiement
   */
  async logPayment(
    userId: string,
    paymentId: string,
    amount: number,
    method: string,
    companyId?: string,
    agencyId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      agencyId,
      action: AuditAction.PAYMENT,
      entityType: 'Payment',
      entityId: paymentId,
      description: `Payment of ${amount}€ via ${method}`,
      metadata: {
        amount,
        method,
      },
    });
  }

  /**
   * Log de changement de statut booking
   */
  async logBookingStatusChange(
    userId: string,
    bookingId: string,
    oldStatus: string,
    newStatus: string,
    agencyId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      agencyId,
      action: AuditAction.BOOKING_STATUS_CHANGE,
      entityType: 'Booking',
      entityId: bookingId,
      description: `Booking status changed from ${oldStatus} to ${newStatus}`,
      metadata: {
        oldStatus,
        newStatus,
      },
    });
  }

  /**
   * Obtenir les logs d'audit
   */
  async getLogs(filters: {
    userId?: string;
    companyId?: string;
    agencyId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.prisma.auditLog.findMany({
      where: {
        userId: filters.userId,
        companyId: filters.companyId,
        agencyId: filters.agencyId,
        action: filters.action,
        entityType: filters.entityType,
        entityId: filters.entityId,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 100,
    });
  }
}





