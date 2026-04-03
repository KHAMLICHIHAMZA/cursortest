-- Profile fields present in schema.prisma but missing from early User table migrations.
-- Fixes: PrismaClientKnownRequestError column User.phone does not exist (and related selects).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
