import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../../common/services/outbox.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { BusinessEventType, InvoiceStatus, InvoiceType, AuditAction, Prisma } from '@prisma/client';

// Morocco timezone (Africa/Casablanca)
const MOROCCO_TIMEZONE = 'Africa/Casablanca';

/**
 * V2 Invoice Payload structure (frozen at issuance)
 */
export interface InvoicePayload {
  version: number;
  issuedAt: string; // ISO 8601 with timezone
  timezone: string;
  company: {
    id: string;
    name: string;
    raisonSociale: string;
    identifiantLegal: string | null;
    formeJuridique: string;
    address: string | null;
  };
  agency: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    idCardNumber: string | null;
    passportNumber: string | null;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    registrationNumber: string;
  };
  booking: {
    id: string;
    bookingNumber: string;
    startDate: string;
    endDate: string;
    originalEndDate: string | null;
    extensionDays: number | null;
    totalPrice: number;
    lateFeeAmount: number | null;
    depositAmount: number | null;
    depositRequired: boolean;
    depositStatusFinal: string | null;
  };
  amounts: {
    subtotal: number;
    lateFees: number;
    total: number;
    currency: string;
  };
}

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private permissionService: PermissionService,
    private auditService: AuditService,
    private outboxService: OutboxService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  /**
   * V2: Get Morocco time for invoice issuance
   */
  private getMoroccoTime(): Date {
    return new Date();
  }

  /**
   * V2: Get year in Morocco timezone (prevents year-boundary bugs)
   */
  private getMoroccoYear(date: Date): number {
    return Number(
      new Intl.DateTimeFormat('en-US', { timeZone: MOROCCO_TIMEZONE, year: 'numeric' }).format(date),
    );
  }

  /**
   * V2: Format date in Morocco timezone for display
   */
  private formatMoroccoDate(date: Date): string {
    return date.toLocaleString('fr-MA', { timeZone: MOROCCO_TIMEZONE });
  }

  /**
   * V2: Générer le prochain numéro de facture pour une Company (séquence annuelle)
   * Format: FAC-{YEAR}-{SEQUENCE}
   * Exemple: FAC-2026-000001, FAC-2026-000002, etc.
   * Transactional to ensure no duplicates
   */
  private async getNextInvoiceNumber(
    companyId: string,
    year: number,
  ): Promise<{ invoiceNumber: string; sequence: number }> {
    // Atomic upsert to get next sequence value
    const result = await (this.prisma as any).invoiceNumberSequence.upsert({
      where: {
        companyId_year: { companyId, year },
      },
      update: {
        lastValue: { increment: 1 },
      },
      create: {
        companyId,
        year,
        lastValue: 1,
      },
    });

    const sequence = result.lastValue;
    const invoiceNumber = `FAC-${year}-${sequence.toString().padStart(6, '0')}`;

    return { invoiceNumber, sequence };
  }

  /**
   * V2: Build frozen payload for invoice (immutable snapshot)
   */
  private buildInvoicePayload(
    booking: any,
    amounts: { subtotal: number; lateFees: number; total: number },
    issuedAt: Date,
  ): InvoicePayload {
    const company = booking.agency?.company;
    const agency = booking.agency;
    const client = booking.client;
    const vehicle = booking.vehicle;

    return {
      version: 1,
      issuedAt: issuedAt.toISOString(),
      timezone: MOROCCO_TIMEZONE,
      company: {
        id: company?.id || '',
        name: company?.name || '',
        raisonSociale: company?.raisonSociale || '',
        identifiantLegal: company?.identifiantLegal || null,
        formeJuridique: company?.formeJuridique || 'AUTRE',
        address: company?.address || null,
      },
      agency: {
        id: agency?.id || '',
        name: agency?.name || '',
        address: agency?.address || null,
        phone: agency?.phone || null,
      },
      client: {
        id: client?.id || '',
        name: client?.name || '',
        email: client?.email || null,
        phone: client?.phone || null,
        idCardNumber: client?.idCardNumber || null,
        passportNumber: client?.passportNumber || null,
      },
      vehicle: {
        id: vehicle?.id || '',
        brand: vehicle?.brand || '',
        model: vehicle?.model || '',
        registrationNumber: vehicle?.registrationNumber || '',
      },
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber || '',
        startDate: booking.startDate?.toISOString() || '',
        endDate: booking.endDate?.toISOString() || '',
        originalEndDate: booking.originalEndDate?.toISOString() || null,
        extensionDays: booking.extensionDays || null,
        totalPrice: amounts.subtotal,
        lateFeeAmount: amounts.lateFees || null,
        depositAmount: booking.depositAmount ? Number(booking.depositAmount) : null,
        depositRequired: booking.depositRequired || false,
        depositStatusFinal: booking.depositStatusFinal || null,
      },
      amounts: {
        subtotal: amounts.subtotal,
        lateFees: amounts.lateFees,
        total: amounts.total,
        currency: company?.currency || 'MAD',
      },
    };
  }

  /**
   * V2: Générer une facture pour un booking
   * Règle: Génération au check-out si pas de litige, ou après clôture financière si litige résolu
   * - Séquence par Company avec reset annuel
   * - Payload figé (immutable snapshot)
   * - Timezone Maroc
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
      throw new NotFoundException('Réservation introuvable');
    }

    const companyId = booking.agency?.companyId;
    if (!companyId) {
      throw new BadRequestException('L\'agence de la réservation n\'a pas de société');
    }

    // ============================================
    // VALIDATION FACTURATION (R6)
    // ============================================
    // Vérifier qu'il n'y a pas de litige en cours
    if (booking.incidents.some((inc: any) => inc.status === 'DISPUTED')) {
      throw new BadRequestException(
        'Impossible de générer la facture: un ou plusieurs incidents sont en litige (DISPUTED). ' +
        'Veuillez résoudre les litiges avant de générer la facture.',
      );
    }

    // Vérifier que la caution n'est pas en DISPUTED
    if (booking.depositStatusFinal === 'DISPUTED') {
      throw new BadRequestException(
        'Impossible de générer la facture: la caution est en litige (DISPUTED). ' +
        'Veuillez résoudre le litige avant de générer la facture.',
      );
    }

    // Vérifier qu'une facture INVOICE n'existe pas déjà pour ce booking
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { bookingId, type: InvoiceType.INVOICE },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        `Une facture existe déjà pour ce booking (${existingInvoice.invoiceNumber})`,
      );
    }

    // V2: Get Morocco time for issuance (year in Morocco timezone)
    const issuedAt = this.getMoroccoTime();
    const year = this.getMoroccoYear(issuedAt);

    // V2: Générer le numéro de facture (séquence par Company + année)
    const { invoiceNumber, sequence } = await this.getNextInvoiceNumber(companyId, year);

    // Calculer les montants
    const totalPriceValue = booking.totalPrice
      ? typeof booking.totalPrice === 'number'
        ? booking.totalPrice
        : Number(booking.totalPrice)
      : 0;
    const lateFeeValue = booking.lateFeeAmount
      ? typeof booking.lateFeeAmount === 'number'
        ? booking.lateFeeAmount
        : Number(booking.lateFeeAmount)
      : 0;
    const totalAmount = totalPriceValue + lateFeeValue;

    // V2: Build frozen payload
    const payload = this.buildInvoicePayload(
      booking,
      { subtotal: totalPriceValue, lateFees: lateFeeValue, total: totalAmount },
      issuedAt,
    );

    // V2: Créer la facture avec payload figé
    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        agencyId: booking.agencyId,
        bookingId: booking.id,
        invoiceNumber,
        type: InvoiceType.INVOICE,
        year,
        sequence,
        issuedAt,
        totalAmount,
        status: InvoiceStatus.ISSUED,
        payload: payload as unknown as Prisma.InputJsonValue,
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

    // V2: Emit domain event InvoiceIssued
    await this.outboxService.enqueue({
      aggregateType: 'Invoice',
      aggregateId: invoice.id,
      eventType: 'InvoiceIssued',
      payload: {
        invoiceId: invoice.id,
        invoiceNumber,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        companyId,
        agencyId: booking.agencyId,
        totalAmount,
        issuedAt: issuedAt.toISOString(),
      },
    });

    // Logger l'audit
    await this.auditService.log({
      userId,
      companyId,
      agencyId: booking.agencyId,
      action: AuditAction.CREATE,
      entityType: 'Invoice',
      entityId: invoice.id,
      description: `Facture ${invoiceNumber} générée pour le booking ${bookingId}. Montant: ${totalAmount} MAD`,
      metadata: {
        bookingId,
        bookingNumber: booking.bookingNumber,
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
        BusinessEventType.FINE_CREATED, // TODO: Add INVOICE_GENERATED to enum
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
   * V2: Generate a credit note (avoir) for an existing invoice
   */
  async generateCreditNote(
    originalInvoiceId: string,
    userId: string,
    reason: string,
  ): Promise<any> {
    const originalInvoice = await this.prisma.invoice.findUnique({
      where: { id: originalInvoiceId },
      include: {
        company: true,
        agency: true,
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    if (!originalInvoice) {
      throw new NotFoundException('Facture originale introuvable');
    }

    if (originalInvoice.type !== InvoiceType.INVOICE) {
      throw new BadRequestException('Impossible de créer un avoir pour un document qui n\'est pas une facture');
    }

    if (originalInvoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Impossible de créer un avoir pour une facture annulée');
    }

    const issuedAt = this.getMoroccoTime();
    const year = this.getMoroccoYear(issuedAt);
    const { invoiceNumber, sequence } = await this.getNextInvoiceNumber(
      originalInvoice.companyId,
      year,
    );

    // Credit note has negative amount
    const creditAmount = -Number(originalInvoice.totalAmount);

    // Build payload from original invoice payload
    const originalPayload = originalInvoice.payload as unknown as InvoicePayload;
    const creditNotePayload: InvoicePayload = {
      ...originalPayload,
      version: 1,
      issuedAt: issuedAt.toISOString(),
      amounts: {
        ...originalPayload.amounts,
        subtotal: -originalPayload.amounts.subtotal,
        lateFees: -originalPayload.amounts.lateFees,
        total: creditAmount,
      },
    };

    const creditNote = await this.prisma.invoice.create({
      data: {
        companyId: originalInvoice.companyId,
        agencyId: originalInvoice.agencyId,
        bookingId: originalInvoice.bookingId,
        invoiceNumber: invoiceNumber.replace('FAC-', 'AVO-'), // AVO for Avoir
        type: InvoiceType.CREDIT_NOTE,
        year,
        sequence,
        issuedAt,
        totalAmount: creditAmount,
        status: InvoiceStatus.ISSUED,
        payload: creditNotePayload as unknown as Prisma.InputJsonValue,
        originalInvoiceId,
      },
    });

    // Emit domain event
    await this.outboxService.enqueue({
      aggregateType: 'Invoice',
      aggregateId: creditNote.id,
      eventType: 'CreditNoteIssued',
      payload: {
        creditNoteId: creditNote.id,
        originalInvoiceId,
        reason,
        amount: creditAmount,
        issuedAt: issuedAt.toISOString(),
      },
    });

    // Audit log
    await this.auditService.log({
      userId,
      companyId: originalInvoice.companyId,
      agencyId: originalInvoice.agencyId,
      action: AuditAction.CREATE,
      entityType: 'Invoice',
      entityId: creditNote.id,
      description: `Avoir ${creditNote.invoiceNumber} créé pour la facture ${originalInvoice.invoiceNumber}. Raison: ${reason}`,
      metadata: {
        originalInvoiceId,
        originalInvoiceNumber: originalInvoice.invoiceNumber,
        creditNoteNumber: creditNote.invoiceNumber,
        amount: creditAmount,
        reason,
      },
    });

    return creditNote;
  }

  /**
   * V2: Get invoice payload for PDF rendering (always from frozen payload)
   */
  async getInvoicePayload(invoiceId: string): Promise<InvoicePayload> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }

    return invoice.payload as unknown as InvoicePayload;
  }

  /**
   * Récupérer toutes les factures d'une agence
   */
  async findAll(agencyId: string, user: any): Promise<any[]> {
    // Vérifier les permissions avec PermissionService
    const hasAccess = await this.permissionService.checkAgencyAccess(agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Accès refusé à cette agence');
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
      throw new NotFoundException('Facture introuvable');
    }

    // Vérifier les permissions avec PermissionService
    const hasAccess = await this.permissionService.checkAgencyAccess(invoice.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Accès refusé à cette facture');
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
      throw new NotFoundException('Facture introuvable');
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

