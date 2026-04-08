-- Colonnes audit User présentes dans schema.prisma (évite P2022 au prisma:seed en CI).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedByUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedReason" TEXT;
