import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CmiService } from './cmi.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private cmiService: CmiService,
  ) {}

  /**
   * Créer un paiement en ligne (CMI)
   */
  async createOnlinePayment(createPaymentDto: CreatePaymentDto, userId: string) {
    const { bookingId, amount, isDeposit, depositAmount } = createPaymentDto;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        agency: true,
        client: true,
      },
    });

    if (!booking || booking.deletedAt) {
      throw new NotFoundException('Booking not found');
    }

    // Calculer le montant à payer
    const paymentAmount = isDeposit && depositAmount ? depositAmount : amount;

    // Créer le paiement en statut PENDING
    const payment = await this.prisma.payment.create({
      data: {
        agencyId: booking.agencyId,
        bookingId,
        amount: paymentAmount,
        method: PaymentMethod.ONLINE_CMI,
        status: PaymentStatus.PENDING,
        isDeposit: isDeposit || false,
        depositAmount: isDeposit ? depositAmount : null,
      },
    });

    // Générer l'URL de paiement CMI
    const orderId = `PAY-${payment.id}`;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    const clientName = booking.client?.name || booking.clientId;
    const clientEmail = booking.client?.email || '';
    
    const paymentRequest = await this.cmiService.createPaymentRequest({
      amount: paymentAmount,
      orderId,
      currency: '504', // MAD
      clientId: booking.clientId,
      clientEmail,
      clientName,
      successUrl: `${baseUrl}/payment/success?paymentId=${payment.id}`,
      failUrl: `${baseUrl}/payment/fail?paymentId=${payment.id}`,
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/payment/cmi/callback`,
      language: 'fr',
    });

    // Mettre à jour avec le transaction ID
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        cmiTransactionId: orderId,
        cmiResponse: paymentRequest.formData as any,
      },
    });

    return {
      payment,
      paymentUrl: paymentRequest.url,
      formData: paymentRequest.formData,
    };
  }

  /**
   * Créer un paiement espèces
   */
  async createCashPayment(createPaymentDto: CreatePaymentDto, userId: string) {
    const { bookingId, amount, isDeposit, depositAmount } = createPaymentDto;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.deletedAt) {
      throw new NotFoundException('Booking not found');
    }

    const paymentAmount = isDeposit && depositAmount ? depositAmount : amount;

    const payment = await this.prisma.payment.create({
      data: {
        agencyId: booking.agencyId,
        bookingId,
        amount: paymentAmount,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID, // Espèces = payé immédiatement
        isDeposit: isDeposit || false,
        depositAmount: isDeposit ? depositAmount : null,
      },
      include: {
        booking: {
          include: {
            client: true,
            vehicle: true,
          },
        },
      },
    });

    return payment;
  }

  /**
   * Traiter le callback CMI (webhook)
   */
  async handleCmiCallback(data: Record<string, any>) {
    try {
      // Vérifier la signature
      const verification = await this.cmiService.verifyCallback(data);

      if (!verification.valid) {
        throw new BadRequestException('Invalid callback signature');
      }

      // Trouver le paiement (orderId = PAY-{paymentId})
      const payment = await this.prisma.payment.findFirst({
        where: {
          cmiTransactionId: verification.orderId,
        },
        include: {
          booking: true,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Mettre à jour le statut
      const newStatus =
        verification.status === 'success' ? PaymentStatus.PAID : PaymentStatus.FAILED;

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          cmiResponse: data as any,
        },
      });

      // Si le paiement est réussi et que c'est le paiement total, mettre à jour le booking
      if (newStatus === PaymentStatus.PAID && !payment.isDeposit) {
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CONFIRMED',
          },
        });
      }

      return {
        success: true,
        paymentId: payment.id,
        status: newStatus,
      };
    } catch (error) {
      this.logger.error('CMI Callback error:', error);
      throw error;
    }
  }

  /**
   * Gérer la caution (déposer/retourner)
   */
  async handleDeposit(paymentId: string, action: 'hold' | 'return', amount: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (action === 'hold') {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          depositHeld: amount,
        },
      });
    } else if (action === 'return') {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          depositReturned: amount,
        },
      });
    }

    return this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
  }

  /**
   * Obtenir les paiements d'un booking
   */
  async getBookingPayments(bookingId: string) {
    return this.prisma.payment.findMany({
      where: {
        bookingId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtenir un paiement par ID
   */
  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            client: true,
            vehicle: true,
          },
        },
        agency: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}

