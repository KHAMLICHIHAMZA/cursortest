import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// In-App Notification Status (mirroring Prisma enum)
const InAppNotificationStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENT: 'SENT',
  READ: 'READ',
} as const;

// In-App Notification Type (mirroring Prisma enum)
const InAppNotificationType = {
  CONTRACT_TO_SIGN: 'CONTRACT_TO_SIGN',
  INVOICE_AVAILABLE: 'INVOICE_AVAILABLE',
  BOOKING_LATE: 'BOOKING_LATE',
  CHECK_OUT_REMINDER: 'CHECK_OUT_REMINDER',
  INCIDENT_REPORTED: 'INCIDENT_REPORTED',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  ADMIN_ANNOUNCEMENT: 'ADMIN_ANNOUNCEMENT',
} as const;

type InAppNotificationStatusType = (typeof InAppNotificationStatus)[keyof typeof InAppNotificationStatus];
type InAppNotificationTypeType = (typeof InAppNotificationType)[keyof typeof InAppNotificationType];

export interface CreateNotificationDto {
  userId: string;
  companyId?: string;
  agencyId?: string;
  type: InAppNotificationTypeType;
  title: string;
  message: string;
  actionUrl?: string;
  bookingId?: string;
  contractId?: string;
  invoiceId?: string;
  scheduledAt?: Date;
  metadata?: any;
}

@Injectable()
export class InAppNotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * V2: Create a notification (from domain events)
   */
  async createNotification(dto: CreateNotificationDto): Promise<any> {
    const status = dto.scheduledAt
      ? InAppNotificationStatus.SCHEDULED
      : InAppNotificationStatus.DRAFT;

    const notification = await (this.prisma as any).inAppNotification.create({
      data: {
        userId: dto.userId,
        companyId: dto.companyId || null,
        agencyId: dto.agencyId || null,
        type: dto.type,
        status,
        title: dto.title,
        message: dto.message,
        actionUrl: dto.actionUrl || null,
        bookingId: dto.bookingId || null,
        contractId: dto.contractId || null,
        invoiceId: dto.invoiceId || null,
        scheduledAt: dto.scheduledAt || null,
        metadata: dto.metadata || null,
      },
    });

    return notification;
  }

  /**
   * V2: Send a notification (mark as sent)
   */
  async sendNotification(notificationId: string): Promise<any> {
    const notification = await (this.prisma as any).inAppNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    return (this.prisma as any).inAppNotification.update({
      where: { id: notificationId },
      data: {
        status: InAppNotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  /**
   * V2: Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    const notification = await (this.prisma as any).inAppNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    // Verify owner
    if (notification.userId !== userId) {
      throw new NotFoundException('Notification non trouvée');
    }

    return (this.prisma as any).inAppNotification.update({
      where: { id: notificationId },
      data: {
        status: InAppNotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * V2: Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await (this.prisma as any).inAppNotification.updateMany({
      where: {
        userId,
        status: InAppNotificationStatus.SENT,
      },
      data: {
        status: InAppNotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * V2: Get notifications for a user
   */
  async findByUser(
    userId: string,
    options?: {
      status?: InAppNotificationStatusType;
      type?: InAppNotificationTypeType;
      unreadOnly?: boolean;
      limit?: number;
    },
  ): Promise<any[]> {
    const where: any = { userId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.unreadOnly) {
      where.status = { in: [InAppNotificationStatus.DRAFT, InAppNotificationStatus.SENT] };
    }

    return (this.prisma as any).inAppNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });
  }

  /**
   * V2: Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await (this.prisma as any).inAppNotification.count({
      where: {
        userId,
        status: { in: [InAppNotificationStatus.DRAFT, InAppNotificationStatus.SENT] },
        readAt: null,
      },
    });

    return count;
  }

  /**
   * V2: Get a single notification
   */
  async findOne(id: string, userId: string): Promise<any> {
    const notification = await (this.prisma as any).inAppNotification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification non trouvée');
    }

    return notification;
  }

  /**
   * V2: Broadcast a notification to all users of a company, or all companies
   * Used by Super Admin to send announcements
   */
  async broadcastNotification(dto: {
    title: string;
    message: string;
    companyId?: string; // null = all companies
    actionUrl?: string;
    scheduledAt?: Date;
    senderId: string;
  }): Promise<{ count: number }> {
    // Build user filter
    const userWhere: any = { isActive: true, deletedAt: null };

    if (dto.companyId) {
      // Target specific company
      userWhere.companyId = dto.companyId;
    }
    // else: all users across all companies

    // Fetch target users
    const users = await (this.prisma as any).user.findMany({
      where: userWhere,
      select: { id: true, companyId: true },
    });

    if (users.length === 0) {
      return { count: 0 };
    }

    const status = dto.scheduledAt
      ? InAppNotificationStatus.SCHEDULED
      : InAppNotificationStatus.SENT;

    const now = new Date();

    // Create one notification per user
    const createData = users.map((u: any) => ({
      userId: u.id,
      companyId: u.companyId || null,
      agencyId: null,
      type: InAppNotificationType.ADMIN_ANNOUNCEMENT,
      status,
      title: dto.title,
      message: dto.message,
      actionUrl: dto.actionUrl || null,
      bookingId: null,
      contractId: null,
      invoiceId: null,
      scheduledAt: dto.scheduledAt || null,
      sentAt: dto.scheduledAt ? null : now,
      metadata: { senderId: dto.senderId, broadcast: true, targetCompanyId: dto.companyId || 'ALL' },
    }));

    const result = await (this.prisma as any).inAppNotification.createMany({
      data: createData,
    });

    return { count: result.count };
  }

  /**
   * V2: Process scheduled notifications (called by scheduler)
   */
  async processScheduledNotifications(): Promise<number> {
    const now = new Date();

    const result = await (this.prisma as any).inAppNotification.updateMany({
      where: {
        status: InAppNotificationStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      data: {
        status: InAppNotificationStatus.SENT,
        sentAt: now,
      },
    });

    return result.count;
  }
}
