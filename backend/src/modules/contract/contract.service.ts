import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OutboxService } from '../../common/services/outbox.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, Role } from '@prisma/client';
import { CreateContractDto, SignContractDto } from './dto/create-contract.dto';

// Contract Status enum (mirroring Prisma)
const ContractStatus = {
  DRAFT: 'DRAFT',
  PENDING_SIGNATURE: 'PENDING_SIGNATURE',
  SIGNED: 'SIGNED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

type ContractStatusType = (typeof ContractStatus)[keyof typeof ContractStatus];

/**
 * V2 Contract Payload structure (frozen at creation)
 */
export interface ContractPayload {
  version: number;
  createdAt: string;
  timezone: string;
  company: {
    id: string;
    name: string;
    raisonSociale: string;
    identifiantLegal: string | null;
    formeJuridique: string;
    address: string | null;
  };
  agency: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    idCardNumber: string | null;
    passportNumber: string | null;
    licenseNumber: string | null;
    licenseExpiryDate: string | null;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    registrationNumber: string;
    mileage: number;
  };
  booking: {
    id: string;
    bookingNumber: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    depositRequired: boolean;
    depositAmount: number | null;
  };
}

@Injectable()
export class ContractService {
  constructor(
    private prisma: PrismaService,
    private outboxService: OutboxService,
    private auditService: AuditService,
  ) {}

  /**
   * V2: Create a contract in DRAFT status for a booking
   * Called automatically when a booking is created
   */
  async createContract(
    dto: CreateContractDto,
    userId: string,
  ): Promise<any> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        agency: {
          include: { company: true },
        },
        vehicle: true,
        client: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if contract already exists for this booking
    const existingContract = await (this.prisma as any).contract.findFirst({
      where: {
        bookingId: dto.bookingId,
        status: { notIn: ['CANCELLED', 'EXPIRED'] },
      },
    });

    if (existingContract) {
      throw new BadRequestException(
        'Un contrat existe déjà pour cette réservation',
      );
    }

    // Build frozen payload
    const payload = this.buildContractPayload(booking);

    const contract = await (this.prisma as any).contract.create({
      data: {
        bookingId: dto.bookingId,
        agencyId: booking.agencyId,
        companyId: booking.companyId,
        templateId: dto.templateId || null,
        status: ContractStatus.DRAFT,
        payload,
      },
    });

    // Emit domain event
    await this.outboxService.enqueue({
      aggregateType: 'Contract',
      aggregateId: contract.id,
      eventType: 'ContractCreated',
      payload: {
        contractId: contract.id,
        bookingId: dto.bookingId,
        bookingNumber: booking.bookingNumber,
        companyId: booking.companyId,
        agencyId: booking.agencyId,
      },
    });

    // Audit log
    await this.auditService.log({
      userId,
      companyId: booking.companyId,
      agencyId: booking.agencyId,
      action: AuditAction.CREATE,
      entityType: 'Contract',
      entityId: contract.id,
      description: `Contrat créé pour la réservation ${booking.bookingNumber}`,
      metadata: {
        bookingId: dto.bookingId,
        bookingNumber: booking.bookingNumber,
      },
    });

    return contract;
  }

  /**
   * V2: Build frozen payload for contract
   */
  private buildContractPayload(booking: any): ContractPayload {
    const company = booking.agency?.company;
    const agency = booking.agency;
    const client = booking.client;
    const vehicle = booking.vehicle;

    return {
      version: 1,
      createdAt: new Date().toISOString(),
      timezone: 'Africa/Casablanca',
      company: {
        id: company?.id || '',
        name: company?.name || '',
        raisonSociale: company?.raisonSociale || '',
        identifiantLegal: company?.identifiantLegal || null,
        formeJuridique: company?.formeJuridique || 'AUTRE',
        address: company?.address || null,
      },
      agency: {
        id: agency?.id || '',
        name: agency?.name || '',
        address: agency?.address || null,
        phone: agency?.phone || null,
      },
      client: {
        id: client?.id || '',
        name: client?.name || '',
        email: client?.email || null,
        phone: client?.phone || null,
        idCardNumber: client?.idCardNumber || null,
        passportNumber: client?.passportNumber || null,
        licenseNumber: client?.licenseNumber || null,
        licenseExpiryDate: client?.licenseExpiryDate?.toISOString() || null,
      },
      vehicle: {
        id: vehicle?.id || '',
        brand: vehicle?.brand || '',
        model: vehicle?.model || '',
        registrationNumber: vehicle?.registrationNumber || '',
        mileage: vehicle?.mileage || 0,
      },
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber || '',
        startDate: booking.startDate?.toISOString() || '',
        endDate: booking.endDate?.toISOString() || '',
        totalPrice: typeof booking.totalPrice === 'number' ? booking.totalPrice : Number(booking.totalPrice) || 0,
        depositRequired: booking.depositRequired || false,
        depositAmount: booking.depositAmount ? Number(booking.depositAmount) : null,
      },
    };
  }

  /**
   * V2: Sign a contract (client or agent)
   */
  async signContract(
    contractId: string,
    dto: SignContractDto,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const contract = await (this.prisma as any).contract.findUnique({
      where: { id: contractId },
      include: {
        booking: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Cannot sign if already fully signed
    if (contract.status === ContractStatus.SIGNED) {
      throw new BadRequestException('Le contrat est déjà signé');
    }

    // Cannot sign cancelled/expired contracts
    if (
      contract.status === ContractStatus.CANCELLED ||
      contract.status === ContractStatus.EXPIRED
    ) {
      throw new BadRequestException('Le contrat ne peut plus être signé');
    }

    const updateData: any = {};
    const now = new Date();

    if (dto.signerType === 'client') {
      if (contract.clientSignedAt) {
        throw new BadRequestException('Le client a déjà signé ce contrat');
      }
      updateData.clientSignedAt = now;
      updateData.clientSignature = dto.signatureData;
      updateData.clientSignedDevice = dto.deviceInfo || null;
    } else if (dto.signerType === 'agent') {
      if (contract.agentSignedAt) {
        throw new BadRequestException("L'agent a déjà signé ce contrat");
      }
      updateData.agentSignedAt = now;
      updateData.agentSignature = dto.signatureData;
      updateData.agentSignedDevice = dto.deviceInfo || null;
      updateData.agentUserId = userId;
    }

    // Check if both signatures are now complete
    const willBeFullySigned =
      (dto.signerType === 'client' && contract.agentSignedAt) ||
      (dto.signerType === 'agent' && contract.clientSignedAt);

    if (willBeFullySigned) {
      updateData.status = ContractStatus.SIGNED;
    } else if (contract.status === ContractStatus.DRAFT) {
      updateData.status = ContractStatus.PENDING_SIGNATURE;
    }

    const updatedContract = await (this.prisma as any).contract.update({
      where: { id: contractId },
      data: updateData,
    });

    // Emit domain event
    await this.outboxService.enqueue({
      aggregateType: 'Contract',
      aggregateId: contractId,
      eventType: 'ContractSigned',
      payload: {
        contractId,
        signerType: dto.signerType,
        signedAt: now.toISOString(),
        isFullySigned: willBeFullySigned,
        userId,
      },
    });

    // Audit log
    await this.auditService.log({
      userId,
      companyId: contract.companyId,
      agencyId: contract.agencyId,
      action: AuditAction.UPDATE,
      entityType: 'Contract',
      entityId: contractId,
      description: `Contrat signé par ${dto.signerType}${willBeFullySigned ? ' (contrat complet)' : ''}`,
      metadata: {
        signerType: dto.signerType,
        deviceInfo: dto.deviceInfo,
        isFullySigned: willBeFullySigned,
      },
    });

    return updatedContract;
  }

  /**
   * V2: Create a new version of a contract (after signature not allowed to edit)
   */
  async createNewVersion(
    contractId: string,
    reason: string,
    userId: string,
  ): Promise<any> {
    const originalContract = await (this.prisma as any).contract.findUnique({
      where: { id: contractId },
      include: {
        booking: {
          include: {
            agency: { include: { company: true } },
            vehicle: true,
            client: true,
          },
        },
      },
    });

    if (!originalContract) {
      throw new NotFoundException('Contract not found');
    }

    // Mark original as expired
    await (this.prisma as any).contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.EXPIRED },
    });

    // Build new payload from current booking state
    const payload = this.buildContractPayload(originalContract.booking);

    // Create new version
    const newContract = await (this.prisma as any).contract.create({
      data: {
        bookingId: originalContract.bookingId,
        agencyId: originalContract.agencyId,
        companyId: originalContract.companyId,
        templateId: originalContract.templateId,
        templateVersion: originalContract.templateVersion,
        status: ContractStatus.DRAFT,
        payload,
        version: originalContract.version + 1,
        previousVersion: originalContract.id,
        versionReason: reason,
      },
    });

    // Audit log
    await this.auditService.log({
      userId,
      companyId: originalContract.companyId,
      agencyId: originalContract.agencyId,
      action: AuditAction.CREATE,
      entityType: 'Contract',
      entityId: newContract.id,
      description: `Nouvelle version du contrat créée (v${newContract.version}). Raison: ${reason}`,
      metadata: {
        previousContractId: contractId,
        previousVersion: originalContract.version,
        newVersion: newContract.version,
        reason,
      },
    });

    return newContract;
  }

  /**
   * V2: Make contract effective (at check-in)
   */
  async makeEffective(contractId: string, userId: string): Promise<any> {
    const contract = await (this.prisma as any).contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status !== ContractStatus.SIGNED) {
      throw new BadRequestException(
        'Le contrat doit être signé avant de devenir effectif',
      );
    }

    const updatedContract = await (this.prisma as any).contract.update({
      where: { id: contractId },
      data: { effectiveAt: new Date() },
    });

    return updatedContract;
  }

  /**
   * Get contract by ID
   */
  async findOne(id: string): Promise<any> {
    const contract = await (this.prisma as any).contract.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  /**
   * Get contract by booking ID
   */
  async findByBookingId(bookingId: string): Promise<any> {
    const contract = await (this.prisma as any).contract.findFirst({
      where: {
        bookingId,
        status: { notIn: ['CANCELLED', 'EXPIRED'] },
      },
      orderBy: { version: 'desc' },
    });

    return contract;
  }

  /**
   * Get all contracts for an agency
   */
  async findAll(agencyId: string): Promise<any[]> {
    return (this.prisma as any).contract.findMany({
      where: { agencyId },
      include: {
        booking: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get contract payload for PDF rendering
   */
  async getContractPayload(contractId: string): Promise<ContractPayload> {
    const contract = await (this.prisma as any).contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract.payload as ContractPayload;
  }
}
