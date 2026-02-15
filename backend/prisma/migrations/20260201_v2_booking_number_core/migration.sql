-- 1) Add columns as nullable first (existing rows)
ALTER TABLE "Booking"
  ADD COLUMN "companyId" TEXT,
  ADD COLUMN "bookingNumber" TEXT;

-- 2) Backfill companyId from Agency
UPDATE "Booking" b
SET "companyId" = a."companyId"
FROM "Agency" a
WHERE b."agencyId" = a."id"
  AND b."companyId" IS NULL;

-- 3) Backfill bookingNumber for existing bookings with their cuid id (alphanum, unique)
UPDATE "Booking"
SET "bookingNumber" = "id"
WHERE "bookingNumber" IS NULL;

-- 4) Enforce NOT NULL
ALTER TABLE "Booking"
  ALTER COLUMN "companyId" SET NOT NULL,
  ALTER COLUMN "bookingNumber" SET NOT NULL;

-- 5) Create BookingNumberSequence (company + year, reset annuel)
CREATE TABLE "BookingNumberSequence" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "lastValue" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingNumberSequence_pkey" PRIMARY KEY ("id")
);

-- 6) Indexes / constraints
CREATE INDEX "BookingNumberSequence_companyId_idx" ON "BookingNumberSequence"("companyId");
CREATE INDEX "BookingNumberSequence_year_idx" ON "BookingNumberSequence"("year");
CREATE UNIQUE INDEX "BookingNumberSequence_companyId_year_key" ON "BookingNumberSequence"("companyId", "year");

CREATE INDEX "Booking_companyId_idx" ON "Booking"("companyId");
CREATE UNIQUE INDEX "Booking_companyId_bookingNumber_key" ON "Booking"("companyId", "bookingNumber");

-- 7) Foreign keys
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingNumberSequence"
  ADD CONSTRAINT "BookingNumberSequence_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

