import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OutboxEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * In-process dispatcher for Outbox events.
 *
 * V2: consumers project domain events to Journal and trigger side-effects.
 */
@Injectable()
export class OutboxDispatcher {
  private readonly logger = new Logger(OutboxDispatcher.name);

  constructor(private prisma: PrismaService) {}

  async dispatch(event: Pick<OutboxEvent, 'id' | 'eventType' | 'aggregateType' | 'aggregateId' | 'payload'>) {
    const payload = event.payload as any;

    switch (event.eventType) {
      // Booking Events
      case 'BookingCreated':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'BOOKING_CREATED',
          title: `Réservation créée: ${payload.bookingNumber}`,
          content: `Nouvelle réservation ${payload.bookingNumber} créée pour le véhicule.`,
          bookingId: payload.bookingId,
          bookingNumber: payload.bookingNumber,
          vehicleId: payload.vehicleId,
          userId: payload.userId,
          metadata: payload,
        });
        return;

      case 'BookingNumberAssigned':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'BOOKING_UPDATED',
          title: `Numéro attribué: ${payload.bookingNumber}`,
          content: `Le numéro ${payload.bookingNumber} a été attribué à la réservation.`,
          bookingId: payload.bookingId,
          bookingNumber: payload.bookingNumber,
          metadata: payload,
        });
        return;

      case 'CheckInCompleted':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'CHECK_IN',
          title: `Check-in: ${payload.bookingNumber}`,
          content: `Check-in effectué pour la réservation ${payload.bookingNumber}.`,
          bookingId: payload.bookingId,
          bookingNumber: payload.bookingNumber,
          vehicleId: payload.vehicleId,
          userId: payload.userId,
          metadata: payload,
        });
        return;

      case 'CheckOutCompleted':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'CHECK_OUT',
          title: `Check-out: ${payload.bookingNumber}`,
          content: `Check-out effectué pour la réservation ${payload.bookingNumber}.`,
          bookingId: payload.bookingId,
          bookingNumber: payload.bookingNumber,
          vehicleId: payload.vehicleId,
          userId: payload.userId,
          metadata: payload,
        });
        return;

      // Invoice Events
      case 'InvoiceIssued':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'INVOICE_ISSUED',
          title: `Facture: ${payload.invoiceNumber}`,
          content: `Facture ${payload.invoiceNumber} émise pour la réservation ${payload.bookingNumber}. Montant: ${payload.totalAmount} MAD.`,
          bookingId: payload.bookingId,
          bookingNumber: payload.bookingNumber,
          invoiceId: payload.invoiceId,
          metadata: payload,
        });
        return;

      case 'CreditNoteIssued':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'CREDIT_NOTE_ISSUED',
          title: `Avoir: ${payload.creditNoteId}`,
          content: `Avoir créé pour la facture ${payload.originalInvoiceId}. Raison: ${payload.reason}`,
          invoiceId: payload.creditNoteId,
          metadata: payload,
        });
        return;

      // Contract Events
      case 'ContractCreated':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'CONTRACT_CREATED',
          title: `Contrat créé: ${payload.bookingNumber}`,
          content: `Contrat créé pour la réservation ${payload.bookingNumber}.`,
          bookingId: payload.bookingId,
          bookingNumber: payload.bookingNumber,
          contractId: payload.contractId,
          metadata: payload,
        });
        return;

      case 'ContractSigned':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'CONTRACT_SIGNED',
          title: `Contrat signé par ${payload.signerType}`,
          content: `Le contrat a été signé par ${payload.signerType === 'client' ? 'le client' : "l'agent"}.${payload.isFullySigned ? ' Contrat complet.' : ''}`,
          contractId: payload.contractId,
          userId: payload.userId,
          metadata: payload,
        });
        return;

      // Incident Events
      case 'IncidentReported':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'INCIDENT_REPORTED',
          title: `Incident: ${payload.title}`,
          content: `Incident signalé: ${payload.description}`,
          bookingId: payload.bookingId,
          bookingNumber: payload.bookingNumber,
          vehicleId: payload.vehicleId,
          incidentId: payload.incidentId,
          userId: payload.userId,
          metadata: payload,
        });
        return;

      case 'IncidentResolved':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'INCIDENT_RESOLVED',
          title: `Incident résolu: ${payload.title}`,
          content: `Incident résolu: ${payload.resolution || 'Résolution non spécifiée'}`,
          incidentId: payload.incidentId,
          userId: payload.resolvedBy,
          metadata: payload,
        });
        return;

      // GPS Events
      case 'GpsSnapshotCaptured':
        await this.appendJournalEntry({
          agencyId: payload.agencyId,
          companyId: payload.companyId,
          type: 'GPS_SNAPSHOT',
          title: `GPS: ${payload.reason}`,
          content: `Snapshot GPS capturé (${payload.reason}). Lat: ${payload.latitude}, Lon: ${payload.longitude}`,
          bookingId: payload.bookingId,
          vehicleId: payload.vehicleId,
          metadata: payload,
        });
        return;

      default:
        // Log unknown events but don't fail - allows graceful handling of new events
        this.logger.warn(
          `No handler for outbox eventType="${event.eventType}" aggregate=${event.aggregateType}:${event.aggregateId} (id=${event.id})`,
        );
        return;
    }
  }

  /**
   * Helper to append journal entry
   */
  private async appendJournalEntry(data: {
    agencyId: string;
    companyId: string;
    type: string;
    title: string;
    content: string;
    bookingId?: string;
    bookingNumber?: string;
    vehicleId?: string;
    userId?: string;
    contractId?: string;
    invoiceId?: string;
    incidentId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await (this.prisma as any).journalEntry.create({
        data: {
          agencyId: data.agencyId,
          companyId: data.companyId,
          type: data.type,
          title: data.title,
          content: data.content,
          bookingId: data.bookingId || null,
          bookingNumber: data.bookingNumber || null,
          vehicleId: data.vehicleId || null,
          userId: data.userId || null,
          contractId: data.contractId || null,
          invoiceId: data.invoiceId || null,
          incidentId: data.incidentId || null,
          metadata: data.metadata || null,
          isManualNote: false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to append journal entry: ${error.message}`, error.stack);
      // Don't throw - journal projection failure shouldn't break the event processing
    }
  }
}

