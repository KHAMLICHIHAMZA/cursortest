# Changelog

Historique des changements **utiles pour l’équipe et le déploiement**.  
Tout changement visible côté produit, toute évolution de déploiement ou toute **rupture** (breaking) doit être noté ici — même en une ligne.

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).  
**Version produit affichée dans le README** : `2.0.0` (identité marketing) ; les packages `backend` / `frontend-web` / `mobile-agent` peuvent avoir des versions npm **indépendantes** — ne pas les confondre avec la version « produit ».

## [Unreleased]

### À compléter avant la prochaine release ou tag

- …

### Corrections

- **Backend** : `ChargeService.computeKpi` — requête `Vehicle` pour **SUPER_ADMIN** sans `companyId` : ne plus passer `agency: { companyId: null }` (erreur Prisma en prod sur `/charges/kpi`).

### Documentation

- **`README.md`** : distinction explicite version produit **2.0.0** vs spécifications fonctionnelles **3.0.0** (niveaux de version différents).
- **`docs/AUDIT_PREPROD_VERS_PROD.md`** : cadre complet préprod → prod (vérité, monorepo, env, Prisma, infra, CI, parcours, sécurité, phases).
- **`CURRENT_STATUS.md`** : statut officiel préprod (contenu précédemment dans `STATUT_PREPROD.md`) ; **`STATUT_PREPROD.md`** conservé comme alias de redirection.
- **`docs/archive/`** : guides pilote 2–3 obsolètes, CR préprod, tutoriels et docs Render historiques déplacés depuis la racine ; index dans **`docs/archive/README.md`**.
- **`TESTS_V2_ET_UNIFICATION.md`** : encadré explicite — recette / UAT sur le front préprod **https://v0-cursortest.vercel.app**.
- **Préprod Vercel** : URL de recette **https://v0-cursortest.vercel.app** documentée dans **`CURRENT_STATUS.md`**, **`docs/PRODUCTION.md`**, **`PREPROD_CHECKLIST.md`** (tests manuels / UAT à faire sur ce front).

### Maintenance dépôt

- Suppression de **`pnpm-lock.yaml`** à la racine (non utilisé ; le flux officiel est **npm**).
- Scripts et artefacts de test ponctuels déplacés vers **`scripts/archive/qa-snapshots/`** (racine allégée).

## [2.0.x] - 2026-03-28

### Ajouté

- **Admin** : mot de passe utilisateur en immédiat (`POST /api/v1/users/:id/set-password`), option envoi e-mail ; UI (dialogue) sur liste et fiche utilisateurs.
- **Documentation** : `AGENTS.md`, `docs/README.md`, `CHANGELOG.md` ; nettoyage de markdown obsolètes à la racine (audit d’unification, rapports ponctuels).
- **`docs/PRODUCTION.md`** : chaîne prod (Render, front, Neon/Postgres, variables, smoke).
- **Script** : `backend/scripts/ci-integration-smoke.mjs` pour smoke CI (health, ready, login seed).

### Documentation

- Mise à jour de `CONTEXT_CHATGPT.md` et `README.md` (ports, API Users, statuts réservation).
- **`STATUT_PREPROD.md`** réécrit (architecture unifiée `frontend-web` uniquement).
- **Monorepo** : `package.json` racine = orchestration uniquement (suppression des dépendances Next/React à la racine — éviter divergence avec `frontend-web`).

### CI

- **`ci-full.yml`** : intégration réelle (smoke HTTP) ; workflow **`ci-frontend-web`** invoqué via `workflow_call` ; besoin des trois jobs (backend, mobile, frontend-web) avant le smoke.

---

## Comment tenir ce fichier à jour

1. À chaque PR ou commit significatif : ajouter une puce sous `[Unreleased]` ou créer une section datée lors d’un tag / release.
2. Lors d’un déploiement prod : copier les items pertinents de `[Unreleased]` vers une section datée et taguer le dépôt si besoin.
3. Ne pas promettre « prêt prod » dans les autres docs sans cocher au minimum la **[checklist preuve environnement](./docs/PRODUCTION_READINESS.md)**.
