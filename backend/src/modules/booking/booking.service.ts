import { Injectable, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlanningService } from '../planning/planning.service';
import { AuditService } from '../audit/audit.service';
import { AuditService as CommonAuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { InvoiceService } from '../invoice/invoice.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { OverrideLateFeeDto } from './dto/override-late-fee.dto';
import { BusinessEventType, DocumentType, AuditAction } from '@prisma/client';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private prisma: PrismaService,
    private planningService: PlanningService,
    private auditService: AuditService,
    private commonAuditService: CommonAuditService,
    private businessEventLogService: BusinessEventLogService,
    private invoiceService: InvoiceService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string) {
    const { agencyId, vehicleId, clientId, startDate, endDate, totalPrice, status } = createBookingDto;

    if (!totalPrice || totalPrice <= 0) {
      throw new BadRequestException('Total price must be greater than 0');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Vérifier que le véhicule existe et appartient à l'agence
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        agencyId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      throw new BadRequestException('Vehicle not found or does not belong to this agency');
    }

    // Vérifier que le client existe et appartient à l'agence
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        agencyId,
        deletedAt: null,
      },
    });

    if (!client) {
      throw new BadRequestException('Client not found or does not belong to this agency');
    }

    // Vérifier le type de permis du client
    if (!client.licenseNumber) {
      throw new BadRequestException('Le client doit avoir un numéro de permis valide pour louer un véhicule');
    }

    // ============================================
    // VALIDATION PERMIS (R1.3) - BLOQUANTE
    // ============================================
    // Règle: Une réservation est IMPOSSIBLE si le permis expire AVANT la fin de la location
    if (!client.licenseExpiryDate) {
      await this.auditService.log({
        userId,
        agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: 'N/A',
        description: `Réservation bloquée: le client ${client.name} (${clientId}) n'a pas de date d'expiration de permis`,
      });
      throw new BadRequestException(
        'Le client doit avoir une date d\'expiration de permis valide pour louer un véhicule'
      );
    }

    const licenseExpiry = new Date(client.licenseExpiryDate);
    const bookingEnd = new Date(endDate);

    // Vérifier que le permis expire APRÈS la fin de la location
    if (licenseExpiry <= bookingEnd) {
      await this.auditService.log({
        userId,
        agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: 'N/A',
        description: `Réservation bloquée: le client ${client.name} (${clientId}) n'a pas de date d'expiration de permis`,
      });
      throw new BadRequestException(
        `Le permis de conduite expire le ${licenseExpiry.toLocaleDateString('fr-FR')}, ` +
        `avant la fin de la location prévue (${bookingEnd.toLocaleDateString('fr-FR')}). ` +
        `La réservation est impossible.`
      );
    }

    // Vérifier la disponibilité via PlanningService (source de vérité)
    const isAvailable = await this.planningService.getVehicleAvailability(vehicleId, start, end);
    if (!isAvailable) {
      const conflicts = await this.planningService.detectConflicts(vehicleId, start, end);
      throw new ConflictException({
        message: 'Vehicle is not available for this period',
        conflicts,
      });
    }

    // ============================================
    // VALIDATION TEMPS DE PRÉPARATION (R2.2) - BLOQUANTE
    // ============================================
    // Règle: Toute réservation chevauchant la période de préparation est BLOQUÉE
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new BadRequestException('Agency not found');
    }

    const preparationTimeMinutes = agency.preparationTimeMinutes || 60; // Default 1h

    // Pour chaque booking actif, calculer la fin réelle avec préparation
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        vehicleId,
        status: { in: ['IN_PROGRESS', 'LATE'] },
        deletedAt: null,
      },
      include: {
        agency: true,
      },
    });

    for (const activeBooking of activeBookings) {
      const actualEndDate = new Date(activeBooking.endDate);
      const activeAgency = activeBooking.agency;
      const activePreparationTime = activeAgency.preparationTimeMinutes || 60;
      const preparationEnd = new Date(actualEndDate);
      preparationEnd.setMinutes(preparationEnd.getMinutes() + activePreparationTime);

      // Vérifier si la nouvelle réservation chevauche la période de préparation
      if (start < preparationEnd && end > actualEndDate) {
        await this.auditService.logBookingStatusChange(
          userId,
          'N/A',
          'CONFIRMED',
          'BLOCKED',
          agencyId,
        );
        throw new ConflictException({
          message: `Le véhicule est indisponible jusqu'au ${preparationEnd.toLocaleString('fr-FR')} ` +
                   `(temps de préparation après retour). La réservation chevauche cette période.`,
          conflicts: [{
            type: 'PREPARATION_TIME',
            id: activeBooking.id,
            startDate: actualEndDate,
            endDate: preparationEnd,
          }],
        });
      }
    }

    // Extraire le type de permis du client depuis le champ note
    const clientNote = client.note || '';
    const licenseTypeMatch = clientNote.match(/Type permis:\s*([A-Z]+(?:\s+[A-Z]+)?)/i);
    const clientLicenseType = licenseTypeMatch ? licenseTypeMatch[1].trim().toUpperCase() : null;

    // Déterminer le type de permis requis selon le type de véhicule
    // Pour l'instant, on considère que tous les véhicules nécessitent au minimum un permis B
    // Vous pouvez affiner cette logique selon vos besoins
    const requiredLicenseTypes = ['B']; // Permis B minimum pour les voitures
    
    // Si le véhicule est un camion ou un bus, vérifier les permis C ou D
    const vehicleModel = (vehicle.model || '').toLowerCase();
    const vehicleBrand = (vehicle.brand || '').toLowerCase();
    
    if (vehicleModel.includes('camion') || vehicleModel.includes('truck') || 
        vehicleBrand.includes('iveco') || vehicleBrand.includes('mercedes') && vehicleModel.includes('sprinter')) {
      requiredLicenseTypes.push('C');
    }
    
    if (vehicleModel.includes('bus') || vehicleModel.includes('minibus') || 
        vehicleBrand.includes('mercedes') && vehicleModel.includes('tourismo')) {
      requiredLicenseTypes.push('D');
    }

    // Vérifier si le client a le permis approprié
    if (clientLicenseType) {
      const hasValidLicense = requiredLicenseTypes.some(required => {
        // Vérifier si le permis du client correspond (ex: B, BE, C, CE, D, DE)
        return clientLicenseType.includes(required) || 
               clientLicenseType.startsWith(required);
      });

      if (!hasValidLicense) {
        throw new BadRequestException(
          `Le client n'a pas le type de permis approprié. Permis requis: ${requiredLicenseTypes.join(' ou ')}. Permis du client: ${clientLicenseType}`
        );
      }
    } else {
      // Si le type de permis n'est pas spécifié, on accepte mais on avertit
      // Vous pouvez choisir de bloquer ou d'accepter avec un avertissement
      // Pour l'instant, on accepte mais on pourrait ajouter un log d'avertissement
    }

    // Créer le booking
    const booking = await this.prisma.booking.create({
      data: {
        agencyId,
        vehicleId,
        clientId,
        startDate: start,
        endDate: end,
        totalPrice: parseFloat(totalPrice.toString()),
        status: status || 'DRAFT',
      },
      include: {
        agency: {
          include: {
            company: true,
          },
        },
        vehicle: true,
        client: true,
      },
    });

    // Créer l'événement de planning si le booking est confirmé
    if (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') {
      await this.planningService.createBookingEvent(
        booking.id,
        vehicleId,
        agencyId,
        start,
        end,
        client.name,
        `${vehicle.brand} ${vehicle.model}`,
      );

      // Mettre à jour le statut du véhicule
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'RENTED' },
      });
    }

    // Log business event (async, non-blocking)
    this.businessEventLogService
      .logEvent(
        booking.agencyId,
        'Booking',
        booking.id,
        BusinessEventType.BOOKING_CREATED,
        null,
        booking,
        userId,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.commonAuditService.removeAuditFields(booking);
  }

  async checkIn(id: string, checkInDto: CheckInDto, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, client: true },
    });

    if (!booking || booking.deletedAt) {
      throw new BadRequestException('Booking not found');
    }

    // Vérifier que le booking est en statut CONFIRMED
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Booking must be CONFIRMED to check in. Current status: ${booking.status}`,
      );
    }

    // ============================================
    // VALIDATION PERMIS (R1.3) - BLOQUANTE
    // ============================================
    // Règle: Un check-in est BLOQUÉ si le permis est expiré ou expire le jour même
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Vérifier le permis depuis le client (source de vérité)
    if (!booking.client.licenseExpiryDate) {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: id,
        description: 'Clôture financière bloquée: montant récupéré dépasse la caution',
      });
      throw new BadRequestException(
        'Le client doit avoir une date d\'expiration de permis valide. Le check-in est impossible.'
      );
    }

    const licenseExpiry = new Date(booking.client.licenseExpiryDate);
    licenseExpiry.setHours(0, 0, 0, 0);

    // Vérifier que le permis n'est pas expiré ni expire aujourd'hui
    if (licenseExpiry <= today) {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: id,
        description: 'Clôture financière bloquée: montant récupéré dépasse la caution',
      });
      throw new BadRequestException(
        `Le permis de conduite est expiré ou expire aujourd'hui (${licenseExpiry.toLocaleDateString('fr-FR')}). ` +
        `Le check-in est impossible.`
      );
    }

    // Vérifier aussi que le permis est valide jusqu'à la fin de la location
    const bookingEnd = new Date(booking.endDate);
    bookingEnd.setHours(0, 0, 0, 0);
    if (licenseExpiry <= bookingEnd) {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: id,
        description: 'Clôture financière bloquée: montant récupéré dépasse la caution',
      });
      throw new BadRequestException(
        `Le permis de conduite expire le ${licenseExpiry.toLocaleDateString('fr-FR')}, ` +
        `avant la fin de la location (${bookingEnd.toLocaleDateString('fr-FR')}). ` +
        `Le check-in est impossible.`
      );
    }

    // Créer les documents pour les photos
    const documents: Array<{
      type: DocumentType;
      title: string;
      url: string;
      key: string;
      bookingId: string;
      description?: string;
    }> = [];
    
    // Photos avant
    for (const photoUrl of checkInDto.photosBefore) {
      documents.push({
        type: DocumentType.PHOTO,
        title: 'Photo avant check-in',
        url: photoUrl,
        key: photoUrl.split('/').pop() || '',
        bookingId: id,
      });
    }

    // Photo permis
    documents.push({
      type: DocumentType.DRIVING_LICENSE,
      title: 'Photo permis de conduire',
      url: checkInDto.driverLicensePhoto,
      key: checkInDto.driverLicensePhoto.split('/').pop() || '',
      bookingId: id,
    });

    // Document identité si fourni
    if (checkInDto.identityDocument) {
      documents.push({
        type: DocumentType.ID_CARD,
        title: 'Pièce d\'identité',
        url: checkInDto.identityDocument,
        key: checkInDto.identityDocument.split('/').pop() || '',
        bookingId: id,
      });
    }

    // Document caution si fourni
    if (checkInDto.depositDocument) {
      documents.push({
        type: DocumentType.OTHER,
        title: 'Document caution',
        url: checkInDto.depositDocument,
        key: checkInDto.depositDocument.split('/').pop() || '',
        bookingId: id,
      });
    }

    // Stocker les données de check-in dans un document JSON
    const checkInData = {
      odometerStart: checkInDto.odometerStart,
      fuelLevelStart: checkInDto.fuelLevelStart,
      notesStart: checkInDto.notesStart,
      existingDamages: checkInDto.existingDamages || [],
      driverLicenseExpiry: checkInDto.driverLicenseExpiry,
      extractionStatus: checkInDto.extractionStatus,
      deposit: checkInDto.depositRequired
        ? {
            required: true,
            statusCheckIn: checkInDto.depositStatusCheckIn,
          }
        : null,
      signature: checkInDto.signature,
      signedAt: new Date().toISOString(),
    };

    // Créer un document JSON pour les données de check-in
    documents.push({
      type: DocumentType.OTHER,
      title: 'Données check-in',
      description: JSON.stringify(checkInData),
      url: '',
      key: `checkin-${id}`,
      bookingId: id,
    });

    // Mettre à jour le booking et créer les documents
    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      // Mettre à jour le statut à IN_PROGRESS (ACTIVE dans le mobile)
      const updateData: any = {
        status: 'IN_PROGRESS',
          ...this.commonAuditService.addUpdateAuditFields({}, userId),
      };

      // Mettre à jour le statut de la caution si fourni
      if (checkInDto.depositStatusCheckIn !== undefined) {
        updateData.depositStatusCheckIn = checkInDto.depositStatusCheckIn;
      }

      const booking = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          agency: {
            include: {
              company: true,
            },
          },
          vehicle: true,
          client: true,
        },
      });

      // Créer les documents
      await tx.document.createMany({
        data: documents,
      });

      // Mettre à jour le statut du véhicule
      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'RENTED' },
      });

      return this.commonAuditService.removeAuditFields(booking);
    });

    // Créer un événement de log métier
    await this.businessEventLogService.logEvent(
      updatedBooking.agencyId,
      'Booking',
      id,
      BusinessEventType.BOOKING_STATUS_CHANGED,
      { status: 'CONFIRMED' },
      { status: 'IN_PROGRESS', odometerStart: checkInDto.odometerStart, fuelLevelStart: checkInDto.fuelLevelStart },
      userId,
      updatedBooking.agency.companyId,
    );

    return this.commonAuditService.removeAuditFields(updatedBooking);
  }

  async checkOut(id: string, checkOutDto: CheckOutDto, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, client: true },
    });

    if (!booking || booking.deletedAt) {
      throw new BadRequestException('Booking not found');
    }

    // Vérifier que le booking est en statut IN_PROGRESS (ACTIVE)
    if (booking.status !== 'IN_PROGRESS' && booking.status !== 'LATE') {
      throw new BadRequestException(
        `Booking must be IN_PROGRESS or LATE to check out. Current status: ${booking.status}`,
      );
    }

    // Valider l'encaissement espèces si cashCollected est true
    if (checkOutDto.cashCollected === true && (!checkOutDto.cashAmount || checkOutDto.cashAmount <= 0)) {
      throw new BadRequestException('Cash amount is required and must be greater than 0 if cash is collected');
    }

    // Récupérer les données de check-in pour vérifier odometerStart
    const checkInDoc = await this.prisma.document.findFirst({
      where: {
        bookingId: id,
        key: `checkin-${id}`,
      },
    });

    let odometerStart = 0;
    if (checkInDoc?.description) {
      try {
        const checkInData = JSON.parse(checkInDoc.description);
        odometerStart = checkInData.odometerStart || 0;
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Vérifier que odometerEnd >= odometerStart
    if (checkOutDto.odometerEnd < odometerStart) {
      throw new BadRequestException(
        `Odometer end (${checkOutDto.odometerEnd}) must be greater than or equal to odometer start (${odometerStart})`,
      );
    }

    // ============================================
    // CALCUL AUTOMATIQUE DES FRAIS DE RETARD (R4)
    // ============================================
    // Règle: Calcul automatique basé sur le prix journalier
    // ≤ 1h → 25%, ≤ 2h → 50%, > 4h → 100%
    const calculateLateFee = (booking: any, actualReturnDate: Date): number => {
      const expectedEndDate = new Date(booking.endDate);
      const delayMs = actualReturnDate.getTime() - expectedEndDate.getTime();
      const delayHours = delayMs / (1000 * 60 * 60);

      if (delayHours <= 0) {
        return 0; // Pas de retard
      }

      const dailyRate = booking.vehicle?.dailyRate || 0;
      let lateFeeRate = 0;

      if (delayHours <= 1) {
        lateFeeRate = 0.25; // 25%
      } else if (delayHours <= 2) {
        lateFeeRate = 0.50; // 50%
      } else if (delayHours <= 4) {
        lateFeeRate = 0.75; // 75% (interpolation)
      } else {
        lateFeeRate = 1.0; // 100%
      }

      return dailyRate * lateFeeRate;
    };

    const actualReturnDate = new Date(); // Date actuelle
    const calculatedLateFee = calculateLateFee(booking, actualReturnDate);
    
    // Utiliser le frais de retard calculé automatiquement (sauf si override manuel)
    const lateFeeAmount = booking.lateFeeOverride 
      ? booking.lateFeeAmount 
      : calculatedLateFee;

    // Créer les documents pour les photos
    const documents: Array<{
      type: DocumentType;
      title: string;
      url: string;
      key: string;
      bookingId: string;
      description?: string;
    }> = [];

    // Photos après
    for (const photoUrl of checkOutDto.photosAfter) {
      documents.push({
        type: DocumentType.PHOTO,
        title: 'Photo après check-out',
        url: photoUrl,
        key: photoUrl.split('/').pop() || '',
        bookingId: id,
      });
    }

    // Reçu de paiement si fourni
    if (checkOutDto.cashReceipt) {
      documents.push({
        type: DocumentType.OTHER,
        title: 'Reçu de paiement',
        url: checkOutDto.cashReceipt,
        key: checkOutDto.cashReceipt.split('/').pop() || '',
        bookingId: id,
      });
    }

    // Stocker les données de check-out dans un document JSON
    const checkOutData = {
      odometerEnd: checkOutDto.odometerEnd,
      fuelLevelEnd: checkOutDto.fuelLevelEnd,
      notesEnd: checkOutDto.notesEnd,
      newDamages: checkOutDto.newDamages || [],
      extraFees: checkOutDto.extraFees,
      lateFeeAmount: lateFeeAmount, // Utiliser le frais calculé automatiquement
      damageFee: checkOutDto.damageFee,
      cashCollected: checkOutDto.cashCollected,
      cashAmount: checkOutDto.cashAmount,
      returnSignature: checkOutDto.returnSignature,
      returnedAt: new Date().toISOString(),
    };

    // Créer un document JSON pour les données de check-out
    documents.push({
      type: DocumentType.OTHER,
      title: 'Données check-out',
      description: JSON.stringify(checkOutData),
      url: '',
      key: `checkout-${id}`,
      bookingId: id,
    });

    // Calculer le prix total avec les frais supplémentaires
    let finalPrice = booking.totalPrice;
    if (checkOutDto.extraFees) finalPrice += checkOutDto.extraFees;
    // Utiliser le frais de retard calculé automatiquement
    const lateFeeValue = typeof lateFeeAmount === 'number' ? lateFeeAmount : (lateFeeAmount ? Number(lateFeeAmount) : 0);
    if (lateFeeValue > 0) finalPrice += lateFeeValue;
    if (checkOutDto.damageFee) finalPrice += checkOutDto.damageFee;

    // Mettre à jour le booking et créer les documents
    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      // Mettre à jour le statut à RETURNED (COMPLETED dans le mobile)
      const booking = await tx.booking.update({
        where: { id },
        data: {
          status: 'RETURNED',
          totalPrice: finalPrice,
          // Enregistrer les frais de retard calculés
          lateFeeAmount: lateFeeValue > 0 ? lateFeeValue : null,
          lateFeeCalculatedAt: lateFeeValue > 0 ? actualReturnDate : null,
        },
        include: {
          agency: {
            include: {
              company: true,
            },
          },
          vehicle: true,
          client: true,
        },
      });

      // Créer les documents
      await tx.document.createMany({
        data: documents,
      });

      // Mettre à jour le statut du véhicule
      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'AVAILABLE' },
      });

      return this.commonAuditService.removeAuditFields(booking);
    });

    // ============================================
    // GÉNÉRATION FACTURE (R6)
    // ============================================
    // Générer la facture automatiquement si pas de litige
    try {
      await this.invoiceService.generateInvoice(id, userId);
    } catch (error) {
      // Si erreur (litige en cours), ne pas bloquer le check-out
      // La facture sera générée après la clôture financière
      this.logger.warn(`Facture non générée au check-out: ${error.message}`);
    }

    // Créer un événement de log métier
    await this.businessEventLogService.logEvent(
      updatedBooking.agencyId,
      'Booking',
      id,
      BusinessEventType.BOOKING_STATUS_CHANGED,
      { status: booking.status },
      { 
        status: 'RETURNED', 
        odometerEnd: checkOutDto.odometerEnd, 
        fuelLevelEnd: checkOutDto.fuelLevelEnd,
        extraFees: checkOutDto.extraFees,
        lateFeeAmount: lateFeeAmount,
        damageFee: checkOutDto.damageFee,
      },
      userId,
      updatedBooking.agency.companyId,
    );

    return this.commonAuditService.removeAuditFields(updatedBooking);
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['PENDING', 'CANCELLED'],
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      IN_PROGRESS: ['RETURNED', 'LATE'],
      LATE: ['RETURNED'],
      RETURNED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, client: true },
    });

    if (!booking || booking.deletedAt) {
      throw new BadRequestException('Booking not found');
    }

    const { startDate, endDate, status, totalPrice } = updateBookingDto;

    // Validate status transition
    if (status && status !== booking.status) {
      if (!this.isValidStatusTransition(booking.status, status)) {
        throw new BadRequestException(
          `Invalid status transition from ${booking.status} to ${status}`,
        );
      }
    }

    // Si les dates changent, vérifier la disponibilité
    if (startDate || endDate) {
      const newStart = startDate ? new Date(startDate) : booking.startDate;
      const newEnd = endDate ? new Date(endDate) : booking.endDate;

      const conflicts = await this.planningService.detectConflicts(
        booking.vehicleId,
        newStart,
        newEnd,
        booking.id,
      );

      if (conflicts.length > 0) {
        throw new ConflictException({
          message: 'Vehicle is not available for this period',
          conflicts,
        });
      }
    }

    // Store previous state for event log
    const previousState = { ...booking };

    const updateData: any = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) updateData.status = status;
    if (totalPrice !== undefined) updateData.totalPrice = parseFloat(totalPrice.toString());

    // Add audit fields
    const dataWithAudit = this.commonAuditService.addUpdateAuditFields(updateData, userId);

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: dataWithAudit,
      include: {
        agency: {
          include: {
            company: true,
          },
        },
        vehicle: true,
        client: true,
      },
    });

    // Mettre à jour l'événement de planning
    await this.planningService.deleteBookingEvents(booking.id);
    if (updatedBooking.status === 'CONFIRMED' || updatedBooking.status === 'IN_PROGRESS') {
      await this.planningService.createBookingEvent(
        booking.id,
        booking.vehicleId,
        booking.agencyId,
        updatedBooking.startDate,
        updatedBooking.endDate,
        updatedBooking.client.name,
        `${updatedBooking.vehicle.brand} ${updatedBooking.vehicle.model}`,
      );
    }

    // Mettre à jour le statut du véhicule
    if (updatedBooking.status === 'RETURNED' || updatedBooking.status === 'CANCELLED') {
      await this.prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'AVAILABLE' },
      });

      // Créer temps de préparation si retourné
      if (updatedBooking.status === 'RETURNED') {
        const isLate = new Date() > booking.endDate;
        await this.planningService.createPreparationTime(
          booking.id,
          booking.vehicleId,
          booking.agencyId,
          new Date(),
          isLate,
        );
      }
    } else if (updatedBooking.status === 'CONFIRMED' || updatedBooking.status === 'IN_PROGRESS') {
      await this.prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'RENTED' },
      });
    }

    // Log business event
    const eventType = status && status !== booking.status
      ? BusinessEventType.BOOKING_STATUS_CHANGED
      : BusinessEventType.BOOKING_UPDATED;

    this.businessEventLogService
      .logEvent(
        updatedBooking.agencyId,
        'Booking',
        updatedBooking.id,
        eventType,
        previousState,
        updatedBooking,
        userId,
      )
      .catch(() => {
        // Error already logged in service
      });

    // Remove audit fields from response
    return this.commonAuditService.removeAuditFields(updatedBooking);
  }

  /**
   * Vérifier et mettre à jour automatiquement les statuts des bookings en retard
   */
  private async checkAndUpdateLateBookings(bookings: any[]): Promise<void> {
    const now = new Date();
    const lateBookings = bookings.filter(
      (booking) =>
        booking.status === 'IN_PROGRESS' &&
        new Date(booking.endDate) < now,
    );

    // Mettre à jour les bookings en retard en batch
    if (lateBookings.length > 0) {
      await Promise.all(
        lateBookings.map((booking) =>
          this.prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'LATE' },
          }),
        ),
      );
    }
  }

  async findAll(user: any, filters?: any) {
    let where: any = {
      deletedAt: null,
    };

    // Filter by role
    if (user.role === 'SUPER_ADMIN') {
      if (filters?.agencyId) where.agencyId = filters.agencyId;
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.status) where.status = filters.status;
    } else if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      where.agency = { companyId: user.companyId };
      if (filters?.agencyId) {
        const agency = await this.prisma.agency.findFirst({
          where: { id: filters.agencyId, companyId: user.companyId },
        });
        if (agency) {
          where.agencyId = filters.agencyId;
        } else {
          return [];
        }
      }
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.status) where.status = filters.status;
    } else if (user.agencyIds && user.agencyIds.length > 0) {
      where.agencyId = { in: user.agencyIds };
      if (filters?.agencyId && user.agencyIds.includes(filters.agencyId)) {
        where.agencyId = filters.agencyId;
      } else if (filters?.agencyId) {
        return [];
      }
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.status) where.status = filters.status;
    } else {
      return [];
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        agency: {
          include: { company: true },
        },
        vehicle: true,
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Vérifier et mettre à jour automatiquement les bookings en retard
    await this.checkAndUpdateLateBookings(bookings);

    // Mettre à jour les statuts en mémoire pour éviter un second appel DB
    const updatedBookings = bookings.map((booking) => {
      if (
        booking.status === 'IN_PROGRESS' &&
        new Date(booking.endDate) < new Date()
      ) {
        return { ...booking, status: 'LATE' };
      }
      return this.commonAuditService.removeAuditFields(booking);
    });

    return updatedBookings;
  }

  async findOne(id: string, user: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        agency: {
          include: {
            company: true,
          },
        },
        vehicle: true,
        client: {
          include: {
            documents: {
              where: {
                type: {
                  in: ['ID_CARD', 'DRIVING_LICENSE', 'OTHER'],
                },
              },
            },
          },
        },
        fines: true,
        payments: true,
        incidents: true,
        documents: true, // Documents liés au booking (check-in, check-out)
      },
    });

    if (!booking || booking.deletedAt) {
      throw new BadRequestException('Booking not found');
    }

    // Remove audit fields from public responses
    return this.commonAuditService.removeAuditFields(booking);
  }

  async remove(id: string, user: any, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking || booking.deletedAt) {
      throw new BadRequestException('Booking not found');
    }

    // Store previous state for event log
    const previousState = { ...booking };

    // Supprimer les événements de planning
    await this.planningService.deleteBookingEvents(id);

    // Add audit fields for soft delete
    const deleteData = this.commonAuditService.addDeleteAuditFields({}, user.id || user.userId, reason);

    // Soft delete
    await this.prisma.booking.update({
      where: { id },
      data: deleteData,
    });

    // Remettre le véhicule en disponible
    await this.prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: 'AVAILABLE' },
    });

    return { message: 'Booking deleted successfully' };
  }

  /**
   * Clôture financière d'un booking
   * Bloquée si incident DISPUTED ou depositStatusFinal = DISPUTED
   */
  async financialClosure(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        incidents: {
          where: { status: 'DISPUTED' },
        },
        payments: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // ============================================
    // VALIDATION DOMMAGES & LITIGES (R5)
    // ============================================
    // Vérifier qu'il n'y a pas de litige en cours
    if (booking.incidents.some((inc) => inc.status === 'DISPUTED')) {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: id,
        description: 'Clôture financière bloquée: montant récupéré dépasse la caution',
      });
      throw new BadRequestException(
        'La clôture financière est bloquée: un ou plusieurs incidents sont en litige (DISPUTED). ' +
        'Veuillez résoudre les litiges avant de procéder à la clôture.'
      );
    }

    // Vérifier que la caution n'est pas en DISPUTED
    if (booking.depositStatusFinal === 'DISPUTED') {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: id,
        description: 'Clôture financière bloquée: montant récupéré dépasse la caution',
      });
      throw new BadRequestException(
        'La clôture financière est bloquée: la caution est en litige (DISPUTED). ' +
        'Veuillez résoudre le litige avant de procéder à la clôture.'
      );
    }

    // Calculer le montant total récupéré (ne jamais dépasser la caution)
    const totalCollected = booking.payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const maxAllowed = booking.depositAmount ? (typeof booking.depositAmount === 'number' ? booking.depositAmount : Number(booking.depositAmount)) : 0;
    if (totalCollected > maxAllowed) {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: id,
        description: 'Clôture financière bloquée: montant récupéré dépasse la caution',
      });
      throw new BadRequestException(
        `Le montant total récupéré (${totalCollected}) ne peut pas dépasser la caution (${maxAllowed})`
      );
    }

    // ============================================
    // GÉNÉRATION FACTURE (R6)
    // ============================================
    // Générer la facture après résolution du litige
    try {
      await this.invoiceService.generateInvoice(id, userId);
    } catch (error) {
      // Si erreur, logger mais ne pas bloquer la clôture
      this.logger.warn(`Facture non générée lors de la clôture financière: ${error.message}`);
    }

    // Mettre à jour le statut final de la caution si nécessaire
    // (sera fait manuellement ou automatiquement selon les règles métier)

    return this.commonAuditService.removeAuditFields(booking);
  }

  /**
   * Override des frais de retard par Agency Manager
   * Règle: Override possible UNIQUEMENT par Agency Manager avec justification loggée
   */
  async overrideLateFee(id: string, overrideDto: OverrideLateFeeDto, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        agency: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Vérifier que l'utilisateur est Agency Manager ou SUPER_ADMIN
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || (user.role !== 'AGENCY_MANAGER' && user.role !== 'SUPER_ADMIN')) {
      throw new ForbiddenException('Only AGENCY_MANAGER or SUPER_ADMIN can override late fees');
    }

    // Vérifier que le booking est en statut RETURNED
    if (booking.status !== 'RETURNED') {
      throw new BadRequestException(
        'Les frais de retard ne peuvent être modifiés que pour un booking en statut RETURNED'
      );
    }

    // Enregistrer l'override avec justification
    await this.prisma.booking.update({
      where: { id },
      data: {
        lateFeeAmount: overrideDto.newAmount,
        // Note: lateFeeReason n'existe pas dans le schéma, on logge la justification dans l'audit
      },
    });

    // Logger l'audit avec justification
    await this.auditService.logUpdate(
      userId,
      'Booking',
      id,
      `Override des frais de retard: ${booking.lateFeeAmount || 0} MAD → ${overrideDto.newAmount} MAD. Justification: ${overrideDto.justification}`,
      { lateFeeAmount: booking.lateFeeAmount },
      { lateFeeAmount: overrideDto.newAmount, justification: overrideDto.justification },
      booking.agency.companyId,
      booking.agencyId,
    );

    // Log business event
    await this.businessEventLogService.logEvent(
      booking.agencyId,
      'Booking',
      id,
      BusinessEventType.BOOKING_UPDATED,
      { lateFeeAmount: booking.lateFeeAmount },
      { lateFeeAmount: overrideDto.newAmount, lateFeeReason: overrideDto.justification },
      userId,
      booking.agency.companyId,
    );

    return { message: 'Frais de retard modifiés avec succès', lateFeeAmount: overrideDto.newAmount };
  }
}
