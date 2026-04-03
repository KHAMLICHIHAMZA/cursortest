-- BookingStatus: migration 20251213180819 replaced the enum with a set that omitted
-- 'EXTENDED' while schema.prisma still defines it → 22P02 when reading/writing EXTENDED.
-- VehicleStatus: schema adds RESERVED, IN_DELIVERY, IN_RECOVERY vs older DB enums.

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXTENDED';

ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'RESERVED';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'IN_DELIVERY';
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'IN_RECOVERY';
