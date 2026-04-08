-- Charge: enums + table (la table n’existait dans aucune migration antérieure) + colonnes scope / costCenter / bookingId.
-- Idempotent pour bases vides (CI) ou bases déjà partiellement migrées.

-- Enums
DO $cat$
BEGIN
  CREATE TYPE "ChargeCategory" AS ENUM (
    'INSURANCE',
    'GENERAL_INSURANCE',
    'VIGNETTE',
    'BANK_INSTALLMENT',
    'PREVENTIVE_MAINTENANCE',
    'CORRECTIVE_MAINTENANCE',
    'FUEL',
    'SALARY',
    'OFFICE_RENT',
    'TAX',
    'ADMIN_EXPENSE',
    'MARKETING_EXPENSE',
    'UTILITIES_EXPENSE',
    'EXTERNAL_SERVICE',
    'EXCEPTIONAL',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $cat$;

DO $scope$
BEGIN
  CREATE TYPE "ChargeScope" AS ENUM ('VEHICLE', 'AGENCY', 'COMPANY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $scope$;

CREATE TABLE IF NOT EXISTS "Charge" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "bookingId" TEXT,
    "scope" "ChargeScope" NOT NULL DEFAULT 'VEHICLE'::"ChargeScope",
    "costCenter" TEXT,
    "category" "ChargeCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePeriod" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- Anciennes bases : ajout des colonnes si la table existait sans elles
ALTER TABLE "Charge" ADD COLUMN IF NOT EXISTS "scope" "ChargeScope" NOT NULL DEFAULT 'VEHICLE'::"ChargeScope";
ALTER TABLE "Charge" ADD COLUMN IF NOT EXISTS "costCenter" TEXT;
ALTER TABLE "Charge" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

CREATE INDEX IF NOT EXISTS "Charge_companyId_idx" ON "Charge" ("companyId");
CREATE INDEX IF NOT EXISTS "Charge_agencyId_idx" ON "Charge" ("agencyId");
CREATE INDEX IF NOT EXISTS "Charge_vehicleId_idx" ON "Charge" ("vehicleId");
CREATE INDEX IF NOT EXISTS "Charge_bookingId_idx" ON "Charge" ("bookingId");
CREATE INDEX IF NOT EXISTS "Charge_scope_idx" ON "Charge" ("scope");
CREATE INDEX IF NOT EXISTS "Charge_costCenter_idx" ON "Charge" ("costCenter");
CREATE INDEX IF NOT EXISTS "Charge_category_idx" ON "Charge" ("category");
CREATE INDEX IF NOT EXISTS "Charge_date_idx" ON "Charge" ("date");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Charge_companyId_fkey') THEN
    ALTER TABLE "Charge"
      ADD CONSTRAINT "Charge_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Charge_agencyId_fkey') THEN
    ALTER TABLE "Charge"
      ADD CONSTRAINT "Charge_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Charge_vehicleId_fkey') THEN
    ALTER TABLE "Charge"
      ADD CONSTRAINT "Charge_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
