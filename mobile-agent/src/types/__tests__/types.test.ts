// Tests de types TypeScript (vérification à la compilation)
import { BookingStatus, FuelLevel, DamageZone, DamageType, DamageSeverity } from '../index';

describe('Type Definitions', () => {
  describe('BookingStatus', () => {
    it('should have correct status values', () => {
      const statuses: BookingStatus[] = [
        'PENDING',
        'CONFIRMED',
        'ACTIVE',
        'COMPLETED',
        'CANCELLED',
      ];
      
      expect(statuses.length).toBe(5);
      expect(statuses).toContain('PENDING');
      expect(statuses).toContain('ACTIVE');
    });
  });

  describe('FuelLevel', () => {
    it('should have correct fuel level values', () => {
      const levels: FuelLevel[] = [
        'EMPTY',
        'QUARTER',
        'HALF',
        'THREE_QUARTERS',
        'FULL',
      ];
      
      expect(levels.length).toBe(5);
      expect(levels).toContain('FULL');
      expect(levels).toContain('EMPTY');
    });
  });

  describe('DamageZone', () => {
    it('should have correct damage zone values', () => {
      const zones: DamageZone[] = [
        'FRONT',
        'REAR',
        'LEFT',
        'RIGHT',
        'ROOF',
        'INTERIOR',
        'WINDOWS',
        'WHEELS',
      ];
      
      expect(zones.length).toBe(8);
    });
  });

  describe('DamageType', () => {
    it('should have correct damage type values', () => {
      const types: DamageType[] = [
        'SCRATCH',
        'DENT',
        'BROKEN',
        'PAINT',
        'GLASS',
        'OTHER',
      ];
      
      expect(types.length).toBe(6);
    });
  });

  describe('DamageSeverity', () => {
    it('should have correct severity values', () => {
      const severities: DamageSeverity[] = [
        'LOW',
        'MEDIUM',
        'HIGH',
      ];
      
      expect(severities.length).toBe(3);
    });
  });
});

