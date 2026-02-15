import { ChargeService } from './charge.service';

describe('ChargeService', () => {
  let service: ChargeService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      charge: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      booking: { findMany: jest.fn() },
      vehicle: { count: jest.fn(), findMany: jest.fn() },
    };
    service = new ChargeService(mockPrisma as any);
  });

  describe('create', () => {
    it('should create a charge', async () => {
      const dto = { agencyId: 'a1', vehicleId: 'v1', category: 'FUEL', description: 'Fuel', amount: 500, date: '2026-01-15' };
      mockPrisma.charge.create.mockResolvedValue({ id: 'c1', ...dto });
      const result = await service.create('comp1', dto, 'u1');
      expect(mockPrisma.charge.create).toHaveBeenCalled();
      expect(result.id).toBe('c1');
    });
  });

  describe('findOne', () => {
    it('should return a charge if it belongs to the company', async () => {
      mockPrisma.charge.findUnique.mockResolvedValue({ id: 'c1', companyId: 'comp1' });
      const result = await service.findOne('c1', 'comp1');
      expect(result.id).toBe('c1');
    });

    it('should throw if charge does not belong to company', async () => {
      mockPrisma.charge.findUnique.mockResolvedValue({ id: 'c1', companyId: 'other' });
      await expect(service.findOne('c1', 'comp1')).rejects.toThrow('Charge introuvable');
    });

    it('should throw if charge not found', async () => {
      mockPrisma.charge.findUnique.mockResolvedValue(null);
      await expect(service.findOne('c1', 'comp1')).rejects.toThrow('Charge introuvable');
    });
  });

  describe('computeKpi', () => {
    it('should compute revenue, charges, margin and occupancy', async () => {
      const start = '2026-01-01';
      const end = '2026-01-31';

      mockPrisma.booking.findMany.mockResolvedValue([
        { id: 'b1', totalPrice: 3000, startDate: new Date('2026-01-05'), endDate: new Date('2026-01-10'), vehicleId: 'v1' },
        { id: 'b2', totalPrice: 2000, startDate: new Date('2026-01-15'), endDate: new Date('2026-01-20'), vehicleId: 'v2' },
      ]);

      mockPrisma.charge.findMany.mockResolvedValue([
        { amount: 500, category: 'FUEL' },
        { amount: 300, category: 'INSURANCE' },
      ]);

      mockPrisma.vehicle.count.mockResolvedValue(3);

      const result = await service.computeKpi('comp1', { startDate: start, endDate: end });

      expect(result.revenue).toBe(5000);
      expect(result.charges).toBe(800);
      expect(result.margin).toBe(4200);
      expect(result.totalBookings).toBe(2);
      expect(result.vehicleCount).toBe(3);
      expect(result.chargesByCategory['FUEL']).toBe(500);
      expect(result.chargesByCategory['INSURANCE']).toBe(300);
      expect(result.occupancyRate).toBeGreaterThan(0);
      expect(result.marginRate).toBeGreaterThan(0);
    });

    it('should handle no bookings', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.charge.findMany.mockResolvedValue([]);
      mockPrisma.vehicle.count.mockResolvedValue(0);

      const result = await service.computeKpi('comp1', { startDate: '2026-01-01', endDate: '2026-01-31' });
      expect(result.revenue).toBe(0);
      expect(result.margin).toBe(0);
      expect(result.occupancyRate).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete a charge', async () => {
      mockPrisma.charge.findUnique.mockResolvedValue({ id: 'c1', companyId: 'comp1' });
      mockPrisma.charge.delete.mockResolvedValue({ id: 'c1' });
      await service.delete('c1', 'comp1');
      expect(mockPrisma.charge.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });
});
