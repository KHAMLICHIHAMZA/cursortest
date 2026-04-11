import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PlanningService } from "../planning/planning.service";
import { AuditService } from "../audit/audit.service";
import { AuditService as CommonAuditService } from "../../common/services/audit.service";
import { BusinessEventLogService } from "../business-event-log/business-event-log.service";
import { InvoiceService } from "../invoice/invoice.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
import { CheckInDto } from "./dto/check-in.dto";
import { CheckOutDto } from "./dto/check-out.dto";
import { OverrideLateFeeDto } from "./dto/override-late-fee.dto";
import { BusinessEventType, DocumentType, AuditAction } from "@prisma/client";
import { OutboxService } from "../../common/services/outbox.service";
import { ContractService } from "../contract/contract.service";
import { InAppNotificationService } from "../in-app-notification/in-app-notification.service";
import { JournalService } from "../journal/journal.service";
import { SAAS_SETTINGS_RULE_KEYS } from "../saas-settings/saas-settings.types";

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private static readonly BOOKING_NUMBER_MAX_LEN = 32;
  private static readonly MAINTENANCE_ALERT_INTERVAL_KM = 10000;
  // Local runtime constants (avoid relying on Prisma enum exports in tooling)
  private static readonly BookingNumberMode = {
    AUTO: "AUTO",
    MANUAL: "MANUAL",
  } as const;

  constructor(
    private prisma: PrismaService,
    private planningService: PlanningService,
    private auditService: AuditService,
    private commonAuditService: CommonAuditService,
    private businessEventLogService: BusinessEventLogService,
    private invoiceService: InvoiceService,
    private outboxService: OutboxService,
    private contractService: ContractService,
    private inAppNotificationService: InAppNotificationService,
    private journalService: JournalService,
  ) {}

  private async getGlobalMaintenanceAlertIntervalKm(): Promise<number> {
    const rule = await this.prisma.businessRule.findFirst({
      where: {
        key: SAAS_SETTINGS_RULE_KEYS.MAINTENANCE_MILEAGE_ALERT_INTERVAL_KM,
        companyId: null,
        agencyId: null,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
      select: { value: true },
    });
    const parsed = Number(rule?.value);
    if (!Number.isFinite(parsed)) {
      return BookingService.MAINTENANCE_ALERT_INTERVAL_KM;
    }
    return Math.max(1000, Math.floor(parsed));
  }

  private async notifyMaintenanceMileageThreshold(params: {
    vehicleId: string;
    companyId: string;
    agencyId: string;
    registrationNumber: string;
    oldMileage: number;
    newMileage: number;
    vehicleMaintenanceAlertIntervalKm?: number | null;
  }): Promise<void> {
    const {
      vehicleId,
      companyId,
      agencyId,
      registrationNumber,
      oldMileage,
      newMileage,
      vehicleMaintenanceAlertIntervalKm,
    } = params;
    const vehicleInterval = Number(vehicleMaintenanceAlertIntervalKm);
    const interval =
      Number.isFinite(vehicleInterval) && vehicleInterval >= 1000
        ? Math.floor(vehicleInterval)
        : await this.getGlobalMaintenanceAlertIntervalKm();
    if (newMileage < interval) return;

    const reachedThreshold = Math.floor(newMileage / interval) * interval;
    if (oldMileage >= reachedThreshold) return;

    const alertTitle = `Alerte entretien: ${registrationNumber}`;
    const existing = await (this.prisma as any).inAppNotification.findFirst({
      where: {
        companyId,
        type: "SYSTEM_ALERT",
        title: alertTitle,
        message: { contains: `palier ${reachedThreshold} km` },
      },
      select: { id: true },
    });
    if (existing) return;

    const recipients = await this.prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!recipients.length) return;

    const message =
      `Le véhicule ${registrationNumber} a atteint ${newMileage} km (palier ${reachedThreshold} km). ` +
      `Planifiez la vidange/maintenance préventive.`;

    await Promise.allSettled(
      recipients.map((recipient) =>
        this.inAppNotificationService.createNotification({
          userId: recipient.id,
          companyId,
          agencyId,
          type: "SYSTEM_ALERT",
          title: alertTitle,
          message,
          actionUrl: "/agency/maintenance",
          metadata: {
            kind: "MAINTENANCE_MILEAGE_ALERT",
            vehicleId,
            registrationNumber,
            oldMileage,
            newMileage,
            threshold: reachedThreshold,
          },
        }),
      ),
    );
  }

  /**
   * Notify agency managers that financial closure is pending after check-out.
   * This is non-blocking and must not prevent check-out completion.
   */
  private async notifyFinancialClosurePending(params: {
    bookingId: string;
    agencyId: string;
    companyId: string;
    bookingNumber?: string | null;
    vehicleRegistrationNumber?: string | null;
  }): Promise<void> {
    const {
      bookingId,
      agencyId,
      companyId,
      bookingNumber,
      vehicleRegistrationNumber,
    } = params;

    const recipients = await this.prisma.user.findMany({
      where: {
        role: "AGENCY_MANAGER",
        isActive: true,
        deletedAt: null,
        userAgencies: {
          some: { agencyId },
        },
      },
      select: { id: true },
    });

    if (!recipients.length) return;

    const existingNotifications = await (
      this.prisma as any
    ).inAppNotification.findMany({
      where: {
        bookingId,
        type: "CHECK_OUT_REMINDER",
        userId: { in: recipients.map((r) => r.id) },
      },
      select: { userId: true },
    });
    const alreadyNotifiedUserIds = new Set(
      existingNotifications.map((n: any) => n.userId),
    );

    const ref = bookingNumber || bookingId.slice(0, 8);
    const vehicleRef = vehicleRegistrationNumber || "véhicule";
    const title = `Clôture financière en attente (${ref})`;
    const message =
      `Le check-out de la réservation ${ref} est terminé pour ${vehicleRef}. ` +
      `Merci de finaliser la clôture financière.`;

    await Promise.allSettled(
      recipients.map((recipient) =>
        alreadyNotifiedUserIds.has(recipient.id)
          ? Promise.resolve(null)
          : this.inAppNotificationService.createNotification({
              userId: recipient.id,
              companyId,
              agencyId,
              type: "CHECK_OUT_REMINDER",
              title,
              message,
              actionUrl: `/agency/bookings/${bookingId}`,
              bookingId,
              metadata: {
                event: "FINANCIAL_CLOSURE_PENDING",
              },
            }),
      ),
    );
  }

  private normalizeBookingNumber(input: string): string {
    return String(input || "")
      .trim()
      .toUpperCase();
  }

  private normalizeAndValidateManualBookingNumber(input: unknown): string {
    const normalized = this.normalizeBookingNumber(String(input ?? ""));
    if (!normalized) {
      throw new BadRequestException("Le numéro de réservation est requis");
    }
    if (normalized.length > BookingService.BOOKING_NUMBER_MAX_LEN) {
      throw new BadRequestException(
        `Le numéro de réservation doit être <= ${BookingService.BOOKING_NUMBER_MAX_LEN} caractères`,
      );
    }
    if (!/^[A-Z0-9]+$/.test(normalized)) {
      throw new BadRequestException(
        "Le numéro de réservation doit être alphanumérique (A-Z, 0-9) sans espaces",
      );
    }
    return normalized;
  }

  /**
   * Verify user has access to the booking's agency.
   * SUPER_ADMIN: always allowed.
   * COMPANY_ADMIN: booking's agency must belong to their company.
   * AGENT/MANAGER: must be assigned to the booking's agency.
   */
  private assertBookingAccess(
    booking: { agencyId: string; companyId?: string | null },
    user: any,
  ): void {
    if (user.role === "SUPER_ADMIN") return;
    if (user.role === "COMPANY_ADMIN") {
      if (booking.companyId && booking.companyId !== user.companyId) {
        throw new ForbiddenException(
          "Vous n'avez pas accès à cette réservation",
        );
      }
      return;
    }
    // AGENT / AGENCY_MANAGER
    if (!user.agencyIds?.includes(booking.agencyId)) {
      throw new ForbiddenException("Vous n'avez pas accès à cette réservation");
    }
  }

  private async getNextAutoBookingNumber(
    companyId: string,
    now: Date,
  ): Promise<string> {
    const year = now.getFullYear();
    const seq = await (this.prisma as any).bookingNumberSequence.upsert({
      where: { companyId_year: { companyId, year } },
      create: { companyId, year, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
      select: { lastValue: true },
    });
    // Format: YYYY + 6 digits (reset annuel, alphanum)
    return `${year}${String(seq.lastValue).padStart(6, "0")}`;
  }

  async create(createBookingDto: CreateBookingDto, userId: string, user?: any) {
    const {
      agencyId,
      vehicleId,
      clientId,
      startDate,
      endDate,
      totalPrice,
      status,
    } = createBookingDto;

    // Agency access validation
    if (user && agencyId) {
      this.assertBookingAccess({ agencyId }, user);
    }

    if (!totalPrice || totalPrice <= 0) {
      throw new BadRequestException("Le prix total doit être supérieur à 0");
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
      throw new BadRequestException(
        "Véhicule introuvable ou n'appartient pas à cette agence",
      );
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
      throw new BadRequestException(
        "Client introuvable ou n'appartient pas à cette agence",
      );
    }

    // Vérifier le type de permis du client
    if (!client.licenseNumber) {
      throw new BadRequestException(
        "Le client doit avoir un numéro de permis valide pour louer un véhicule",
      );
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
        entityType: "Booking",
        entityId: "N/A",
        description: `Réservation bloquée: le client ${client.name} (${clientId}) n'a pas de date d'expiration de permis`,
      });
      throw new BadRequestException(
        "Le client doit avoir une date d'expiration de permis valide pour louer un véhicule",
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
        entityType: "Booking",
        entityId: "N/A",
        description: `Réservation bloquée: le client ${client.name} (${clientId}) n'a pas de date d'expiration de permis`,
      });
      throw new BadRequestException(
        `Le permis de conduite expire le ${licenseExpiry.toLocaleDateString("fr-FR")}, ` +
          `avant la fin de la location prévue (${bookingEnd.toLocaleDateString("fr-FR")}). ` +
          `La réservation est impossible.`,
      );
    }

    // Vérifier la disponibilité via PlanningService (source de vérité)
    const isAvailable = await this.planningService.getVehicleAvailability(
      vehicleId,
      start,
      end,
    );
    if (!isAvailable) {
      const conflicts = await this.planningService.detectConflicts(
        vehicleId,
        start,
        end,
      );
      throw new ConflictException({
        message: "Le véhicule n'est pas disponible pour cette période",
        conflicts,
      });
    }

    // ============================================
    // VALIDATION TEMPS DE PRÉPARATION (R2.2) - BLOQUANTE
    // ============================================
    // Règle: Toute réservation chevauchant la période de préparation est BLOQUÉE
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: { company: true },
    });

    if (!agency) {
      throw new BadRequestException("Agence introuvable");
    }

    const preparationTimeMinutes = agency.preparationTimeMinutes || 60; // Default 1h

    const companyId = agency.companyId;
    const bookingNumberMode: "AUTO" | "MANUAL" =
      ((agency as any).company?.bookingNumberMode as any) ||
      BookingService.BookingNumberMode.AUTO;

    // ============================================
    // V2: BOOKING NUMBER (unique par company)
    // ============================================
    let bookingNumberToUse: string;
    if (bookingNumberMode === BookingService.BookingNumberMode.MANUAL) {
      const raw = createBookingDto.bookingNumber;
      if (!raw) {
        throw new BadRequestException(
          "Le numéro de réservation est requis lorsque le mode est MANUEL",
        );
      }
      bookingNumberToUse = this.normalizeAndValidateManualBookingNumber(raw);

      const existing = await this.prisma.booking.findFirst({
        where: {
          companyId,
          bookingNumber: bookingNumberToUse,
          deletedAt: null,
        } as any,
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          "Ce numéro de réservation existe déjà pour cette société",
        );
      }
    } else {
      if (createBookingDto.bookingNumber) {
        throw new BadRequestException(
          "Le numéro de réservation ne peut pas être défini lorsque le mode est AUTOMATIQUE",
        );
      }
      bookingNumberToUse = await this.getNextAutoBookingNumber(
        companyId,
        new Date(),
      );
    }

    // Pour chaque booking actif, calculer la fin réelle avec préparation
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        vehicleId,
        status: { in: ["IN_PROGRESS", "LATE"] },
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
      preparationEnd.setMinutes(
        preparationEnd.getMinutes() + activePreparationTime,
      );

      // Vérifier si la nouvelle réservation chevauche la période de préparation
      if (start < preparationEnd && end > actualEndDate) {
        await this.auditService.logBookingStatusChange(
          userId,
          "N/A",
          "CONFIRMED",
          "BLOCKED",
          agencyId,
        );
        throw new ConflictException({
          message:
            `Le véhicule est indisponible jusqu'au ${preparationEnd.toLocaleString("fr-FR")} ` +
            `(temps de préparation après retour). La réservation chevauche cette période.`,
          conflicts: [
            {
              type: "PREPARATION_TIME",
              id: activeBooking.id,
              startDate: actualEndDate,
              endDate: preparationEnd,
            },
          ],
        });
      }
    }

    // Extraire le type de permis du client depuis le champ note
    const clientNote = client.note || "";
    const licenseTypeMatch = clientNote.match(
      /Type permis:\s*([A-Z]+(?:\s+[A-Z]+)?)/i,
    );
    const clientLicenseType = licenseTypeMatch
      ? licenseTypeMatch[1].trim().toUpperCase()
      : null;

    // Déterminer le type de permis requis selon le type de véhicule
    // Pour l'instant, on considère que tous les véhicules nécessitent au minimum un permis B
    // Vous pouvez affiner cette logique selon vos besoins
    const requiredLicenseTypes = ["B"]; // Permis B minimum pour les voitures

    // Si le véhicule est un camion ou un bus, vérifier les permis C ou D
    const vehicleModel = (vehicle.model || "").toLowerCase();
    const vehicleBrand = (vehicle.brand || "").toLowerCase();

    if (
      vehicleModel.includes("camion") ||
      vehicleModel.includes("truck") ||
      vehicleBrand.includes("iveco") ||
      (vehicleBrand.includes("mercedes") && vehicleModel.includes("sprinter"))
    ) {
      requiredLicenseTypes.push("C");
    }

    if (
      vehicleModel.includes("bus") ||
      vehicleModel.includes("minibus") ||
      (vehicleBrand.includes("mercedes") && vehicleModel.includes("tourismo"))
    ) {
      requiredLicenseTypes.push("D");
    }

    // Vérifier si le client a le permis approprié
    if (clientLicenseType) {
      const hasValidLicense = requiredLicenseTypes.some((required) => {
        // Vérifier si le permis du client correspond (ex: B, BE, C, CE, D, DE)
        return (
          clientLicenseType.includes(required) ||
          clientLicenseType.startsWith(required)
        );
      });

      if (!hasValidLicense) {
        throw new BadRequestException(
          `Le client n'a pas le type de permis approprié. Permis requis: ${requiredLicenseTypes.join(" ou ")}. Permis du client: ${clientLicenseType}`,
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
        companyId,
        bookingNumber: bookingNumberToUse,
        vehicleId,
        clientId,
        startDate: start,
        endDate: end,
        totalPrice: parseFloat(totalPrice.toString()),
        status: status || "DRAFT",
        // Caution fields
        depositRequired: createBookingDto.depositRequired ?? false,
        depositAmount: createBookingDto.depositAmount
          ? parseFloat(createBookingDto.depositAmount.toString())
          : null,
        depositDecisionSource: createBookingDto.depositDecisionSource ?? null,
      } as any,
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
    if (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") {
      await this.planningService.createBookingEvent(
        booking.id,
        vehicleId,
        agencyId,
        start,
        end,
        client.name,
        `${vehicle.brand} ${vehicle.model}`,
      );

      // Mettre à jour le statut du véhicule selon spec
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: booking.status === "CONFIRMED" ? "RESERVED" : "RENTED",
        },
      });
    }

    // Log business event (async, non-blocking)
    this.businessEventLogService
      .logEvent(
        booking.agencyId,
        "Booking",
        booking.id,
        BusinessEventType.BOOKING_CREATED,
        null,
        booking,
        userId,
      )
      .catch(() => {
        // Error already logged in service
      });

    // V2 Domain Events (outbox backbone)
    await this.outboxService.enqueue({
      aggregateType: "Booking",
      aggregateId: booking.id,
      eventType: "BookingCreated",
      payload: {
        bookingId: booking.id,
        companyId,
        agencyId,
        bookingNumber: (booking as any).bookingNumber,
      },
      deduplicationKey: `BookingCreated:${booking.id}`,
    });
    await this.outboxService.enqueue({
      aggregateType: "Booking",
      aggregateId: booking.id,
      eventType: "BookingNumberAssigned",
      payload: {
        bookingId: booking.id,
        companyId,
        bookingNumber: (booking as any).bookingNumber,
        mode: bookingNumberMode,
      },
      deduplicationKey: `BookingNumberAssigned:${booking.id}`,
    });

    // Spec: 1 booking = 1 contrat, généré automatiquement
    try {
      await this.contractService.createContract(
        { bookingId: booking.id, templateId: undefined },
        userId,
      );
    } catch (error) {
      // Non-blocking: log error but don't fail booking creation
      this.logger.warn(
        `Échec création contrat auto pour booking ${booking.id}: ${error.message}`,
      );
    }

    // Remove audit fields from response
    return this.commonAuditService.removeAuditFields(booking);
  }

  async checkIn(id: string, checkInDto: CheckInDto, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, client: true },
    });

    if (!booking || booking.deletedAt) {
      throw new BadRequestException("Réservation introuvable");
    }

    // Check-in : confirmée ou retard au départ (pickup)
    if (booking.status !== "CONFIRMED" && booking.status !== "PICKUP_LATE") {
      throw new BadRequestException(
        `La réservation doit être CONFIRMÉE ou en retard au départ pour effectuer le check-in. Statut actuel : ${booking.status}`,
      );
    }

    // ============================================
    // VALIDATION CAUTION (R3) - BLOQUANTE
    // ============================================
    // Si caution requise, elle doit être collectée avant check-in
    if (booking.depositRequired === true) {
      const statusCheckIn = checkInDto.depositStatusCheckIn;
      if (statusCheckIn !== "COLLECTED") {
        throw new BadRequestException(
          "La caution doit être collectée avant le check-in",
        );
      }
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
        entityType: "Booking",
        entityId: id,
        description:
          "Clôture financière bloquée: montant récupéré dépasse la caution",
      });
      throw new BadRequestException(
        "Le client doit avoir une date d'expiration de permis valide. Le check-in est impossible.",
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
        entityType: "Booking",
        entityId: id,
        description:
          "Clôture financière bloquée: montant récupéré dépasse la caution",
      });
      throw new BadRequestException(
        `Le permis de conduite est expiré ou expire aujourd'hui (${licenseExpiry.toLocaleDateString("fr-FR")}). ` +
          `Le check-in est impossible.`,
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
        entityType: "Booking",
        entityId: id,
        description:
          "Clôture financière bloquée: montant récupéré dépasse la caution",
      });
      throw new BadRequestException(
        `Le permis de conduite expire le ${licenseExpiry.toLocaleDateString("fr-FR")}, ` +
          `avant la fin de la location (${bookingEnd.toLocaleDateString("fr-FR")}). ` +
          `Le check-in est impossible.`,
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
        title: "Photo avant check-in",
        url: photoUrl,
        key: photoUrl.split("/").pop() || "",
        bookingId: id,
      });
    }

    // Photo permis
    documents.push({
      type: DocumentType.DRIVING_LICENSE,
      title: "Photo permis de conduire",
      url: checkInDto.driverLicensePhoto,
      key: checkInDto.driverLicensePhoto.split("/").pop() || "",
      bookingId: id,
    });

    // Document identité si fourni
    if (checkInDto.identityDocument) {
      documents.push({
        type: DocumentType.ID_CARD,
        title: "Pièce d'identité",
        url: checkInDto.identityDocument,
        key: checkInDto.identityDocument.split("/").pop() || "",
        bookingId: id,
      });
    }

    // Document caution si fourni
    if (checkInDto.depositDocument) {
      documents.push({
        type: DocumentType.OTHER,
        title: "Document caution",
        url: checkInDto.depositDocument,
        key: checkInDto.depositDocument.split("/").pop() || "",
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
      title: "Données check-in",
      description: JSON.stringify(checkInData),
      url: "",
      key: `checkin-${id}`,
      bookingId: id,
    });

    // Mettre à jour le booking et créer les documents
    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      // Mettre à jour le statut à IN_PROGRESS (ACTIVE dans le mobile)
      const updateData: any = {
        status: "IN_PROGRESS",
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
        data: { status: "RENTED" },
      });

      return this.commonAuditService.removeAuditFields(booking);
    });

    // Créer un événement de log métier
    await this.businessEventLogService.logEvent(
      updatedBooking.agencyId,
      "Booking",
      id,
      BusinessEventType.BOOKING_STATUS_CHANGED,
      { status: booking.status },
      {
        status: "IN_PROGRESS",
        odometerStart: checkInDto.odometerStart,
        fuelLevelStart: checkInDto.fuelLevelStart,
      },
      userId,
      updatedBooking.agency.companyId,
    );

    try {
      await this.notifyFinancialClosurePending({
        bookingId: id,
        agencyId: updatedBooking.agencyId,
        companyId: updatedBooking.agency.companyId,
        bookingNumber: (updatedBooking as any).bookingNumber,
        vehicleRegistrationNumber: (updatedBooking as any).vehicle
          ?.registrationNumber,
      });
    } catch (error: any) {
      this.logger.warn(
        `Notification clôture financière non envoyée: ${error?.message || error}`,
      );
    }

    return this.commonAuditService.removeAuditFields(updatedBooking);
  }

  async checkOut(id: string, checkOutDto: CheckOutDto, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, client: true },
    });

    if (!booking || booking.deletedAt) {
      throw new BadRequestException("Réservation introuvable");
    }

    // Vérifier que le booking est en statut IN_PROGRESS (ACTIVE)
    if (booking.status !== "IN_PROGRESS" && booking.status !== "LATE") {
      throw new BadRequestException(
        `La réservation doit être EN COURS ou EN RETARD pour effectuer le check-out. Statut actuel : ${booking.status}`,
      );
    }

    // Valider l'encaissement espèces si cashCollected est true
    if (
      checkOutDto.cashCollected === true &&
      (!checkOutDto.cashAmount || checkOutDto.cashAmount <= 0)
    ) {
      throw new BadRequestException(
        "Le montant en espèces est requis et doit être supérieur à 0 si des espèces sont collectées",
      );
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
        `Le kilométrage de fin (${checkOutDto.odometerEnd}) doit être supérieur ou égal au kilométrage de début (${odometerStart})`,
      );
    }
    if (
      typeof booking.vehicle?.mileage === "number" &&
      checkOutDto.odometerEnd < booking.vehicle.mileage
    ) {
      throw new BadRequestException(
        `Le kilométrage de fin (${checkOutDto.odometerEnd}) ne peut pas être inférieur au kilométrage actuel du véhicule (${booking.vehicle.mileage})`,
      );
    }

    // ============================================
    // CALCUL AUTOMATIQUE DES FRAIS DE RETARD (R4)
    // ============================================
    // Tolérance 1 h sans frais, puis barème sur le retard effectif (hors 1ère heure).
    const GRACE_RETURN_HOURS = 1;
    const calculateLateFee = (booking: any, actualReturnDate: Date): number => {
      const expectedEndDate = new Date(booking.endDate);
      const delayMs = actualReturnDate.getTime() - expectedEndDate.getTime();
      const delayHours = delayMs / (1000 * 60 * 60);

      if (delayHours <= 0) {
        return 0;
      }

      const effectiveDelayHours = delayHours - GRACE_RETURN_HOURS;
      if (effectiveDelayHours <= 0) {
        return 0;
      }

      const dailyRate = booking.vehicle?.dailyRate || 0;
      let lateFeeRate = 0;

      if (effectiveDelayHours <= 1) {
        lateFeeRate = 0.25;
      } else if (effectiveDelayHours <= 2) {
        lateFeeRate = 0.5;
      } else if (effectiveDelayHours <= 4) {
        lateFeeRate = 0.75;
      } else {
        lateFeeRate = 1.0;
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
        title: "Photo après check-out",
        url: photoUrl,
        key: photoUrl.split("/").pop() || "",
        bookingId: id,
      });
    }

    // Reçu de paiement si fourni
    if (checkOutDto.cashReceipt) {
      documents.push({
        type: DocumentType.OTHER,
        title: "Reçu de paiement",
        url: checkOutDto.cashReceipt,
        key: checkOutDto.cashReceipt.split("/").pop() || "",
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
      title: "Données check-out",
      description: JSON.stringify(checkOutData),
      url: "",
      key: `checkout-${id}`,
      bookingId: id,
    });

    // Calculer le prix total avec les frais supplémentaires
    let finalPrice = booking.totalPrice;
    if (checkOutDto.extraFees) finalPrice += checkOutDto.extraFees;
    // Utiliser le frais de retard calculé automatiquement
    const lateFeeValue =
      typeof lateFeeAmount === "number"
        ? lateFeeAmount
        : lateFeeAmount
          ? Number(lateFeeAmount)
          : 0;
    if (lateFeeValue > 0) finalPrice += lateFeeValue;
    if (checkOutDto.damageFee) finalPrice += checkOutDto.damageFee;

    // Mettre à jour le booking et créer les documents
    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      // Mettre à jour le statut à RETURNED (COMPLETED dans le mobile)
      const booking = await tx.booking.update({
        where: { id },
        data: {
          status: "RETURNED",
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
        data: {
          status: "AVAILABLE",
          mileage: checkOutDto.odometerEnd,
        },
      });

      return this.commonAuditService.removeAuditFields(booking);
    });

    // ============================================
    // TEMPS DE PRÉPARATION AUTOMATIQUE (R2.2)
    // ============================================
    // Au retour, supprimer l'événement booking et créer un créneau de préparation
    await this.planningService.deleteBookingEvents(id);
    await this.planningService.createPreparationTime(
      id,
      booking.vehicleId,
      booking.agencyId,
      actualReturnDate,
      actualReturnDate > new Date(booking.endDate),
    );

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
      "Booking",
      id,
      BusinessEventType.BOOKING_STATUS_CHANGED,
      { status: booking.status },
      {
        status: "RETURNED",
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

  private isValidStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): boolean {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["PENDING", "CANCELLED"],
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
      PICKUP_LATE: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
      IN_PROGRESS: ["RETURNED", "LATE"],
      LATE: ["RETURNED"],
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
      throw new BadRequestException("Réservation introuvable");
    }

    const {
      startDate,
      endDate,
      status,
      totalPrice,
      bookingNumber,
      extensionReason,
    } = updateBookingDto as any;

    // V2: bookingNumber is locked once an invoice exists (InvoiceIssued)
    if (bookingNumber !== undefined) {
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: { bookingId: id },
        select: { id: true },
      });
      if (existingInvoice) {
        throw new ForbiddenException(
          "Le numéro de réservation est verrouillé car une facture a été émise",
        );
      }
    }

    // Validate status transition
    if (status && status !== booking.status) {
      if (!this.isValidStatusTransition(booking.status, status)) {
        throw new BadRequestException(
          `Transition de statut invalide de ${booking.status} à ${status}`,
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
          message: "Le véhicule n'est pas disponible pour cette période",
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
    if (totalPrice !== undefined)
      updateData.totalPrice = parseFloat(totalPrice.toString());
    if (bookingNumber !== undefined) {
      const normalized =
        this.normalizeAndValidateManualBookingNumber(bookingNumber);
      const existing = await this.prisma.booking.findFirst({
        where: {
          companyId: (booking as any).companyId,
          bookingNumber: normalized,
          deletedAt: null,
          NOT: { id },
        } as any,
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          "Ce numéro de réservation existe déjà pour cette société",
        );
      }
      updateData.bookingNumber = normalized;
    }

    // Add audit fields
    const dataWithAudit = this.commonAuditService.addUpdateAuditFields(
      updateData,
      userId,
    );

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

    // V2: domain event for bookingNumber change
    if (
      bookingNumber !== undefined &&
      (updatedBooking as any).bookingNumber !== (booking as any).bookingNumber
    ) {
      await this.outboxService.enqueue({
        aggregateType: "Booking",
        aggregateId: updatedBooking.id,
        eventType: "BookingNumberEdited",
        payload: {
          bookingId: updatedBooking.id,
          companyId: (updatedBooking as any).companyId,
          previousBookingNumber: (booking as any).bookingNumber,
          bookingNumber: (updatedBooking as any).bookingNumber,
        },
        deduplicationKey: `BookingNumberEdited:${updatedBooking.id}:${(updatedBooking as any).bookingNumber}`,
      });
    }

    // Mettre à jour l'événement de planning
    await this.planningService.deleteBookingEvents(booking.id);
    if (
      updatedBooking.status === "CONFIRMED" ||
      updatedBooking.status === "PICKUP_LATE" ||
      updatedBooking.status === "IN_PROGRESS"
    ) {
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
    if (
      updatedBooking.status === "RETURNED" ||
      updatedBooking.status === "CANCELLED"
    ) {
      await this.prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: "AVAILABLE" },
      });

      // Créer temps de préparation si retourné
      if (updatedBooking.status === "RETURNED") {
        const isLate = new Date() > booking.endDate;
        await this.planningService.createPreparationTime(
          booking.id,
          booking.vehicleId,
          booking.agencyId,
          new Date(),
          isLate,
        );
      }
    } else if (
      updatedBooking.status === "IN_PROGRESS" ||
      updatedBooking.status === "LATE"
    ) {
      await this.prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: "RENTED" },
      });
    } else if (
      updatedBooking.status === "CONFIRMED" ||
      updatedBooking.status === "PICKUP_LATE"
    ) {
      await this.prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: "RESERVED" },
      });
    }

    // Log business event
    const eventType =
      status && status !== booking.status
        ? BusinessEventType.BOOKING_STATUS_CHANGED
        : BusinessEventType.BOOKING_UPDATED;

    this.businessEventLogService
      .logEvent(
        updatedBooking.agencyId,
        "Booking",
        updatedBooking.id,
        eventType,
        previousState,
        updatedBooking,
        userId,
      )
      .catch(() => {
        // Error already logged in service
      });

    if (startDate || endDate) {
      this.tryAppendPastPeriodJournal({
        agencyId: updatedBooking.agencyId,
        companyId: (updatedBooking as any).companyId,
        bookingId: updatedBooking.id,
        bookingNumber: (updatedBooking as any).bookingNumber,
        vehicleId: updatedBooking.vehicleId,
        userId,
        start: updatedBooking.startDate,
        end: updatedBooking.endDate,
        context: "update",
      });
    }

    if (extensionReason && (startDate || endDate)) {
      this.journalService
        .appendEntry({
          agencyId: updatedBooking.agencyId,
          companyId: (updatedBooking as any).companyId,
          type: "SYSTEM_EVENT",
          title: "Modification des dates (motif agence)",
          content: `Motif : ${extensionReason}. Période : ${updatedBooking.startDate.toISOString()} → ${updatedBooking.endDate.toISOString()}.`,
          bookingId: updatedBooking.id,
          bookingNumber: (updatedBooking as any).bookingNumber,
          vehicleId: updatedBooking.vehicleId,
          userId,
          metadata: { kind: "DATE_CHANGE_REASON" },
        })
        .catch(() => {});
    }

    // Remove audit fields from response
    return this.commonAuditService.removeAuditFields(updatedBooking);
  }

  /**
   * Journal « dossier » : période avec date de début dans le passé (saisie historique / correction).
   */
  private tryAppendPastPeriodJournal(params: {
    agencyId: string;
    companyId: string;
    bookingId: string;
    bookingNumber: string;
    vehicleId: string;
    userId: string | undefined;
    start: Date;
    end: Date;
    context: "create" | "update";
  }): void {
    void this.appendPastPeriodJournal(params).catch(() => {});
  }

  private async appendPastPeriodJournal(params: {
    agencyId: string;
    companyId: string;
    bookingId: string;
    bookingNumber: string;
    vehicleId: string;
    userId: string | undefined;
    start: Date;
    end: Date;
    context: "create" | "update";
  }): Promise<void> {
    if (params.start.getTime() >= Date.now()) return;

    const title =
      params.context === "create"
        ? "Réservation avec date de début passée"
        : "Modification : date de début dans le passé";

    const content =
      `Réf. ${params.bookingNumber}. Début ${params.start.toISOString()}, fin ${params.end.toISOString()}. ` +
      `Traçabilité saisie ou correction (hors flux temps réel).`;

    await this.journalService.appendEntry({
      agencyId: params.agencyId,
      companyId: params.companyId,
      type: "SYSTEM_EVENT",
      title,
      content,
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      vehicleId: params.vehicleId,
      userId: params.userId,
      metadata: { kind: "PAST_PERIOD_BOOKING", context: params.context },
    });
  }

  /**
   * Vérifier et mettre à jour automatiquement les statuts des bookings en retard
   */
  private async checkAndUpdateLateBookings(bookings: any[]): Promise<void> {
    const now = new Date();
    const lateBookingIds = bookings
      .filter(
        (booking) =>
          booking.status === "IN_PROGRESS" && new Date(booking.endDate) < now,
      )
      .map((booking) => booking.id);

    // Mettre à jour les bookings en retard en batch
    if (lateBookingIds.length > 0) {
      await this.prisma.booking.updateMany({
        where: {
          id: { in: lateBookingIds },
          status: "IN_PROGRESS",
        },
        data: { status: "LATE" },
      });
    }
  }

  private async buildBookingWhere(
    user: any,
    filters?: any,
  ): Promise<any | null> {
    const where: any = {
      deletedAt: null,
    };

    const bookingNumberFilterRaw = filters?.bookingNumber;
    const bookingNumberFilter =
      bookingNumberFilterRaw != null &&
      String(bookingNumberFilterRaw).trim() !== ""
        ? this.normalizeBookingNumber(String(bookingNumberFilterRaw))
        : null;

    // Filter by role
    if (user.role === "SUPER_ADMIN") {
      if (filters?.agencyId) where.agencyId = filters.agencyId;
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.status) where.status = filters.status;
      if (bookingNumberFilter)
        where.bookingNumber = { contains: bookingNumberFilter };
    } else if (user.role === "COMPANY_ADMIN" && user.companyId) {
      where.agency = { companyId: user.companyId };
      if (filters?.agencyId) {
        const agency = await this.prisma.agency.findFirst({
          where: { id: filters.agencyId, companyId: user.companyId },
        });
        if (agency) {
          where.agencyId = filters.agencyId;
        } else {
          return null;
        }
      }
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.status) where.status = filters.status;
      if (bookingNumberFilter)
        where.bookingNumber = { contains: bookingNumberFilter };
    } else if (user.agencyIds && user.agencyIds.length > 0) {
      where.agencyId = { in: user.agencyIds };
      if (filters?.agencyId && user.agencyIds.includes(filters.agencyId)) {
        where.agencyId = filters.agencyId;
      } else if (filters?.agencyId) {
        return null;
      }
      if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.status) where.status = filters.status;
      if (bookingNumberFilter)
        where.bookingNumber = { contains: bookingNumberFilter };
    } else {
      return null;
    }

    if (filters?.startDate || filters?.endDate) {
      const dateFilter: any = {};
      if (filters?.startDate) {
        dateFilter.gte = new Date(filters.startDate);
      }
      if (filters?.endDate) {
        dateFilter.lte = new Date(filters.endDate);
      }
      where.startDate = dateFilter;
    }

    return where;
  }

  private normalizeBookingRows(bookings: any[]) {
    const now = new Date();
    return bookings.map((booking) => {
      const withLateStatus =
        booking.status === "IN_PROGRESS" && new Date(booking.endDate) < now
          ? { ...booking, status: "LATE" }
          : booking;
      return this.commonAuditService.removeAuditFields(withLateStatus);
    });
  }

  async findAll(user: any, filters?: any) {
    const where = await this.buildBookingWhere(user, filters);
    if (!where) {
      return [];
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            registrationNumber: true,
            dailyRate: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            licenseExpiryDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Vérifier et mettre à jour automatiquement les bookings en retard
    await this.checkAndUpdateLateBookings(bookings);

    return this.normalizeBookingRows(bookings);
  }

  async findAllLight(user: any, page = 1, pageSize = 20, filters?: any) {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize)
      ? Math.min(Math.max(1, Math.floor(pageSize)), 100)
      : 20;
    const skip = (safePage - 1) * safePageSize;

    const where = await this.buildBookingWhere(user, filters);
    if (!where) {
      return {
        items: [],
        total: 0,
        page: safePage,
        pageSize: safePageSize,
        totalPages: 1,
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              companyId: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              registrationNumber: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: safePageSize,
      }),
      this.prisma.booking.count({ where }),
    ]);

    await this.checkAndUpdateLateBookings(rows);

    const items = this.normalizeBookingRows(rows);
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    };
  }

  async getSummary(user: any, filters?: any) {
    const where = await this.buildBookingWhere(user, filters);
    if (!where) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        late: 0,
        cancelled: 0,
        estimatedRevenue: 0,
      };
    }

    const [
      total,
      active,
      completed,
      late,
      cancelled,
      revenueAgg,
      groupedByAgency,
    ] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { ...where, status: "IN_PROGRESS" } }),
      this.prisma.booking.count({ where: { ...where, status: "RETURNED" } }),
      this.prisma.booking.count({ where: { ...where, status: "LATE" } }),
      this.prisma.booking.count({ where: { ...where, status: "CANCELLED" } }),
      this.prisma.booking.aggregate({
        where: { ...where, status: "RETURNED" },
        _sum: { totalPrice: true },
      }),
      (this.prisma.booking as any).groupBy({
        by: ["agencyId"],
        where,
        _count: { _all: true },
        orderBy: { _count: { agencyId: "desc" } },
        take: 10,
      }),
    ]);

    const agencyIds = groupedByAgency.map((item: any) => item.agencyId);
    const agencies = agencyIds.length
      ? await this.prisma.agency.findMany({
          where: { id: { in: agencyIds } },
          select: { id: true, name: true },
        })
      : [];
    const agencyNameById = new Map(
      agencies.map((agency) => [agency.id, agency.name]),
    );

    return {
      total,
      active,
      completed,
      late,
      cancelled,
      estimatedRevenue: Number(revenueAgg._sum.totalPrice || 0),
      topAgencies: groupedByAgency.map((item: any) => ({
        agencyId: item.agencyId,
        agencyName: agencyNameById.get(item.agencyId) || "Agence",
        bookings: Number(item._count?._all || 0),
      })),
    };
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
                  in: ["ID_CARD", "DRIVING_LICENSE", "OTHER"],
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
      throw new BadRequestException("Réservation introuvable");
    }

    // Agency access check
    this.assertBookingAccess(booking, user);

    // Remove audit fields from public responses
    return this.commonAuditService.removeAuditFields(booking);
  }

  async remove(id: string, user: any, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking || booking.deletedAt) {
      throw new BadRequestException("Réservation introuvable");
    }

    // Agency access check
    this.assertBookingAccess(booking, user);

    // Store previous state for event log
    const previousState = { ...booking };

    // Supprimer les événements de planning
    await this.planningService.deleteBookingEvents(id);

    // Add audit fields for soft delete
    const deleteData = this.commonAuditService.addDeleteAuditFields(
      {},
      user.id || user.userId,
      reason,
    );

    // Soft delete
    await this.prisma.booking.update({
      where: { id },
      data: deleteData,
    });

    // Remettre le véhicule en disponible
    await this.prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: "AVAILABLE" },
    });

    return { message: "Réservation supprimée avec succès" };
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
          where: { status: "DISPUTED" },
        },
        payments: true,
      },
    });

    if (!booking) {
      throw new BadRequestException("Réservation introuvable");
    }

    // ============================================
    // VALIDATION DOMMAGES & LITIGES (R5)
    // ============================================
    // Vérifier qu'il n'y a pas de litige en cours
    if (booking.incidents.some((inc) => inc.status === "DISPUTED")) {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: "Booking",
        entityId: id,
        description:
          "Clôture financière bloquée: montant récupéré dépasse la caution",
      });
      throw new BadRequestException(
        "La clôture financière est bloquée: un ou plusieurs incidents sont en litige (DISPUTED). " +
          "Veuillez résoudre les litiges avant de procéder à la clôture.",
      );
    }

    // Vérifier que la caution n'est pas en DISPUTED
    if (booking.depositStatusFinal === "DISPUTED") {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: "Booking",
        entityId: id,
        description:
          "Clôture financière bloquée: montant récupéré dépasse la caution",
      });
      throw new BadRequestException(
        "La clôture financière est bloquée: la caution est en litige (DISPUTED). " +
          "Veuillez résoudre le litige avant de procéder à la clôture.",
      );
    }

    // Calculer le montant total récupéré (ne jamais dépasser la caution)
    const totalCollected = booking.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    const maxAllowed = booking.depositAmount
      ? typeof booking.depositAmount === "number"
        ? booking.depositAmount
        : Number(booking.depositAmount)
      : 0;
    if (totalCollected > maxAllowed) {
      await this.auditService.log({
        userId,
        agencyId: booking.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: "Booking",
        entityId: id,
        description:
          "Clôture financière bloquée: montant récupéré dépasse la caution",
      });
      throw new BadRequestException(
        `Le montant total récupéré (${totalCollected}) ne peut pas dépasser la caution (${maxAllowed})`,
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
      this.logger.warn(
        `Facture non générée lors de la clôture financière: ${error.message}`,
      );
    }

    // Mettre à jour le statut final de la caution si nécessaire
    // (sera fait manuellement ou automatiquement selon les règles métier)

    return this.commonAuditService.removeAuditFields(booking);
  }

  /**
   * Override des frais de retard par Agency Manager
   * Règle: Override possible UNIQUEMENT par Agency Manager avec justification loggée
   */
  async overrideLateFee(
    id: string,
    overrideDto: OverrideLateFeeDto,
    userId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        agency: true,
      },
    });

    if (!booking) {
      throw new BadRequestException("Réservation introuvable");
    }

    // Vérifier que l'utilisateur est gestionnaire d'agence, admin société ou SUPER_ADMIN
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      !user ||
      (user.role !== "AGENCY_MANAGER" &&
        user.role !== "COMPANY_ADMIN" &&
        user.role !== "SUPER_ADMIN")
    ) {
      throw new ForbiddenException(
        "Seuls les gestionnaires d'agence, les administrateurs société ou SUPER_ADMIN peuvent modifier les frais de retard",
      );
    }

    // Vérifier que le booking est en statut RETURNED
    if (booking.status !== "RETURNED") {
      throw new BadRequestException(
        "Les frais de retard ne peuvent être modifiés que pour un booking en statut RETURNED",
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
      "Booking",
      id,
      `Override des frais de retard: ${booking.lateFeeAmount || 0} MAD → ${overrideDto.newAmount} MAD. Justification: ${overrideDto.justification}`,
      { lateFeeAmount: booking.lateFeeAmount },
      {
        lateFeeAmount: overrideDto.newAmount,
        justification: overrideDto.justification,
      },
      booking.agency.companyId,
      booking.agencyId,
    );

    // Log business event
    await this.businessEventLogService.logEvent(
      booking.agencyId,
      "Booking",
      id,
      BusinessEventType.BOOKING_UPDATED,
      { lateFeeAmount: booking.lateFeeAmount },
      {
        lateFeeAmount: overrideDto.newAmount,
        lateFeeReason: overrideDto.justification,
      },
      userId,
      booking.agency.companyId,
    );

    try {
      await this.invoiceService.syncInvoiceTotalsFromBooking(id);
    } catch (err: any) {
      this.logger.warn(
        `Synchronisation facture après override frais: ${err?.message || err}`,
      );
    }

    return {
      message: "Frais de retard modifiés avec succès",
      lateFeeAmount: overrideDto.newAmount,
    };
  }
}
