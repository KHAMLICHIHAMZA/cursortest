import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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

@Injectable()
export class ChargeService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateChargeDto, userId: string) {
    return (this.prisma as any).charge.create({
      data: {
        companyId,
        agencyId: dto.agencyId,
        vehicleId: dto.vehicleId,
        bookingId: dto.bookingId || null,
        category: dto.category as any,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        date: new Date(dto.date),
        recurring: dto.recurring || false,
        recurrencePeriod: dto.recurrencePeriod || null,
        createdByUserId: userId,
      },
    });
  }

  async findAll(companyId: string, filters?: {
    agencyId?: string;
    vehicleId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = { companyId };

    if (filters?.agencyId) where.agencyId = filters.agencyId;
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.category) where.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    return (this.prisma as any).charge.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, registrationNumber: true } },
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const charge = await (this.prisma as any).charge.findUnique({ where: { id } });
    if (!charge || charge.companyId !== companyId) {
      throw new NotFoundException('Charge introuvable');
    }
    return charge;
  }

  async update(id: string, companyId: string, dto: Partial<CreateChargeDto>) {
    const charge = await this.findOne(id, companyId);
    const data: any = {};
    if (dto.category) data.category = dto.category;
    if (dto.description) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.date) data.date = new Date(dto.date);
    if (dto.recurring !== undefined) data.recurring = dto.recurring;
    if (dto.recurrencePeriod !== undefined) data.recurrencePeriod = dto.recurrencePeriod;

    return (this.prisma as any).charge.update({ where: { id }, data });
  }

  async delete(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return (this.prisma as any).charge.delete({ where: { id } });
  }

  /**
   * Compute KPIs for a company/agency over a period
   */
  async computeKpi(companyId: string, options: {
    agencyId?: string;
    vehicleId?: string;
    startDate: string;
    endDate: string;
  }): Promise<KpiResult> {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const whereBooking: any = {
      companyId,
      deletedAt: null,
      startDate: { lte: end },
      endDate: { gte: start },
    };
    if (options.agencyId) whereBooking.agencyId = options.agencyId;
    if (options.vehicleId) whereBooking.vehicleId = options.vehicleId;

    const whereCharge: any = {
      companyId,
      date: { gte: start, lte: end },
    };
    if (options.agencyId) whereCharge.agencyId = options.agencyId;
    if (options.vehicleId) whereCharge.vehicleId = options.vehicleId;

    // Fetch data
    const [bookings, charges, vehicleCount] = await Promise.all([
      this.prisma.booking.findMany({
        where: whereBooking,
        select: { id: true, totalPrice: true, startDate: true, endDate: true, vehicleId: true },
      }),
      (this.prisma as any).charge.findMany({
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
  async vehicleProfitability(companyId: string, options: {
    agencyId?: string;
    startDate: string;
    endDate: string;
  }) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);

    const vehicleWhere: any = {
      agency: { companyId },
      deletedAt: null,
    };
    if (options.agencyId) vehicleWhere.agencyId = options.agencyId;

    const vehicles = await (this.prisma as any).vehicle.findMany({
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
