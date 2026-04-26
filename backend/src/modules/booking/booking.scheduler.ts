import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../common/prisma/prisma.service";
import { BookingStatus, VehicleStatus } from "@prisma/client";

/**
 * Scheduler pour les tâches automatiques de gestion des réservations
 *
 * Tâches :
 * - Marquer les bookings NO_SHOW (client absent après startDate) - quotidien 6h
 * - Marquer les bookings LATE (véhicule non rendu après endDate) - quotidien 7h
 * - Alertes J-1 pour les retours prévus (pour notifications) - quotidien 8h
 *
 * Logique métier:
 * - PENDING/CONFIRMED + startDate passée + pas de check-in → NO_SHOW
 * - IN_PROGRESS + endDate passée + pas de check-out → LATE
 * - Le véhicule reste RENTED tant que le booking est LATE (pas de libération auto)
 */
@Injectable()
export class BookingScheduler {
  private readonly logger = new Logger(BookingScheduler.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Marquer les réservations NO_SHOW
   * Un client qui n'a pas récupéré le véhicule après la date de début
   * Exécuté tous les jours à 6h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async markNoShowBookings() {
    this.logger.log("Vérification des réservations NO_SHOW...");

    try {
      const now = new Date();

      // Trouver les bookings PENDING ou CONFIRMED dont startDate est passée
      // et qui n'ont pas eu de check-in (pas de checkInAt)
      const noShowBookings = await this.prisma.booking.findMany({
        where: {
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
          startDate: {
            lt: now, // startDate passée
          },
          checkInAt: null, // Pas de check-in effectué
          deletedAt: null,
        },
        include: {
          vehicle: true,
        },
      });

      let updatedCount = 0;

      for (const booking of noShowBookings) {
        try {
          await this.prisma.$transaction(async (tx) => {
            // Mettre à jour le statut du booking
            await tx.booking.update({
              where: { id: booking.id },
              data: {
                status: BookingStatus.NO_SHOW,
                updatedAt: now,
              },
            });

            // Libérer le véhicule s'il était RESERVED
            if (booking.vehicle?.status === VehicleStatus.RESERVED) {
              await tx.vehicle.update({
                where: { id: booking.vehicleId },
                data: {
                  status: VehicleStatus.AVAILABLE,
                  updatedAt: now,
                },
              });
            }
          });

          updatedCount++;
          this.logger.log(
            `Réservation ${booking.bookingNumber || booking.id} marquée NO_SHOW`,
          );
        } catch (error) {
          this.logger.error(
            `Erreur lors du marquage NO_SHOW pour ${booking.id}:`,
            error,
          );
        }
      }

      this.logger.log(`${updatedCount} réservation(s) marquée(s) NO_SHOW`);
    } catch (error) {
      this.logger.error("Erreur dans markNoShowBookings:", error);
    }
  }

  /**
   * Marquer les réservations LATE (retard de retour)
   * Un véhicule non rendu après la date de fin prévue
   * Exécuté tous les jours à 7h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async markLateBookings() {
    this.logger.log("Vérification des réservations en RETARD...");

    try {
      const now = new Date();

      // Trouver les bookings IN_PROGRESS ou EXTENDED dont endDate est passée
      // et qui n'ont pas eu de check-out (pas de checkOutAt)
      const lateBookings = await this.prisma.booking.findMany({
        where: {
          status: {
            in: [BookingStatus.IN_PROGRESS, BookingStatus.EXTENDED],
          },
          endDate: {
            lt: now, // endDate passée
          },
          checkOutAt: null, // Pas de check-out effectué
          deletedAt: null,
        },
      });

      let updatedCount = 0;

      for (const booking of lateBookings) {
        try {
          await this.prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.LATE,
              updatedAt: now,
            },
          });

          // Note: On ne libère PAS le véhicule - il reste RENTED
          // Le véhicule ne sera libéré que lors du check-out effectif

          updatedCount++;
          this.logger.log(
            `Réservation ${booking.bookingNumber || booking.id} marquée en RETARD`,
          );
        } catch (error) {
          this.logger.error(
            `Erreur lors du marquage RETARD pour ${booking.id}:`,
            error,
          );
        }
      }

      this.logger.log(`${updatedCount} réservation(s) marquée(s) en RETARD`);
    } catch (error) {
      this.logger.error("Erreur dans markLateBookings:", error);
    }
  }

  /**
   * Générer les alertes pour les retours prévus demain (J-1)
   * Pour déclencher des notifications aux agents/managers
   * Exécuté tous les jours à 8h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async alertUpcomingReturns() {
    this.logger.log("Vérification des retours prévus demain (J-1)...");

    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Trouver les bookings IN_PROGRESS qui se terminent demain
      const upcomingReturns = await this.prisma.booking.findMany({
        where: {
          status: BookingStatus.IN_PROGRESS,
          endDate: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
          deletedAt: null,
        },
        include: {
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
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          agency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log pour le moment - dans une V2, on pourrait créer des InAppNotifications
      this.logger.log(
        `${upcomingReturns.length} véhicule(s) prévu(s) en retour demain`,
      );

      for (const booking of upcomingReturns) {
        this.logger.log(
          `- ${booking.vehicle?.brand} ${booking.vehicle?.model} (${booking.vehicle?.registrationNumber}) - Client: ${booking.client?.firstName} ${booking.client?.lastName}`,
        );
      }

      // TODO V2: Créer des InAppNotification pour les agents/managers
      // await this.inAppNotificationService.createReturnReminder(upcomingReturns);
    } catch (error) {
      this.logger.error("Erreur dans alertUpcomingReturns:", error);
    }
  }

  /**
   * Méthode utilitaire pour exécuter manuellement les checks
   * Peut être appelée via un endpoint admin si nécessaire
   */
  async runAllChecks() {
    this.logger.log("Exécution manuelle de tous les contrôles de statut...");
    await this.markNoShowBookings();
    await this.markLateBookings();
    await this.alertUpcomingReturns();
    this.logger.log("Tous les contrôles terminés");
  }
}
