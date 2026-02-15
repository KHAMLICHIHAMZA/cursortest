-- CreateEnum
CREATE TYPE "BookingNumberMode" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "bookingNumberMode" "BookingNumberMode" NOT NULL DEFAULT 'AUTO';

