-- JournalEntry + InAppNotification (schema.prisma V2) — tables absentes des migrations historiques.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JournalEntryType') THEN
    CREATE TYPE "JournalEntryType" AS ENUM (
      'BOOKING_CREATED',
      'BOOKING_UPDATED',
      'BOOKING_CANCELLED',
      'CHECK_IN',
      'CHECK_OUT',
      'INVOICE_ISSUED',
      'CREDIT_NOTE_ISSUED',
      'CONTRACT_CREATED',
      'CONTRACT_SIGNED',
      'INCIDENT_REPORTED',
      'INCIDENT_RESOLVED',
      'GPS_SNAPSHOT',
      'MANUAL_NOTE',
      'SYSTEM_EVENT'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "JournalEntry" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "type" "JournalEntryType" NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "bookingId" TEXT,
  "bookingNumber" TEXT,
  "vehicleId" TEXT,
  "userId" TEXT,
  "contractId" TEXT,
  "invoiceId" TEXT,
  "incidentId" TEXT,
  "metadata" JSONB,
  "isManualNote" BOOLEAN NOT NULL DEFAULT false,
  "editedAt" TIMESTAMP(3),
  "editedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "JournalEntry_agencyId_idx" ON "JournalEntry"("agencyId");
CREATE INDEX IF NOT EXISTS "JournalEntry_companyId_idx" ON "JournalEntry"("companyId");
CREATE INDEX IF NOT EXISTS "JournalEntry_type_idx" ON "JournalEntry"("type");
CREATE INDEX IF NOT EXISTS "JournalEntry_bookingId_idx" ON "JournalEntry"("bookingId");
CREATE INDEX IF NOT EXISTS "JournalEntry_bookingNumber_idx" ON "JournalEntry"("bookingNumber");
CREATE INDEX IF NOT EXISTS "JournalEntry_vehicleId_idx" ON "JournalEntry"("vehicleId");
CREATE INDEX IF NOT EXISTS "JournalEntry_createdAt_idx" ON "JournalEntry"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InAppNotificationStatus') THEN
    CREATE TYPE "InAppNotificationStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'READ');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InAppNotificationType') THEN
    CREATE TYPE "InAppNotificationType" AS ENUM (
      'CONTRACT_TO_SIGN',
      'INVOICE_AVAILABLE',
      'BOOKING_LATE',
      'CHECK_OUT_REMINDER',
      'INCIDENT_REPORTED',
      'SYSTEM_ALERT',
      'ADMIN_ANNOUNCEMENT'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "InAppNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT,
  "agencyId" TEXT,
  "type" "InAppNotificationType" NOT NULL,
  "status" "InAppNotificationStatus" NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actionUrl" TEXT,
  "bookingId" TEXT,
  "contractId" TEXT,
  "invoiceId" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InAppNotification_userId_idx" ON "InAppNotification"("userId");
CREATE INDEX IF NOT EXISTS "InAppNotification_companyId_idx" ON "InAppNotification"("companyId");
CREATE INDEX IF NOT EXISTS "InAppNotification_agencyId_idx" ON "InAppNotification"("agencyId");
CREATE INDEX IF NOT EXISTS "InAppNotification_type_idx" ON "InAppNotification"("type");
CREATE INDEX IF NOT EXISTS "InAppNotification_status_idx" ON "InAppNotification"("status");
CREATE INDEX IF NOT EXISTS "InAppNotification_sentAt_idx" ON "InAppNotification"("sentAt");
CREATE INDEX IF NOT EXISTS "InAppNotification_readAt_idx" ON "InAppNotification"("readAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InAppNotification_userId_fkey') THEN
    ALTER TABLE "InAppNotification"
      ADD CONSTRAINT "InAppNotification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
