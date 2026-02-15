import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface GpsKpiResult {
  totalSnapshots: number;
  snapshotsByReason: Record<string, number>;
  gpsMissingCount: number;
  gpsMissingRate: number;
  avgAccuracy: number | null;
  distanceEstimates: VehicleDistanceEstimate[];
  consistencyIssues: ConsistencyIssue[];
}

export interface VehicleDistanceEstimate {
  vehicleId: string;
  vehicle: string;
  snapshotCount: number;
  estimatedKm: number | null; // from mileage difference
  checkInMileage: number | null;
  checkOutMileage: number | null;
  mileageDelta: number | null;
}

export interface ConsistencyIssue {
  bookingId: string;
  vehicleId: string;
  issue: string;
  details: string;
}

@Injectable()
export class GpsKpiService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute GPS eco-KPIs for a company/agency
   */
  async computeKpi(companyId: string, options: {
    agencyId?: string;
    vehicleId?: string;
    startDate: string;
    endDate: string;
  }): Promise<GpsKpiResult> {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);

    const where: any = {
      booking: { companyId },
      createdAt: { gte: start, lte: end },
    };
    if (options.agencyId) where.agencyId = options.agencyId;
    if (options.vehicleId) where.vehicleId = options.vehicleId;

    const snapshots = await (this.prisma as any).gpsSnapshot.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, registrationNumber: true } },
      },
    });

    // Total & by reason
    const snapshotsByReason: Record<string, number> = {};
    let gpsMissingCount = 0;
    let accuracySum = 0;
    let accuracyCount = 0;

    for (const snap of snapshots) {
      const reason = snap.reason || 'UNKNOWN';
      snapshotsByReason[reason] = (snapshotsByReason[reason] || 0) + 1;

      if (snap.isGpsMissing) gpsMissingCount++;
      if (snap.accuracy != null) {
        accuracySum += snap.accuracy;
        accuracyCount++;
      }
    }

    const totalSnapshots = snapshots.length;
    const gpsMissingRate = totalSnapshots > 0 ? (gpsMissingCount / totalSnapshots) * 100 : 0;
    const avgAccuracy = accuracyCount > 0 ? Math.round((accuracySum / accuracyCount) * 100) / 100 : null;

    // Distance estimates per vehicle (from mileage at check-in/out)
    const vehicleMap = new Map<string, any[]>();
    for (const snap of snapshots) {
      if (!snap.vehicleId) continue;
      if (!vehicleMap.has(snap.vehicleId)) vehicleMap.set(snap.vehicleId, []);
      vehicleMap.get(snap.vehicleId)!.push(snap);
    }

    const distanceEstimates: VehicleDistanceEstimate[] = [];
    const consistencyIssues: ConsistencyIssue[] = [];

    for (const [vehicleId, vSnapshots] of vehicleMap) {
      const vehicle = vSnapshots[0]?.vehicle;
      const vName = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : vehicleId;

      // Find check-in and check-out snapshots with mileage
      const checkIns = vSnapshots.filter((s: any) => s.reason === 'CHECK_IN' && s.mileage != null);
      const checkOuts = vSnapshots.filter((s: any) => s.reason === 'CHECK_OUT' && s.mileage != null);

      let checkInMileage: number | null = null;
      let checkOutMileage: number | null = null;
      let mileageDelta: number | null = null;

      if (checkIns.length > 0) checkInMileage = checkIns[0].mileage;
      if (checkOuts.length > 0) checkOutMileage = checkOuts[checkOuts.length - 1].mileage;

      if (checkInMileage != null && checkOutMileage != null) {
        mileageDelta = checkOutMileage - checkInMileage;

        // Consistency check: negative mileage delta
        if (mileageDelta < 0) {
          consistencyIssues.push({
            bookingId: vSnapshots[0]?.bookingId || '',
            vehicleId,
            issue: 'NEGATIVE_MILEAGE',
            details: `Kilometrage checkout (${checkOutMileage}) < checkin (${checkInMileage})`,
          });
        }

        // Consistency check: unusually high mileage per day
        if (mileageDelta > 0) {
          const bookingSnapPairs = vSnapshots.filter((s: any) => s.bookingId);
          if (bookingSnapPairs.length >= 2) {
            const firstDate = new Date(bookingSnapPairs[0].createdAt);
            const lastDate = new Date(bookingSnapPairs[bookingSnapPairs.length - 1].createdAt);
            const days = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
            const kmPerDay = mileageDelta / days;
            if (kmPerDay > 500) {
              consistencyIssues.push({
                bookingId: vSnapshots[0]?.bookingId || '',
                vehicleId,
                issue: 'HIGH_MILEAGE_PER_DAY',
                details: `${Math.round(kmPerDay)} km/jour (seuil: 500 km/jour)`,
              });
            }
          }
        }
      }

      distanceEstimates.push({
        vehicleId,
        vehicle: vName,
        snapshotCount: vSnapshots.length,
        estimatedKm: mileageDelta,
        checkInMileage,
        checkOutMileage,
        mileageDelta,
      });
    }

    return {
      totalSnapshots,
      snapshotsByReason,
      gpsMissingCount,
      gpsMissingRate: Math.round(gpsMissingRate * 100) / 100,
      avgAccuracy,
      distanceEstimates: distanceEstimates.sort((a, b) => (b.mileageDelta || 0) - (a.mileageDelta || 0)),
      consistencyIssues,
    };
  }
}
