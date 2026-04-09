-- Champs métier Booking de 20250126000000 : la migration utilisait ALTER TABLE IF EXISTS alors que
-- "Booking" n'est créée que dans 20251210215456 → aucune colonne ajoutée sur une base neuve.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositDecisionSource') THEN
    CREATE TYPE "DepositDecisionSource" AS ENUM ('COMPANY', 'AGENCY');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositStatusCheckIn') THEN
    CREATE TYPE "DepositStatusCheckIn" AS ENUM ('PENDING', 'COLLECTED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositStatusFinal') THEN
    CREATE TYPE "DepositStatusFinal" AS ENUM ('REFUNDED', 'PARTIAL', 'FORFEITED', 'DISPUTED');
  END IF;
END $$;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "depositRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "depositAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "depositDecisionSource" "DepositDecisionSource",
  ADD COLUMN IF NOT EXISTS "depositStatusCheckIn" "DepositStatusCheckIn" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "depositStatusFinal" "DepositStatusFinal",
  ADD COLUMN IF NOT EXISTS "lateFeeAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "lateFeeCalculatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lateFeeOverride" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lateFeeOverrideJustification" TEXT,
  ADD COLUMN IF NOT EXISTS "lateFeeOverrideBy" TEXT,
  ADD COLUMN IF NOT EXISTS "lateFeeOverrideAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "financialClosureBlocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "financialClosureBlockedReason" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedReason" TEXT;
