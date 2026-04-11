-- À exécuter sur la base **préprod/prod** si les logins seed échouent avec « Compte inactif »
-- (Playwright E2E, démos). Vérifier les e-mails avant d’appliquer.

UPDATE "User"
SET "isActive" = true,
    "updatedAt" = NOW()
WHERE email IN (
  'admin@autolocation.fr',
  'manager1@autolocation.fr',
  'agent1@autolocation.fr'
)
  AND "deletedAt" IS NULL;
