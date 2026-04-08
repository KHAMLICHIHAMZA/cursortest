-- Script manuel (hors Prisma migrate) : anciennes valeurs d’énum Booking
-- ACTIVE -> IN_PROGRESS, COMPLETED -> RETURNED
-- Ex. : psql "$DATABASE_URL" -f backend/scripts/sql/data_migration_booking_status.sql

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Booking" WHERE status = 'ACTIVE') THEN
    UPDATE "Booking" SET status = 'IN_PROGRESS' WHERE status = 'ACTIVE';
    RAISE NOTICE 'Migrated ACTIVE bookings to IN_PROGRESS';
  END IF;

  IF EXISTS (SELECT 1 FROM "Booking" WHERE status = 'COMPLETED') THEN
    UPDATE "Booking" SET status = 'RETURNED' WHERE status = 'COMPLETED';
    RAISE NOTICE 'Migrated COMPLETED bookings to RETURNED';
  END IF;
END $$;
