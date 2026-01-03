import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../audit/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { BusinessEventType, InvoiceStatus, AuditAction } from '@prisma/client';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private permissionService: PermissionService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  /**
   * Générer le prochain numéro de facture pour une agence
   * Format: {AGENCY_PREFIX}-{NUMERO_INCREMENTAL}
   * Exemple: AGEN-000001, AGEN-000002, etc.
   */
  private async getNextInvoiceNumber(agencyId: string): Promise<string> {
    // Récupérer la dernière facture de l'agence
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { agencyId },
      orderBy: { invoiceNumber: 'desc' },
    });

    // Récupérer le préfixe de l'agence (4 premiers caractères de l'ID)
    const agencyPrefix = agencyId.slice(0, 4).toUpperCase();

    if (!lastInvoice) {
      // Première facture de l'agence
      return `${agencyPrefix}-000001`;
    }

    // Extraire le numéro de la dernière facture
    const lastNumberMatch = lastInvoice.invoiceNumber.match(/-(\d+)$/);
    if (!lastNumberMatch) {
      // Format inattendu, commencer à 1
      return `${agencyPrefix}-000001`;
    }

    const lastNumber = parseInt(lastNumberMatch[1], 10);
    const nextNumber = lastNumber + 1;

    // Formater avec padding de 6 chiffres
    return `${agencyPrefix}-${nextNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Générer une facture pour un booking
   * Règle: Génération au check-out si pas de litige, ou après clôture financière si litige résolu
   */
  async generateInvoice(bookingId: string, userId: string): Promise<any> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        agency: {
          include: { company: true },
        },
        vehicle: true,
        client: true,
        incidents: {
          where: { status: 'DISPUTED' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // ============================================
    // VALIDATION FACTURATION (R6)
    // ============================================
    // Vérifier qu'il n'y a pas de litige en cours
    if (booking.incidents.some((inc) => inc.status === 'DISPUTED')) {
      throw new BadRequestException(
        'Impossible de générer la facture: un ou plusieurs incidents sont en litige (DISPUTED). ' +
        'Veuillez résoudre les litiges avant de générer la facture.'
      );
    }

    // Vérifier que la caution n'est pas en DISPUTED
    if (booking.depositStatusFinal === 'DISPUTED') {
      throw new BadRequestException(
        'Impossible de générer la facture: la caution est en litige (DISPUTED). ' +
        'Veuillez résoudre le litige avant de générer la facture.'
      );
    }

    // Vérifier qu'une facture n'existe pas déjà pour ce booking
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { bookingId },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        `Une facture existe déjà pour ce booking (${existingInvoice.invoiceNumber})`
      );
    }

    // Générer le numéro de facture (incrémental par agence)
    const invoiceNumber = await this.getNextInvoiceNumber(booking.agencyId);

    // Calculer le montant total
    // totalPrice (prix de base) + lateFeeAmount (frais de retard) + extraFees (si applicable)
    const totalPriceValue = booking.totalPrice ? (typeof booking.totalPrice === 'number' ? booking.totalPrice : Number(booking.totalPrice)) : 0;
    const lateFeeValue = booking.lateFeeAmount ? (typeof booking.lateFeeAmount === 'number' ? booking.lateFeeAmount : Number(booking.lateFeeAmount)) : 0;
    const totalAmount = totalPriceValue + lateFeeValue;
    // Note: extraFees est déjà inclus dans totalPrice après check-out

    // Créer la facture
    const invoice = await this.prisma.invoice.create({
      data: {
        agencyId: booking.agencyId,
        bookingId: booking.id,
        invoiceNumber,
        issuedAt: new Date(),
        totalAmount,
        status: InvoiceStatus.ISSUED,
      },
      include: {
        agency: {
          include: { company: true },
        },
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    // Logger l'audit
    await this.auditService.log({
      userId,
      companyId: booking.agency.companyId,
      agencyId: booking.agencyId,
      action: AuditAction.CREATE,
      entityType: 'Invoice',
      entityId: invoice.id,
      description: `Facture ${invoiceNumber} générée pour le booking ${bookingId}. Montant: ${totalAmount} MAD`,
      metadata: {
        bookingId,
        invoiceNumber,
        totalAmount,
        bookingTotalPrice: booking.totalPrice,
        lateFeeAmount: booking.lateFeeAmount,
      },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        booking.agencyId,
        'Invoice',
        invoice.id,
        BusinessEventType.FINE_CREATED, // Utiliser FINE_CREATED pour l'instant (à ajouter INVOICE_GENERATED si nécessaire)
        null,
        invoice,
        userId,
      )
      .catch(() => {
        // Error already logged
      });

    return invoice;
  }

  /**
   * Récupérer toutes les factures d'une agence
   */
  async findAll(agencyId: string, user: any): Promise<any[]> {
    // Vérifier les permissions avec PermissionService
    const hasAccess = await this.permissionService.checkAgencyAccess(agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { agencyId },
      include: {
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return invoices;
  }

  /**
   * Récupérer une facture par ID
   */
  async findOne(id: string, user: any): Promise<any> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        agency: {
          include: { company: true },
        },
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Vérifier les permissions avec PermissionService
    const hasAccess = await this.permissionService.checkAgencyAccess(invoice.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    return invoice;
  }

  /**
   * Mettre à jour le statut d'une facture (PAID, CANCELLED)
   */
  async updateStatus(id: string, status: InvoiceStatus, userId: string): Promise<any> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: { status },
    });

    // Logger l'audit
    await this.auditService.log({
      userId,
      agencyId: invoice.agencyId,
      action: AuditAction.UPDATE,
      entityType: 'Invoice',
      entityId: id,
      description: `Statut de la facture ${invoice.invoiceNumber} changé de ${invoice.status} à ${status}`,
      metadata: {
        before: { status: invoice.status },
        after: { status },
      },
    });

    return updatedInvoice;
  }
}

