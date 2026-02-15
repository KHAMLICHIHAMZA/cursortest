# MalocAuto - Détails des Applications

**Date :** 2026-01-28  
**Version :** 2.0.0 (V2 + Unification Frontend)  
**Statut :** Branche `v2-preprod` — En cours de validation

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Backend API](#backend-api)
3. [Frontend Web unifié](#frontend-web-unifié)
4. [Mobile Agent](#mobile-agent)
5. [Proxy (port unique)](#proxy-port-unique)
6. [Configuration des Ports](#configuration-des-ports)

---

## Vue d'ensemble

MalocAuto est une plateforme SaaS multi-tenant pour la gestion complète de location de véhicules. En V2, l'architecture frontend a été **unifiée** :

- **1 Backend API** (NestJS) — API REST centralisée avec modules V2
- **1 Application Web unifiée** (Next.js) — Gère Super Admin, Company Admin et Agency
- **1 Application Mobile** (React Native/Expo) — Agent terrain
- **1 Reverse Proxy** (Express) — Port unique 8080

> **Changement majeur V2** : Les anciennes applications `frontend-admin` (Vite) et `frontend-agency` (Vite) ont été **supprimées**. Toutes leurs fonctionnalités ont été migrées dans `frontend-web` (Next.js).

### Architecture V2

```
                    ┌─────────────────────────┐
   Navigateur ────► │   Proxy Express (8080)  │
                    └──────────┬──────────────┘
                               │
                  ┌────────────┼────────────┐
                  │                         │
       ┌──────────▼──────────┐   ┌──────────▼──────────┐
       │  Frontend Web       │   │  Backend API         │
       │  Next.js (3001)     │   │  NestJS (3000)       │
       │                     │   │                      │
       │  /login             │   │  /api/v1/auth        │
       │  /admin/*           │   │  /api/v1/companies   │
       │  /company/*         │   │  /api/v1/agencies    │
       │  /agency/*          │   │  /api/v1/vehicles    │
       │                     │   │  /api/v1/bookings    │
       │  Middleware RBAC    │   │  /api/v1/invoices    │
       │  Sidebar dynamique  │   │  /api/v1/contracts   │
       │  Module filtering   │   │  /api/v1/journal     │
       └─────────────────────┘   │  /api/v1/gps         │
                                 │  /api/v1/notifications│
       ┌─────────────────────┐   └──────────────────────┘
       │  Mobile Agent       │
       │  Expo (8081)        │
       │  iOS / Android      │
       └─────────────────────┘
```

---

## Backend API

**Répertoire :** `backend/`  
**Framework :** NestJS 10.3.0  
**Port :** 3000  
**URL :** http://localhost:3000  
**Swagger :** http://localhost:3000/api/docs

### Stack Technique

- **Language :** TypeScript 5.3.3
- **Database :** PostgreSQL
- **ORM :** Prisma 5.7.1
- **Authentication :** JWT (Passport) — Access + Refresh tokens
- **Validation :** class-validator + class-transformer
- **Documentation :** Swagger/OpenAPI
- **Security :** Helmet, CORS, Throttler

### Modules existants (V1)

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `/api/v1/auth` | Login, refresh, forgot/reset password |
| Companies | `/api/v1/companies` | CRUD entreprises |
| Agencies | `/api/v1/agencies` | CRUD agences |
| Users | `/api/v1/users` | CRUD utilisateurs, attribution rôles |
| Vehicles | `/api/v1/vehicles` | CRUD véhicules, upload photo |
| Clients | `/api/v1/clients` | CRUD clients, analyse IA permis |
| Bookings | `/api/v1/bookings` | CRUD locations, check-in/out |
| Maintenance | `/api/v1/maintenance` | Gestion entretiens |
| Fines | `/api/v1/fines` | Gestion amendes |
| Planning | `/api/v1/planning` | Planning calendrier |
| Analytics | `/api/v1/analytics` | KPIs et statistiques |
| Subscriptions | `/api/v1/subscriptions` | Abonnements SaaS |
| Modules | `/api/v1/modules` | Feature flags SaaS |
| Audit | `/api/v1/audit` | Logs d'audit |

### Modules V2 (nouveaux)

| Module | Endpoint | Description |
|--------|----------|-------------|
| **Invoice** | `/api/v1/invoices` | Factures + avoirs, payload figé, numérotation séquentielle annuelle, timezone Maroc |
| **Contract** | `/api/v1/contracts` | E-contrats DRAFT → PENDING_SIGNATURE → SIGNED, versioning, payload figé |
| **Journal** | `/api/v1/journal` | Événements domaine immutables + notes manuelles (RBAC création/modification/suppression) |
| **GPS** | `/api/v1/gps` | Snapshots géolocalisation (check-in/out, incident, action manuelle), tag "GPS missing" |
| **In-App Notifications** | `/api/v1/notifications` | Cycle DRAFT → SCHEDULED → SENT → READ, priorités, actions URL |
| **Outbox** | (interne) | Pattern outbox pour émission fiable d'événements domaine |
| **BookingNumber** | (via bookings) | Numérotation AUTO (YYYY000001) / MANUAL, unicité par company, verrouillage après facture |

### Règles Métier

- **R1.3** : Validation permis de conduire (blocage si expiré)
- **R2.2** : Temps de préparation véhicule (validation chevauchement)
- **R3** : Caution (blocage check-in si non collectée)
- **R4** : Frais de retard (calcul automatique)
- **R5** : Dommages & litiges (statut DISPUTED automatique)
- **R6** : Facturation (génération automatique)

### Démarrage

```bash
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL et autres variables
npx prisma migrate dev
npx prisma db seed
npm run dev
```

---

## Frontend Web unifié

**Répertoire :** `frontend-web/`  
**Framework :** Next.js 14.0.4  
**Port :** 3001  
**URL directe :** http://localhost:3001  
**URL via proxy :** http://localhost:8080

### Stack Technique

- **Framework :** Next.js 14.0.4 (App Router)
- **Language :** TypeScript 5.3.3
- **State Management :** @tanstack/react-query 5.14.2
- **HTTP Client :** Axios (apiClient avec refresh token automatique)
- **UI Library :** Tailwind CSS 3.4.0
- **Icons :** Lucide React
- **Calendar :** @fullcalendar/react 6.1.10
- **Forms :** react-hook-form 7.49.2
- **Validation :** zod 3.22.4
- **Notifications :** react-hot-toast 2.6.0

### Rôles et routes

| Rôle | Routes | Redirection après login |
|------|--------|------------------------|
| **SUPER_ADMIN** | `/admin/*` | `/admin` |
| **COMPANY_ADMIN** | `/company/*` | `/company` |
| **AGENCY_MANAGER** | `/agency/*` | `/agency` |
| **AGENT** | `/agency/*` | `/agency` |

### Protection des routes

- **`middleware.ts`** : Intercepte chaque requête, vérifie le JWT et le rôle. Redirige vers `/login` si non authentifié ou vers l'espace du rôle si mauvais chemin.
- **Sidebar dynamique** (`components/layout/sidebar.tsx`) : Filtre les menus en fonction du rôle ET des modules SaaS activés pour la company/agency de l'utilisateur.

### Pages Super Admin (`/admin/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Statistiques globales, entreprises récentes |
| Companies | `/admin/companies` | CRUD entreprises, audit trail |
| Agencies | `/admin/agencies` | CRUD agences, filtrage par entreprise |
| Users | `/admin/users` | CRUD utilisateurs, attribution rôles |
| **Subscriptions** | `/admin/subscriptions` | Gestion abonnements (créer, suspendre, renouveler, annuler) |
| **Company Health** | `/admin/company-health` | Santé comptes, alertes expiration, factures |
| Planning | `/admin/planning` | Planning global toutes agences |
| Analytics | `/admin/analytics` | KPIs globaux, top 10 entreprises/agences |

### Pages Company Admin (`/company/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/company` | Statistiques entreprise, alertes SaaS |
| Agencies | `/company/agencies` | CRUD agences de l'entreprise |
| Users | `/company/users` | CRUD utilisateurs, attribution rôles/agences |
| Planning | `/company/planning` | Planning entreprise, filtrage par agence |
| Analytics | `/company/analytics` | KPIs entreprise, top 10 agences |

### Pages Agency (`/agency/*`)

| Page | Route | Module requis | Description |
|------|-------|---------------|-------------|
| Dashboard | `/agency` | — | Statistiques agence |
| Vehicles | `/agency/vehicles` | VEHICLES | CRUD véhicules, upload photo |
| Clients | `/agency/clients` | — | CRUD clients, analyse IA permis |
| Bookings | `/agency/bookings` | BOOKINGS | CRUD locations, check-in/out |
| Fines | `/agency/fines` | FINES | CRUD amendes |
| Maintenance | `/agency/maintenance` | MAINTENANCE | CRUD maintenance |
| Planning | `/agency/planning` | — | Planning calendrier agence |
| Analytics | `/agency/analytics` | ANALYTICS | KPIs agence |
| **Invoices** | `/agency/invoices` | INVOICES | Factures V2 + avoirs, téléchargement PDF |
| **Contracts** | `/agency/contracts` | — | Contrats V2, signatures, versions, PDF |
| **Journal** | `/agency/journal` | — | Journal activité, notes manuelles (manager) |
| **Notifications** | `/agency/notifications` | — | Notifications in-app, marquer lu |

### Démarrage

```bash
cd frontend-web
npm install
npm run dev -- -p 3001
```

---

## Mobile Agent

**Répertoire :** `mobile-agent/`  
**Framework :** React Native 0.81.5 + Expo SDK 54  
**Port :** 8081  
**URL :** http://localhost:8081

### Stack Technique

- **Framework :** React Native 0.81.5
- **Build Tool :** Expo SDK 54
- **Navigation :** @react-navigation/native 6.1.9
- **State Management :** @tanstack/react-query 5.17.0
- **HTTP Client :** axios 1.6.2
- **Validation :** zod 3.22.4
- **i18n :** i18next + react-i18next (FR, EN, Darija)
- **Storage :** expo-secure-store + @react-native-async-storage
- **Database :** expo-sqlite (offline queue)
- **Camera/Image :** expo-camera, expo-image-picker
- **Signature :** react-native-signature-canvas

### Public Cible

- **AGENCY_MANAGER** : Tous droits + création booking
- **AGENT** : Check-in / check-out uniquement

### Fonctionnalités

1. **Authentification** — Login, stockage sécurisé tokens
2. **Sélection Langue** — FR, EN, Darija marocaine
3. **Liste Missions** — Groupement (En retard, Aujourd'hui, À venir, Terminées)
4. **Check-In** — État véhicule, dommages, documents, caution, signature
5. **Check-Out** — État retour, nouveaux dommages, frais retard, signature
6. **Mode Offline** — Queue SQLite locale, synchronisation automatique

### Services V2 (nouveaux)

- **contract.service.ts** : Gestion contrats depuis mobile
- **gps.service.ts** : Envoi snapshots GPS
- **notification.service.ts** : Réception notifications in-app

### Démarrage

```bash
cd mobile-agent
npm install
npm start
# iOS: npm run ios
# Android: npm run android
```

---

## Proxy (port unique)

**Répertoire :** `proxy/`  
**Framework :** Express + http-proxy-middleware  
**Port :** 8080

### Fonctionnement

Le proxy route le trafic vers les services internes :

| Chemin | Cible | Service |
|--------|-------|---------|
| `/api/*` | `http://localhost:3000` | Backend NestJS |
| `/*` (tout le reste) | `http://localhost:3001` | Frontend Web Next.js |

### Configuration

Variables d'environnement (optionnelles) :
- `PROXY_PORT` : Port du proxy (défaut : 8080)
- `BACKEND_URL` : URL backend (défaut : http://localhost:3000)
- `WEB_URL` : URL frontend (défaut : http://localhost:3001)

---

## Configuration des Ports

| Application | Port | URL | Commande |
|-------------|------|-----|----------|
| **Proxy (point d'entrée)** | **8080** | http://localhost:8080 | `npm run dev` (racine) |
| **Backend API** | 3000 | http://localhost:3000 | `cd backend && npm run dev` |
| **Frontend Web** | 3001 | http://localhost:3001 | `cd frontend-web && npm run dev -- -p 3001` |
| **Mobile Agent** | 8081 | http://localhost:8081 | `cd mobile-agent && npm start` |

### Lancement tout-en-un (recommandé)

```bash
# À la racine du projet
npm install
npm run dev
```

Lance simultanément : backend (3000) + frontend-web (3001) + proxy (8080)

### Vérification des ports (PowerShell)

```powershell
Get-NetTCPConnection | Where-Object {$_.LocalPort -in @(3000, 3001, 8080, 8081)} | Select-Object LocalPort, State
```

---

## Applications supprimées (V2)

Les applications suivantes ont été **supprimées** et leurs fonctionnalités **migrées** dans `frontend-web` :

| Application | Ancien port | Raison suppression |
|-------------|-------------|-------------------|
| `frontend-admin/` (Vite + React) | 5173 | Pages migrées vers `/admin/*` dans frontend-web |
| `frontend-agency/` (Vite + React) | 8080 | Pages migrées vers `/agency/*` dans frontend-web |

---

**Dernière mise à jour :** 2026-01-28  
**Version :** 2.0.0 V2 + Unification  
**Branche :** `v2-preprod`
