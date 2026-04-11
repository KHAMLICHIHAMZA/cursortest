# Audit actionnable préprod → prod — MALOC

**Objectif** : une **seule vérité** lisible entre code, docs, CI et infra — et un plan d’exécution par phases.

**Branche de référence production / intégration continue :** `main`.  
**Tag interne de stabilité doc / process :** `preprod-stable` (à pousser avec `git push origin preprod-stable` après création locale).

**Dernière mise à jour du présent document :** 28 mars 2026.

---

## Source de vérité (à utiliser dans cet ordre)

| Priorité | Source | Rôle |
|----------|--------|------|
| 1 | **Code** (`main`) | Comportement réel |
| 2 | **`backend/prisma/schema.prisma` + `migrations/`** | Schéma et historique DB |
| 3 | **`STATUT_PREPROD.md`**, **`docs/PRODUCTION.md`**, **`docs/PRODUCTION_READINESS.md`** | Statut préprod, chaîne hébergement, preuve environnement |
| 4 | **`CONTEXT_CHATGPT.md`**, **`README.md`** | Contexte large pour l’équipe / IA |
| 5 | Specs dans **`docs/specs.md`**, **`SPECIFICATIONS_FONCTIONNELLES.md`** | Intention fonctionnelle — en cas de doute, le code prime |

**Ne pas** prendre comme vérité opérationnelle : tutoriels ou dossiers datés type `docs/*_2026-03-07*.md`, `TUTORIEL_LANCEMENT_SAAS.md`, `REPONSES_QUESTIONS_V1.md` — utiles en **archive / contexte**, pas pour des commandes de déploiement.

---

## État dans le dépôt (synthèse)

| # | Thème | Statut dépôt | Fichiers / actions |
|---|--------|--------------|-------------------|
| 1 | Vérité projet | **Partiel → bon** | `STATUT_PREPROD.md` réécrit ; tag `preprod-stable` recommandé ; vieux fronts retirés des docs clés |
| 2 | Monorepo | **Fait** | Racine `package.json` = orchestration uniquement ; Next/React **uniquement** dans `frontend-web/` |
| 3 | Variables d’environnement | **Base solide** | `backend/.env.example`, `frontend-web/.env.example`, `mobile-agent/.env.example` — matrice § Variables ci-dessous |
| 4 | Prisma / DB | **À valider sur vos données** | CI + `verify:push` ; plan rollback : documenter procédure manuelle (backup + `migrate resolve` si besoin) |
| 5 | Infra prod complète | **Partiel** | `render.yaml` = API ; front + domaines + monitoring **hors repo** — voir § Infra |
| 6 | CI bloquante | **En progrès** | Workflows `.github/workflows/` ; `ci-full.yml` = smoke API réel ; branch protection **à activer sur GitHub** (`docs/GITHUB_BRANCH_PROTECTION.md`) |
| 7 | Parcours métier (7) | **Manuel** | Checklist § Parcours + UAT existants dans `docs/` |
| 8 | Périmètre V1 go-live | **Décision produit** | § Périmètre recommandé |
| 9 | Sécurité minimale | **Checklist** | `CHECKLIST_SECRETS.md`, `backend/SECURITE_JWT.md` |
| 10 | Monitoring / support | **À mettre en place** | Sentry / alertes / logs — § Monitoring |
| 11 | Dossier commercial | **Hors repo code** | Présentation, démo — matériel déjà partiellement dans `docs/` |
| 12 | Ordre des phases | **Ci-dessous** | Phases A → D |

---

## 1. Figer la vérité du projet

**Fait dans le repo :** architecture unifiée documentée ; `STATUT_PREPROD.md` aligné.

**À faire vous-même :**

- [ ] Décider que **`main`** est la branche prod (déjà le cas par convention ici).
- [ ] Créer et pousser le tag :  
  `git tag -a preprod-stable -m "Référence audit docs/AUDIT_PREPROD_VERS_PROD.md"`  
  `git push origin preprod-stable`
- [ ] Ne plus maintenir de doc qui décrit `frontend-admin` / `frontend-agency` comme apps séparées — les références restantes dans d’anciens fichiers (`TUTORIEL_*`, etc.) sont **historiques**.

---

## 2. Monorepo

**Fait :** racine sans Next/React fantômes ; description dans `package.json` racine.

**À faire :** après `git pull`, **`npm install`** à la racine uniquement pour le proxy / `concurrently` ; le front se installe avec `cd frontend-web && npm ci`.

---

## 3. Variables d’environnement — matrice par service

### Backend (`backend/.env` — voir `.env.example`)

| Variable | Obligatoire prod | Notes |
|----------|------------------|--------|
| `DATABASE_URL` | Oui | Souvent URL *pooler* (Neon, etc.) |
| `DIRECT_URL` | Oui | URL **directe** pour `migrate` (souvent sans `-pooler`) |
| `JWT_SECRET` | Oui | Fort, unique |
| `JWT_REFRESH_SECRET` | Oui | Fort, distinct du JWT access |
| `NODE_ENV` | Oui | `production` |
| `PORT` | Selon hébergeur | Souvent injecté |
| `FRONTEND_URL` / `FRONTEND_WEB_URL` | Oui | Domaine(s) front réels (CORS + liens e-mail) |
| `SMTP_*` ou `RESEND_*` | Si e-mails | Voir `backend/.env.example` |
| `S3_*` | Si stockage fichiers | Optionnel |
| CORS | Via config Nest + URLs ci-dessus | Pas `origin: true` en prod |

### Frontend Web (`frontend-web/.env.local` — voir `.env.example`)

| Variable | Obligatoire prod |
|----------|------------------|
| `NEXT_PUBLIC_API_URL` | Oui — URL publique API, **terminaison `/api/v1`** |

Limiter le reste des `NEXT_PUBLIC_*` au strict nécessaire (pas de secrets).

### Mobile (`mobile-agent/.env`)

| Variable | Obligatoire prod |
|----------|------------------|
| `EXPO_PUBLIC_API_URL` | Oui — base API utilisée par le client (vérifier dans le code si suffixe `/api/v1` requis) |

Firebase / push : uniquement si activés côté backend + app.

**Résultat attendu :** recopier cette matrice dans votre gestionnaire de secrets (Render, Vercel, EAS, etc.) sans improvisation.

---

## 4. Prisma / base de données

**Dans le repo :** migrations ordonnées ; `render.yaml` lance `migrate deploy` au démarrage ; CI exécute `migrate deploy` + seed + tests.

**À faire avant go-live réel :**

- [ ] `migrate deploy` sur une base **vide** (déjà couvert en CI).
- [ ] `migrate deploy` sur une copie **proche des données réelles** (staging).
- [ ] Documenter **rollback** : backup Postgres avant migration majeure ; en cas d’échec, restaurer le backup ou utiliser `prisma migrate resolve` selon le cas (procédure interne à écrire dans votre runbook équipe).

---

## 5. Infra prod complète (topologie cible)

**Déjà décrit :** API Render dans `render.yaml`, santé `/api/v1/health`.

**À fermer explicitement (choix infra — pas tout dans Git) :**

| Composant | Exemple | Statut |
|-----------|---------|--------|
| DNS | `app.`, `api.` | À configurer |
| SSL | Automatique (Render / Vercel / Cloudflare) | À configurer |
| Front Next | Vercel, Netlify, ou derrière même domaine | À configurer |
| Postgres | Neon, RDS, etc. | Souvent déjà lié à Render |
| Fichiers | S3-compatible | Si besoin métier |
| E-mail | Resend / SMTP | Variables backend |
| Monitoring | Sentry / Log drains Render | § 10 |

**Région :** choisir Europe proche (latence Maroc / EU) de façon cohérente pour DB + API.

---

## 6. CI bloquante

**Dans le repo :** lint/build backend, frontend, mobile ; **`ci-full.yml`** smoke API (`ci-integration-smoke.mjs`).

**À faire sur GitHub :**

- [ ] Activer **branch protection** sur `main` : checks requis (noms exacts des jobs) — `docs/GITHUB_BRANCH_PROTECTION.md`.
- [ ] Optionnel : smoke **front** post-déploiement (Playwright / e2e) — non présent aujourd’hui ; la CI locale `frontend-web/e2e` peut être branchée plus tard.

**Alignement prod vs CI :** backend = `npm ci`, `prisma generate`, `migrate deploy`, `build`, tests ; même esprit que Render (sans copier les secrets prod).

---

## 7. Les 7 parcours métier critiques

À exécuter sur **préprod** (URL réelle), avec capture / note des frictions :

1. Création entreprise / agence / utilisateur (selon rôle admin).
2. Connexion + rôle + permissions (RBAC + modules).
3. Véhicule + client.
4. Réservation.
5. Check-in.
6. Check-out.
7. Contrat / facture / charge / KPI (minimum lecture + génération si applicable).

Référence UAT : `docs/UAT_CHECKLIST_FUNCTIONAL_CYCLES_2026-03-07.md` (adapter aux écrans actuels si besoin).

---

## 8. Périmètre V1 go-live (recommandation)

**Mettre en avant au début :** agences / utilisateurs, véhicules, clients, réservations, planning, check-in/out, contrats & factures, charges simples, KPI essentiels.

**Plus tard ou mode discret :** IA avancée, automatisations peu testées terrain, modules secondaires.

---

## 9. Sécurité minimale

Checklist : reprendre **`CHECKLIST_SECRETS.md`** + :

- [ ] Comptes **seed** non utilisables en prod (ou base sans seed en prod).
- [ ] HTTPS partout ; cookies `secure` en prod si utilisés.
- [ ] Rate limit login (backend — vérifier activation).
- [ ] Reset password + **mot de passe admin** testés une fois sur préprod.

---

## 10. Monitoring et support

**Pas encore dans le code :** intégration Sentry (ou équivalent), alertes, runbook incident.

**À faire :**

- [ ] Brancher **Sentry** (front + back) ou erreurs Render.
- [ ] Canal alertes (email / Slack).
- [ ] Compte admin support + procédure incident 1 page.

---

## 11. Dossier commercial

Hors dépôt technique — vous avez déjà des livrables dans `docs/` (présentations, captures). Compléter avec pitch court + vidéo démo si besoin marché.

---

## 12. Ordre recommandé (phases)

### Phase A — Cette semaine (fondations)

- [ ] Doc de vérité lue par l’équipe (`STATUT_PREPROD`, ce fichier, `PRODUCTION.md`).
- [ ] Tag `preprod-stable` poussé.
- [ ] Variables par service recopiées sur les hébergeurs (matrice §3).
- [ ] `migrate deploy` validé sur copie de données réalistes.

### Phase B — Infra + CI

- [ ] Topologie §5 complétée (domaines, SSL, front).
- [ ] Branch protection + checks verts obligatoires.
- [ ] Smoke API après chaque déploiement (script distant déjà documenté).

### Phase C — Métier + périmètre

- [ ] 7 parcours §7 sur préprod.
- [ ] Corriger uniquement les **bloquants** ; figer périmètre V1 §8.

### Phase D — Go-live

- [ ] Mise en prod ; monitoring §10 ; 1–2 agences pilotes.

---

## Documents connexes

| Fichier | Usage |
|---------|--------|
| [`STATUT_PREPROD.md`](../STATUT_PREPROD.md) | Statut préprod aligné repo |
| [`PRODUCTION.md`](PRODUCTION.md) | Chaîne hébergement |
| [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) | Prêt technique vs prouvé |
| [`GITHUB_BRANCH_PROTECTION.md`](GITHUB_BRANCH_PROTECTION.md) | Protection `main` |
| [`CHANGELOG.md`](../CHANGELOG.md) | Historique des changements |
