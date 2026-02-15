import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService, InvoicePayload } from './invoice.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PermissionService } from '../../common/services/permission.service';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../../common/services/outbox.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, InvoiceType } from '@prisma/client';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let prismaService: PrismaService;
  let outboxService: OutboxService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    invoiceNumberSequence: {
      upsert: jest.fn(),
    },
  };

  const mockPermissionService = {
    checkAgencyAccess: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockOutboxService = {
    enqueue: jest.fn(),
  };

  const mockBusinessEventLogService = {
    logEvent: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: OutboxService, useValue: mockOutboxService },
        { provide: BusinessEventLogService, useValue: mockBusinessEventLogService },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    prismaService = module.get<PrismaService>(PrismaService);
    outboxService = module.get<OutboxService>(OutboxService);

    jest.clearAllMocks();
  });

  describe('generateInvoice', () => {
    const mockBooking = {
      id: 'booking-1',
      bookingNumber: 'RES-2026-001',
      agencyId: 'agency-1',
      companyId: 'company-1',
      totalPrice: 1000,
      lateFeeAmount: null,
      depositRequired: true,
      depositAmount: 500,
      depositStatusFinal: 'REFUNDED',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-05'),
      agency: {
        id: 'agency-1',
        name: 'Test Agency',
        companyId: 'company-1',
        company: {
          id: 'company-1',
          name: 'Test Company',
          raisonSociale: 'Test SARL',
          identifiantLegal: 'ICE123456',
          formeJuridique: 'SARL',
          address: '123 Test St',
          currency: 'MAD',
        },
      },
      vehicle: {
        id: 'vehicle-1',
        brand: 'Toyota',
        model: 'Corolla',
        registrationNumber: '123-A-45',
      },
      client: {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+212600000000',
      },
      incidents: [],
    };

    it('should generate an invoice with correct invoice number', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);
      mockPrismaService.invoiceNumberSequence.upsert.mockResolvedValue({ lastValue: 1 });
      mockPrismaService.invoice.create.mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'FAC-2026-000001',
        type: InvoiceType.INVOICE,
        totalAmount: 1000,
        status: InvoiceStatus.ISSUED,
      });

      const result = await service.generateInvoice('booking-1', 'user-1');

      expect(result.invoiceNumber).toBe('FAC-2026-000001');
      expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'InvoiceIssued',
        }),
      );
    });

    it('should reject invoice generation if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.generateInvoice('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject if invoice already exists for booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        id: 'existing-invoice',
        invoiceNumber: 'FAC-2026-000001',
      });

      await expect(service.generateInvoice('booking-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if there are disputed incidents', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        incidents: [{ id: 'incident-1', status: 'DISPUTED' }],
      });
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(service.generateInvoice('booking-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if deposit is disputed', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        depositStatusFinal: 'DISPUTED',
      });
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(service.generateInvoice('booking-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include late fees in total amount', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        lateFeeAmount: 200,
      });
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);
      mockPrismaService.invoiceNumberSequence.upsert.mockResolvedValue({ lastValue: 2 });
      mockPrismaService.invoice.create.mockImplementation((args) => ({
        id: 'invoice-2',
        ...args.data,
      }));

      await service.generateInvoice('booking-1', 'user-1');

      expect(mockPrismaService.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 1200, // 1000 + 200
          }),
        }),
      );
    });
  });

  describe('generateCreditNote', () => {
    const mockInvoice = {
      id: 'invoice-1',
      invoiceNumber: 'FAC-2026-000001',
      type: InvoiceType.INVOICE,
      status: InvoiceStatus.ISSUED,
      companyId: 'company-1',
      agencyId: 'agency-1',
      bookingId: 'booking-1',
      totalAmount: 1000,
      payload: {
        version: 1,
        issuedAt: '2026-01-05T10:00:00Z',
        timezone: 'Africa/Casablanca',
        amounts: { subtotal: 1000, lateFees: 0, total: 1000, currency: 'MAD' },
        company: {},
        agency: {},
        client: {},
        vehicle: {},
        booking: {},
      },
    };

    it('should create credit note with negative amount', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.invoiceNumberSequence.upsert.mockResolvedValue({ lastValue: 3 });
      mockPrismaService.invoice.create.mockImplementation((args) => ({
        id: 'credit-note-1',
        ...args.data,
      }));

      const result = await service.generateCreditNote('invoice-1', 'user-1', 'Client dissatisfaction');

      expect(mockPrismaService.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: InvoiceType.CREDIT_NOTE,
            totalAmount: -1000,
            originalInvoiceId: 'invoice-1',
          }),
        }),
      );
      expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CreditNoteIssued',
        }),
      );
    });

    it('should reject credit note for non-invoice document', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        type: InvoiceType.CREDIT_NOTE,
      });

      await expect(
        service.generateCreditNote('invoice-1', 'user-1', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject credit note for cancelled invoice', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.CANCELLED,
      });

      await expect(
        service.generateCreditNote('invoice-1', 'user-1', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getInvoicePayload', () => {
    it('should return frozen payload', async () => {
      const mockPayload: InvoicePayload = {
        version: 1,
        issuedAt: '2026-01-05T10:00:00Z',
        timezone: 'Africa/Casablanca',
        company: {
          id: 'c1',
          name: 'Test',
          raisonSociale: 'Test SARL',
          identifiantLegal: 'ICE123',
          formeJuridique: 'SARL',
          address: '123 Test St',
        },
        agency: { id: 'a1', name: 'Agency', address: null, phone: null },
        client: { id: 'cl1', name: 'John', email: null, phone: null, idCardNumber: null, passportNumber: null },
        vehicle: { id: 'v1', brand: 'Toyota', model: 'Corolla', registrationNumber: '123-A-45' },
        booking: {
          id: 'b1',
          bookingNumber: 'RES-001',
          startDate: '2026-01-01',
          endDate: '2026-01-05',
          originalEndDate: null,
          extensionDays: null,
          totalPrice: 1000,
          lateFeeAmount: null,
          depositAmount: 500,
          depositRequired: true,
          depositStatusFinal: 'REFUNDED',
        },
        amounts: { subtotal: 1000, lateFees: 0, total: 1000, currency: 'MAD' },
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        id: 'invoice-1',
        payload: mockPayload,
      });

      const result = await service.getInvoicePayload('invoice-1');

      expect(result).toEqual(mockPayload);
    });

    it('should throw if invoice not found', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(service.getInvoicePayload('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Invoice Numbering', () => {
    it('should generate sequential invoice numbers per company per year', async () => {
      const mockBooking = {
        id: 'booking-1',
        bookingNumber: 'RES-001',
        agencyId: 'agency-1',
        companyId: 'company-1',
        totalPrice: 500,
        agency: {
          companyId: 'company-1',
          company: { id: 'company-1', name: 'Test', currency: 'MAD' },
        },
        vehicle: {},
        client: {},
        incidents: [],
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      // First invoice
      mockPrismaService.invoiceNumberSequence.upsert.mockResolvedValueOnce({ lastValue: 1 });
      mockPrismaService.invoice.create.mockResolvedValueOnce({
        id: 'inv-1',
        invoiceNumber: 'FAC-2026-000001',
      });

      const result1 = await service.generateInvoice('booking-1', 'user-1');
      expect(result1.invoiceNumber).toBe('FAC-2026-000001');

      // Second invoice
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);
      mockPrismaService.invoiceNumberSequence.upsert.mockResolvedValueOnce({ lastValue: 2 });
      mockPrismaService.invoice.create.mockResolvedValueOnce({
        id: 'inv-2',
        invoiceNumber: 'FAC-2026-000002',
      });

      const result2 = await service.generateInvoice('booking-1', 'user-1');
      expect(result2.invoiceNumber).toBe('FAC-2026-000002');
    });
  });
});
