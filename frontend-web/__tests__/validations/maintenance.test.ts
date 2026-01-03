import { describe, it, expect } from 'vitest';
import { createMaintenanceSchema, updateMaintenanceSchema } from '@/lib/validations/maintenance';

describe('Maintenance validations', () => {
  describe('createMaintenanceSchema', () => {
    it('should validate a valid maintenance', () => {
      const validData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
        description: 'Révision générale',
        plannedAt: '2024-01-15T10:00:00',
        cost: 200,
        status: 'PLANNED',
      };

      const result = createMaintenanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require agencyId', () => {
      const invalidData = {
        vehicleId: 'vehicle-123',
        description: 'Révision',
      };

      const result = createMaintenanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require vehicleId', () => {
      const invalidData = {
        agencyId: 'agency-123',
        description: 'Révision',
      };

      const result = createMaintenanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require description', () => {
      const invalidData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
      };

      const result = createMaintenanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate cost is positive', () => {
      const invalidData = {
        agencyId: 'agency-123',
        vehicleId: 'vehicle-123',
        description: 'Révision',
        cost: -100,
      };

      const result = createMaintenanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid status enum values', () => {
      const statuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      
      statuses.forEach(status => {
        const data = {
          agencyId: 'agency-123',
          vehicleId: 'vehicle-123',
          description: 'Révision',
          status,
        };
        const result = createMaintenanceSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateMaintenanceSchema', () => {
    it('should validate a valid update', () => {
      const validData = {
        description: 'Révision mise à jour',
        cost: 250,
        status: 'COMPLETED',
      };

      const result = updateMaintenanceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        status: 'COMPLETED',
      };

      const result = updateMaintenanceSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should validate description when provided', () => {
      const invalidData = {
        description: '',
      };

      const result = updateMaintenanceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});


