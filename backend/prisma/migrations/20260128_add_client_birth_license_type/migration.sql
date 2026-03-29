-- Add client dateOfBirth and licenseType (idempotent)
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "licenseType" TEXT;
