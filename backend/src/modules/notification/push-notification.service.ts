import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Push Notification Service using Firebase Cloud Messaging (FCM)
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private firebaseApp: any = null;
  private isInitialized = false;

  constructor(private prisma: PrismaService) {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn('Firebase not configured - push notifications disabled');
        return;
      }

      // Dynamic import to avoid crash if firebase-admin not properly configured
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
      } else {
        this.firebaseApp = admin.app();
      }
      this.isInitialized = true;
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.warn('Firebase init failed - push notifications disabled', error);
    }
  }

  /**
   * Register a device token for a user
   */
  async registerToken(userId: string, token: string, platform: string) {
    // Upsert: if token exists update, else create
    const existing = await (this.prisma as any).deviceToken.findUnique({ where: { token } });
    if (existing) {
      return (this.prisma as any).deviceToken.update({
        where: { token },
        data: { userId, platform, isActive: true },
      });
    }
    return (this.prisma as any).deviceToken.create({
      data: { userId, token, platform, isActive: true },
    });
  }

  /**
   * Unregister a device token
   */
  async unregisterToken(token: string) {
    const existing = await (this.prisma as any).deviceToken.findUnique({ where: { token } });
    if (existing) {
      return (this.prisma as any).deviceToken.update({
        where: { token },
        data: { isActive: false },
      });
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<{ success: number; failed: number }> {
    if (!this.isInitialized) {
      this.logger.warn('Push skipped - Firebase not initialized');
      return { success: 0, failed: 0 };
    }

    const tokens = await (this.prisma as any).deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return { success: 0, failed: 0 };
    }

    return this.sendToTokens(
      tokens.map((t: any) => t.token),
      notification,
    );
  }

  /**
   * Send push notification to all users of a company
   */
  async sendToCompany(companyId: string, notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<{ success: number; failed: number }> {
    if (!this.isInitialized) {
      this.logger.warn('Push skipped - Firebase not initialized');
      return { success: 0, failed: 0 };
    }

    const users = await this.prisma.user.findMany({
      where: { companyId, isActive: true },
      select: { id: true },
    });

    const tokens = await (this.prisma as any).deviceToken.findMany({
      where: {
        userId: { in: users.map((u: any) => u.id) },
        isActive: true,
      },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return { success: 0, failed: 0 };
    }

    return this.sendToTokens(
      tokens.map((t: any) => t.token),
      notification,
    );
  }

  /**
   * Send to multiple tokens with error handling
   */
  private async sendToTokens(
    tokens: string[],
    notification: { title: string; body: string; data?: Record<string, string> },
  ): Promise<{ success: number; failed: number }> {
    if (!this.firebaseApp) {
      return { success: 0, failed: tokens.length };
    }

    let success = 0;
    let failed = 0;

    const admin = require('firebase-admin');
    const messaging = admin.messaging();

    // Send in batches of 500 (FCM limit)
    const batchSize = 500;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);

      try {
        const message = {
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {},
          tokens: batch,
        };

        const response = await messaging.sendEachForMulticast(message);
        success += response.successCount;
        failed += response.failureCount;

        // Deactivate invalid tokens
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
            (this.prisma as any).deviceToken.update({
              where: { token: batch[idx] },
              data: { isActive: false },
            }).catch(() => {});
          }
        });
      } catch (error) {
        this.logger.error('FCM batch send error:', error);
        failed += batch.length;
      }
    }

    return { success, failed };
  }

  /**
   * Check if Firebase is configured
   */
  isConfigured(): boolean {
    return this.isInitialized;
  }
}
