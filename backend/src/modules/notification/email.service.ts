import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationChannel, NotificationType } from '@prisma/client';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || '',
        pass: this.configService.get<string>('SMTP_PASS') || '',
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    type: NotificationType = NotificationType.TRANSACTIONAL,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@malocauto.com',
        to,
        subject,
        html,
      });

      // Enregistrer dans l'historique
      await this.prisma.notification.create({
        data: {
          channel: NotificationChannel.EMAIL,
          type,
          recipient: to,
          subject,
          content: html,
          sent: true,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Email send error:', error);

      // Enregistrer l'erreur
      await this.prisma.notification.create({
        data: {
          channel: NotificationChannel.EMAIL,
          type,
          recipient: to,
          subject,
          content: html,
          sent: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Log l'erreur mais ne pas crasher l'app
    }
  }

  async sendWelcomeEmail(email: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3E7BFA;">Bienvenue sur MalocAuto, ${name} !</h2>
        <p>Votre compte a été créé avec succès.</p>
        <p>Pour définir votre mot de passe et accéder à votre espace, cliquez sur le lien ci-dessous :</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3E7BFA; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Configurer mon mot de passe
        </a>
        <p>Ce lien expire dans 1 heure.</p>
      </div>
    `;

    await this.sendEmail(email, 'Bienvenue sur MalocAuto - Configuration de votre compte', html);
  }

  async sendBookingConfirmation(
    email: string,
    bookingDetails: {
      bookingId: string;
      clientName: string;
      vehicleInfo: string;
      startDate: Date;
      endDate: Date;
      totalPrice: number;
    },
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3E7BFA;">Confirmation de réservation</h2>
        <p>Bonjour ${bookingDetails.clientName},</p>
        <p>Votre réservation a été confirmée :</p>
        <ul>
          <li><strong>Véhicule :</strong> ${bookingDetails.vehicleInfo}</li>
          <li><strong>Du :</strong> ${bookingDetails.startDate.toLocaleDateString('fr-FR')}</li>
          <li><strong>Au :</strong> ${bookingDetails.endDate.toLocaleDateString('fr-FR')}</li>
          <li><strong>Montant total :</strong> ${bookingDetails.totalPrice}€</li>
        </ul>
        <p>Merci de votre confiance !</p>
      </div>
    `;

    await this.sendEmail(
      email,
      'Confirmation de réservation MalocAuto',
      html,
      NotificationType.TRANSACTIONAL,
    );
  }
}

