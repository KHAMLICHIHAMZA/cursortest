import { Test, TestingModule } from '@nestjs/testing';
import { JournalService } from './journal.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('JournalService', () => {
  let service: JournalService;
  let prismaService: any;

  const mockPrismaService = {
    journalEntry: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<JournalService>(JournalService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('appendEntry', () => {
    it('should create a journal entry from domain event', async () => {
      mockPrismaService.journalEntry.create.mockResolvedValue({
        id: 'entry-1',
        type: 'BOOKING_CREATED',
        title: 'Test Entry',
        isManualNote: false,
      });

      const result = await service.appendEntry({
        agencyId: 'agency-1',
        companyId: 'company-1',
        type: 'BOOKING_CREATED',
        title: 'Réservation créée',
        content: 'Nouvelle réservation RES-001',
        bookingNumber: 'RES-001',
      });

      expect(result.type).toBe('BOOKING_CREATED');
      expect(result.isManualNote).toBe(false);
    });
  });

  describe('createManualNote', () => {
    it('should create manual note for AGENCY_MANAGER', async () => {
      mockPrismaService.journalEntry.create.mockResolvedValue({
        id: 'note-1',
        type: 'MANUAL_NOTE',
        title: 'Note importante',
        isManualNote: true,
      });

      const result = await service.createManualNote(
        {
          agencyId: 'agency-1',
          title: 'Note importante',
          content: 'Détails de la note',
        },
        'user-1',
        Role.AGENCY_MANAGER,
        'company-1',
      );

      expect(result.type).toBe('MANUAL_NOTE');
      expect(result.isManualNote).toBe(true);
    });

    it('should reject manual note for AGENT role', async () => {
      await expect(
        service.createManualNote(
          {
            agencyId: 'agency-1',
            title: 'Note',
            content: 'Content',
          },
          'user-1',
          Role.AGENT,
          'company-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow manual note for SUPER_ADMIN', async () => {
      mockPrismaService.journalEntry.create.mockResolvedValue({
        id: 'note-1',
        type: 'MANUAL_NOTE',
        isManualNote: true,
      });

      const result = await service.createManualNote(
        {
          agencyId: 'agency-1',
          title: 'Admin Note',
          content: 'Content',
        },
        'user-1',
        Role.SUPER_ADMIN,
        'company-1',
      );

      expect(result.isManualNote).toBe(true);
    });
  });

  describe('updateManualNote', () => {
    const mockNote = {
      id: 'note-1',
      type: 'MANUAL_NOTE',
      title: 'Original Title',
      content: 'Original Content',
      isManualNote: true,
      agencyId: 'agency-1',
      companyId: 'company-1',
    };

    it('should update manual note for manager', async () => {
      mockPrismaService.journalEntry.findUnique.mockResolvedValue(mockNote);
      mockPrismaService.journalEntry.update.mockResolvedValue({
        ...mockNote,
        title: 'Updated Title',
        editedAt: new Date(),
        editedBy: 'user-1',
      });

      const result = await service.updateManualNote(
        'note-1',
        { title: 'Updated Title' },
        'user-1',
        Role.AGENCY_MANAGER,
      );

      expect(result.title).toBe('Updated Title');
      expect(result.editedBy).toBe('user-1');
    });

    it('should reject update for AGENT role', async () => {
      await expect(
        service.updateManualNote(
          'note-1',
          { title: 'New' },
          'user-1',
          Role.AGENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject update for non-manual note', async () => {
      mockPrismaService.journalEntry.findUnique.mockResolvedValue({
        ...mockNote,
        type: 'BOOKING_CREATED',
        isManualNote: false,
      });

      await expect(
        service.updateManualNote(
          'note-1',
          { title: 'New' },
          'user-1',
          Role.AGENCY_MANAGER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteManualNote', () => {
    const mockNote = {
      id: 'note-1',
      type: 'MANUAL_NOTE',
      title: 'To Delete',
      isManualNote: true,
      agencyId: 'agency-1',
      companyId: 'company-1',
    };

    it('should delete manual note for manager', async () => {
      mockPrismaService.journalEntry.findUnique.mockResolvedValue(mockNote);
      mockPrismaService.journalEntry.delete.mockResolvedValue(mockNote);

      await service.deleteManualNote('note-1', 'user-1', Role.AGENCY_MANAGER);

      expect(mockPrismaService.journalEntry.delete).toHaveBeenCalledWith({
        where: { id: 'note-1' },
      });
    });

    it('should reject delete for AGENT role', async () => {
      await expect(
        service.deleteManualNote('note-1', 'user-1', Role.AGENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject delete for non-manual note', async () => {
      mockPrismaService.journalEntry.findUnique.mockResolvedValue({
        ...mockNote,
        isManualNote: false,
      });

      await expect(
        service.deleteManualNote('note-1', 'user-1', Role.AGENCY_MANAGER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should filter by type', async () => {
      mockPrismaService.journalEntry.findMany.mockResolvedValue([
        { id: 'e1', type: 'CHECK_IN' },
        { id: 'e2', type: 'CHECK_IN' },
      ]);

      const result = await service.findAll({
        agencyId: 'agency-1',
        type: 'CHECK_IN',
      });

      expect(mockPrismaService.journalEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'CHECK_IN' }),
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      mockPrismaService.journalEntry.findMany.mockResolvedValue([]);

      const dateFrom = new Date('2026-01-01');
      const dateTo = new Date('2026-01-31');

      await service.findAll({
        agencyId: 'agency-1',
        dateFrom,
        dateTo,
      });

      expect(mockPrismaService.journalEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: dateFrom, lte: dateTo },
          }),
        }),
      );
    });

    it('should filter by bookingNumber with case insensitive search', async () => {
      mockPrismaService.journalEntry.findMany.mockResolvedValue([]);

      await service.findAll({
        agencyId: 'agency-1',
        bookingNumber: 'RES-001',
      });

      expect(mockPrismaService.journalEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bookingNumber: { contains: 'RES-001', mode: 'insensitive' },
          }),
        }),
      );
    });
  });
});
