-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompanyLegalForm') THEN
    CREATE TYPE "CompanyLegalForm" AS ENUM ('SARL', 'SAS', 'SA', 'EI', 'AUTO_ENTREPRENEUR', 'ASSOCIATION', 'AUTRE');
  END IF;
END $$;

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) THEN
    ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "raisonSociale" TEXT NOT NULL DEFAULT '';
    ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "identifiantLegal" TEXT;
    ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "formeJuridique" "CompanyLegalForm" NOT NULL DEFAULT 'AUTRE';
    ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "maxAgencies" INTEGER DEFAULT 5;
  END IF;
END $$;

-- Unique index for identifiantLegal
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS "Company_identifiantLegal_key" ON "Company"("identifiantLegal");
  END IF;
END $$;

-- Backfill
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) THEN
    UPDATE "Company" SET "raisonSociale" = "name" WHERE "raisonSociale" = '' OR "raisonSociale" IS NULL;
  END IF;
END $$;

-- Update BusinessEventType enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BusinessEventType') THEN
    ALTER TYPE "BusinessEventType" ADD VALUE IF NOT EXISTS 'AGENCY_CREATE_BLOCKED_MAX_LIMIT';
  END IF;
END $$;
