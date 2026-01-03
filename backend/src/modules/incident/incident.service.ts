import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../audit/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { IncidentType, IncidentStatus, AuditAction, BusinessEventType } from '@prisma/client';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

@Injectable()
export class IncidentService {
  constructor(
    private prisma: PrismaService,
    private permissionService: PermissionService,
    private auditService: AuditService,
    private businessEventLogService: BusinessEventLogService,
  ) {}

  /**
   * Créer un incident (dommage ou amende)
   * Si dommage avec montant élevé → statut DISPUTED automatique
   */
  async create(createIncidentDto: CreateIncidentDto, userId: string) {
    const { agencyId, bookingId, type, title, description, amount } = createIncidentDto;

    const hasAccess = await this.permissionService.checkAgencyAccess(agencyId, { id: userId });
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }

    // Récupérer le booking si fourni pour vérifier la caution
    let booking = null;
    if (bookingId) {
      booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: true,
          client: true,
        },
      });

      if (!booking || booking.agencyId !== agencyId) {
        throw new BadRequestException('Booking not found or does not belong to this agency');
      }
    }

    let status: IncidentStatus = IncidentStatus.REPORTED;

    // ============================================
    // GESTION DOMMAGES & LITIGES (R5)
    // ============================================
    // Si dommage avec montant élevé → DISPUTED automatique
    if (type === IncidentType.DAMAGE && amount && booking) {
      const damageThreshold = (booking.vehicle?.depositAmount || 0) * 0.5; // 50% de la caution
      if (amount > damageThreshold) {
        status = IncidentStatus.DISPUTED as IncidentStatus;

        // Bloquer la clôture financière
        await this.prisma.booking.update({
          where: { id: bookingId! },
          data: {
            depositStatusFinal: 'DISPUTED',
            financialClosureBlocked: true,
            financialClosureBlockedReason: 'Dommage en litige nécessitant expertise externe',
          },
        });

        // Logger l'audit
        await this.auditService.log({
          userId,
          agencyId,
          action: AuditAction.BOOKING_STATUS_CHANGE,
          entityType: 'Booking',
          entityId: bookingId!,
          description: `Incident DISPUTED créé: dommage de ${amount} MAD (seuil: ${damageThreshold} MAD). Clôture financière bloquée.`,
        });
      }
    }

    const incident = await this.prisma.incident.create({
      data: {
        agencyId,
        bookingId: bookingId || null,
        vehicleId: booking?.vehicleId || createIncidentDto.vehicleId || null,
        clientId: booking?.clientId || createIncidentDto.clientId || null,
        type,
        status,
        title,
        description,
        amount: amount ? parseFloat(amount.toString()) : null,
      },
      include: {
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    // Log business event
    this.businessEventLogService
      .logEvent(
        agencyId,
        'Incident',
        incident.id,
        BusinessEventType.FINE_CREATED, // Utiliser FINE_CREATED pour l'instant (à ajouter INCIDENT_CREATED si nécessaire)
        null,
        incident,
        userId,
      )
      .catch(() => {
        // Error already logged
      });

    return incident;
  }

  /**
   * Récupérer tous les incidents d'une agence
   */
  async findAll(agencyId: string, bookingId?: string, user?: any): Promise<any[]> {
    const where: any = { agencyId };
    if (bookingId) {
      where.bookingId = bookingId;
    }

    const incidents = await this.prisma.incident.findMany({
      where,
      include: {
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
        vehicle: true,
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return incidents;
  }

  /**
   * Récupérer un incident par ID
   */
  async findOne(id: string, user: any): Promise<any> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
        vehicle: true,
        client: true,
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    // Vérifier les permissions avec PermissionService
    // Note: findOne reçoit user, pas userId, donc on utilise user directement
    const hasAccess = await this.permissionService.checkAgencyAccess(incident.agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this incident');
    }

    return incident;
  }

  /**
   * Mettre à jour le statut d'un incident
   * Si passage à DISPUTED → bloquer clôture financière
   */
  async updateStatus(id: string, updateDto: UpdateIncidentStatusDto, userId: string) {
    const { status: newStatus, justification } = updateDto;
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        booking: true,
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const hasAccess = await this.permissionService.checkAgencyAccess(incident.agencyId, { id: userId });
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }

    // Si passage à DISPUTED → bloquer clôture financière
    if (newStatus === IncidentStatus.DISPUTED && incident.bookingId) {
      await this.prisma.booking.update({
        where: { id: incident.bookingId },
        data: {
          depositStatusFinal: 'DISPUTED',
          financialClosureBlocked: true,
          financialClosureBlockedReason: justification || 'Incident en litige nécessitant expertise externe',
        },
      });

      await this.auditService.log({
        userId,
        agencyId: incident.agencyId,
        action: AuditAction.BOOKING_STATUS_CHANGE,
        entityType: 'Booking',
        entityId: incident.bookingId,
        description: `Incident ${incident.id} mis en statut DISPUTED. Clôture financière bloquée.${justification ? ` Justification: ${justification}` : ''}`,
      });
    }

    // Si résolution du DISPUTED → débloquer clôture financière
    if (incident.status === IncidentStatus.DISPUTED && newStatus !== IncidentStatus.DISPUTED && incident.bookingId) {
      await this.prisma.booking.update({
        where: { id: incident.bookingId },
        data: {
          financialClosureBlocked: false,
          financialClosureBlockedReason: null,
        },
      });
    }

    const updatedIncident = await this.prisma.incident.update({
      where: { id },
      data: {
        status: newStatus,
        resolvedAt: newStatus === IncidentStatus.RESOLVED ? new Date() : null,
        resolvedBy: newStatus === IncidentStatus.RESOLVED ? userId : null,
      },
    });

    return updatedIncident;
  }
}

