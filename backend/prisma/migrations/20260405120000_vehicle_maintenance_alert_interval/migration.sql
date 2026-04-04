-- Align Vehicle with schema.prisma (custom maintenance alert km threshold).

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "maintenanceAlertIntervalKm" INTEGER;
