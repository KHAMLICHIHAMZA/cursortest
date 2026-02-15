# MalocAuto - SaaS de Gestion de Location Automobile

Plateforme SaaS multi-tenant pour la gestion complète de location de véhicules.

**Version :** 2.0.0  
**Architecture :** Frontend unifié (Next.js) + Backend API (NestJS)

---

## Architecture

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend Web unifié**: Next.js 14 + TypeScript + Tailwind CSS (gère admin, company, agency)
- **Mobile Agent**: React Native + Expo (agent terrain)
- **Proxy**: Express reverse proxy (port unique 8080)
- **Base de données**: PostgreSQL
- **Authentification**: JWT (Access + Refresh tokens) avec middleware Next.js

### Schéma

```
                  ┌────────────────────┐
  Navigateur ───► │  Proxy (port 8080) │
                  └────────┬───────────┘
                           │
              ┌────────────┼────────────┐
              │                         │
    ┌─────────▼──────────┐   ┌──────────▼──────────┐
    │  Frontend Web       │   │  Backend API         │
    │  Next.js (3001)     │   │  NestJS (3000)       │
    │  /admin/*           │   │  /api/v1/*           │
    │  /company/*         │   │  PostgreSQL          │
    │  /agency/*          │   └─────────────────────┘
    │  /login             │
    └─────────────────────┘

    ┌─────────────────────┐
    │  Mobile Agent       │
    │  Expo (8081)        │
    │  iOS / Android      │
    └─────────────────────┘
```

---

## Structure du Projet

```
malocauto/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── modules/      # Modules métier (Auth, Company, Agency, Invoice, Contract, Journal, GPS, etc.)
│   │   ├── common/       # Services partagés (Outbox, Guards, etc.)
│   │   └── main.ts       # Point d'entrée (port 3000)
│   └── prisma/           # Schéma Prisma + seed
│
├── frontend-web/         # Application Next.js unifiée
│   ├── app/
│   │   ├── admin/        # Pages Super Admin (companies, subscriptions, users, planning, etc.)
│   │   ├── company/      # Pages Company Admin (agencies, users, analytics, etc.)
│   │   ├── agency/       # Pages Agency (vehicles, clients, bookings, invoices, contracts, etc.)
│   │   └── login/        # Authentification
│   ├── components/       # Composants React (layout, UI, planning)
│   ├── lib/              # API client, modules, validations, utils
│   └── middleware.ts     # Protection routes par rôle (RBAC)
│
├── mobile-agent/         # Application React Native / Expo
│   └── src/              # Screens, services, navigation
│
├── proxy/                # Reverse proxy Express (port 8080)
│   └── server.cjs        # /api → Backend, /* → Frontend Web
│
├── docs/                 # Spécifications
└── scripts/              # Scripts PowerShell utilitaires
```

---

## Installation rapide

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL dans .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Le serveur démarre sur `http://localhost:3000`  
API Documentation (Swagger) : `http://localhost:3000/api/docs`

### 2. Frontend Web

```bash
cd frontend-web
npm install
# Créer .env.local avec : NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm run dev -- -p 3001
```

L'application démarre sur `http://localhost:3001`

### 3. Tout sur un seul port (recommandé)

```bash
# À la racine du projet
npm install
npm run dev
```

**Une seule adresse :** http://localhost:8080

| Chemin | Application |
|--------|-------------|
| http://localhost:8080/ | Page de login |
| http://localhost:8080/admin/* | Interface Super Admin |
| http://localhost:8080/company/* | Interface Company Admin |
| http://localhost:8080/agency/* | Interface Agency Manager / Agent |
| http://localhost:8080/api/* | Backend API (ex. /api/docs pour Swagger) |

Le proxy (`proxy/server.cjs`) route `/api` vers le backend et tout le reste vers le frontend Next.js.

---

## Comptes de Test

Après le seed (`npx prisma db seed`), vous pouvez vous connecter avec :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Super Admin** | `admin@malocauto.com` | `admin123` |
| **Company Admin** | `admin@autolocation.fr` | `admin123` |
| **Agency Manager** | `manager1@autolocation.fr` | `manager123` |
| **Agent** | `agent1@autolocation.fr` | `agent123` |

Chaque rôle est automatiquement redirigé vers son espace après connexion :
- Super Admin → `/admin`
- Company Admin → `/company`
- Agency Manager / Agent → `/agency`

---

## Fonctionnalités V2

### Backend — Nouveaux modules

| Module | Description |
|--------|-------------|
| **Invoice** | Factures + avoirs, payload figé, numérotation séquentielle annuelle par company |
| **Contract** | E-contrats (DRAFT → PENDING_SIGNATURE → SIGNED), versioning, payload figé |
| **Journal** | Événements métier automatiques + notes manuelles (RBAC) |
| **GPS** | Snapshots géolocalisation (check-in/out, incident, action manuelle) |
| **In-App Notifications** | Cycle DRAFT → SCHEDULED → SENT → READ, priorités, actions |
| **Outbox** | Pattern outbox pour émission fiable d'événements domaine |
| **BookingNumber** | Numérotation AUTO (YYYY000001) ou MANUAL, verrouillage après facture |

### Frontend — Architecture unifiée

L'application `frontend-web` (Next.js) centralise **toutes les interfaces** :

- **`/admin/*`** — Super Admin : gestion companies, abonnements, santé comptes, utilisateurs, planning global, analytics
- **`/company/*`** — Company Admin : gestion agences, utilisateurs, planning entreprise, analytics
- **`/agency/*`** — Agency Manager / Agent : véhicules, clients, réservations, amendes, maintenance, planning, **factures V2**, **contrats V2**, **journal V2**, **notifications V2**

**Anciennes apps supprimées** : `frontend-admin` (Vite) et `frontend-agency` (Vite) ont été supprimées. Toutes leurs fonctionnalités ont été migrées dans `frontend-web`.

### Protection des routes

- **Middleware Next.js** (`middleware.ts`) : vérifie le JWT et le rôle pour chaque route protégée
- **Sidebar dynamique** : affiche les menus en fonction du rôle ET des modules SaaS activés pour la company/agency

---

## Sécurité

- JWT avec refresh token rotation (cookies sécurisés)
- Middleware Next.js pour protection RBAC des routes
- Rate limiting (backend)
- Audit logs complets (backend)
- Soft delete pour les données critiques
- Validation des entrées (Zod côté frontend, class-validator côté backend)

---

## Tests

### Backend

```bash
cd backend
npm test                    # Tests unitaires
npm run test:e2e            # Tests E2E
```

### Documentation de test

- [Tests V2 et Unification](./TESTS_V2_ET_UNIFICATION.md) — Plan de test complet (126 tests)
- [Questions Préprod V2](./QUESTIONS_PREPROD_V2.md) — Revue technique complète

---

## Documentation

### Principale

- [Détails des Applications](./APPLICATIONS_DETAILS.md) — Vue d'ensemble de l'architecture
- [Spécifications complètes](./docs/specs.md)
- [API Documentation](http://localhost:3000/api/docs) (Swagger, backend démarré)
- [Ports des Applications](./PORTS_APPLICATIONS.md)

### Tests & Préprod

- [Tests V2 et Unification](./TESTS_V2_ET_UNIFICATION.md) — 126 tests fonctionnels
- [Questions Préprod V2](./QUESTIONS_PREPROD_V2.md) — Revue technique
- [Audit Unification Frontend](./AUDIT_UNIFICATION_FRONTEND.md) — Analyse migration
- [Checklist Préprod](./PREPROD_CHECKLIST.md)
- [Checklist Secrets](./CHECKLIST_SECRETS.md)
- [Sécurité JWT](./backend/SECURITE_JWT.md)

### Guides de Pilotes

- [PILOTE 1 - Backend API](./GUIDE_PILOTE_1_BACKEND.md)
- [PILOTE 4 - Mobile Agent](./GUIDE_PILOTE_4_MOBILE_AGENT.md)

> **Note :** Les guides PILOTE 2 (Frontend Agency) et PILOTE 3 (Frontend Admin) sont obsolètes — ces apps ont été fusionnées dans `frontend-web`.

---

## License

Propriétaire - MalocAuto
