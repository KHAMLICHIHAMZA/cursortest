import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma, ChargeCategory } from '@prisma/client';

export interface CreateChargeDto {
  agencyId: string;
  vehicleId: string;   // Spec: charge rattachée AU VÉHICULE (obligatoire)
  bookingId?: string;
  category: string;     // INSURANCE, VIGNETTE, BANK_INSTALLMENT, PREVENTIVE_MAINTENANCE, CORRECTIVE_MAINTENANCE, FUEL, EXCEPTIONAL, OTHER
  description: string;
  amount: number;
  date: string;
  recurring?: boolean;
  recurrencePeriod?: string;
}

export interface KpiResult {
  period: string;
  revenue: number;          // CA (chiffre d'affaires)
  charges: number;          // Total charges
  margin: number;           // Marge = revenue - charges
  marginRate: number;       // Taux de marge (%)
  occupancyRate: number;    // Taux d'occupation (%)
  totalBookings: number;
  avgBookingValue: number;
  vehicleCount: number;
  chargesByCategory: Record<string, number>;
}

/**
 * Helper: enforce that the user can access the given agencyId.
 * SUPER_ADMIN / COMPANY_ADMIN: can access any agency in their company.
 * AGENCY_MANAGER / AGENT: can only access their assigned agencies.
 */
function enforceAgencyAccess(user: any, agencyId?: string): void {
  if (!agencyId) return;
  if (user.role === 'SUPER_ADMIN') return;
  if (user.role === 'COMPANY_ADMIN') return; // scoped to company at query level
  // AGENCY_MANAGER / AGENT: must belong to the agency
  if (user.agencyIds && !user.agencyIds.includes(agencyId)) {
    throw new ForbiddenException('Vous n\'avez pas accès à cette agence');
  }
}

/**
 * Build a where clause scoped to the user's agencies.
 */
function buildAgencyScope(user: any, filters?: { agencyId?: string }): any {
  if (user.role === 'SUPER_ADMIN') {
    return filters?.agencyId ? { agencyId: filters.agencyId } : {};
  }
  if (user.role === 'COMPANY_ADMIN') {
    return {
      companyId: user.companyId,
      ...(filters?.agencyId ? { agencyId: filters.agencyId } : {}),
    };
  }
  // AGENCY_MANAGER / AGENT
  if (filters?.agencyId) {
    enforceAgencyAccess(user, filters.agencyId);
    return { companyId: user.companyId, agencyId: filters.agencyId };
  }
  return {
    companyId: user.companyId,
    agencyId: user.agencyIds?.length ? { in: user.agencyIds } : undefined,
  };
}

@Injectable()
export class ChargeService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, dto: CreateChargeDto) {
    enforceAgencyAccess(user, dto.agencyId);
    return this.prisma.charge.create({
      data: {
        companyId: user.companyId,
        agencyId: dto.agencyId,
        vehicleId: dto.vehicleId,
        bookingId: dto.bookingId || null,
        category: dto.category as ChargeCategory,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        date: new Date(dto.date),
        recurring: dto.recurring || false,
        recurrencePeriod: dto.recurrencePeriod || null,
        createdByUserId: user.userId,
      },
    });
  }

  async findAll(user: any, filters?: {
    agencyId?: string;
    vehicleId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = buildAgencyScope(user, filters);

    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.category) where.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    return this.prisma.charge.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, registrationNumber: true } },
      },
    });
  }

  async findOne(id: string, user: any) {
    const charge = await this.prisma.charge.findUnique({ where: { id } });
    if (!charge || charge.companyId !== user.companyId) {
      throw new NotFoundException('Charge introuvable');
    }
    enforceAgencyAccess(user, charge.agencyId);
    return charge;
  }

  async update(id: string, user: any, dto: Partial<CreateChargeDto>) {
    const charge = await this.findOne(id, user);
    const data: any = {};
    if (dto.category) data.category = dto.category;
    if (dto.description) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.date) data.date = new Date(dto.date);
    if (dto.recurring !== undefined) data.recurring = dto.recurring;
    if (dto.recurrencePeriod !== undefined) data.recurrencePeriod = dto.recurrencePeriod;

    return this.prisma.charge.update({ where: { id }, data });
  }

  async delete(id: string, user: any) {
    await this.findOne(id, user);
    return this.prisma.charge.delete({ where: { id } });
  }

  /**
   * Compute KPIs for a company/agency over a period
   */
  async computeKpi(user: any, options: {
    agencyId?: string;
    vehicleId?: string;
    startDate: string;
    endDate: string;
  }): Promise<KpiResult> {
    enforceAgencyAccess(user, options.agencyId);

    const companyId = user.companyId;
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const agencyScope = buildAgencyScope(user, { agencyId: options.agencyId });

    const whereBooking: any = {
      ...agencyScope,
      deletedAt: null,
      startDate: { lte: end },
      endDate: { gte: start },
    };
    if (options.vehicleId) whereBooking.vehicleId = options.vehicleId;

    const whereCharge: any = {
      ...agencyScope,
      date: { gte: start, lte: end },
    };
    if (options.vehicleId) whereCharge.vehicleId = options.vehicleId;

    // Fetch data
    const [bookings, charges, vehicleCount] = await Promise.all([
      this.prisma.booking.findMany({
        where: whereBooking,
        select: { id: true, totalPrice: true, startDate: true, endDate: true, vehicleId: true },
      }),
      this.prisma.charge.findMany({
        where: whereCharge,
        select: { amount: true, category: true },
      }),
      this.prisma.vehicle.count({
        where: {
          agency: { companyId },
          ...(options.agencyId ? { agencyId: options.agencyId } : {}),
          ...(options.vehicleId ? { id: options.vehicleId } : {}),
          deletedAt: null,
        },
      }),
    ]);

    // Revenue
    const revenue = bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

    // Charges
    const totalCharges = charges.reduce((sum: number, c: any) => sum + Number(c.amount), 0);

    // Charges by category
    const chargesByCategory: Record<string, number> = {};
    for (const c of charges) {
      const cat = c.category;
      chargesByCategory[cat] = (chargesByCategory[cat] || 0) + Number(c.amount);
    }

    // Margin
    const margin = revenue - totalCharges;
    const marginRate = revenue > 0 ? (margin / revenue) * 100 : 0;

    // Occupancy rate: sum of booking days / (vehicleCount * totalDays)
    let occupiedDays = 0;
    for (const b of bookings) {
      const bStart = new Date(Math.max(b.startDate.getTime(), start.getTime()));
      const bEnd = new Date(Math.min(b.endDate.getTime(), end.getTime()));
      const days = Math.max(0, Math.ceil((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24)));
      occupiedDays += days;
    }
    const maxDays = vehicleCount * totalDays;
    const occupancyRate = maxDays > 0 ? (occupiedDays / maxDays) * 100 : 0;

    // Avg booking value
    const avgBookingValue = bookings.length > 0 ? revenue / bookings.length : 0;

    return {
      period: `${options.startDate} - ${options.endDate}`,
      revenue: Math.round(revenue * 100) / 100,
      charges: Math.round(totalCharges * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      marginRate: Math.round(marginRate * 100) / 100,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      totalBookings: bookings.length,
      avgBookingValue: Math.round(avgBookingValue * 100) / 100,
      vehicleCount,
      chargesByCategory,
    };
  }

  /**
   * Profitability per vehicle
   */
  async vehicleProfitability(user: any, options: {
    agencyId?: string;
    startDate: string;
    endDate: string;
  }) {
    enforceAgencyAccess(user, options.agencyId);

    const start = new Date(options.startDate);
    const end = new Date(options.endDate);

    const vehicleWhere: any = {
      agency: { companyId: user.companyId },
      deletedAt: null,
    };
    if (options.agencyId) vehicleWhere.agencyId = options.agencyId;
    // Scope to user's agencies for non-admin roles
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_ADMIN' && user.agencyIds?.length) {
      if (!options.agencyId) {
        vehicleWhere.agencyId = { in: user.agencyIds };
      }
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where: vehicleWhere,
      select: {
        id: true, brand: true, model: true, registrationNumber: true,
        bookings: {
          where: { startDate: { lte: end }, endDate: { gte: start }, deletedAt: null },
          select: { totalPrice: true },
        },
        charges: {
          where: { date: { gte: start, lte: end } },
          select: { amount: true },
        },
      },
    });

    return vehicles.map((v: any) => {
      const revenue = v.bookings.reduce((s: number, b: any) => s + (b.totalPrice || 0), 0);
      const vCharges = v.charges.reduce((s: number, c: any) => s + Number(c.amount), 0);
      return {
        vehicleId: v.id,
        vehicle: `${v.brand} ${v.model} (${v.registrationNumber})`,
        revenue: Math.round(revenue * 100) / 100,
        charges: Math.round(vCharges * 100) / 100,
        profit: Math.round((revenue - vCharges) * 100) / 100,
        bookingCount: v.bookings.length,
      };
    }).sort((a: any, b: any) => b.profit - a.profit);
  }
}
