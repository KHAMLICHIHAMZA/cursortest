-- Fine.updatedAt : présent dans schema.prisma, absent de la table minimale 20251210215456.

ALTER TABLE "Fine"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
