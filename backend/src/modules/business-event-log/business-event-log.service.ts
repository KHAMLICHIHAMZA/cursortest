import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BusinessEventType } from '@prisma/client';

/**
 * Service for logging business events (functional logs)
 * 
 * This service provides append-only logging of business events.
 * Logs are never editable and are used for audit and analytics purposes.
 * 
 * Performance: Logging is designed to be non-blocking. Consider async processing
 * for high-volume scenarios in production.
 */
@Injectable()
export class BusinessEventLogService {
  private readonly logger = new Logger(BusinessEventLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log a business event
   * 
   * @param agencyId - The agency ID (optional for company-level events)
   * @param companyId - The company ID (optional for super-admin level events)
   * @param entityType - Type of entity (e.g., "Booking", "Vehicle", "Company", "Agency", "User")
   * @param entityId - ID of the entity
   * @param eventType - Type of event
   * @param previousState - State before the event (optional, for updates)
   * @param newState - State after the event
   * @param triggeredByUserId - User ID who triggered the event
   */
  async logEvent(
    agencyId: string | null,
    entityType: string,
    entityId: string,
    eventType: BusinessEventType,
    previousState: any | null,
    newState: any,
    triggeredByUserId?: string,
    companyId?: string | null,
  ): Promise<void> {
    try {
      await this.prisma.businessEventLog.create({
        data: {
          agencyId: agencyId || null,
          companyId: companyId || null,
          entityType,
          entityId,
          eventType,
          previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : null,
          newState: JSON.parse(JSON.stringify(newState)),
          triggeredByUserId: triggeredByUserId || null,
        },
      });
    } catch (error) {
      // Log error but don't throw - business event logging should not break core operations
      this.logger.error(
        `Failed to log business event: ${eventType} for ${entityType}:${entityId}`,
        error,
      );
    }
  }

  /**
   * Query business events by agency and date range
   * 
   * @param agencyId - Agency ID
   * @param startDate - Start date (optional)
   * @param endDate - End date (optional)
   * @param entityType - Filter by entity type (optional)
   * @param eventType - Filter by event type (optional)
   */
  async findEvents(
    agencyId: string,
    startDate?: Date,
    endDate?: Date,
    entityType?: string,
    eventType?: BusinessEventType,
  ) {
    const where: any = { agencyId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    return this.prisma.businessEventLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to prevent excessive data retrieval
    });
  }

  /**
   * Get events for a specific entity
   * 
   * @param agencyId - Agency ID
   * @param entityType - Entity type
   * @param entityId - Entity ID
   */
  async getEntityEvents(agencyId: string, entityType: string, entityId: string) {
    return this.prisma.businessEventLog.findMany({
      where: {
        agencyId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}


