-- AlterTable: Add companyId column and make agencyId optional in BusinessEventLog
-- This allows logging company-level events (not just agency-level)

-- Step 1: Add companyId column (nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'BusinessEventLog'
  ) THEN
    ALTER TABLE "BusinessEventLog" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
    -- Step 2: Make agencyId nullable (it was required before)
    ALTER TABLE "BusinessEventLog" ALTER COLUMN "agencyId" DROP NOT NULL;
  END IF;
END $$;

-- Step 3: Add foreign key constraint for companyId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'BusinessEventLog'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Company'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'BusinessEventLog_companyId_fkey'
  ) THEN
    ALTER TABLE "BusinessEventLog"
      ADD CONSTRAINT "BusinessEventLog_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 4: Add index for companyId if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'BusinessEventLog'
  ) THEN
    CREATE INDEX IF NOT EXISTS "BusinessEventLog_companyId_idx" ON "BusinessEventLog"("companyId");
  END IF;
END $$;


