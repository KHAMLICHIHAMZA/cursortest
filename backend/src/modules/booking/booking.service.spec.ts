import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlanningService } from '../planning/planning.service';
import { AuditService } from '../audit/audit.service';
import { AuditService as CommonAuditService } from '../../common/services/audit.service';
import { BusinessEventLogService } from '../business-event-log/business-event-log.service';
import { InvoiceService } from '../invoice/invoice.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ContractService } from '../contract/contract.service';

describe('BookingService', () => {
  let service: BookingService;
  let prismaService: PrismaService;
  let planningService: PlanningService;

  const mockPrismaService = {
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    bookingNumberSequence: {
      upsert: jest.fn(),
    },
    vehicle: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
    },
    agency: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(),
    },
  };

  const mockPlanningService = {
    getVehicleAvailability: jest.fn(),
    detectConflicts: jest.fn(),
    createBookingEvent: jest.fn(),
    deleteBookingEvents: jest.fn(),
    createPreparationTime: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
    logBookingStatusChange: jest.fn(),
  };

  const mockCommonAuditService = {
    addCreateAuditFields: jest.fn((data, userId) => ({ ...data, createdByUserId: userId })),
    addUpdateAuditFields: jest.fn((data, userId) => ({ ...data, updatedByUserId: userId })),
    removeAuditFields: jest.fn((data) => data),
  };

  const mockBusinessEventLogService = {
    logEvent: jest.fn().mockResolvedValue(undefined),
  };

  const mockInvoiceService = {
    generateInvoice: jest.fn(),
  };

  const mockOutboxService = {
    enqueue: jest.fn(),
  };

  const mockContractService = {
    createContract: jest.fn().mockResolvedValue({ id: 'contract-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PlanningService, useValue: mockPlanningService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: CommonAuditService, useValue: mockCommonAuditService },
        { provide: BusinessEventLogService, useValue: mockBusinessEventLogService },
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: OutboxService, useValue: mockOutboxService },
        { provide: ContractService, useValue: mockContractService },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prismaService = module.get<PrismaService>(PrismaService);
    planningService = module.get<PlanningService>(PlanningService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBookingDto = {
      agencyId: 'agency-1',
      vehicleId: 'vehicle-1',
      clientId: 'client-1',
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-01-20T00:00:00Z',
      totalPrice: 500,
      status: 'CONFIRMED' as const,
    };

    it('should throw ConflictException if vehicle is not available', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        agencyId: 'agency-1',
        brand: 'Toyota',
        model: 'Corolla',
        status: 'AVAILABLE',
      };
      const mockClient = {
        id: 'client-1',
        agencyId: 'agency-1',
        name: 'John Doe',
        licenseNumber: 'ABC123',
        licenseExpiryDate: new Date('2025-12-31'),
      };

      mockPrismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrismaService.client.findFirst.mockResolvedValue(mockClient);
      mockPlanningService.getVehicleAvailability.mockResolvedValue(false);
      mockPlanningService.detectConflicts.mockResolvedValue([
        { id: 'conflict-1', startDate: new Date(), endDate: new Date() },
      ]);

      await expect(service.create(createBookingDto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if vehicle not found', async () => {
      mockPlanningService.getVehicleAvailability.mockResolvedValue(true);
      mockPrismaService.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.create(createBookingDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create booking when all validations pass', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        agencyId: 'agency-1',
        brand: 'Toyota',
        model: 'Corolla',
        status: 'AVAILABLE',
      };

      const mockClient = {
        id: 'client-1',
        agencyId: 'agency-1',
        name: 'John Doe',
        licenseNumber: 'ABC123',
        licenseExpiryDate: new Date('2025-12-31'),
      };

      const mockAgency = {
        id: 'agency-1',
        companyId: 'company-1',
        preparationTimeMinutes: 60,
        company: { id: 'company-1', bookingNumberMode: 'AUTO' },
      };

      const mockBooking = {
        id: 'booking-1',
        companyId: 'company-1',
        bookingNumber: '2024000001',
        ...createBookingDto,
        vehicle: mockVehicle,
        client: mockClient,
        agency: mockAgency,
        deletedAt: null,
      };

      mockPlanningService.getVehicleAvailability.mockResolvedValue(true);
      mockPrismaService.agency.findUnique.mockResolvedValue(mockAgency);
      mockPrismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrismaService.client.findFirst.mockResolvedValue(mockClient);
      mockPrismaService.booking.findMany.mockResolvedValue([]); // Pas de bookings actifs
      mockPrismaService.bookingNumberSequence.upsert.mockResolvedValue({ lastValue: 1 });
      mockPrismaService.booking.create.mockResolvedValue(mockBooking);
      mockPrismaService.vehicle.update.mockResolvedValue({ ...mockVehicle, status: 'RENTED' });
      mockPlanningService.createBookingEvent.mockResolvedValue(undefined);

      const result = await service.create(createBookingDto, 'user-1');

      expect(result).toEqual(mockBooking);
      expect(mockPrismaService.booking.create).toHaveBeenCalled();
      expect(mockPlanningService.createBookingEvent).toHaveBeenCalled();
      expect(mockOutboxService.enqueue).toHaveBeenCalled();
    });

    it('should reject MANUAL bookingNumber with non-alphanumeric characters', async () => {
      const dto: any = {
        agencyId: 'agency-1',
        vehicleId: 'vehicle-1',
        clientId: 'client-1',
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-01-20T00:00:00Z',
        totalPrice: 500,
        status: 'CONFIRMED',
        bookingNumber: 'AB-12',
      };

      const mockVehicle = { id: 'vehicle-1', agencyId: 'agency-1', brand: 'Toyota', model: 'Corolla', status: 'AVAILABLE' };
      const mockClient = { id: 'client-1', agencyId: 'agency-1', name: 'John Doe', licenseNumber: 'ABC123', licenseExpiryDate: new Date('2025-12-31') };
      const mockAgency = { id: 'agency-1', companyId: 'company-1', preparationTimeMinutes: 60, company: { id: 'company-1', bookingNumberMode: 'MANUAL' } };

      mockPlanningService.getVehicleAvailability.mockResolvedValue(true);
      mockPrismaService.agency.findUnique.mockResolvedValue(mockAgency);
      mockPrismaService.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrismaService.client.findFirst.mockResolvedValue(mockClient);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('isValidStatusTransition', () => {
    it('should return true for valid transitions', () => {
      expect(service['isValidStatusTransition']('DRAFT', 'PENDING')).toBe(true);
      expect(service['isValidStatusTransition']('PENDING', 'CONFIRMED')).toBe(true);
      expect(service['isValidStatusTransition']('CONFIRMED', 'IN_PROGRESS')).toBe(true);
      expect(service['isValidStatusTransition']('IN_PROGRESS', 'RETURNED')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(service['isValidStatusTransition']('DRAFT', 'RETURNED')).toBe(false);
      expect(service['isValidStatusTransition']('RETURNED', 'CONFIRMED')).toBe(false);
      expect(service['isValidStatusTransition']('CANCELLED', 'IN_PROGRESS')).toBe(false);
    });
  });

  describe('V2 BookingNumber AUTO (concurrency)', () => {
    it('should generate unique booking numbers for concurrent calls', async () => {
      // Arrange: make upsert behave atomically (incrementing counter)
      let counter = 0;
      mockPrismaService.bookingNumberSequence.upsert.mockImplementation(async () => {
        counter += 1;
        return { lastValue: counter };
      });

      const now = new Date('2026-01-15T10:00:00Z');

      // Act
      const results = await Promise.all(
        Array.from({ length: 25 }).map(() =>
          // private method access for focused test
          (service as any)['getNextAutoBookingNumber']('company-1', now),
        ),
      );

      // Assert: uniqueness
      const unique = new Set(results);
      expect(unique.size).toBe(results.length);
      expect(mockPrismaService.bookingNumberSequence.upsert).toHaveBeenCalledTimes(25);

      // Format sanity: YYYY + 6 digits
      for (const n of results) {
        expect(n).toMatch(/^2026\d{6}$/);
      }
    });
  });

  describe('V2 BookingNumber lock (InvoiceIssued)', () => {
    it('should allow bookingNumber update when no invoice exists', async () => {
      const booking = {
        id: 'booking-1',
        agencyId: 'agency-1',
        companyId: 'company-1',
        bookingNumber: 'BN001',
        status: 'CONFIRMED',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: 100,
        deletedAt: null,
        vehicleId: 'vehicle-1',
        client: { id: 'client-1', name: 'John Doe' },
        vehicle: { id: 'vehicle-1', brand: 'Toyota', model: 'Corolla' },
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.findFirst.mockResolvedValue(null); // uniqueness
      mockPrismaService.booking.update.mockResolvedValue({ ...booking, bookingNumber: 'BN002' });
      mockPlanningService.detectConflicts.mockResolvedValue([]);
      mockPlanningService.deleteBookingEvents.mockResolvedValue(undefined);
      mockPlanningService.createBookingEvent.mockResolvedValue(undefined);
      mockPrismaService.vehicle.update.mockResolvedValue({ id: 'vehicle-1' });

      const res = await service.update('booking-1', { bookingNumber: 'bn002' } as any, 'user-1');
      expect((res as any).bookingNumber).toBe('BN002');
    });

    it('should throw ForbiddenException when invoice exists', async () => {
      const booking = {
        id: 'booking-1',
        agencyId: 'agency-1',
        companyId: 'company-1',
        bookingNumber: 'BN001',
        status: 'CONFIRMED',
        startDate: new Date(),
        endDate: new Date(),
        totalPrice: 100,
        deletedAt: null,
        vehicleId: 'vehicle-1',
        client: { id: 'client-1', name: 'John Doe' },
        vehicle: { id: 'vehicle-1', brand: 'Toyota', model: 'Corolla' },
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.invoice.findFirst.mockResolvedValue({ id: 'inv-1' });

      await expect(service.update('booking-1', { bookingNumber: 'BN002' } as any, 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});



