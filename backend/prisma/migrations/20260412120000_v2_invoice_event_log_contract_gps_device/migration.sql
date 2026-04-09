-- Invoice V2, InvoiceNumberSequence, BusinessEventLog, Contract, GpsSnapshot, DeviceToken :
-- présents dans schema.prisma mais jamais créés / complétés dans les migrations historiques.

-- ========= InvoiceType =========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceType') THEN
    CREATE TYPE "InvoiceType" AS ENUM ('INVOICE', 'CREDIT_NOTE');
  END IF;
END $$;

-- ========= Invoice : colonnes V2 =========
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "type" "InvoiceType";
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "year" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sequence" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "payload" JSONB;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "originalInvoiceId" TEXT;

UPDATE "Invoice" i
SET "companyId" = b."companyId"
FROM "Booking" b
WHERE i."bookingId" = b."id"
  AND (i."companyId" IS NULL OR i."companyId" = '');

UPDATE "Invoice"
SET "year" = EXTRACT(YEAR FROM "issuedAt")::integer
WHERE "year" IS NULL;

UPDATE "Invoice"
SET "payload" = '{}'::jsonb
WHERE "payload" IS NULL;

UPDATE "Invoice"
SET "type" = 'INVOICE'::"InvoiceType"
WHERE "type" IS NULL;

WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY "companyId", COALESCE("year", EXTRACT(YEAR FROM "issuedAt")::integer)
           ORDER BY "issuedAt", id
         ) AS rn
  FROM "Invoice"
  WHERE "sequence" IS NULL AND "companyId" IS NOT NULL
)
UPDATE "Invoice" i
SET "sequence" = n.rn
FROM numbered n
WHERE i.id = n.id;

UPDATE "Invoice"
SET "sequence" = 1
WHERE "sequence" IS NULL;

ALTER TABLE "Invoice" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "year" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "sequence" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "payload" SET NOT NULL;

ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_invoiceNumber_key";
DROP INDEX IF EXISTS "Invoice_invoiceNumber_key";

ALTER TABLE "Invoice"
  DROP CONSTRAINT IF EXISTS "Invoice_companyId_fkey";

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  DROP CONSTRAINT IF EXISTS "Invoice_originalInvoiceId_fkey";

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_originalInvoiceId_fkey"
  FOREIGN KEY ("originalInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_companyId_year_sequence_key"
  ON "Invoice"("companyId", "year", "sequence");

-- ========= InvoiceNumberSequence =========
CREATE TABLE IF NOT EXISTS "InvoiceNumberSequence" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "lastValue" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceNumberSequence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceNumberSequence_companyId_year_key"
  ON "InvoiceNumberSequence"("companyId", "year");

CREATE INDEX IF NOT EXISTS "InvoiceNumberSequence_companyId_idx" ON "InvoiceNumberSequence"("companyId");
CREATE INDEX IF NOT EXISTS "InvoiceNumberSequence_year_idx" ON "InvoiceNumberSequence"("year");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InvoiceNumberSequence_companyId_fkey'
  ) THEN
    ALTER TABLE "InvoiceNumberSequence"
      ADD CONSTRAINT "InvoiceNumberSequence_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ========= BusinessEventType =========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BusinessEventType') THEN
    CREATE TYPE "BusinessEventType" AS ENUM (
      'BOOKING_CREATED',
      'BOOKING_UPDATED',
      'BOOKING_CANCELLED',
      'BOOKING_STATUS_CHANGED',
      'VEHICLE_CREATED',
      'VEHICLE_UPDATED',
      'VEHICLE_DELETED',
      'VEHICLE_STATUS_CHANGED',
      'CLIENT_CREATED',
      'CLIENT_UPDATED',
      'CLIENT_DELETED',
      'MAINTENANCE_CREATED',
      'MAINTENANCE_UPDATED',
      'MAINTENANCE_STATUS_CHANGED',
      'FINE_CREATED',
      'FINE_UPDATED',
      'FINE_DELETED',
      'COMPANY_CREATED',
      'COMPANY_UPDATED',
      'COMPANY_DELETED',
      'AGENCY_CREATED',
      'AGENCY_UPDATED',
      'AGENCY_DELETED',
      'AGENCY_CREATE_BLOCKED_MAX_LIMIT',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED'
    );
  END IF;
END $$;

-- ========= BusinessEventLog =========
CREATE TABLE IF NOT EXISTS "BusinessEventLog" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT,
  "companyId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "eventType" "BusinessEventType" NOT NULL,
  "previousState" JSONB,
  "newState" JSONB,
  "triggeredByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessEventLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BusinessEventLog_agencyId_idx" ON "BusinessEventLog"("agencyId");
CREATE INDEX IF NOT EXISTS "BusinessEventLog_companyId_idx" ON "BusinessEventLog"("companyId");
CREATE INDEX IF NOT EXISTS "BusinessEventLog_entityType_idx" ON "BusinessEventLog"("entityType");
CREATE INDEX IF NOT EXISTS "BusinessEventLog_entityId_idx" ON "BusinessEventLog"("entityId");
CREATE INDEX IF NOT EXISTS "BusinessEventLog_eventType_idx" ON "BusinessEventLog"("eventType");
CREATE INDEX IF NOT EXISTS "BusinessEventLog_triggeredByUserId_idx" ON "BusinessEventLog"("triggeredByUserId");
CREATE INDEX IF NOT EXISTS "BusinessEventLog_createdAt_idx" ON "BusinessEventLog"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessEventLog_agencyId_fkey') THEN
    ALTER TABLE "BusinessEventLog"
      ADD CONSTRAINT "BusinessEventLog_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessEventLog_companyId_fkey') THEN
    ALTER TABLE "BusinessEventLog"
      ADD CONSTRAINT "BusinessEventLog_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ========= Contract =========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContractStatus') THEN
    CREATE TYPE "ContractStatus" AS ENUM (
      'DRAFT',
      'PENDING_SIGNATURE',
      'SIGNED',
      'EXPIRED',
      'CANCELLED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Contract" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "templateId" TEXT,
  "templateVersion" INTEGER NOT NULL DEFAULT 1,
  "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
  "payload" JSONB NOT NULL,
  "clientSignedAt" TIMESTAMP(3),
  "clientSignature" TEXT,
  "clientSignedDevice" TEXT,
  "agentSignedAt" TIMESTAMP(3),
  "agentSignature" TEXT,
  "agentSignedDevice" TEXT,
  "agentUserId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "previousVersion" TEXT,
  "versionReason" TEXT,
  "effectiveAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Contract_bookingId_idx" ON "Contract"("bookingId");
CREATE INDEX IF NOT EXISTS "Contract_agencyId_idx" ON "Contract"("agencyId");
CREATE INDEX IF NOT EXISTS "Contract_companyId_idx" ON "Contract"("companyId");
CREATE INDEX IF NOT EXISTS "Contract_status_idx" ON "Contract"("status");
CREATE INDEX IF NOT EXISTS "Contract_version_idx" ON "Contract"("version");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Contract_bookingId_fkey') THEN
    ALTER TABLE "Contract"
      ADD CONSTRAINT "Contract_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ========= ContractTemplate =========
CREATE TABLE IF NOT EXISTS "ContractTemplate" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContractTemplate_companyId_idx" ON "ContractTemplate"("companyId");
CREATE INDEX IF NOT EXISTS "ContractTemplate_isActive_idx" ON "ContractTemplate"("isActive");
CREATE INDEX IF NOT EXISTS "ContractTemplate_isDefault_idx" ON "ContractTemplate"("isDefault");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContractTemplate_companyId_fkey') THEN
    ALTER TABLE "ContractTemplate"
      ADD CONSTRAINT "ContractTemplate_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ========= GpsSnapshot =========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GpsSnapshotReason') THEN
    CREATE TYPE "GpsSnapshotReason" AS ENUM ('CHECK_IN', 'CHECK_OUT', 'INCIDENT', 'MANUAL');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "GpsSnapshot" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "bookingId" TEXT,
  "vehicleId" TEXT,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "accuracy" DOUBLE PRECISION,
  "altitude" DOUBLE PRECISION,
  "reason" "GpsSnapshotReason" NOT NULL,
  "capturedByUserId" TEXT,
  "capturedByRole" TEXT,
  "isGpsMissing" BOOLEAN NOT NULL DEFAULT false,
  "gpsMissingReason" TEXT,
  "deviceInfo" TEXT,
  "mileage" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GpsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GpsSnapshot_agencyId_idx" ON "GpsSnapshot"("agencyId");
CREATE INDEX IF NOT EXISTS "GpsSnapshot_bookingId_idx" ON "GpsSnapshot"("bookingId");
CREATE INDEX IF NOT EXISTS "GpsSnapshot_vehicleId_idx" ON "GpsSnapshot"("vehicleId");
CREATE INDEX IF NOT EXISTS "GpsSnapshot_reason_idx" ON "GpsSnapshot"("reason");
CREATE INDEX IF NOT EXISTS "GpsSnapshot_createdAt_idx" ON "GpsSnapshot"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GpsSnapshot_bookingId_fkey') THEN
    ALTER TABLE "GpsSnapshot"
      ADD CONSTRAINT "GpsSnapshot_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GpsSnapshot_vehicleId_fkey') THEN
    ALTER TABLE "GpsSnapshot"
      ADD CONSTRAINT "GpsSnapshot_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ========= DeviceToken =========
CREATE TABLE IF NOT EXISTS "DeviceToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeviceToken_token_key" ON "DeviceToken"("token");
CREATE INDEX IF NOT EXISTS "DeviceToken_userId_idx" ON "DeviceToken"("userId");
CREATE INDEX IF NOT EXISTS "DeviceToken_token_idx" ON "DeviceToken"("token");
CREATE INDEX IF NOT EXISTS "DeviceToken_isActive_idx" ON "DeviceToken"("isActive");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DeviceToken_userId_fkey') THEN
    ALTER TABLE "DeviceToken"
      ADD CONSTRAINT "DeviceToken_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
