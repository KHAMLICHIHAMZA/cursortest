import { GpsKpiService } from './gps-kpi.service';

describe('GpsKpiService', () => {
  let service: GpsKpiService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      gpsSnapshot: {
        findMany: jest.fn(),
      },
    };
    service = new GpsKpiService(mockPrisma as any);
  });

  describe('computeKpi', () => {
    it('should compute snapshot stats and distance estimates', async () => {
      mockPrisma.gpsSnapshot.findMany.mockResolvedValue([
        {
          id: 's1', vehicleId: 'v1', bookingId: 'b1', reason: 'CHECK_IN',
          isGpsMissing: false, accuracy: 10, mileage: 50000,
          createdAt: new Date('2026-01-10'),
          vehicle: { id: 'v1', brand: 'Dacia', model: 'Logan', registrationNumber: '123-A-1' },
        },
        {
          id: 's2', vehicleId: 'v1', bookingId: 'b1', reason: 'CHECK_OUT',
          isGpsMissing: false, accuracy: 15, mileage: 50500,
          createdAt: new Date('2026-01-15'),
          vehicle: { id: 'v1', brand: 'Dacia', model: 'Logan', registrationNumber: '123-A-1' },
        },
        {
          id: 's3', vehicleId: 'v2', bookingId: 'b2', reason: 'CHECK_IN',
          isGpsMissing: true, accuracy: null, mileage: null,
          createdAt: new Date('2026-01-12'),
          vehicle: { id: 'v2', brand: 'Renault', model: 'Clio', registrationNumber: '456-B-2' },
        },
      ]);

      const result = await service.computeKpi('comp1', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(result.totalSnapshots).toBe(3);
      expect(result.snapshotsByReason['CHECK_IN']).toBe(2);
      expect(result.snapshotsByReason['CHECK_OUT']).toBe(1);
      expect(result.gpsMissingCount).toBe(1);
      expect(result.gpsMissingRate).toBeCloseTo(33.33, 1);
      expect(result.avgAccuracy).toBe(12.5);

      // Distance estimate for v1
      const v1 = result.distanceEstimates.find(d => d.vehicleId === 'v1');
      expect(v1).toBeDefined();
      expect(v1!.checkInMileage).toBe(50000);
      expect(v1!.checkOutMileage).toBe(50500);
      expect(v1!.mileageDelta).toBe(500);

      // v2 has no mileage data
      const v2 = result.distanceEstimates.find(d => d.vehicleId === 'v2');
      expect(v2).toBeDefined();
      expect(v2!.mileageDelta).toBeNull();
    });

    it('should detect negative mileage consistency issue', async () => {
      mockPrisma.gpsSnapshot.findMany.mockResolvedValue([
        {
          id: 's1', vehicleId: 'v1', bookingId: 'b1', reason: 'CHECK_IN',
          isGpsMissing: false, accuracy: 10, mileage: 50500,
          createdAt: new Date('2026-01-10'),
          vehicle: { id: 'v1', brand: 'Dacia', model: 'Logan', registrationNumber: '123-A-1' },
        },
        {
          id: 's2', vehicleId: 'v1', bookingId: 'b1', reason: 'CHECK_OUT',
          isGpsMissing: false, accuracy: 10, mileage: 50000, // lower than check-in!
          createdAt: new Date('2026-01-15'),
          vehicle: { id: 'v1', brand: 'Dacia', model: 'Logan', registrationNumber: '123-A-1' },
        },
      ]);

      const result = await service.computeKpi('comp1', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(result.consistencyIssues).toHaveLength(1);
      expect(result.consistencyIssues[0].issue).toBe('NEGATIVE_MILEAGE');
    });

    it('should handle empty snapshots', async () => {
      mockPrisma.gpsSnapshot.findMany.mockResolvedValue([]);

      const result = await service.computeKpi('comp1', {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(result.totalSnapshots).toBe(0);
      expect(result.gpsMissingCount).toBe(0);
      expect(result.gpsMissingRate).toBe(0);
      expect(result.distanceEstimates).toHaveLength(0);
      expect(result.consistencyIssues).toHaveLength(0);
    });
  });
});
