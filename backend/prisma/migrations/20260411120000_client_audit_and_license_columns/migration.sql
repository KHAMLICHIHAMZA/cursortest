-- Colonnes Client présentes dans schema.prisma mais absentes des migrations cumulées.

ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "idCardType" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedReason" TEXT;
