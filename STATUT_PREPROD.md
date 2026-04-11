# Statut préproduction — MalocAuto

**Dernière révision :** 28 mars 2026  
**Branche de référence :** `main`  
**Architecture web :** **une seule app** — `frontend-web/` (Next.js 14, React 18). Les anciens projets `frontend-admin` et `frontend-agency` (Vite) **n’existent plus** dans ce dépôt.

---

## Alignement avec le dépôt actuel

| Zone | Emplacement | Rôle |
|------|-------------|------|
| API | `backend/` | NestJS, Prisma, PostgreSQL |
| Web unifié | `frontend-web/` | Admin + Company + Agency (App Router) |
| Mobile | `mobile-agent/` | Expo / agent terrain |
| Proxy local | `proxy/` | Un port (8080) : `/api` → backend, reste → Next |
| **Racine** | `package.json` | **Orchestration uniquement** (`concurrently`) — pas de stack Next/React ici |

La **preuve « prêt environnement »** (checklists déploiement, pas seulement code) est dans **[`docs/PRODUCTION_READINESS.md`](./docs/PRODUCTION_READINESS.md)**.  
La **chaîne prod** (hébergeurs, variables, santé, smoke) est décrite dans **[`docs/PRODUCTION.md`](./docs/PRODUCTION.md)**.

---

## Ce qui est cadré dans le repo

- **CI GitHub** : backend (tests + e2e), mobile, frontend-web (lint + build), et job **d’intégration** (`ci-full.yml`) qui démarre l’API sur Postgres de service et exécute un **smoke** HTTP (health + ready + login seed). Voir `.github/workflows/`.
- **Blueprint Render** : `render.yaml` (API, `rootDir: backend`, health check, migrations au démarrage).
- **Secrets / JWT** : [`CHECKLIST_SECRETS.md`](./CHECKLIST_SECRETS.md), [`backend/SECURITE_JWT.md`](./backend/SECURITE_JWT.md).
- **Validation locale backend** : `cd backend && npm run verify:push` (base dédiée).

Les **nombres exacts** de tests changent avec le temps : la référence est la **CI verte** sur `main`, pas un chiffre figé dans ce fichier.

---

## Vérifications avant mise en préprod / prod

### Obligatoire

- [ ] Variables d’environnement **réelles** sur l’hébergeur (voir [`docs/PRODUCTION.md`](./docs/PRODUCTION.md)) : `DATABASE_URL`, **`DIRECT_URL`** (Neon ou équivalent), `JWT_SECRET`, `JWT_REFRESH_SECRET`, URLs front pour CORS et e-mails.
- [ ] `NODE_ENV=production` côté API.
- [ ] Aucun secret commité (`.env` ignorés — vérifier `.gitignore`).
- [ ] Migrations Prisma appliquées sur la base cible (souvent via la commande de **start** Render : `migrate deploy` puis `node`).

### Recommandé

- [ ] Repasser la [checklist secrets](./CHECKLIST_SECRETS.md).
- [ ] Smoke **manuel** sur l’URL déployée : [`backend/scripts/smoke-remote-api.mjs`](./backend/scripts/smoke-remote-api.mjs) avec `SMOKE_API_BASE`.
- [ ] Parcours manuel critique (login web + une page métier).

---

## Ce qui n’est plus d’actualité (ne plus suivre ces pistes)

- ~~Builds séparés `frontend-admin` / `frontend-agency`~~ → tout est dans **`frontend-web`**.
- ~~Chiffres fixes « 84/84 » / « 150/150 »~~ → se fier à la **CI** et aux commandes locales.

---

## Synthèse

| Axes | Statut |
|------|--------|
| Code monorepo unifié | Aligné (`frontend-web` seul front web) |
| Documentation préprod | Ce fichier + `docs/PRODUCTION.md` + `PRODUCTION_READINESS.md` |
| CI | Workflows sous `.github/workflows/` ; intégration API smoke dans `ci-full.yml` |
| Configuration prod | À finaliser **sur les hébergeurs** (variables, domaines) — pas dans Git |

**Prochaine action typique :** compléter les variables sur Render / Vercel (ou équivalent) et exécuter un smoke sur l’URL réelle.
