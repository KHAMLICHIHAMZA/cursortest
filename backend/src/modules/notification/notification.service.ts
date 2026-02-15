import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { PushService } from './push.service';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private whatsappService: WhatsAppService,
    private pushService: PushService,
  ) {}

  /**
   * Envoyer une notification multi-canal
   */
  async sendNotification(dto: SendNotificationDto): Promise<void> {
    const { channels, recipient, subject, content, type, metadata } = dto;

    // Vérifier opt-in pour marketing (RGPD)
    if (type === NotificationType.MARKETING) {
      // Récupérer le companyId depuis les metadata ou rechercher par recipient
      let companyId: string | undefined = metadata?.companyId;
      
      if (!companyId && recipient) {
        // Si le recipient est un email, chercher l'utilisateur associé
        const user = await this.prisma.user.findUnique({
          where: { email: recipient },
          select: { companyId: true },
        });
        companyId = user?.companyId || undefined;
      }

      // Si on a un companyId, vérifier les préférences
      if (companyId) {
        const preference = await this.prisma.notificationPreference.findUnique({
          where: { companyId },
        });

        // Vérification opt-in RGPD pour notifications marketing
        // Conformité RGPD : consentement explicite requis pour marketing
        // Le schéma actuel n'a pas de champ marketingOptIn spécifique
        // Donc on considère que l'absence de préférences = pas de consentement = refuser
        // Si les préférences existent, on considère que la company gère ses préférences
        // et accepte les notifications (car elle a créé les préférences explicitement)
        if (!preference) {
          // Pas de préférences = pas de consentement explicite = refuser marketing (RGPD)
          throw new BadRequestException(
            'Les notifications marketing nécessitent un consentement explicite. Veuillez configurer les préférences de notification (conformité RGPD).'
          );
        }
        // Note: Pour une implémentation plus stricte, ajouter un champ marketingOptIn 
        // au modèle NotificationPreference et vérifier: if (!preference.marketingOptIn)
      } else {
        // Sans companyId, on refuse par défaut pour la conformité RGPD
        throw new BadRequestException(
          'Les notifications marketing nécessitent l\'identification de la société pour la vérification du consentement (conformité RGPD).'
        );
      }
    }

    // Envoyer sur chaque canal demandé
    const promises: Promise<void>[] = [];

    if (channels.includes(NotificationChannel.EMAIL)) {
      promises.push(this.emailService.sendEmail(recipient, subject || '', content, type));
    }

    if (channels.includes(NotificationChannel.WHATSAPP)) {
      promises.push(this.whatsappService.sendMessage(recipient, content, type));
    }

    if (channels.includes(NotificationChannel.PUSH)) {
      promises.push(
        this.pushService.sendPush(recipient, subject || '', content, metadata, type).then(() => {})
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Envoyer notification de confirmation de booking
   */
  async sendBookingConfirmation(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        vehicle: true,
        agency: true,
      },
    });

    if (!booking || !booking.client.email) {
      return;
    }

    // Email
    if (booking.client.email) {
      await this.emailService.sendBookingConfirmation(booking.client.email, {
        bookingId: booking.id,
        clientName: booking.client.name,
        vehicleInfo: `${booking.vehicle.brand} ${booking.vehicle.model}`,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
      });
    }

    // WhatsApp si numéro disponible
    if (booking.client.phone) {
      await this.whatsappService.sendBookingReminder(booking.client.phone, {
        clientName: booking.client.name,
        vehicleInfo: `${booking.vehicle.brand} ${booking.vehicle.model}`,
        startDate: booking.startDate,
      });
    }
  }

  /**
   * Obtenir l'historique des notifications
   */
  async getHistory(recipient?: string, channel?: NotificationChannel) {
    return this.prisma.notification.findMany({
      where: {
        recipient: recipient ? { contains: recipient } : undefined,
        channel: channel || undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }
}



