import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationChannel, NotificationType } from '@prisma/client';

/**
 * WhatsApp Business API Service
 * Documentation: https://developers.facebook.com/docs/whatsapp
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private apiUrl: string;
  private apiToken: string;
  private phoneNumberId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL') || '';
    this.apiToken = this.configService.get<string>('WHATSAPP_API_TOKEN') || '';
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
  }

  async sendMessage(
    to: string,
    message: string,
    type: NotificationType = NotificationType.TRANSACTIONAL,
  ): Promise<void> {
    if (!this.apiUrl || !this.apiToken || !this.phoneNumberId) {
      this.logger.warn('WhatsApp API not configured, skipping message');
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace(/[^0-9]/g, ''), // Nettoyer le numéro
          type: 'text',
          text: {
            body: message,
          },
        }),
      });

      const data = await response.json();

      // Enregistrer dans l'historique
      await this.prisma.notification.create({
        data: {
          channel: NotificationChannel.WHATSAPP,
          type,
          recipient: to,
          content: message,
          sent: response.ok,
          sentAt: response.ok ? new Date() : undefined,
          error: response.ok ? undefined : JSON.stringify(data),
          metadata: data as any,
        },
      });
    } catch (error) {
      this.logger.error('WhatsApp send error:', error);

      await this.prisma.notification.create({
        data: {
          channel: NotificationChannel.WHATSAPP,
          type,
          recipient: to,
          content: message,
          sent: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  async sendBookingReminder(
    phone: string,
    bookingDetails: {
      clientName: string;
      vehicleInfo: string;
      startDate: Date;
    },
  ): Promise<void> {
    const message = `Bonjour ${bookingDetails.clientName},\n\nRappel : Votre location de ${bookingDetails.vehicleInfo} commence le ${bookingDetails.startDate.toLocaleDateString('fr-FR')}.\n\nMerci !`;

    await this.sendMessage(phone, message, NotificationType.TRANSACTIONAL);
  }
}

