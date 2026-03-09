# Dossier technique - MALOC (mise a jour 2026-03-07)

## Architecture impactee

- **Backend (NestJS + Prisma)**
  - Modules: booking, charge, auth, user, notification.
  - Validation metier serveur renforcee.
- **Frontend web (Next.js + React Query)**
  - Formulaires dynamiques et filtrage conditionnel.
  - Invalidation de cache centralisee + ciblee.
- **Mobile agent (React Native / Expo)**
  - Signature WebView native.
  - Hydratation donnees check-in -> check-out.

## Evolutions de schema et modeles

- `Charge.scope`: `VEHICLE | AGENCY | COMPANY`
- `Charge.costCenter`: centre de cout optionnel
- Enrichissement `ChargeCategory` avec categories non-vehicule explicites
- Indexation additionnelle sur `scope` et `costCenter` (recherche/KPI)

## API et logique metier

- **Booking**
  - Verrouillage create/update/delete selon role.
  - Cloture financiere reservee aux roles agence autorises.
  - Notification "cloture en attente" apres check-out avec deduplication.

- **Charge**
  - Validation stricte categorie vs scope/costCenter.
  - Filtres backend `scope` / `costCenter`.
  - KPI: `chargesByCostCenter` + allocation proportionnelle des charges partagees.

- **User/Auth**
  - Activation email et completion profil etendus aux roles agence.

## Frontend details

- Filtres intelligents dependants:
  - Portee -> options centre de cout/categorie.
  - Centre de cout -> categories autorisees.
- Recurrence explicite via select.
- Export CSV robuste:
  - Encodage UTF-8 BOM
  - Fin de ligne CRLF
  - Formatage date/montant defensif

## Mobile details

- Suppression alias Babel qui forcait un stub WebView.
- Hydratation des champs de depart depuis payload check-in dans service booking.

## Scripts d'industrialisation

- `scripts/simulate-functional-cycles.mjs`
  - Seed de cycles metiers complets.
- `backend/scripts/agent-role-e2e.mjs`
  - Validation permissions AGENT + flux autorises.

## Strategie de verification

- Lint/build backend/frontend/mobile.
- UAT scenario-driven (voir checklist dediee).
- Verification role-based via API + UI.
- Verif export CSV sur Windows/Excel.

## Points d'attention exploitation

- Redemarrer backend apres changement Prisma client.
- Verifier verrouillage process Prisma/Node sous Windows en cas d'`EPERM`.
- Controler doublons de notifications existants avant migration si donnees legacy.
