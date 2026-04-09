-- Colonnes Vehicle définies dans schema.prisma mais jamais ajoutées après la création
-- minimale (20251210) : 20241213190000 avait fait ALTER TABLE IF EXISTS avant que la table n'existe.

ALTER TABLE "Vehicle"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "horsepower" INTEGER,
  ADD COLUMN IF NOT EXISTS "color" TEXT,
  ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "acquisitionDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "amortizationYears" INTEGER,
  ADD COLUMN IF NOT EXISTS "financingType" TEXT,
  ADD COLUMN IF NOT EXISTS "downPayment" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "monthlyPayment" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "financingDurationMonths" INTEGER,
  ADD COLUMN IF NOT EXISTS "creditStartDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "gpsTrackerId" TEXT,
  ADD COLUMN IF NOT EXISTS "gpsTrackerLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedReason" TEXT;
