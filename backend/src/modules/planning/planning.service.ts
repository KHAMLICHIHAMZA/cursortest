import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlanningEventType } from '@prisma/client';

/**
 * PlanningService - Source de vérité absolue pour la disponibilité
 * 
 * Règles métier :
 * - Le planning inclut : réservations, maintenances, blocages, temps de préparation
 * - Aucun booking ne peut contourner le planning
 * - Temps de préparation : 1h standard, 2h si retard (créé automatiquement après retour)
 * - Calcul disponibilité unique
 * - Détection conflits
 * - Prochaine disponibilité réelle
 */
@Injectable()
export class PlanningService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcul de la disponibilité réelle d'un véhicule
   * Source de vérité unique
   */
  async getVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    // Vérifier les bookings actifs dans la période
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    });

    if (activeBookings.length > 0) {
      return false;
    }

    // Vérifier les maintenances dans la période
    const activeMaintenance = await this.prisma.maintenance.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        status: {
          in: ['PLANNED', 'IN_PROGRESS'],
        },
        OR: [
          {
            plannedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            status: 'IN_PROGRESS',
          },
        ],
      },
    });

    if (activeMaintenance.length > 0) {
      return false;
    }

    // Vérifier les événements de planning (blocages, temps de préparation)
    const blockingEvents = await this.prisma.planningEvent.findMany({
      where: {
        vehicleId,
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    });

    if (blockingEvents.length > 0) {
      return false;
    }

    // Vérifier le statut du véhicule
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.deletedAt || vehicle.status !== 'AVAILABLE') {
      return false;
    }

    return true;
  }

  /**
   * Détection de conflits
   */
  async detectConflicts(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string,
  ): Promise<Array<{ type: string; id: string; startDate: Date; endDate: Date }>> {
    const conflicts: Array<{ type: string; id: string; startDate: Date; endDate: Date }> = [];

    // Conflits avec bookings
    const bookingConflicts = await this.prisma.booking.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    });

    bookingConflicts.forEach((booking) => {
      conflicts.push({
        type: 'BOOKING',
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
      });
    });

    // Conflits avec maintenances
    const maintenanceConflicts = await this.prisma.maintenance.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        status: {
          in: ['PLANNED', 'IN_PROGRESS'],
        },
        OR: [
          {
            plannedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            status: 'IN_PROGRESS',
          },
        ],
      },
    });

    maintenanceConflicts.forEach((maintenance) => {
      if (maintenance.plannedAt) {
        const maintenanceEnd = new Date(maintenance.plannedAt);
        maintenanceEnd.setHours(maintenanceEnd.getHours() + 4); // Durée par défaut 4h

        conflicts.push({
          type: 'MAINTENANCE',
          id: maintenance.id,
          startDate: maintenance.plannedAt,
          endDate: maintenanceEnd,
        });
      }
    });

    // Conflits avec événements de planning
    const eventConflicts = await this.prisma.planningEvent.findMany({
      where: {
        vehicleId,
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    });

    eventConflicts.forEach((event) => {
      conflicts.push({
        type: event.type,
        id: event.id,
        startDate: event.startDate,
        endDate: event.endDate,
      });
    });

    return conflicts;
  }

  /**
   * Prochaine disponibilité réelle
   */
  async getNextAvailability(vehicleId: string, fromDate: Date): Promise<Date | null> {
    // Récupérer tous les événements bloquants après fromDate
    const bookings = await this.prisma.booking.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
        endDate: {
          gte: fromDate,
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    const maintenances = await this.prisma.maintenance.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        status: {
          in: ['PLANNED', 'IN_PROGRESS'],
        },
        OR: [
          {
            plannedAt: {
              gte: fromDate,
            },
          },
          {
            status: 'IN_PROGRESS',
          },
        ],
      },
      orderBy: {
        plannedAt: 'asc',
      },
    });

    const events = await this.prisma.planningEvent.findMany({
      where: {
        vehicleId,
        endDate: {
          gte: fromDate,
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    // Trouver la première période libre
    let currentDate = new Date(fromDate);
    const allBlockingEnds: Date[] = [];

    bookings.forEach((b) => allBlockingEnds.push(b.endDate));
    maintenances.forEach((m) => {
      if (m.plannedAt) {
        const end = new Date(m.plannedAt);
        end.setHours(end.getHours() + 4);
        allBlockingEnds.push(end);
      }
    });
    events.forEach((e) => allBlockingEnds.push(e.endDate));

    if (allBlockingEnds.length === 0) {
      return currentDate;
    }

    // Trier par date de fin
    allBlockingEnds.sort((a, b) => a.getTime() - b.getTime());

    // Vérifier s'il y a un gap après le premier blocage
    for (const endDate of allBlockingEnds) {
      if (endDate > currentDate) {
        // Vérifier qu'il n'y a pas de nouveau blocage qui commence juste après
        const hasImmediateConflict = await this.hasConflict(vehicleId, endDate, new Date(endDate.getTime() + 1000));
        if (!hasImmediateConflict) {
          return endDate;
        }
        currentDate = endDate;
      }
    }

    // Si pas de gap, retourner la date de fin du dernier blocage
    const lastBlockingEnd = allBlockingEnds[allBlockingEnds.length - 1];
    return lastBlockingEnd > currentDate ? lastBlockingEnd : null;
  }

  /**
   * Vérifier s'il y a un conflit à une date donnée
   */
  private async hasConflict(vehicleId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const conflicts = await this.detectConflicts(vehicleId, startDate, endDate);
    return conflicts.length > 0;
  }

  /**
   * Créer temps de préparation automatique
   * Utilise preparationTimeMinutes de l'agence (default: 60 minutes)
   * Double si retard
   */
  async createPreparationTime(
    bookingId: string,
    vehicleId: string,
    agencyId: string,
    returnDate: Date,
    isLate: boolean = false,
  ): Promise<void> {
    // Récupérer l'agence pour obtenir le temps de préparation
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    const preparationTimeMinutes = agency?.preparationTimeMinutes || 60; // Default 1h
    const finalPreparationTime = isLate ? preparationTimeMinutes * 2 : preparationTimeMinutes; // Double si retard

    const startDate = new Date(returnDate);
    const endDate = new Date(returnDate);
    endDate.setMinutes(endDate.getMinutes() + finalPreparationTime);

    // Vérifier qu'il n'y a pas de conflit
    const conflicts = await this.detectConflicts(vehicleId, startDate, endDate, bookingId);
    if (conflicts.length > 0) {
      // Ajuster la date de début pour éviter les conflits
      const nextAvailable = await this.getNextAvailability(vehicleId, returnDate);
      if (nextAvailable) {
        startDate.setTime(nextAvailable.getTime());
        endDate.setTime(nextAvailable.getTime());
        endDate.setMinutes(endDate.getMinutes() + finalPreparationTime);
      }
    }

    await this.prisma.planningEvent.create({
      data: {
        agencyId,
        vehicleId,
        bookingId,
        type: PlanningEventType.PREPARATION_TIME,
        title: `Temps de préparation${isLate ? ' (retard)' : ''}`,
        description: `Temps de préparation automatique après retour${isLate ? ' - Retard détecté' : ''}`,
        startDate,
        endDate,
        isPreparationTime: true,
        isLate,
      },
    });
  }

  /**
   * Créer événement de planning pour un booking
   */
  async createBookingEvent(
    bookingId: string,
    vehicleId: string,
    agencyId: string,
    startDate: Date,
    endDate: Date,
    clientName: string,
    vehicleInfo: string,
  ): Promise<void> {
    await this.prisma.planningEvent.create({
      data: {
        agencyId,
        vehicleId,
        bookingId,
        type: PlanningEventType.BOOKING,
        title: `${clientName} - ${vehicleInfo}`,
        description: `Réservation`,
        startDate,
        endDate,
        isPreparationTime: false,
        isLate: false,
      },
    });
  }

  /**
   * Créer événement de planning pour une maintenance
   */
  async createMaintenanceEvent(
    maintenanceId: string,
    vehicleId: string,
    agencyId: string,
    startDate: Date,
    endDate: Date,
    description: string,
  ): Promise<void> {
    await this.prisma.planningEvent.create({
      data: {
        agencyId,
        vehicleId,
        maintenanceId,
        type: PlanningEventType.MAINTENANCE,
        title: `Maintenance: ${description}`,
        description,
        startDate,
        endDate,
        isPreparationTime: false,
        isLate: false,
      },
    });
  }

  /**
   * Supprimer événement de planning
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.prisma.planningEvent.delete({
      where: { id: eventId },
    });
  }

  /**
   * Supprimer événements liés à un booking
   */
  async deleteBookingEvents(bookingId: string): Promise<void> {
    await this.prisma.planningEvent.deleteMany({
      where: { bookingId },
    });
  }

  /**
   * Supprimer événements liés à une maintenance
   */
  async deleteMaintenanceEvents(maintenanceId: string): Promise<void> {
    await this.prisma.planningEvent.deleteMany({
      where: { maintenanceId },
    });
  }
}
