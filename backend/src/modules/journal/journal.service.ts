import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

// Journal Entry Types (mirroring Prisma enum)
const JournalEntryType = {
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_UPDATED: 'BOOKING_UPDATED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',
  INVOICE_ISSUED: 'INVOICE_ISSUED',
  CREDIT_NOTE_ISSUED: 'CREDIT_NOTE_ISSUED',
  CONTRACT_CREATED: 'CONTRACT_CREATED',
  CONTRACT_SIGNED: 'CONTRACT_SIGNED',
  INCIDENT_REPORTED: 'INCIDENT_REPORTED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  GPS_SNAPSHOT: 'GPS_SNAPSHOT',
  MANUAL_NOTE: 'MANUAL_NOTE',
  SYSTEM_EVENT: 'SYSTEM_EVENT',
} as const;

type JournalEntryTypeValue = (typeof JournalEntryType)[keyof typeof JournalEntryType];

export interface CreateJournalEntryDto {
  agencyId: string;
  companyId: string;
  type: JournalEntryTypeValue;
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
}

export interface CreateManualNoteDto {
  agencyId: string;
  title: string;
  content: string;
  bookingId?: string;
  bookingNumber?: string;
  vehicleId?: string;
}

export interface UpdateManualNoteDto {
  title?: string;
  content?: string;
}

export interface JournalFilters {
  agencyId?: string;
  companyId?: string;
  type?: JournalEntryTypeValue;
  bookingId?: string;
  bookingNumber?: string;
  vehicleId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isManualNote?: boolean;
}

// Roles allowed to manage manual notes
const MANUAL_NOTE_ROLES: string[] = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER'];

@Injectable()
export class JournalService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * V2: Append a journal entry (from domain events)
   * Journal entries are immutable once created (except manual notes)
   */
  async appendEntry(dto: CreateJournalEntryDto): Promise<any> {
    const entry = await (this.prisma as any).journalEntry.create({
      data: {
        agencyId: dto.agencyId,
        companyId: dto.companyId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        bookingId: dto.bookingId || null,
        bookingNumber: dto.bookingNumber || null,
        vehicleId: dto.vehicleId || null,
        userId: dto.userId || null,
        contractId: dto.contractId || null,
        invoiceId: dto.invoiceId || null,
        incidentId: dto.incidentId || null,
        metadata: dto.metadata || null,
        isManualNote: false,
      },
    });

    return entry;
  }

  /**
   * V2: Create a manual note (managers only)
   */
  async createManualNote(
    dto: CreateManualNoteDto,
    userId: string,
    userRole: string,
    companyId: string,
  ): Promise<any> {
    // Check permissions
    if (!MANUAL_NOTE_ROLES.includes(userRole)) {
      throw new ForbiddenException(
        'Seuls les managers peuvent créer des notes manuelles',
      );
    }

    const entry = await (this.prisma as any).journalEntry.create({
      data: {
        agencyId: dto.agencyId,
        companyId,
        type: JournalEntryType.MANUAL_NOTE,
        title: dto.title,
        content: dto.content,
        bookingId: dto.bookingId || null,
        bookingNumber: dto.bookingNumber || null,
        vehicleId: dto.vehicleId || null,
        userId,
        isManualNote: true,
      },
    });

    // Audit log
    await this.auditService.log({
      userId,
      companyId,
      agencyId: dto.agencyId,
      action: AuditAction.CREATE,
      entityType: 'JournalEntry',
      entityId: entry.id,
      description: `Note manuelle créée: ${dto.title}`,
      metadata: {
        title: dto.title,
        bookingId: dto.bookingId,
        bookingNumber: dto.bookingNumber,
      },
    });

    return entry;
  }

  /**
   * V2: Update a manual note (managers only)
   */
  async updateManualNote(
    entryId: string,
    dto: UpdateManualNoteDto,
    userId: string,
    userRole: string,
  ): Promise<any> {
    // Check permissions
    if (!MANUAL_NOTE_ROLES.includes(userRole)) {
      throw new ForbiddenException(
        'Seuls les managers peuvent modifier des notes manuelles',
      );
    }

    const entry = await (this.prisma as any).journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Note non trouvée');
    }

    if (!entry.isManualNote) {
      throw new BadRequestException(
        'Seules les notes manuelles peuvent être modifiées',
      );
    }

    const updatedEntry = await (this.prisma as any).journalEntry.update({
      where: { id: entryId },
      data: {
        title: dto.title !== undefined ? dto.title : entry.title,
        content: dto.content !== undefined ? dto.content : entry.content,
        editedAt: new Date(),
        editedBy: userId,
      },
    });

    // Audit log
    await this.auditService.log({
      userId,
      companyId: entry.companyId,
      agencyId: entry.agencyId,
      action: AuditAction.UPDATE,
      entityType: 'JournalEntry',
      entityId: entryId,
      description: `Note manuelle modifiée: ${updatedEntry.title}`,
      metadata: {
        before: { title: entry.title, content: entry.content },
        after: { title: dto.title, content: dto.content },
      },
    });

    return updatedEntry;
  }

  /**
   * V2: Delete a manual note (managers only)
   */
  async deleteManualNote(
    entryId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    // Check permissions
    if (!MANUAL_NOTE_ROLES.includes(userRole)) {
      throw new ForbiddenException(
        'Seuls les managers peuvent supprimer des notes manuelles',
      );
    }

    const entry = await (this.prisma as any).journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Note non trouvée');
    }

    if (!entry.isManualNote) {
      throw new BadRequestException(
        'Seules les notes manuelles peuvent être supprimées',
      );
    }

    await (this.prisma as any).journalEntry.delete({
      where: { id: entryId },
    });

    // Audit log
    await this.auditService.log({
      userId,
      companyId: entry.companyId,
      agencyId: entry.agencyId,
      action: AuditAction.DELETE,
      entityType: 'JournalEntry',
      entityId: entryId,
      description: `Note manuelle supprimée: ${entry.title}`,
      metadata: {
        title: entry.title,
        content: entry.content,
      },
    });
  }

  /**
   * V2: Get journal entries with filters
   */
  async findAll(filters: JournalFilters): Promise<any[]> {
    const where: any = {};

    if (filters.agencyId) where.agencyId = filters.agencyId;
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.type) where.type = filters.type;
    if (filters.bookingId) where.bookingId = filters.bookingId;
    if (filters.bookingNumber) where.bookingNumber = { contains: filters.bookingNumber, mode: 'insensitive' };
    if (filters.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.isManualNote !== undefined) where.isManualNote = filters.isManualNote;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return (this.prisma as any).journalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit results
    });
  }

  /**
   * V2: Get a single journal entry
   */
  async findOne(id: string): Promise<any> {
    const entry = await (this.prisma as any).journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Entrée de journal non trouvée');
    }

    return entry;
  }
}
