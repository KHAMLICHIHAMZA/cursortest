import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    this.isConfigured = !!(smtpUser && smtpPass);

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: smtpUser || '', pass: smtpPass || '' },
    });
  }

  private get from(): string {
    return process.env.SMTP_FROM || 'noreply@malocauto.com';
  }

  /**
   * Send invoice email to client
   */
  async sendInvoiceEmail(params: {
    clientEmail: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    bookingNumber?: string;
    pdfBuffer?: Buffer;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px;">
          <h2 style="color: #3E7BFA; margin-top: 0;">Facture MalocAuto</h2>
          <p>Bonjour ${params.clientName},</p>
          <p>Votre facture <strong>N° ${params.invoiceNumber}</strong> est disponible.</p>
          ${params.bookingNumber ? `<p>Reservation: <strong>${params.bookingNumber}</strong></p>` : ''}
          <div style="background: #f0f4ff; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #3E7BFA;">
              Montant: ${params.amount.toFixed(2)} MAD
            </p>
          </div>
          <p>Merci pour votre confiance.</p>
          <p style="color: #999; font-size: 12px;">MalocAuto - Location de vehicules</p>
        </div>
      </div>
    `;

    const attachments = params.pdfBuffer ? [{
      filename: `facture-${params.invoiceNumber}.pdf`,
      content: params.pdfBuffer,
      contentType: 'application/pdf',
    }] : [];

    return this.send({
      to: params.clientEmail,
      subject: `Facture ${params.invoiceNumber} - MalocAuto`,
      html,
    }, attachments);
  }

  /**
   * Send contract email to client
   */
  async sendContractEmail(params: {
    clientEmail: string;
    clientName: string;
    bookingNumber?: string;
    vehicleInfo: string;
    startDate: string;
    endDate: string;
    pdfBuffer?: Buffer;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px;">
          <h2 style="color: #3E7BFA; margin-top: 0;">Contrat de Location</h2>
          <p>Bonjour ${params.clientName},</p>
          <p>Votre contrat de location est disponible.</p>
          ${params.bookingNumber ? `<p>Reservation: <strong>${params.bookingNumber}</strong></p>` : ''}
          <div style="background: #f0f4ff; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Vehicule:</strong> ${params.vehicleInfo}</p>
            <p style="margin: 5px 0;"><strong>Du:</strong> ${params.startDate}</p>
            <p style="margin: 5px 0;"><strong>Au:</strong> ${params.endDate}</p>
          </div>
          <p>Merci de consulter le contrat ci-joint.</p>
          <p style="color: #999; font-size: 12px;">MalocAuto - Location de vehicules</p>
        </div>
      </div>
    `;

    const attachments = params.pdfBuffer ? [{
      filename: `contrat-${params.bookingNumber || 'location'}.pdf`,
      content: params.pdfBuffer,
      contentType: 'application/pdf',
    }] : [];

    return this.send({
      to: params.clientEmail,
      subject: `Contrat de location ${params.bookingNumber || ''} - MalocAuto`,
      html,
    }, attachments);
  }

  /**
   * Send late return reminder to agent/manager
   */
  async sendLateReturnEmail(params: {
    agentEmail: string;
    agentName: string;
    clientName: string;
    vehicleInfo: string;
    bookingNumber?: string;
    expectedReturnDate: string;
    daysLate: number;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px;">
          <h2 style="color: #e53e3e; margin-top: 0;">Alerte Retard</h2>
          <p>Bonjour ${params.agentName},</p>
          <p>Un vehicule n'a pas ete restitue a temps:</p>
          <div style="background: #fff5f5; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #e53e3e;">
            ${params.bookingNumber ? `<p style="margin: 5px 0;"><strong>Reservation:</strong> ${params.bookingNumber}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Client:</strong> ${params.clientName}</p>
            <p style="margin: 5px 0;"><strong>Vehicule:</strong> ${params.vehicleInfo}</p>
            <p style="margin: 5px 0;"><strong>Retour prevu:</strong> ${params.expectedReturnDate}</p>
            <p style="margin: 5px 0; color: #e53e3e; font-weight: bold;">Retard: ${params.daysLate} jour(s)</p>
          </div>
          <p>Veuillez contacter le client ou prendre les mesures necessaires.</p>
          <p style="color: #999; font-size: 12px;">MalocAuto - Location de vehicules</p>
        </div>
      </div>
    `;

    return this.send({
      to: params.agentEmail,
      subject: `Alerte retard - ${params.vehicleInfo} - MalocAuto`,
      html,
    });
  }

  /**
   * Send check-in reminder
   */
  async sendCheckInReminder(params: {
    agentEmail: string;
    agentName: string;
    clientName: string;
    vehicleInfo: string;
    bookingNumber?: string;
    startDate: string;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px;">
          <h2 style="color: #3E7BFA; margin-top: 0;">Rappel Check-in</h2>
          <p>Bonjour ${params.agentName},</p>
          <p>Un check-in est prevu aujourd'hui:</p>
          <div style="background: #f0f4ff; border-radius: 6px; padding: 15px; margin: 20px 0;">
            ${params.bookingNumber ? `<p style="margin: 5px 0;"><strong>Reservation:</strong> ${params.bookingNumber}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Client:</strong> ${params.clientName}</p>
            <p style="margin: 5px 0;"><strong>Vehicule:</strong> ${params.vehicleInfo}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${params.startDate}</p>
          </div>
          <p style="color: #999; font-size: 12px;">MalocAuto - Location de vehicules</p>
        </div>
      </div>
    `;

    return this.send({
      to: params.agentEmail,
      subject: `Check-in prevu - ${params.vehicleInfo} - MalocAuto`,
      html,
    });
  }

  private async send(config: EmailConfig, attachments: any[] = []): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn(`Email skipped (SMTP not configured): ${config.subject}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: config.to,
        subject: config.subject,
        html: config.html,
        attachments,
      });
      this.logger.log(`Email sent: ${config.subject} -> ${config.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Email send failed: ${config.subject}`, error);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      return false;
    }
  }

  /**
   * Check if SMTP is configured
   */
  checkConfigured(): boolean {
    return this.isConfigured;
  }
}
