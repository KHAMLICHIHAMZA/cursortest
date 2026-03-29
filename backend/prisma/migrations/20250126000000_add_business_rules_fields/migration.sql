-- Ensure enums exist before Booking/Invoice changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'DepositDecisionSource'
  ) THEN
    CREATE TYPE "DepositDecisionSource" AS ENUM ('COMPANY', 'AGENCY');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'DepositStatusCheckIn'
  ) THEN
    CREATE TYPE "DepositStatusCheckIn" AS ENUM ('PENDING', 'COLLECTED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'DepositStatusFinal'
  ) THEN
    CREATE TYPE "DepositStatusFinal" AS ENUM ('REFUNDED', 'PARTIAL', 'FORFEITED', 'DISPUTED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'InvoiceStatus'
  ) THEN
    CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'PAID', 'CANCELLED');
  END IF;
END $$;

-- AlterTable: Add deposit fields to Booking
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "depositRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "depositAmount" DECIMAL(10,2);
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "depositDecisionSource" "DepositDecisionSource";
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "depositStatusCheckIn" "DepositStatusCheckIn" NOT NULL DEFAULT 'PENDING';
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "depositStatusFinal" "DepositStatusFinal";

-- AlterTable: Add late fee fields to Booking
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "lateFeeAmount" DECIMAL(10,2);
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "lateFeeCalculatedAt" TIMESTAMP(3);
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "lateFeeOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "lateFeeOverrideJustification" TEXT;
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "lateFeeOverrideBy" TEXT;
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "lateFeeOverrideAt" TIMESTAMP(3);

-- AlterTable: Add financial closure fields to Booking
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "financialClosureBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS "Booking" ADD COLUMN IF NOT EXISTS "financialClosureBlockedReason" TEXT;

-- AlterTable: Add preparation time to Agency
ALTER TABLE IF EXISTS "Agency" ADD COLUMN IF NOT EXISTS "preparationTimeMinutes" INTEGER NOT NULL DEFAULT 60;

-- AlterTable: Make licenseExpiryDate NOT NULL in Client
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Client'
  ) THEN
    -- First, update any existing NULL values to a default date (1 year from now)
    UPDATE "Client" SET "licenseExpiryDate" = (CURRENT_DATE + INTERVAL '1 year') WHERE "licenseExpiryDate" IS NULL;
    -- Now make the column NOT NULL
    ALTER TABLE "Client" ALTER COLUMN "licenseExpiryDate" SET NOT NULL;
  END IF;
END $$;

-- CreateTable: Invoice
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_agencyId_idx" ON "Invoice"("agencyId");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

-- AddForeignKey
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Agency'
  ) THEN
    ALTER TABLE "Invoice"
      ADD CONSTRAINT "Invoice_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Booking'
  ) THEN
    ALTER TABLE "Invoice"
      ADD CONSTRAINT "Invoice_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

