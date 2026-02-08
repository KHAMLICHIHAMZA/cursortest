import { Test, TestingModule } from '@nestjs/testing';
import { ContractService } from './contract.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OutboxService } from '../../common/services/outbox.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ContractService', () => {
  let service: ContractService;
  let prismaService: any;
  let outboxService: OutboxService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
    },
    contract: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockOutboxService = {
    enqueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: OutboxService, useValue: mockOutboxService },
      ],
    }).compile();

    service = module.get<ContractService>(ContractService);
    prismaService = module.get<PrismaService>(PrismaService);
    outboxService = module.get<OutboxService>(OutboxService);

    jest.clearAllMocks();
  });

  describe('createContract', () => {
    const mockBooking = {
      id: 'booking-1',
      bookingNumber: 'RES-2026-001',
      agencyId: 'agency-1',
      companyId: 'company-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-05'),
      totalPrice: 1000,
      depositRequired: true,
      depositAmount: 500,
      agency: {
        id: 'agency-1',
        name: 'Test Agency',
        company: {
          id: 'company-1',
          name: 'Test Company',
          raisonSociale: 'Test SARL',
        },
      },
      vehicle: {
        id: 'vehicle-1',
        brand: 'Toyota',
        model: 'Corolla',
        registrationNumber: '123-A-45',
        mileage: 50000,
      },
      client: {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    it('should create a contract in DRAFT status', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.contract.findFirst.mockResolvedValue(null);
      mockPrismaService.contract.create.mockResolvedValue({
        id: 'contract-1',
        status: 'DRAFT',
        bookingId: 'booking-1',
      });

      const result = await service.createContract(
        { bookingId: 'booking-1' },
        'user-1',
      );

      expect(result.status).toBe('DRAFT');
      expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ContractCreated',
        }),
      );
    });

    it('should reject if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createContract({ bookingId: 'invalid-id' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject if contract already exists for booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.contract.findFirst.mockResolvedValue({
        id: 'existing-contract',
        status: 'DRAFT',
      });

      await expect(
        service.createContract({ bookingId: 'booking-1' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('signContract', () => {
    const mockContract = {
      id: 'contract-1',
      status: 'DRAFT',
      bookingId: 'booking-1',
      companyId: 'company-1',
      agencyId: 'agency-1',
      clientSignedAt: null,
      agentSignedAt: null,
      booking: {
        bookingNumber: 'RES-001',
      },
    };

    it('should sign contract as client', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.contract.update.mockResolvedValue({
        ...mockContract,
        clientSignedAt: new Date(),
        status: 'PENDING_SIGNATURE',
      });

      const result = await service.signContract(
        'contract-1',
        { signatureData: 'base64...', signerType: 'client' },
        'user-1',
        'AGENT',
      );

      expect(result.status).toBe('PENDING_SIGNATURE');
      expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ContractSigned',
          payload: expect.objectContaining({
            signerType: 'client',
            isFullySigned: false,
          }),
        }),
      );
    });

    it('should mark contract as SIGNED when both signatures are present', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue({
        ...mockContract,
        clientSignedAt: new Date(),
        status: 'PENDING_SIGNATURE',
      });
      mockPrismaService.contract.update.mockResolvedValue({
        ...mockContract,
        clientSignedAt: new Date(),
        agentSignedAt: new Date(),
        status: 'SIGNED',
      });

      const result = await service.signContract(
        'contract-1',
        { signatureData: 'base64...', signerType: 'agent' },
        'user-1',
        'AGENT',
      );

      expect(mockOutboxService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            isFullySigned: true,
          }),
        }),
      );
    });

    it('should reject if contract already signed', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue({
        ...mockContract,
        status: 'SIGNED',
      });

      await expect(
        service.signContract(
          'contract-1',
          { signatureData: 'base64...', signerType: 'client' },
          'user-1',
          'AGENT',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if client already signed', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue({
        ...mockContract,
        clientSignedAt: new Date(),
        status: 'PENDING_SIGNATURE',
      });

      await expect(
        service.signContract(
          'contract-1',
          { signatureData: 'base64...', signerType: 'client' },
          'user-1',
          'AGENT',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject signing cancelled contract', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue({
        ...mockContract,
        status: 'CANCELLED',
      });

      await expect(
        service.signContract(
          'contract-1',
          { signatureData: 'base64...', signerType: 'client' },
          'user-1',
          'AGENT',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createNewVersion', () => {
    const mockContract = {
      id: 'contract-1',
      status: 'SIGNED',
      version: 1,
      bookingId: 'booking-1',
      agencyId: 'agency-1',
      companyId: 'company-1',
      templateId: 'template-1',
      templateVersion: 1,
      booking: {
        id: 'booking-1',
        bookingNumber: 'RES-001',
        agency: { company: {} },
        vehicle: {},
        client: {},
      },
    };

    it('should create new version and expire old contract', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.contract.update.mockResolvedValue({
        ...mockContract,
        status: 'EXPIRED',
      });
      mockPrismaService.contract.create.mockResolvedValue({
        id: 'contract-2',
        status: 'DRAFT',
        version: 2,
        previousVersion: 'contract-1',
        versionReason: 'Modification des termes',
      });

      const result = await service.createNewVersion(
        'contract-1',
        'Modification des termes',
        'user-1',
      );

      expect(result.version).toBe(2);
      expect(result.previousVersion).toBe('contract-1');
      expect(mockPrismaService.contract.update).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        data: { status: 'EXPIRED' },
      });
    });
  });

  describe('makeEffective', () => {
    it('should set effectiveAt for signed contract', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue({
        id: 'contract-1',
        status: 'SIGNED',
      });
      mockPrismaService.contract.update.mockResolvedValue({
        id: 'contract-1',
        status: 'SIGNED',
        effectiveAt: new Date(),
      });

      const result = await service.makeEffective('contract-1', 'user-1');

      expect(result.effectiveAt).toBeDefined();
    });

    it('should reject if contract not signed', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue({
        id: 'contract-1',
        status: 'DRAFT',
      });

      await expect(
        service.makeEffective('contract-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
