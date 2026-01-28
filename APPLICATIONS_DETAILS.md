# 📋 MalocAuto - Détails des Applications

**Date :** 2025-01-26  
**Version :** 2.0.0 Enterprise  
**Statut :** Production Ready

---

## 📑 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Backend API](#backend-api)
3. [Frontend Admin (Super Admin)](#frontend-admin-super-admin)
4. [Frontend Agency (Agence)](#frontend-agency-agence)
5. [Frontend Web (Company Admin)](#frontend-web-company-admin)
6. [Mobile Agent](#mobile-agent)
7. [Configuration des Ports](#configuration-des-ports)

---

## 🎯 Vue d'ensemble

MalocAuto est une plateforme SaaS multi-tenant pour la gestion complète de location de véhicules. Elle comprend :

- **1 Backend API** (NestJS) - API REST centralisée
- **3 Applications Web** (React/Next.js) - Super Admin, Agence, Company Admin
- **1 Application Mobile** (React Native/Expo) - Agent terrain

### Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    Backend API (NestJS)                  │
│                    Port: 3000                            │
│                    PostgreSQL Database                   │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│ Frontend     │  │ Frontend     │  │ Frontend     │
│ Admin        │  │ Agency       │  │ Web          │
│ Port: 5173   │  │ Port: 8080   │  │ Port: 3001   │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                 ┌────────▼────────┐
                 │  Mobile Agent   │
                 │  Port: 8081     │
                 └─────────────────┘
```

---

## 🔧 Backend API

**Répertoire :** `backend/`  
**Framework :** NestJS 10.3.0  
**Port :** 3000  
**URL :** http://localhost:3000  
**Swagger :** http://localhost:3000/api/docs

### Stack Technique

- **Language :** TypeScript 5.3.3
- **Database :** PostgreSQL
- **ORM :** Prisma 5.7.1
- **Authentication :** JWT (Passport)
- **Validation :** class-validator + class-transformer
- **Documentation :** Swagger/OpenAPI
- **Security :** Helmet, CORS, Throttler

### Fonctionnalités Principales

- ✅ Authentification JWT (Access + Refresh tokens)
- ✅ RBAC (Role-Based Access Control)
- ✅ Audit logging complet
- ✅ Business Event Logging
- ✅ Gestion multi-tenant (Companies, Agencies)
- ✅ Modules SaaS (VEHICLES, BOOKINGS, INVOICES, MAINTENANCE, FINES, ANALYTICS)
- ✅ Règles métier implémentées (R1.3, R2.2, R3, R4, R5, R6)
- ✅ API Versioning (`/api/v1`)
- ✅ Read-Only Mode (maintenance)

### Modules API

- `/api/v1/auth` - Authentification
- `/api/v1/companies` - Gestion entreprises
- `/api/v1/agencies` - Gestion agences
- `/api/v1/users` - Gestion utilisateurs
- `/api/v1/vehicles` - Gestion véhicules
- `/api/v1/clients` - Gestion clients
- `/api/v1/bookings` - Gestion réservations
- `/api/v1/maintenance` - Gestion maintenance
- `/api/v1/fines` - Gestion amendes
- `/api/v1/planning` - Planning
- `/api/v1/analytics` - Analytics
- `/api/v1/subscriptions` - Abonnements SaaS

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

## 🎛️ Frontend Admin (Super Admin)

**Répertoire :** `frontend-admin/`  
**Framework :** React 18.2.0 + Vite 5.0.8  
**Port :** 5173  
**URL :** http://localhost:5173

### Stack Technique

- **Framework :** React 18.2.0
- **Build Tool :** Vite 5.0.8
- **Routing :** React Router DOM 6.21.1
- **State Management :** @tanstack/react-query 5.14.2
- **HTTP Client :** Axios 1.6.2
- **UI Library :** Tailwind CSS 3.3.6
- **Icons :** Lucide React 0.303.0
- **Calendar :** @fullcalendar/react 6.1.10
- **Language :** TypeScript 5.3.3

### Public Cible

- **SUPER_ADMIN** : Administrateurs système avec accès complet

### Fonctionnalités Principales

1. **Authentification** (`/login`)
   - Connexion par email/mot de passe
   - Restriction SUPER_ADMIN uniquement

2. **Dashboard** (`/`)
   - Statistiques en temps réel (4 cartes)
   - Liste entreprises récentes

3. **Gestion Entreprises** (`/companies`)
   - CRUD complet
   - Audit trail automatique

4. **Gestion Agences** (`/agencies`)
   - CRUD complet
   - Filtrage par entreprise

5. **Gestion Utilisateurs** (`/users`)
   - CRUD complet
   - Attribution rôles et agences
   - Réinitialisation mot de passe

6. **Gestion Abonnements** (`/subscriptions`)
   - Création, modification, suspension
   - Renouvellement, annulation

7. **Santé Companies** (`/company-health`)
   - Statut abonnement
   - Alertes paiement
   - Historique paiements

8. **Planning Global** (`/planning`)
   - Calendrier FullCalendar
   - Toutes les agences

9. **Analytics Global** (`/analytics`)
   - KPIs globaux plateforme
   - Top 10 entreprises/agences
   - Filtrage par période

### Démarrage

```bash
cd frontend-admin
npm install
npm run dev
```

---

## 🏢 Frontend Agency (Agence)

**Répertoire :** `frontend-agency/`  
**Framework :** React 18.2.0 + Vite 5.0.8  
**Port :** 8080  
**URL :** http://localhost:8080

### Stack Technique

- **Framework :** React 18.2.0
- **Build Tool :** Vite 5.0.8
- **Routing :** React Router DOM 6.21.1
- **State Management :** @tanstack/react-query 5.14.2
- **HTTP Client :** Axios 1.6.2
- **UI Library :** Tailwind CSS 3.3.6
- **Icons :** Lucide React 0.303.0
- **Calendar :** @fullcalendar/react 6.1.10
- **Language :** TypeScript 5.3.3

### Public Cible

- **AGENCY_MANAGER** : Gestionnaires d'agence (accès complet)
- **AGENT** : Agents opérationnels (accès limité)

### Fonctionnalités Principales

1. **Authentification** (`/login`)
   - Connexion par email/mot de passe
   - Gestion tokens JWT

2. **Dashboard** (`/`)
   - Statistiques en temps réel (4 cartes)
   - Véhicules en location
   - Locations récentes

3. **Gestion Véhicules** (`/vehicles`)
   - CRUD complet
   - Upload photo
   - Validation doublons (immatriculation)
   - Protection module VEHICLES

4. **Gestion Clients** (`/clients`)
   - CRUD complet
   - Analyse IA permis de conduire
   - Auto-remplissage depuis permis
   - Validation permis expiré

5. **Gestion Locations** (`/bookings`)
   - CRUD complet
   - Validation disponibilité
   - Validation permis (R1.3)
   - Gestion caution (R3)
   - Frais de retard (R4)
   - Temps de préparation (R2.2)
   - Protection module BOOKINGS

6. **Gestion Amendes** (`/fines`)
   - CRUD complet
   - Upload pièce jointe
   - Protection module FINES

7. **Gestion Maintenance** (`/maintenance`)
   - CRUD complet
   - Upload facture/devis
   - Validation conflits locations
   - Protection module MAINTENANCE

8. **Planning** (`/planning`)
   - Calendrier FullCalendar
   - Locations, maintenances, temps de préparation
   - Événements cliquables

9. **Analytics** (`/analytics`)
   - KPIs agence
   - Top 10 véhicules
   - Protection module ANALYTICS

### Démarrage

```bash
cd frontend-agency
npm install
npm run dev
```

---

## 🏢 Frontend Web (Company Admin)

**Répertoire :** `frontend-web/`  
**Framework :** Next.js 14.0.4  
**Port :** 3001  
**URL :** http://localhost:3001/company

### Stack Technique

- **Framework :** Next.js 14.0.4
- **Language :** TypeScript 5.3.3
- **Routing :** Next.js App Router
- **State Management :** @tanstack/react-query 5.14.2
- **HTTP Client :** Axios 1.6.2
- **UI Library :** Tailwind CSS 3.4.0
- **Icons :** Lucide React
- **Calendar :** @fullcalendar/react 6.1.10
- **Forms :** react-hook-form 7.49.2
- **Validation :** zod 3.22.4
- **Notifications :** react-hot-toast 2.6.0

### Public Cible

- **COMPANY_ADMIN** : Administrateurs d'entreprise
- **SUPER_ADMIN** : Redirigé vers `/admin`

### Fonctionnalités Principales

1. **Authentification** (`/login`)
   - Connexion par email/mot de passe
   - Restriction COMPANY_ADMIN/SUPER_ADMIN

2. **Dashboard** (`/company`)
   - Statistiques en temps réel (4 cartes)
   - Statistiques financières (3 cartes)
   - Actions rapides (4 cartes)
   - Alertes SaaS (abonnement, factures)
   - Agences récentes
   - Locations actives

3. **Gestion Agences** (`/company/agencies`)
   - CRUD complet
   - Recherche par nom
   - Filtrage automatique par companyId

4. **Gestion Utilisateurs** (`/company/users`)
   - CRUD complet
   - Attribution rôles et agences
   - Réinitialisation mot de passe
   - Recherche par nom/email/rôle
   - Filtrage automatique par companyId

5. **Planning Entreprise** (`/company/planning`)
   - Calendrier FullCalendar
   - Toutes les agences de l'entreprise
   - Filtrage par agence

6. **Analytics Entreprise** (`/company/analytics`)
   - KPIs entreprise
   - Top 10 agences
   - Répartition locations
   - Filtrage par période

### Démarrage

```bash
cd frontend-web
npm install
npm run dev -- -p 3001
```

---

## 📱 Mobile Agent

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
- **i18n :** i18next 23.7.6 + react-i18next 14.0.0
- **Storage :** expo-secure-store 15.0.8 + @react-native-async-storage/async-storage 2.2.0
- **Database :** expo-sqlite 16.0.10
- **Camera :** expo-camera 17.0.10
- **Image Picker :** expo-image-picker 17.0.10
- **Signature :** react-native-signature-canvas 3.0.0
- **Language :** TypeScript 5.1.3

### Plateformes Supportées

- iOS (iPhone, iPad)
- Android (téléphones, tablettes)
- Web (développement uniquement)

### Public Cible

- **AGENCY_MANAGER** : Managers d'agence (tous droits + création booking)
- **AGENT** : Agents opérationnels (check-in/check-out uniquement)

### Fonctionnalités Principales

1. **Authentification** (`/login`)
   - Connexion par email/mot de passe
   - Stockage sécurisé tokens (SecureStore)
   - Vérification statut Company

2. **Sélection Langue** (`/language-selection`)
   - Français, Anglais, Darija marocaine
   - Sauvegarde préférence

3. **Liste Missions** (`/bookings`)
   - Groupement par sections (En retard, Aujourd'hui, À venir, Terminées)
   - Filtrage par type (CHECK_IN, CHECK_OUT)
   - Pull-to-refresh

4. **Détails Mission** (`/bookings/:id`)
   - Informations complètes réservation
   - Boutons action selon statut

5. **Création Réservation** (`/bookings/new`) - AGENCY_MANAGER uniquement
   - Sélection agence, client, véhicule
   - Définition dates
   - Validation automatique

6. **Check-In** (`/checkin/:bookingId`)
   - Données véhicule avant
   - Documentation dommages existants
   - Vérification documents client
   - Gestion caution
   - Capture signature
   - Persistance AsyncStorage
   - Validation R1.3 (permis), R3 (caution)

7. **Check-Out** (`/checkout/:bookingId`)
   - Données véhicule après
   - Documentation nouveaux dommages
   - Calcul frais de retard (R4)
   - Gestion frais supplémentaires
   - Capture signature restitution
   - Persistance AsyncStorage

8. **Paramètres** (`/settings`)
   - Changement langue
   - Déconnexion

9. **Mode Offline**
   - Consultation missions
   - Remplissage formulaires
   - Queue SQLite locale
   - Synchronisation automatique
   - Indicateur visuel

### Règles Métier Implémentées

- **R1.3** : Validation permis (blocage si expiré/expirant)
- **R2.2** : Temps de préparation (validation chevauchement)
- **R3** : Caution (blocage check-in si non collectée)
- **R4** : Frais de retard (calcul automatique)
- **R5** : Dommages & litiges (statut DISPUTED automatique)
- **R6** : Facturation (génération automatique)

### Démarrage

```bash
cd mobile-agent
npm install
npm start
# iOS: npm run ios
# Android: npm run android
```

---

## 🔌 Configuration des Ports

| Application | Port | URL | Commande |
|------------|------|-----|----------|
| **Backend API** | **3000** | http://localhost:3000 | `cd backend && npm run dev` |
| **Frontend Web** | **3001** | http://localhost:3001 | `cd frontend-web && npm run dev -- -p 3001` |
| **Frontend Agency** | **8080** | http://localhost:8080 | `cd frontend-agency && npm run dev` |
| **Frontend Admin** | **5173** | http://localhost:5173 | `cd frontend-admin && npm run dev` |
| **Mobile Agent** | **8081** | http://localhost:8081 | `cd mobile-agent && npm start` |

### Scripts de Démarrage

**Démarrer toutes les applications :**
```bash
powershell -ExecutionPolicy Bypass -File scripts/demarrer-toutes-applications.ps1
```

**Relancer les frontends :**
```bash
powershell -ExecutionPolicy Bypass -File scripts/relancer-frontends.ps1
```

**Relancer toutes les applications en dev :**
```bash
powershell -ExecutionPolicy Bypass -File scripts/relancer-toutes-applications-dev.ps1
```

---

## 📚 Documentation Complète

Pour plus de détails sur chaque application, consultez :

- **Backend API :** `backend/README.md`
- **Frontend Admin :** Voir section [Frontend Admin](#frontend-admin-super-admin) ci-dessus
- **Frontend Agency :** Voir section [Frontend Agency](#frontend-agency-agence) ci-dessus
- **Frontend Web :** Voir section [Frontend Web](#frontend-web-company-admin) ci-dessus
- **Mobile Agent :** Voir section [Mobile Agent](#mobile-agent) ci-dessus

### Guides de Pilotes

- **PILOTE 1 - Backend API :** `GUIDE_PILOTE_1_BACKEND.md`
- **PILOTE 2 - Frontend Agency :** `GUIDE_PILOTE_2_FRONTEND_AGENCY.md`
- **PILOTE 3 - Frontend Admin :** `GUIDE_PILOTE_3_FRONTEND_ADMIN.md`
- **PILOTE 4 - Mobile Agent :** `GUIDE_PILOTE_4_MOBILE_AGENT.md`

---

**Dernière mise à jour :** 2025-01-26  
**Version :** 2.0.0 Enterprise  
**Statut :** ✅ Production Ready



