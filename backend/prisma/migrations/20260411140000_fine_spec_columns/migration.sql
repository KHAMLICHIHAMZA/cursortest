-- Alignement Fine sur schema.prisma (table minimale dans 20251210215456 sans extension ultérieure).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FineStatus') THEN
    CREATE TYPE "FineStatus" AS ENUM (
      'RECUE',
      'CLIENT_IDENTIFIE',
      'TRANSMISE',
      'CONTESTEE',
      'CLOTUREE'
    );
  END IF;
END $$;

ALTER TABLE "Fine"
  ADD COLUMN IF NOT EXISTS "number" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "infractionDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "FineStatus" NOT NULL DEFAULT 'RECUE',
  ADD COLUMN IF NOT EXISTS "clientId" TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryDriverId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedReason" TEXT;

CREATE INDEX IF NOT EXISTS "Fine_status_idx" ON "Fine"("status");
CREATE INDEX IF NOT EXISTS "Fine_infractionDate_idx" ON "Fine"("infractionDate");
CREATE INDEX IF NOT EXISTS "Fine_registrationNumber_idx" ON "Fine"("registrationNumber");
