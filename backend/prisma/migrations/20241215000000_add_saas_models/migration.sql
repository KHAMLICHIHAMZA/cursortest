-- Migration: Add SaaS Models
-- Created: 2024-12-15

-- ============================================
-- ENUMS
-- ============================================

-- CompanyStatus
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- AgencyStatus
CREATE TYPE "AgencyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- SubscriptionStatus
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED');

-- ModuleCode
CREATE TYPE "ModuleCode" AS ENUM ('VEHICLES', 'BOOKINGS', 'INVOICES', 'MAINTENANCE', 'FINES', 'ANALYTICS');

-- BillingPeriod
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- UserAgencyPermission
CREATE TYPE "UserAgencyPermission" AS ENUM ('READ', 'WRITE', 'FULL');

-- PaymentStatus (used by PaymentSaas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PaymentStatus'
  ) THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL');
  END IF;
END $$;

-- PaymentMethod (used by PaymentSaas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PaymentMethod'
  ) THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE_CMI', 'CASH', 'BANK_TRANSFER', 'OTHER');
  END IF;
END $$;

-- ============================================
-- ENRICHIR ENUMS EXISTANTS
-- ============================================

-- Ensure VehicleStatus exists before altering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'VehicleStatus'
  ) THEN
    CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE', 'TEMP_UNAVAILABLE');
  END IF;
END $$;

-- Ensure BookingStatus exists before altering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'BookingStatus'
  ) THEN
    CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'EXTENDED', 'LATE', 'RETURNED', 'CANCELLED', 'NO_SHOW');
  END IF;
END $$;

-- Ajouter TEMP_UNAVAILABLE à VehicleStatus
ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'TEMP_UNAVAILABLE';

-- Ajouter EXTENDED à BookingStatus
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXTENDED';

-- ============================================
-- ENRICHIR Company
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) THEN
    ALTER TABLE "Company"
      ADD COLUMN IF NOT EXISTS "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT,
      ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'MAD';

    CREATE INDEX IF NOT EXISTS "Company_status_idx" ON "Company"("status");
    CREATE INDEX IF NOT EXISTS "Company_suspendedAt_idx" ON "Company"("suspendedAt");
  END IF;
END $$;

-- ============================================
-- ENRICHIR Agency
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Agency'
  ) THEN
    ALTER TABLE "Agency"
      ADD COLUMN IF NOT EXISTS "status" "AgencyStatus" NOT NULL DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT,
      ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
      ADD COLUMN IF NOT EXISTS "capacity" INTEGER;

    CREATE INDEX IF NOT EXISTS "Agency_status_idx" ON "Agency"("status");
    CREATE INDEX IF NOT EXISTS "Agency_suspendedAt_idx" ON "Agency"("suspendedAt");
  END IF;
END $$;

-- ============================================
-- ENRICHIR UserAgency
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'UserAgency'
  ) THEN
    ALTER TABLE "UserAgency"
      ADD COLUMN IF NOT EXISTS "permission" "UserAgencyPermission" NOT NULL DEFAULT 'FULL';

    CREATE INDEX IF NOT EXISTS "UserAgency_permission_idx" ON "UserAgency"("permission");
  END IF;
END $$;

-- ============================================
-- PLAN
-- ============================================

CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Plan_name_key" ON "Plan"("name");
CREATE INDEX IF NOT EXISTS "Plan_isActive_idx" ON "Plan"("isActive");

-- ============================================
-- PLANMODULE
-- ============================================

CREATE TABLE IF NOT EXISTS "PlanModule" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "moduleCode" "ModuleCode" NOT NULL,

    CONSTRAINT "PlanModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlanModule_planId_moduleCode_key" ON "PlanModule"("planId", "moduleCode");
CREATE INDEX IF NOT EXISTS "PlanModule_planId_idx" ON "PlanModule"("planId");
CREATE INDEX IF NOT EXISTS "PlanModule_moduleCode_idx" ON "PlanModule"("moduleCode");

ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- PLANQUOTA
-- ============================================

CREATE TABLE IF NOT EXISTS "PlanQuota" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "quotaKey" TEXT NOT NULL,
    "quotaValue" INTEGER NOT NULL,

    CONSTRAINT "PlanQuota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlanQuota_planId_quotaKey_key" ON "PlanQuota"("planId", "quotaKey");
CREATE INDEX IF NOT EXISTS "PlanQuota_planId_idx" ON "PlanQuota"("planId");

ALTER TABLE "PlanQuota" ADD CONSTRAINT "PlanQuota_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- SUBSCRIPTION
-- ============================================

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "renewedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_companyId_key" ON "Subscription"("companyId");
CREATE INDEX IF NOT EXISTS "Subscription_companyId_idx" ON "Subscription"("companyId");
CREATE INDEX IF NOT EXISTS "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_endDate_idx" ON "Subscription"("endDate");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) THEN
    ALTER TABLE "Subscription"
      ADD CONSTRAINT "Subscription_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- SUBSCRIPTIONMODULE
-- ============================================

CREATE TABLE IF NOT EXISTS "SubscriptionModule" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "moduleCode" "ModuleCode" NOT NULL,

    CONSTRAINT "SubscriptionModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionModule_subscriptionId_moduleCode_key" ON "SubscriptionModule"("subscriptionId", "moduleCode");
CREATE INDEX IF NOT EXISTS "SubscriptionModule_subscriptionId_idx" ON "SubscriptionModule"("subscriptionId");
CREATE INDEX IF NOT EXISTS "SubscriptionModule_moduleCode_idx" ON "SubscriptionModule"("moduleCode");

ALTER TABLE "SubscriptionModule" ADD CONSTRAINT "SubscriptionModule_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- PAYMENTSAAS
-- ============================================

CREATE TABLE IF NOT EXISTS "PaymentSaas" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "onlinePaymentId" TEXT,
    "onlinePaymentResponse" JSONB,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "invoiceUrl" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSaas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PaymentSaas_subscriptionId_idx" ON "PaymentSaas"("subscriptionId");
CREATE INDEX IF NOT EXISTS "PaymentSaas_companyId_idx" ON "PaymentSaas"("companyId");
CREATE INDEX IF NOT EXISTS "PaymentSaas_status_idx" ON "PaymentSaas"("status");
CREATE INDEX IF NOT EXISTS "PaymentSaas_dueDate_idx" ON "PaymentSaas"("dueDate");

ALTER TABLE "PaymentSaas" ADD CONSTRAINT "PaymentSaas_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) THEN
    ALTER TABLE "PaymentSaas"
      ADD CONSTRAINT "PaymentSaas_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- COMPANYMODULE
-- ============================================

CREATE TABLE IF NOT EXISTS "CompanyModule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "moduleCode" "ModuleCode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyModule_companyId_moduleCode_key" ON "CompanyModule"("companyId", "moduleCode");
CREATE INDEX IF NOT EXISTS "CompanyModule_companyId_idx" ON "CompanyModule"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyModule_moduleCode_idx" ON "CompanyModule"("moduleCode");
CREATE INDEX IF NOT EXISTS "CompanyModule_isActive_idx" ON "CompanyModule"("isActive");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) THEN
    ALTER TABLE "CompanyModule"
      ADD CONSTRAINT "CompanyModule_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- AGENCYMODULE
-- ============================================

CREATE TABLE IF NOT EXISTS "AgencyModule" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "moduleCode" "ModuleCode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyModule_agencyId_moduleCode_key" ON "AgencyModule"("agencyId", "moduleCode");
CREATE INDEX IF NOT EXISTS "AgencyModule_agencyId_idx" ON "AgencyModule"("agencyId");
CREATE INDEX IF NOT EXISTS "AgencyModule_moduleCode_idx" ON "AgencyModule"("moduleCode");
CREATE INDEX IF NOT EXISTS "AgencyModule_isActive_idx" ON "AgencyModule"("isActive");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Agency'
  ) THEN
    ALTER TABLE "AgencyModule"
      ADD CONSTRAINT "AgencyModule_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- MODULEDEPENDENCY
-- ============================================

CREATE TABLE IF NOT EXISTS "ModuleDependency" (
    "id" TEXT NOT NULL,
    "moduleCode" "ModuleCode" NOT NULL,
    "dependsOnCode" "ModuleCode" NOT NULL,

    CONSTRAINT "ModuleDependency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ModuleDependency_moduleCode_dependsOnCode_key" ON "ModuleDependency"("moduleCode", "dependsOnCode");
CREATE INDEX IF NOT EXISTS "ModuleDependency_moduleCode_idx" ON "ModuleDependency"("moduleCode");
CREATE INDEX IF NOT EXISTS "ModuleDependency_dependsOnCode_idx" ON "ModuleDependency"("dependsOnCode");

-- ============================================
-- NOTIFICATIONPREFERENCE
-- ============================================

CREATE TABLE IF NOT EXISTS "NotificationPreference" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "billingNotificationsEmail" BOOLEAN NOT NULL DEFAULT true,
    "billingNotificationsInApp" BOOLEAN NOT NULL DEFAULT true,
    "systemNotificationsEmail" BOOLEAN NOT NULL DEFAULT true,
    "systemNotificationsInApp" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_companyId_key" ON "NotificationPreference"("companyId");
CREATE INDEX IF NOT EXISTS "NotificationPreference_companyId_idx" ON "NotificationPreference"("companyId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) THEN
    ALTER TABLE "NotificationPreference"
      ADD CONSTRAINT "NotificationPreference_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- MIGRATION DES DONNÉES EXISTANTES
-- ============================================

-- Company: status = ACTIVE (déjà fait par DEFAULT)
-- Agency: status = ACTIVE (déjà fait par DEFAULT)
-- UserAgency: permission = FULL (déjà fait par DEFAULT)

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================


