-- Retard au départ (check-in non effectué) — distinct du retard au retour (LATE).
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PICKUP_LATE';
