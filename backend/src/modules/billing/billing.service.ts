import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentStatus, PaymentMethod, SubscriptionStatus, CompanyStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

/**
 * Service de facturation SaaS
 * 
 * Gère :
 * - Génération des factures récurrentes
 * - Enregistrement des paiements
 * - Notifications de paiement
 * - Calcul des échéances
 */
@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Générer une facture pour un abonnement
   */
  async generateInvoice(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        company: true,
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Calculer la date d'échéance (30 jours après la date de début ou renouvellement)
    const dueDate = new Date(subscription.renewedAt || subscription.startDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Générer un numéro de facture
    const invoiceNumber = this.generateInvoiceNumber(subscription.companyId);

    // Créer le paiement
    const payment = await this.prisma.paymentSaas.create({
      data: {
        subscriptionId: subscription.id,
        companyId: subscription.companyId,
        amount: subscription.amount,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.BANK_TRANSFER, // V1 : paiement manuel uniquement
        dueDate,
        invoiceNumber,
      },
    });

    // Envoyer une notification (si préférences activées)
    await this.sendPaymentNotification(subscription.companyId, payment);

    return payment;
  }

  /**
   * Enregistrer un paiement
   */
  async recordPayment(
    paymentId: string,
    amount: number,
    paidAt: Date,
    invoiceNumber?: string,
    invoiceUrl?: string,
  ) {
    const payment = await this.prisma.paymentSaas.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          select: {
            id: true,
            status: true,
            companyId: true,
          },
        },
        company: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Vérifier le montant
    if (amount < payment.amount) {
      throw new BadRequestException('Payment amount is less than required amount');
    }

    // Mettre à jour le paiement
    const updatedPayment = await this.prisma.paymentSaas.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        paidAt,
        invoiceNumber: invoiceNumber || payment.invoiceNumber,
        invoiceUrl,
      },
      select: {
        id: true,
        subscriptionId: true,
        companyId: true,
      },
    });

    // Si l'abonnement était suspendu, le restaurer
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: updatedPayment.subscriptionId },
      select: { status: true },
    });

    if (subscription && subscription.status === SubscriptionStatus.SUSPENDED) {
      await this.prisma.subscription.update({
        where: { id: updatedPayment.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await this.prisma.company.update({
        where: { id: updatedPayment.companyId },
        data: {
          status: CompanyStatus.ACTIVE,
          suspendedAt: null,
          suspendedReason: null,
        },
      });
    }

    return updatedPayment;
  }

  /**
   * Récupérer les factures d'une Company
   */
  async getCompanyInvoices(companyId: string, user: any) {
    // Vérifier les permissions
    if (user.role !== 'SUPER_ADMIN' && user.companyId !== companyId) {
      throw new BadRequestException('Access denied');
    }

    return this.prisma.paymentSaas.findMany({
      where: { companyId },
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  /**
   * Récupérer les factures en attente de paiement
   */
  async getPendingInvoices() {
    return this.prisma.paymentSaas.findMany({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: {
          lte: new Date(), // Échues ou à échéance
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Générer un numéro de facture unique
   */
  private generateInvoiceNumber(companyId: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${companyId.slice(0, 4).toUpperCase()}-${timestamp}-${random}`;
  }

  /**
   * Envoyer une notification de paiement
   */
  private async sendPaymentNotification(companyId: string, payment: any) {
    try {
      // Récupérer les préférences de notification
      const preferences = await this.prisma.notificationPreference.findUnique({
        where: { companyId },
      });

      if (!preferences || !preferences.billingNotificationsEmail) {
        return; // Notifications désactivées
      }

      // Récupérer le Company Admin pour l'email
      const companyAdmin = await this.prisma.user.findFirst({
        where: {
          companyId,
          role: 'COMPANY_ADMIN',
        },
      });

      if (!companyAdmin || !companyAdmin.email) {
        return; // Pas de Company Admin trouvé
      }

      // Envoyer l'email
      await this.notificationService.sendNotification({
        channels: ['EMAIL'],
        recipient: companyAdmin.email,
        subject: `Facture ${payment.invoiceNumber} - Échéance ${payment.dueDate.toLocaleDateString('fr-FR')}`,
        content: `Votre facture de ${payment.amount} MAD est due le ${payment.dueDate.toLocaleDateString('fr-FR')}.`,
        type: 'SYSTEM',
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
      // Ne pas bloquer si la notification échoue
    }
  }
}

