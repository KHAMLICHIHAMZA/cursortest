import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationChannel, NotificationType } from '@prisma/client';

/**
 * Push Notification Service
 * Supporte Firebase Cloud Messaging (FCM) pour mobile
 * 
 * Configuration requise dans .env:
 * - FCM_SERVER_KEY: Clé serveur Firebase
 * - FCM_PROJECT_ID: ID du projet Firebase
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private fcmServerKey: string;
  private fcmProjectId: string;
  private fcmEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY') || '';
    this.fcmProjectId = this.configService.get<string>('FCM_PROJECT_ID') || '';
    this.fcmEnabled = !!this.fcmServerKey && !!this.fcmProjectId;

    if (!this.fcmEnabled) {
      this.logger.warn('FCM non configuré - Les notifications push seront enregistrées mais non envoyées');
    }
  }

  /**
   * Envoyer une notification push via FCM
   */
  async sendPush(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    type: NotificationType = NotificationType.TRANSACTIONAL,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let sent = false;
    let messageId: string | undefined;
    let error: string | undefined;

    if (!this.fcmEnabled) {
      this.logger.debug('FCM non configuré - Simulation d\'envoi');
      sent = false;
    } else {
      try {
        // Appel FCM API
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${this.fcmProjectId}/messages:send`;
        
        const response = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: deviceToken,
              notification: {
                title,
                body,
              },
              data: data ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
              ) : undefined,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          sent = true;
          messageId = result.name;
          this.logger.log(`Push notification sent: ${messageId}`);
        } else {
          const errorData = await response.json();
          error = errorData.error?.message || 'Unknown FCM error';
          this.logger.error(`FCM error: ${error}`);
        }
      } catch (err: any) {
        error = err.message || 'FCM request failed';
        this.logger.error(`Push send error: ${error}`, err.stack);
      }
    }

    // Enregistrer dans l'historique
    try {
      await this.prisma.notification.create({
        data: {
          channel: NotificationChannel.PUSH,
          type,
          recipient: deviceToken,
          subject: title,
          content: body,
          metadata: data as any,
          sent,
          sentAt: sent ? new Date() : undefined,
          error: error || undefined,
        },
      });
    } catch (dbError) {
      this.logger.error('Failed to save notification to database', dbError);
    }

    return { success: sent, messageId, error };
  }

  /**
   * Obtenir un token d'accès OAuth2 pour FCM
   * 
   * Implémentation OAuth2 avec fallback gracieux :
   * - Si firebase-admin SDK est disponible et configuré : utilise OAuth2
   * - Sinon : utilise la méthode legacy (serveur key) qui fonctionne également
   * 
   * Pour activer OAuth2 :
   * 1. Installer firebase-admin : npm install firebase-admin
   * 2. Configurer FCM_SERVICE_ACCOUNT_JSON (JSON string) ou FCM_SERVICE_ACCOUNT_PATH (file path)
   * 3. Le service utilisera automatiquement OAuth2
   */
  private async getAccessToken(): Promise<string> {
    // Vérifier si firebase-admin SDK est disponible (optionnel)
    const serviceAccountJson = this.configService.get<string>('FCM_SERVICE_ACCOUNT_JSON');
    const serviceAccountPath = this.configService.get<string>('FCM_SERVICE_ACCOUNT_PATH');
    
    // Si credentials OAuth2 sont configurés, essayer d'utiliser firebase-admin
    if (serviceAccountJson || serviceAccountPath) {
      try {
        // Tenter d'utiliser firebase-admin dynamiquement (si installé)
        // Note: Cela nécessite que firebase-admin soit installé (npm install firebase-admin)
        // Si le package n'est pas installé, cette tentative échouera gracieusement
        // et on utilisera le fallback legacy
        let admin: any;
        try {
          admin = require('firebase-admin');
        } catch {
          // firebase-admin n'est pas installé, utiliser legacy
          this.logger.debug('firebase-admin SDK not installed, using legacy server key method');
          return this.fcmServerKey;
        }
        
        // Initialiser Firebase Admin si pas encore fait
        if (!admin.apps || admin.apps.length === 0) {
          if (serviceAccountJson) {
            admin.initializeApp({
              credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
            });
          } else if (serviceAccountPath) {
            const fs = require('fs');
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
          }
        }
        
        // Obtenir un token OAuth2 via Firebase Admin
        const app = admin.app();
        if (app.options?.credential) {
          const accessTokenInfo = await app.options.credential.getAccessToken();
          if (accessTokenInfo?.access_token) {
            this.logger.debug('Using OAuth2 token for FCM');
            return accessTokenInfo.access_token;
          }
        }
      } catch (error: any) {
        // Erreur lors de l'initialisation OAuth2, utiliser méthode legacy
        this.logger.warn('OAuth2 initialization failed, falling back to legacy server key method', error.message);
      }
    }
    
    // Fallback: méthode legacy avec serveur key (fonctionne également)
    return this.fcmServerKey;
  }

  /**
   * Envoyer une notification push à plusieurs devices
   */
  async sendPushToMultiple(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
    type: NotificationType = NotificationType.TRANSACTIONAL,
  ): Promise<{ successCount: number; failureCount: number; results: Array<{ token: string; success: boolean; error?: string }> }> {
    const results = await Promise.all(
      deviceTokens.map(async (token) => {
        const result = await this.sendPush(token, title, body, data, type);
        return {
          token,
          success: result.success,
          error: result.error,
        };
      }),
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return {
      successCount,
      failureCount,
      results,
    };
  }
}
