-- Remove global unique constraint/index on registrationNumber
ALTER TABLE "Vehicle" DROP CONSTRAINT IF EXISTS "Vehicle_registrationNumber_key";
DROP INDEX IF EXISTS "Vehicle_registrationNumber_key";

-- Add partial unique index to allow reuse after soft delete
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_registrationNumber_active_key"
ON "Vehicle" ("registrationNumber")
WHERE "deletedAt" IS NULL;
