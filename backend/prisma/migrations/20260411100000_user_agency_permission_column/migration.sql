-- UserAgency.permission: same timing issue as Company/Agency — 20241215000000 only ALTERed
-- when the table existed; 20251210215456 created UserAgency without "permission".

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserAgencyPermission') THEN
    CREATE TYPE "UserAgencyPermission" AS ENUM ('READ', 'WRITE', 'FULL');
  END IF;
END $$;

ALTER TABLE "UserAgency"
  ADD COLUMN IF NOT EXISTS "permission" "UserAgencyPermission" NOT NULL DEFAULT 'FULL';

CREATE INDEX IF NOT EXISTS "UserAgency_permission_idx" ON "UserAgency"("permission");
