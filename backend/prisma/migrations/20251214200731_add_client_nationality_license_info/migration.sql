-- AlterTable
ALTER TABLE "Client" ADD COLUMN "isMoroccan" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "countryOfOrigin" TEXT,
ADD COLUMN "licenseExpiryDate" TIMESTAMP(3),
ADD COLUMN "isForeignLicense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "idCardNumber" TEXT,
ADD COLUMN "idCardExpiryDate" TIMESTAMP(3),
ADD COLUMN "passportNumber" TEXT,
ADD COLUMN "passportExpiryDate" TIMESTAMP(3);

-- AlterTable: Move licenseNumber from note to dedicated field if it exists
-- Note: This is a data migration that should be handled separately if needed


