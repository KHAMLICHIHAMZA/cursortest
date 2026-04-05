-- Align Charge with schema.prisma (scope, costCenter, bookingId).
-- Missing columns caused prisma.charge.create() to fail on vehicle creation (BANK_INSTALLMENT).

DO $init$
BEGIN
  CREATE TYPE "ChargeScope" AS ENUM ('VEHICLE', 'AGENCY', 'COMPANY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $init$;

ALTER TABLE "Charge" ADD COLUMN IF NOT EXISTS "scope" "ChargeScope" NOT NULL DEFAULT 'VEHICLE';
ALTER TABLE "Charge" ADD COLUMN IF NOT EXISTS "costCenter" TEXT;
ALTER TABLE "Charge" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

CREATE INDEX IF NOT EXISTS "Charge_scope_idx" ON "Charge" ("scope");
CREATE INDEX IF NOT EXISTS "Charge_costCenter_idx" ON "Charge" ("costCenter");
CREATE INDEX IF NOT EXISTS "Charge_bookingId_idx" ON "Charge" ("bookingId");
