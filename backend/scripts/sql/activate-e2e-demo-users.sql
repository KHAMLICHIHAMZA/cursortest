-- Préprod / démo : débloquer les logins seed (E2E, tests manuels).
-- Erreurs possibles côté API :
--   « Compte inactif »     → User.isActive
--   « Société supprimée »  → Company.deletedAt (ou status ≠ ACTIVE)
--   « Société inactive »   → Company.isActive
--   « Société suspendue… » → Company.status

-- 1) Utilisateurs démo
UPDATE "User"
SET "isActive" = true,
    "updatedAt" = NOW()
WHERE email IN (
  'admin@autolocation.fr',
  'manager1@autolocation.fr',
  'agent1@autolocation.fr'
)
  AND "deletedAt" IS NULL;

-- 2) Sociétés liées à ces utilisateurs (lève « Société supprimée » si Company.soft-deleted)
UPDATE "Company" c
SET
  "deletedAt" = NULL,
  "deletedByUserId" = NULL,
  "deletedReason" = NULL,
  "isActive" = true,
  "status" = 'ACTIVE'::"CompanyStatus",
  "suspendedAt" = NULL,
  "suspendedReason" = NULL,
  "updatedAt" = NOW()
WHERE c.id IN (
  SELECT u."companyId"
  FROM "User" u
  WHERE u.email IN (
    'admin@autolocation.fr',
    'manager1@autolocation.fr',
    'agent1@autolocation.fr'
  )
    AND u."companyId" IS NOT NULL
);

-- 3) Agences de ces sociétés (évite des 403 / données manquantes si agences soft-deleted)
UPDATE "Agency" a
SET
  "deletedAt" = NULL,
  "deletedByUserId" = NULL,
  "deletedReason" = NULL,
  "status" = 'ACTIVE'::"AgencyStatus",
  "suspendedAt" = NULL,
  "suspendedReason" = NULL,
  "updatedAt" = NOW()
WHERE a."companyId" IN (
  SELECT u."companyId"
  FROM "User" u
  WHERE u.email IN (
    'admin@autolocation.fr',
    'manager1@autolocation.fr',
    'agent1@autolocation.fr'
  )
    AND u."companyId" IS NOT NULL
);
