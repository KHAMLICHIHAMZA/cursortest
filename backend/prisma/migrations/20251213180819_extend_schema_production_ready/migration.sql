-- ============================================
-- ÉTAPE 1: Créer tous les nouveaux enums
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanningEventType') THEN
    CREATE TYPE "PlanningEventType" AS ENUM ('BOOKING', 'MAINTENANCE', 'BLOCKAGE', 'PREPARATION_TIME');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentType') THEN
    CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'DRIVING_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE', 'PHOTO', 'CONTRACT', 'INVOICE', 'OTHER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentType') THEN
    CREATE TYPE "IncidentType" AS ENUM ('DAMAGE', 'FINE', 'ACCIDENT', 'THEFT', 'OTHER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentStatus') THEN
    CREATE TYPE "IncidentStatus" AS ENUM ('REPORTED', 'UNDER_REVIEW', 'RESOLVED', 'DISPUTED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE_CMI', 'CASH', 'BANK_TRANSFER', 'OTHER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel') THEN
    CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'PUSH', 'SMS');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM ('TRANSACTIONAL', 'MARKETING', 'SYSTEM');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'PAYMENT', 'BOOKING_STATUS_CHANGE', 'OTHER');
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Migrer l'enum BookingStatus
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Booking'
  ) AND EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'BookingStatus'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'BookingStatus_new'
  ) THEN
    -- Créer le nouvel enum avec toutes les valeurs
    CREATE TYPE "BookingStatus_new" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'LATE', 'RETURNED', 'CANCELLED', 'NO_SHOW');

    -- Migrer les données existantes vers le nouvel enum
    -- ACTIVE -> IN_PROGRESS, COMPLETED -> RETURNED
    ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new"
      USING CASE
        WHEN "status"::text = 'ACTIVE' THEN 'IN_PROGRESS'::"BookingStatus_new"
        WHEN "status"::text = 'COMPLETED' THEN 'RETURNED'::"BookingStatus_new"
        ELSE "status"::text::"BookingStatus_new"
      END;

    -- Supprimer l'ancien enum et renommer le nouveau
    DROP TYPE "BookingStatus";
    ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";

    -- Remettre la valeur par défaut
    ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"BookingStatus";
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3: Créer les nouvelles tables
-- ============================================

CREATE TABLE IF NOT EXISTS "PlanningEvent" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "bookingId" TEXT,
    "maintenanceId" TEXT,
    "type" "PlanningEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isPreparationTime" BOOLEAN NOT NULL DEFAULT false,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Incident" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "bookingId" TEXT,
    "vehicleId" TEXT,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "size" INTEGER,
    "mimeType" TEXT,
    "clientId" TEXT,
    "vehicleId" TEXT,
    "bookingId" TEXT,
    "maintenanceId" TEXT,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "cmiTransactionId" TEXT,
    "cmiResponse" JSONB,
    "isDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DOUBLE PRECISION,
    "depositHeld" DOUBLE PRECISION,
    "depositReturned" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "requiresOptIn" BOOLEAN NOT NULL DEFAULT false,
    "optInConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BusinessRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "agencyId" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "agencyId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- ÉTAPE 4: Modifier les tables existantes
-- ============================================

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "isCompliant" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "complianceCheckedAt" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "originalEndDate" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "extensionDays" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "swappedFromVehicleId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "swapReason" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Maintenance" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- ============================================
-- ÉTAPE 5: Créer les index
-- ============================================

CREATE INDEX IF NOT EXISTS "Company_deletedAt_idx" ON "Company"("deletedAt");
CREATE INDEX IF NOT EXISTS "Agency_deletedAt_idx" ON "Agency"("deletedAt");
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX IF NOT EXISTS "Vehicle_deletedAt_idx" ON "Vehicle"("deletedAt");
CREATE INDEX IF NOT EXISTS "Client_deletedAt_idx" ON "Client"("deletedAt");
CREATE INDEX IF NOT EXISTS "Client_isCompliant_idx" ON "Client"("isCompliant");
CREATE INDEX IF NOT EXISTS "Booking_deletedAt_idx" ON "Booking"("deletedAt");
CREATE INDEX IF NOT EXISTS "Maintenance_deletedAt_idx" ON "Maintenance"("deletedAt");

CREATE INDEX IF NOT EXISTS "PlanningEvent_agencyId_idx" ON "PlanningEvent"("agencyId");
CREATE INDEX IF NOT EXISTS "PlanningEvent_vehicleId_idx" ON "PlanningEvent"("vehicleId");
CREATE INDEX IF NOT EXISTS "PlanningEvent_bookingId_idx" ON "PlanningEvent"("bookingId");
CREATE INDEX IF NOT EXISTS "PlanningEvent_startDate_idx" ON "PlanningEvent"("startDate");
CREATE INDEX IF NOT EXISTS "PlanningEvent_endDate_idx" ON "PlanningEvent"("endDate");
CREATE INDEX IF NOT EXISTS "PlanningEvent_type_idx" ON "PlanningEvent"("type");

CREATE INDEX IF NOT EXISTS "Incident_agencyId_idx" ON "Incident"("agencyId");
CREATE INDEX IF NOT EXISTS "Incident_bookingId_idx" ON "Incident"("bookingId");
CREATE INDEX IF NOT EXISTS "Incident_vehicleId_idx" ON "Incident"("vehicleId");
CREATE INDEX IF NOT EXISTS "Incident_status_idx" ON "Incident"("status");
CREATE INDEX IF NOT EXISTS "Incident_type_idx" ON "Incident"("type");

CREATE INDEX IF NOT EXISTS "Document_clientId_idx" ON "Document"("clientId");
CREATE INDEX IF NOT EXISTS "Document_vehicleId_idx" ON "Document"("vehicleId");
CREATE INDEX IF NOT EXISTS "Document_bookingId_idx" ON "Document"("bookingId");
CREATE INDEX IF NOT EXISTS "Document_type_idx" ON "Document"("type");

CREATE INDEX IF NOT EXISTS "Payment_agencyId_idx" ON "Payment"("agencyId");
CREATE INDEX IF NOT EXISTS "Payment_bookingId_idx" ON "Payment"("bookingId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_cmiTransactionId_idx" ON "Payment"("cmiTransactionId");

CREATE INDEX IF NOT EXISTS "Notification_recipient_idx" ON "Notification"("recipient");
CREATE INDEX IF NOT EXISTS "Notification_channel_idx" ON "Notification"("channel");
CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type");
CREATE INDEX IF NOT EXISTS "Notification_sent_idx" ON "Notification"("sent");

CREATE INDEX IF NOT EXISTS "BusinessRule_companyId_idx" ON "BusinessRule"("companyId");
CREATE INDEX IF NOT EXISTS "BusinessRule_agencyId_idx" ON "BusinessRule"("agencyId");
CREATE INDEX IF NOT EXISTS "BusinessRule_key_idx" ON "BusinessRule"("key");
CREATE INDEX IF NOT EXISTS "BusinessRule_isActive_idx" ON "BusinessRule"("isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE INDEX IF NOT EXISTS "RefreshToken_token_idx" ON "RefreshToken"("token");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_revoked_idx" ON "RefreshToken"("revoked");

CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_companyId_idx" ON "AuditLog"("companyId");
CREATE INDEX IF NOT EXISTS "AuditLog_agencyId_idx" ON "AuditLog"("agencyId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ============================================
-- ÉTAPE 6: Créer les foreign keys
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanningEvent_agencyId_fkey') THEN
    ALTER TABLE "PlanningEvent"
      ADD CONSTRAINT "PlanningEvent_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanningEvent_vehicleId_fkey') THEN
    ALTER TABLE "PlanningEvent"
      ADD CONSTRAINT "PlanningEvent_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanningEvent_bookingId_fkey') THEN
    ALTER TABLE "PlanningEvent"
      ADD CONSTRAINT "PlanningEvent_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanningEvent_maintenanceId_fkey') THEN
    ALTER TABLE "PlanningEvent"
      ADD CONSTRAINT "PlanningEvent_maintenanceId_fkey"
      FOREIGN KEY ("maintenanceId") REFERENCES "Maintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Incident_agencyId_fkey') THEN
    ALTER TABLE "Incident"
      ADD CONSTRAINT "Incident_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Incident_bookingId_fkey') THEN
    ALTER TABLE "Incident"
      ADD CONSTRAINT "Incident_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Incident_vehicleId_fkey') THEN
    ALTER TABLE "Incident"
      ADD CONSTRAINT "Incident_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Incident_clientId_fkey') THEN
    ALTER TABLE "Incident"
      ADD CONSTRAINT "Incident_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_clientId_fkey') THEN
    ALTER TABLE "Document"
      ADD CONSTRAINT "Document_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_vehicleId_fkey') THEN
    ALTER TABLE "Document"
      ADD CONSTRAINT "Document_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_bookingId_fkey') THEN
    ALTER TABLE "Document"
      ADD CONSTRAINT "Document_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_maintenanceId_fkey') THEN
    ALTER TABLE "Document"
      ADD CONSTRAINT "Document_maintenanceId_fkey"
      FOREIGN KEY ("maintenanceId") REFERENCES "Maintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_incidentId_fkey') THEN
    ALTER TABLE "Document"
      ADD CONSTRAINT "Document_incidentId_fkey"
      FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_agencyId_fkey') THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_bookingId_fkey') THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessRule_companyId_fkey') THEN
    ALTER TABLE "BusinessRule"
      ADD CONSTRAINT "BusinessRule_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessRule_agencyId_fkey') THEN
    ALTER TABLE "BusinessRule"
      ADD CONSTRAINT "BusinessRule_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RefreshToken_userId_fkey') THEN
    ALTER TABLE "RefreshToken"
      ADD CONSTRAINT "RefreshToken_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey') THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_companyId_fkey') THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
