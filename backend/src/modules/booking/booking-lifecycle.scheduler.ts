import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PlanningService } from "../planning/planning.service";
import { InAppNotificationService } from "../in-app-notification/in-app-notification.service";
import { JournalService } from "../journal/journal.service";
import { BusinessEventLogService } from "../business-event-log/business-event-log.service";
import { BusinessEventType, Role } from "@prisma/client";

/** 0,5 jour après l’heure de départ prévue (check-in non effectué) → no-show auto. */
const NO_SHOW_AFTER_MS = 12 * 60 * 60 * 1000;
/** Passage en PICKUP_LATE : 30 min après l’heure de départ prévue sans check-in. */
const PICKUP_LATE_AFTER_MS = 30 * 60 * 1000;

@Injectable()
export class BookingLifecycleScheduler {
  private readonly logger = new Logger(BookingLifecycleScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planningService: PlanningService,
    private readonly inAppNotificationService: InAppNotificationService,
    private readonly journalService: JournalService,
    private readonly businessEventLogService: BusinessEventLogService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async runAutomaticNoShows(): Promise<void> {
    const threshold = new Date(Date.now() - NO_SHOW_AFTER_MS);
    const candidates = await this.prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "PICKUP_LATE"] },
        deletedAt: null,
        startDate: { lte: threshold },
      },
      include: {
        client: { select: { name: true } },
        vehicle: { select: { registrationNumber: true } },
      },
      take: 100,
    });

    for (const b of candidates) {
      try {
        await this.planningService.deleteBookingEvents(b.id);
        await this.prisma.booking.update({
          where: { id: b.id },
          data: { status: "NO_SHOW" },
        });
        await this.prisma.vehicle.update({
          where: { id: b.vehicleId },
          data: { status: "AVAILABLE" },
        });

        this.businessEventLogService
          .logEvent(
            b.agencyId,
            "Booking",
            b.id,
            BusinessEventType.BOOKING_STATUS_CHANGED,
            { status: b.status },
            {
              status: "NO_SHOW",
              source: "AUTO_NO_SHOW_AFTER_12H",
            },
            undefined,
            b.companyId,
          )
          .catch(() => {});

        this.journalService
          .appendEntry({
            agencyId: b.agencyId,
            companyId: b.companyId,
            type: "SYSTEM_EVENT",
            title: "No-show automatique (12 h après l’heure de départ prévue)",
            content:
              `Réservation ${(b as any).bookingNumber || b.id.slice(0, 8)} — client ${b.client?.name || "N/A"}, immat. ${b.vehicle?.registrationNumber || "N/A"}. ` +
              `Passage en NO_SHOW sans check-in.`,
            bookingId: b.id,
            bookingNumber: (b as any).bookingNumber,
            vehicleId: b.vehicleId,
            metadata: { kind: "AUTO_NO_SHOW", hoursAfterStart: 12 },
          })
          .catch((err) =>
            this.logger.warn(`Journal NO_SHOW: ${err?.message || err}`),
          );
      } catch (e: any) {
        this.logger.warn(
          `No-show auto échoué pour booking ${b.id}: ${e?.message || e}`,
        );
      }
    }

    if (candidates.length > 0) {
      this.logger.log(
        `No-show auto: ${candidates.length} réservation(s) traitée(s)`,
      );
    }
  }

  /**
   * 1) CONFIRMED + départ prévu il y a > 30 min → PICKUP_LATE
   * 2) Notifications in-app pour les PICKUP_LATE récents (une fois par réservation)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async runPickupLateWorkflow(): Promise<void> {
    const now = Date.now();
    const pickupLateBefore = new Date(now - PICKUP_LATE_AFTER_MS);

    const toMarkPickupLate = await this.prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        deletedAt: null,
        startDate: { lte: pickupLateBefore },
      },
      take: 80,
    });

    for (const b of toMarkPickupLate) {
      try {
        await this.prisma.booking.update({
          where: { id: b.id },
          data: { status: "PICKUP_LATE" },
        });
        await this.prisma.vehicle.update({
          where: { id: b.vehicleId },
          data: { status: "RESERVED" },
        });
        this.businessEventLogService
          .logEvent(
            b.agencyId,
            "Booking",
            b.id,
            BusinessEventType.BOOKING_STATUS_CHANGED,
            { status: "CONFIRMED" },
            { status: "PICKUP_LATE", source: "AUTO_PICKUP_LATE_AFTER_30M" },
            undefined,
            b.companyId,
          )
          .catch(() => {});
      } catch (e: any) {
        this.logger.warn(`PICKUP_LATE auto ${b.id}: ${e?.message || e}`);
      }
    }

    const notTooOld = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const notifyCandidates = await this.prisma.booking.findMany({
      where: {
        status: "PICKUP_LATE",
        deletedAt: null,
        startDate: { lte: pickupLateBefore, gte: notTooOld },
      },
      include: {
        client: { select: { name: true } },
        vehicle: {
          select: { registrationNumber: true, brand: true, model: true },
        },
      },
      take: 80,
    });

    let notified = 0;
    for (const b of notifyCandidates) {
      const alreadyAlerted = await (
        this.prisma as any
      ).inAppNotification.findFirst({
        where: {
          bookingId: b.id,
          type: "BOOKING_LATE",
          metadata: {
            path: ["variant"],
            equals: "PICKUP_DELAY_30M",
          },
        },
      });
      if (alreadyAlerted) continue;

      const recipientIds = await this.resolveAgencyNotificationUserIds(
        b.agencyId,
        b.companyId,
      );
      const title = "Retard au départ (check-in non effectué)";
      const message =
        `${(b as any).bookingNumber || b.id.slice(0, 8)} — ${b.client?.name || "Client"} — ` +
        `${b.vehicle?.brand} ${b.vehicle?.model} (${b.vehicle?.registrationNumber}). ` +
        `Départ prévu : ${b.startDate.toLocaleString("fr-FR")}. Statut : retard au départ.`;

      for (const userId of recipientIds) {
        try {
          const n = await this.inAppNotificationService.createNotification({
            userId,
            companyId: b.companyId,
            agencyId: b.agencyId,
            type: "BOOKING_LATE",
            title,
            message,
            bookingId: b.id,
            actionUrl: `/agency/bookings/${b.id}`,
            metadata: { variant: "PICKUP_DELAY_30M" },
          });
          if (n?.id) {
            await this.inAppNotificationService.sendNotification(n.id);
          }
          notified += 1;
        } catch (e: any) {
          this.logger.warn(
            `Notification retard départ: user ${userId} booking ${b.id}: ${e?.message}`,
          );
        }
      }
    }

    if (notified > 0) {
      this.logger.log(`Alertes retard départ: ${notified} notification(s)`);
    }
  }

  private async resolveAgencyNotificationUserIds(
    agencyId: string,
    companyId: string,
  ): Promise<string[]> {
    const ua = await this.prisma.userAgency.findMany({
      where: { agencyId },
      select: { userId: true, user: { select: { isActive: true } } },
    });
    const fromAgency = ua
      .filter((r) => r.user?.isActive !== false)
      .map((r) => r.userId);

    const admins = await this.prisma.user.findMany({
      where: {
        companyId,
        role: Role.COMPANY_ADMIN,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    const fromCompany = admins.map((u) => u.id);

    return [...new Set([...fromAgency, ...fromCompany])];
  }
}
