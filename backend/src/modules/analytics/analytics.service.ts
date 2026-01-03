import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PermissionService } from '../../common/services/permission.service';
import { BookingStatus } from '@prisma/client';

/**
 * Analytics Service
 * 
 * Provides business KPIs and analytics for agencies.
 * 
 * Access: Only AGENCY_MANAGER role
 * 
 * KPIs computed:
 * - Vehicle occupancy rate
 * - Total revenue
 * - Revenue per vehicle
 * - Average booking duration
 * - Most rented vehicles
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private permissionService: PermissionService,
  ) {}

  /**
   * Get global KPIs for super admin (all companies and agencies)
   * 
   * @param user - Current user (must be SUPER_ADMIN)
   * @param startDate - Optional start date for period
   * @param endDate - Optional end date for period
   */
  async getGlobalKPIs(
    user: any,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Check permissions - only SUPER_ADMIN can access global analytics
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Access to global analytics is restricted to SUPER_ADMIN');
    }

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    // Get all companies
    const companies = await this.prisma.company.findMany({
      where: { deletedAt: null },
    });

    // Get all agencies
    const agencies = await this.prisma.agency.findMany({
      where: { deletedAt: null },
    });

    // Get all vehicles
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        deletedAt: null,
      },
    });

    // Get all bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        deletedAt: null,
        ...dateFilter,
      },
      include: {
        vehicle: true,
        agency: true,
      },
    });

    // Get all users
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
    });

    // Calculate global KPIs
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter((c) => c.isActive).length;
    const totalAgencies = agencies.length;
    const totalVehicles = vehicles.length;
    const totalUsers = users.length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === BookingStatus.RETURNED);

    // Total revenue (from completed bookings)
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Revenue per vehicle
    const revenuePerVehicle = totalVehicles > 0 ? totalRevenue / totalVehicles : 0;

    // Average booking duration
    const avgDuration = this.calculateAverageBookingDuration(completedBookings);

    // Most active companies (by number of bookings)
    const companyBookings = new Map<string, number>();
    for (const booking of completedBookings) {
      const companyId = booking.agency?.companyId;
      if (companyId) {
        const count = companyBookings.get(companyId) || 0;
        companyBookings.set(companyId, count + 1);
      }
    }

    const mostActiveCompanies = Array.from(companyBookings.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([companyId, count]) => {
        const company = companies.find((c) => c.id === companyId);
        return {
          companyId,
          company: company ? { id: company.id, name: company.name } : null,
          bookingCount: count,
        };
      });

    // Most active agencies
    const agencyBookings = new Map<string, number>();
    for (const booking of completedBookings) {
      const agencyId = booking.agencyId;
      if (agencyId) {
        const count = agencyBookings.get(agencyId) || 0;
        agencyBookings.set(agencyId, count + 1);
      }
    }

    const mostActiveAgencies = Array.from(agencyBookings.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([agencyId, count]) => {
        const agency = agencies.find((a) => a.id === agencyId);
        return {
          agencyId,
          agency: agency ? { id: agency.id, name: agency.name } : null,
          bookingCount: count,
        };
      });

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      kpis: {
        totalCompanies,
        activeCompanies,
        totalAgencies,
        totalVehicles,
        totalUsers,
        totalBookings,
        completedBookings: completedBookings.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        revenuePerVehicle: Math.round(revenuePerVehicle * 100) / 100,
        averageBookingDurationDays: Math.round(avgDuration * 100) / 100,
        mostActiveCompanies,
        mostActiveAgencies,
      },
    };
  }

  /**
   * Get all KPIs for an agency
   * 
   * @param agencyId - Agency ID
   * @param user - Current user (for permission check)
   * @param startDate - Optional start date for period
   * @param endDate - Optional end date for period
   */
  async getAgencyKPIs(
    agencyId: string,
    user: any,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Check permissions - only AGENCY_MANAGER can access analytics
    if (user.role !== 'AGENCY_MANAGER' && user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_ADMIN') {
      throw new ForbiddenException('Access to analytics is restricted to managers');
    }

    // Verify agency access
    const hasAccess = await this.permissionService.checkAgencyAccess(agencyId, user);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this agency');
    }

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    // Get vehicles
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        agencyId,
        deletedAt: null,
      },
    });

    // Get bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        agencyId,
        deletedAt: null,
        ...dateFilter,
      },
      include: {
        vehicle: true,
      },
    });

    // Calculate KPIs
    const totalVehicles = vehicles.length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === BookingStatus.RETURNED);

    // Vehicle occupancy rate
    const occupancyRate = await this.calculateOccupancyRate(agencyId, startDate, endDate);

    // Total revenue (from completed bookings)
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Revenue per vehicle
    const revenuePerVehicle = totalVehicles > 0 ? totalRevenue / totalVehicles : 0;

    // Average booking duration
    const avgDuration = this.calculateAverageBookingDuration(completedBookings);

    // Most rented vehicles
    const mostRentedVehicles = this.getMostRentedVehicles(completedBookings, vehicles);

    return {
      agencyId,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      kpis: {
        totalVehicles,
        totalBookings,
        completedBookings: completedBookings.length,
        occupancyRate: Math.round(occupancyRate * 100) / 100, // Round to 2 decimals
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        revenuePerVehicle: Math.round(revenuePerVehicle * 100) / 100,
        averageBookingDurationDays: Math.round(avgDuration * 100) / 100,
        mostRentedVehicles,
      },
    };
  }

  /**
   * Calculate vehicle occupancy rate
   * 
   * Occupancy rate = (Total days vehicles were rented) / (Total available days)
   */
  private async calculateOccupancyRate(
    agencyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const periodStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const periodEnd = endDate || new Date();

    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        agencyId,
        deletedAt: null,
      },
    });

    if (vehicles.length === 0) {
      return 0;
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        agencyId,
        deletedAt: null,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.RETURNED],
        },
        OR: [
          {
            startDate: { lte: periodEnd },
            endDate: { gte: periodStart },
          },
        ],
      },
    });

    const totalDays = vehicles.length * ((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    let rentedDays = 0;

    for (const booking of bookings) {
      const bookingStart = booking.startDate > periodStart ? booking.startDate : periodStart;
      const bookingEnd = booking.endDate < periodEnd ? booking.endDate : periodEnd;
      const days = (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24);
      rentedDays += Math.max(0, days);
    }

    return totalDays > 0 ? rentedDays / totalDays : 0;
  }

  /**
   * Calculate average booking duration in days
   */
  private calculateAverageBookingDuration(bookings: any[]): number {
    if (bookings.length === 0) {
      return 0;
    }

    const totalDays = bookings.reduce((sum, booking) => {
      const days = (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return totalDays / bookings.length;
  }

  /**
   * Get most rented vehicles
   */
  private getMostRentedVehicles(bookings: any[], vehicles: any[]) {
    const vehicleRentals = new Map<string, number>();

    for (const booking of bookings) {
      const count = vehicleRentals.get(booking.vehicleId) || 0;
      vehicleRentals.set(booking.vehicleId, count + 1);
    }

    const sorted = Array.from(vehicleRentals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10

    return sorted.map(([vehicleId, count]) => {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      return {
        vehicleId,
        vehicle: vehicle
          ? {
              id: vehicle.id,
              brand: vehicle.brand,
              model: vehicle.model,
              registrationNumber: vehicle.registrationNumber,
            }
          : null,
        rentalCount: count,
      };
    });
  }
}

