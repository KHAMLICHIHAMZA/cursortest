# Chaîne production / préproduction — vue d’ensemble

Ce document décrit **la cible** d’architecture hébergée et les **points de contrôle**. Les secrets ne sont **pas** stockés ici.

**Dernière mise à jour :** 28 mars 2026.

---

## 1. Architecture logique

```
Utilisateurs
     │
     ├─► Frontend Web (Next.js)     ──HTTPS──►  domaine app (ex. Vercel / autre)
     │         │ NEXT_PUBLIC_API_URL
     │         ▼
     └─► API NestJS (Render ou autre) ──►  PostgreSQL (ex. Neon)
                 │
                 ├─► Stockage S3-compatible (optionnel, documents)
                 └─► SMTP / Resend (e-mails)
```

- **Une** base PostgreSQL par environnement (prod / staging), avec **`DATABASE_URL`** (souvent pooler) et **`DIRECT_URL`** (connexion directe pour Prisma `migrate` — voir `render.yaml` et commentaires dans `backend/.env.example`).

---

## 2. Backend API (ex. Render)

| Élément | Détail |
|---------|--------|
| Fichier blueprint | [`render.yaml`](../render.yaml) à la racine |
| `rootDir` | `backend` |
| Build | `npm ci && npx prisma generate && npm run build` |
| Start | `npx prisma migrate deploy && node dist/main` |
| Santé | `GET /api/v1/health` (liveness), `GET /api/v1/ready` (DB) — `healthCheckPath` Render : `/api/v1/health` |

Variables **minimales** (liste complète : `backend/.env.example`) :

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | PostgreSQL (pooler OK pour l’app) |
| `DIRECT_URL` | URL **directe** (sans pooler) pour migrations |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Obligatoires, forts, uniques par env |
| `NODE_ENV` | `production` |
| `FRONTEND_WEB_URL` / `FRONTEND_URL` | Origine(s) autorisées (CORS + liens e-mail) |
| SMTP ou `RESEND_*` | Si envoi d’e-mails |

Smoke **après déploiement** (machine locale ou CI externe) :

```bash
cd backend
set SMOKE_API_BASE=https://votre-service.onrender.com/api/v1
node scripts/smoke-remote-api.mjs
```

Optionnel : `SMOKE_JWT` + `SMOKE_COMPANY_ID` pour valider un `GET /companies/:id` (voir script).

---

## 3. Frontend Web (Next.js)

| Élément | Détail |
|---------|--------|
| Code | **`frontend-web/`** uniquement (Next **14**, React **18** — voir son `package.json`) |
| Build | `npm run build` (CI : `.github/workflows/ci-frontend-web.yml`) |
| Env public | `NEXT_PUBLIC_API_URL` = URL **publique** de l’API, suffixe `/api/v1` selon votre client |

La racine du monorepo **ne contient pas** l’application Next : seulement orchestration (`concurrently`, proxy). Voir [`package.json`](../package.json).

**Domaine :** à configurer chez l’hébergeur front (ex. Vercel) + variable `NEXT_PUBLIC_API_URL` pointant vers l’API Render (ou CDN API).

---

## 4. Base de données

- **Neon**, **RDS**, ou Postgres managé : créer la base, récupérer les deux URL (pool + direct) pour Prisma.
- **Migrations** : livrées dans `backend/prisma/migrations/` ; appliquées au démarrage API sur Render (ou en CI / manuel avec `migrate deploy`).
- **Sauvegardes** : politique à définir côté fournisseur (Neon backups, etc.).

---

## 5. Qualité / preuve

| Niveau | Où |
|--------|-----|
| PR / `main` | CI : backend, frontend-web, mobile, + job intégration API dans [`ci-full.yml`](../.github/workflows/ci-full.yml) |
| « Prêt prouvé » | [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) |

---

## 6. CORS et domaines

- Le backend doit autoriser l’origine exacte du front (configuration Nest/CORS — variables `FRONTEND_*`).
- Les liens dans les e-mails (reset password, etc.) utilisent `FRONTEND_WEB_URL` / `FRONTEND_URL` — les aligner sur le domaine réel du front.

---

## 7. Références rapides

| Document | Contenu |
|----------|---------|
| [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) | Checklist prêt technique vs prêt prouvé |
| [`GITHUB_BRANCH_PROTECTION.md`](./GITHUB_BRANCH_PROTECTION.md) | Protection `main` |
| [`../CHECKLIST_SECRETS.md`](../CHECKLIST_SECRETS.md) | Audit secrets |
| [`../render.yaml`](../render.yaml) | Blueprint Render API |
| [`../STATUT_PREPROD.md`](../STATUT_PREPROD.md) | Statut préprod aligné repo |
