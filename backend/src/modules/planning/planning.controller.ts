import { Controller, Get, Post, Body, Query, UseGuards, Param, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlanningService } from './planning.service';
import { GetPlanningDto } from './dto/get-planning.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreatePreparationTimeDto } from './dto/create-preparation-time.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Planning')
@Controller('planning')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get()
  @ApiOperation({ summary: 'Get planning data' })
  async getPlanning(@Query() query: GetPlanningDto, @CurrentUser() user: any) {
    const start = query.start ? new Date(query.start) : new Date();
    const end = query.end ? new Date(query.end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Déterminer les agences accessibles
    let accessibleAgencyIds: string[] = [];

    if (user.role === 'SUPER_ADMIN') {
      if (query.agencyId) {
        accessibleAgencyIds = [query.agencyId];
      } else {
        const allAgencies = await this.planningService['prisma'].agency.findMany({
          where: { deletedAt: null },
          select: { id: true },
        });
        accessibleAgencyIds = allAgencies.map((a) => a.id);
      }
    } else if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      const where: any = { companyId: user.companyId, deletedAt: null };
      if (query.agencyId) {
        where.id = query.agencyId;
      }
      const agencies = await this.planningService['prisma'].agency.findMany({
        where,
        select: { id: true },
      });
      accessibleAgencyIds = agencies.map((a) => a.id);
    } else if (user.agencyIds && user.agencyIds.length > 0) {
      if (query.agencyId && user.agencyIds.includes(query.agencyId)) {
        accessibleAgencyIds = [query.agencyId];
      } else if (!query.agencyId) {
        accessibleAgencyIds = user.agencyIds;
      }
    }

    if (accessibleAgencyIds.length === 0) {
      return { resources: [], events: [] };
    }

    // Récupérer les véhicules (ressources pour le planning)
    const vehicles = await this.planningService['prisma'].vehicle.findMany({
      where: {
        agencyId: { in: accessibleAgencyIds },
        deletedAt: null,
      },
      include: {
        agency: {
          include: {
            company: true,
          },
        },
      },
      orderBy: [
        { agency: { name: 'asc' } },
        { brand: 'asc' },
        { model: 'asc' },
      ],
    });

    const normalizePlate = (plate?: string) =>
      (plate || '').replace(/[\s-]/g, '').toUpperCase();

    const vehicleKeyToCanonical = new Map<string, typeof vehicles[number]>();
    const vehicleIdToCanonicalId = new Map<string, string>();

    vehicles.forEach((vehicle) => {
      const normalizedPlate = normalizePlate(vehicle.registrationNumber);
      const key = `${vehicle.agencyId}:${normalizedPlate || vehicle.id}`;
      const existing = vehicleKeyToCanonical.get(key);
      if (!existing) {
        vehicleKeyToCanonical.set(key, vehicle);
        return;
      }
      if (vehicle.updatedAt > existing.updatedAt) {
        vehicleKeyToCanonical.set(key, vehicle);
      }
    });

    vehicles.forEach((vehicle) => {
      const normalizedPlate = normalizePlate(vehicle.registrationNumber);
      const key = `${vehicle.agencyId}:${normalizedPlate || vehicle.id}`;
      const canonical = vehicleKeyToCanonical.get(key);
      if (canonical) {
        vehicleIdToCanonicalId.set(vehicle.id, canonical.id);
      }
    });

    const dedupedVehicles = Array.from(vehicleKeyToCanonical.values());

    // Récupérer les bookings dans la période
    const bookings = await this.planningService['prisma'].booking.findMany({
      where: {
        agencyId: { in: accessibleAgencyIds },
        deletedAt: null,
        OR: [
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } },
            ],
          },
        ],
        // Inclure tous les statuts sauf CANCELLED pour voir l'historique
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        client: true,
        vehicle: true,
      },
    });

    // Récupérer les maintenances dans la période
    // Inclure toutes les maintenances PLANNED ou IN_PROGRESS, même sans plannedAt
    const maintenances = await this.planningService['prisma'].maintenance.findMany({
      where: {
        agencyId: { in: accessibleAgencyIds },
        deletedAt: null,
        status: {
          in: ['PLANNED', 'IN_PROGRESS'],
        },
        OR: [
          {
            plannedAt: {
              gte: start,
              lte: end,
            },
          },
          {
            plannedAt: null,
          },
          {
            status: 'IN_PROGRESS',
          },
        ],
      },
      include: {
        vehicle: true,
      },
    });

    // Récupérer les événements de planning
    const planningEvents = await this.planningService['prisma'].planningEvent.findMany({
      where: {
        agencyId: { in: accessibleAgencyIds },
        OR: [
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } },
            ],
          },
        ],
      },
      include: {
        vehicle: true,
      },
    });

    // Formater les ressources (véhicules)
    const resources = dedupedVehicles.map((vehicle) => ({
      id: vehicle.id,
      title: `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})`,
      extendedProps: {
        agencyId: vehicle.agencyId,
        agencyName: vehicle.agency.company.name,
        brand: vehicle.brand,
        model: vehicle.model,
        registrationNumber: vehicle.registrationNumber,
        status: vehicle.status,
      },
    }));

    // Formater les événements
    const events: any[] = [];

    const normalizeEventType = (value: unknown): string => {
      const raw = typeof value === 'string' ? value : '';
      const normalized = raw.trim().toUpperCase();
      return normalized || 'OTHER';
    };

    const normalizeToKnownType = (value: unknown): 'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER' => {
      const normalized = normalizeEventType(value);
      if (normalized === 'BOOKING') return 'BOOKING';
      if (normalized === 'MAINTENANCE') return 'MAINTENANCE';
      if (normalized === 'PREPARATION_TIME') return 'PREPARATION_TIME';
      return 'OTHER';
    };

    const typeToColor: Record<'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER', string> = {
      BOOKING: '#2563EB',
      MAINTENANCE: '#EF4444',
      PREPARATION_TIME: '#10B981',
      OTHER: '#6B7280',
    };

    // Bookings
    bookings.forEach((booking) => {
      const bookingColor = typeToColor.BOOKING;
      const bookingNumber = (booking as any).bookingNumber || booking.id.slice(-6).toUpperCase();

      events.push({
        id: `booking-${booking.id}`,
        resourceId: vehicleIdToCanonicalId.get(booking.vehicleId) || booking.vehicleId,
        title: `#${bookingNumber} ${booking.client.name} - ${booking.vehicle.brand} ${booking.vehicle.model}`,
        start: booking.startDate.toISOString(),
        end: booking.endDate.toISOString(),
        backgroundColor: bookingColor,
        borderColor: bookingColor,
        extendedProps: {
          type: 'BOOKING',
          bookingId: booking.id,
          bookingNumber,
          clientName: booking.client.name,
          status: booking.status,
          totalPrice: booking.totalPrice,
        },
      });
    });

    // Maintenances
    maintenances.forEach((maintenance) => {
      // Utiliser plannedAt si disponible, sinon utiliser createdAt ou une date par défaut
      const maintenanceStart = maintenance.plannedAt 
        ? new Date(maintenance.plannedAt)
        : maintenance.status === 'IN_PROGRESS'
        ? new Date(maintenance.createdAt)
        : new Date(start); // Si PLANNED sans date, utiliser le début de la période demandée
      
      // Vérifier que la maintenance est dans la période demandée ou en cours
      const maintenanceEnd = new Date(maintenanceStart);
      maintenanceEnd.setHours(maintenanceEnd.getHours() + 4); // Durée par défaut 4h

      // Ne pas afficher si la maintenance est terminée et en dehors de la période
      if (maintenance.status === 'COMPLETED' || maintenance.status === 'CANCELLED') {
        return;
      }

      // Vérifier que la maintenance chevauche la période demandée
      if (maintenanceEnd < start || maintenanceStart > end) {
        // Si IN_PROGRESS, afficher quand même même si en dehors de la période
        if (maintenance.status !== 'IN_PROGRESS') {
          return;
        }
      }

      events.push({
        id: `maintenance-${maintenance.id}`,
        resourceId: vehicleIdToCanonicalId.get(maintenance.vehicleId) || maintenance.vehicleId,
        title: `Maintenance: ${maintenance.description}`,
        start: maintenanceStart.toISOString(),
        end: maintenanceEnd.toISOString(),
        backgroundColor: typeToColor.MAINTENANCE,
        borderColor: typeToColor.MAINTENANCE,
        extendedProps: {
          type: 'MAINTENANCE',
          maintenanceId: maintenance.id,
          description: maintenance.description,
          status: maintenance.status,
          cost: maintenance.cost,
          vehicleId: maintenance.vehicleId,
        },
      });
    });

    // Événements de planning (temps de préparation, blocages)
    planningEvents.forEach((event) => {
      const normalizedType = normalizeToKnownType(event.type);
      if (normalizedType === 'BOOKING' || normalizedType === 'MAINTENANCE') {
        return;
      }
      const color = typeToColor[normalizedType];

      // `vehicleId` can be null depending on event type / legacy data
      const resourceId = event.vehicleId
        ? vehicleIdToCanonicalId.get(event.vehicleId) || event.vehicleId
        : '__NO_VEHICLE__';

      events.push({
        id: `event-${event.id}`,
        resourceId,
        title: event.title,
        start: event.startDate.toISOString(),
        end: event.endDate.toISOString(),
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          type: normalizedType,
          eventId: event.id,
          description: event.description,
          isPreparationTime: event.isPreparationTime,
          isLate: event.isLate,
        },
      });
    });

    return {
      resources,
      events,
    };
  }

  @Post('check-availability')
  @ApiOperation({ summary: 'Check vehicle availability' })
  async checkAvailability(@Body() dto: CheckAvailabilityDto, @CurrentUser() user: any) {
    // Verify the user can access this vehicle's agency
    await this.assertVehicleAccess(dto.vehicleId, user);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const isAvailable = await this.planningService.getVehicleAvailability(
      dto.vehicleId,
      startDate,
      endDate,
    );

    const conflicts = await this.planningService.detectConflicts(
      dto.vehicleId,
      startDate,
      endDate,
    );

    return {
      available: isAvailable,
      conflicts,
    };
  }

  @Get('next-availability/:vehicleId')
  @ApiOperation({ summary: 'Get next availability for a vehicle' })
  async getNextAvailability(
    @Param('vehicleId') vehicleId: string,
    @Query('from') from?: string,
    @CurrentUser() user?: any,
  ) {
    if (user) {
      await this.assertVehicleAccess(vehicleId, user);
    }

    const fromDate = from ? new Date(from) : new Date();
    const nextAvailable = await this.planningService.getNextAvailability(vehicleId, fromDate);

    return {
      nextAvailable: nextAvailable ? nextAvailable.toISOString() : null,
    };
  }

  @Post('preparation-time')
  @ApiOperation({ summary: 'Create preparation time event' })
  async createPreparationTime(@Body() dto: CreatePreparationTimeDto, @CurrentUser() user: any) {
    // Verify agency access
    await this.assertAgencyAccess(dto.agencyId, user);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    await this.planningService.createPreparationTime(
      dto.bookingId,
      dto.vehicleId,
      dto.agencyId,
      startDate,
      dto.isLate || false,
    );

    return { success: true };
  }

  /**
   * Verify user has access to the vehicle's agency.
   */
  private async assertVehicleAccess(vehicleId: string, user: any): Promise<void> {
    if (user.role === 'SUPER_ADMIN') return;
    const vehicle = await this.planningService['prisma'].vehicle.findUnique({
      where: { id: vehicleId },
      select: { agencyId: true, agency: { select: { companyId: true } } },
    });
    if (!vehicle) return;
    if (user.role === 'COMPANY_ADMIN') {
      if (vehicle.agency?.companyId !== user.companyId) {
        throw new ForbiddenException('Accès refusé à ce véhicule');
      }
      return;
    }
    if (!user.agencyIds?.includes(vehicle.agencyId)) {
      throw new ForbiddenException('Accès refusé à ce véhicule');
    }
  }

  /**
   * Verify user has access to the agency.
   */
  private async assertAgencyAccess(agencyId: string, user: any): Promise<void> {
    if (!agencyId || user.role === 'SUPER_ADMIN') return;
    if (user.role === 'COMPANY_ADMIN') {
      const agency = await this.planningService['prisma'].agency.findUnique({
        where: { id: agencyId },
        select: { companyId: true },
      });
      if (!agency || agency.companyId !== user.companyId) {
        throw new ForbiddenException('Accès refusé à cette agence');
      }
      return;
    }
    if (!user.agencyIds?.includes(agencyId)) {
      throw new ForbiddenException('Accès refusé à cette agence');
    }
  }
}
