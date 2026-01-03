# 📋 MalocAuto - Application Company Admin
## Spécifications Techniques et Fonctionnelles Complètes

**Version:** 2.0.0 Enterprise  
**Date:** Décembre 2024  
**Type:** Application Web SaaS - Module Company Administration  
**Statut:** Production Ready - Enterprise Features

---

## 📑 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack Technique](#stack-technique)
3. [Architecture](#architecture)
4. [Modules et Fonctionnalités](#modules-et-fonctionnalités)
5. [Spécifications des Écrans](#spécifications-des-écrans)
6. [Use Cases par Module](#use-cases-par-module)
7. [Détails Techniques](#détails-techniques)
8. [Schéma de Base de Données](#schéma-de-base-de-données)
9. [API Endpoints](#api-endpoints)
10. [Tests et Validation](#tests-et-validation)

---

## 🎯 Vue d'ensemble

### Description
MalocAuto Company Admin est une application web moderne permettant aux administrateurs d'entreprise de gérer leurs agences, leurs utilisateurs, leur planning et leurs analytics. L'application offre une interface intuitive avec un design moderne pour gérer toutes les opérations au niveau de l'entreprise.

### Objectifs
- Gérer les agences de l'entreprise avec leurs configurations
- Gérer les utilisateurs de l'entreprise avec leurs rôles et permissions
- Visualiser le planning de toutes les agences de l'entreprise
- Accéder aux analytics de l'entreprise
- Dashboard avec statistiques en temps réel

### Public Cible
- **COMPANY_ADMIN** : Administrateurs d'entreprise avec accès à leurs propres agences et utilisateurs
- **SUPER_ADMIN** : Peut également accéder à cette interface (redirigé vers /admin)

---

## 🏢 Fonctionnalités Enterprise

### Data Governance & Audit Trail
- **Champs d'audit automatiques** : Tous les enregistrements (Agencies, Users) incluent :
  - `createdByUserId` - Utilisateur qui a créé l'enregistrement
  - `updatedByUserId` - Utilisateur qui a modifié l'enregistrement
  - `deletedByUserId` - Utilisateur qui a supprimé l'enregistrement
  - `deletedReason` - Raison de la suppression (optionnel)
- **Traçabilité complète** : Tous les changements sont automatiquement tracés
- **Exclusion des champs d'audit** : Les champs d'audit ne sont jamais exposés dans les réponses API publiques

### RBAC (Role-Based Access Control)
- **Système de permissions granulaire** :
  - **COMPANY_ADMIN** : Accès complet aux agences et utilisateurs de sa propre entreprise
  - **SUPER_ADMIN** : Accès complet (redirigé vers /admin)
- **Protection au niveau backend** : Guards de permissions sur tous les endpoints
- **Protection au niveau frontend** : Restriction d'accès basée sur le rôle et le companyId
- **Filtrage automatique** : Les données sont automatiquement filtrées par `companyId` de l'utilisateur connecté

### Business Event Logging
- **Logging automatique** : Tous les événements métier sont loggés dans `BusinessEventLog`
- **Types d'événements** : 
  - `AGENCY_CREATED`, `AGENCY_UPDATED`, `AGENCY_DELETED`
  - `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`
- **Stockage** : État avant/après en JSON pour traçabilité complète
- **Performance** : Logging asynchrone et non-bloquant

### Analytics & KPIs Entreprise
- **Module Analytics Entreprise** : KPIs calculés en temps réel pour l'entreprise
- **Métriques disponibles** :
  - Nombre total d'agences
  - Nombre total d'utilisateurs
  - Nombre total de véhicules
  - Nombre total de locations
  - Revenus totaux et par véhicule
  - Taux d'occupation
  - Durée moyenne de location
  - Top 10 des agences les plus actives
  - Répartition des locations (terminées/actives)
- **Accès restreint** : Seulement pour COMPANY_ADMIN et SUPER_ADMIN
- **Filtrage par période** : Possibilité de filtrer les KPIs par date de début et de fin

### API Versioning
- **Version actuelle** : `/api/v1`
- **Structure prête** : Pour futures versions `/api/v2`
- **Swagger mis à jour** : Documentation reflète la versioning

### Read-Only Mode
- **Mode maintenance** : Variable d'environnement `READ_ONLY_MODE=true`
- **Protection** : Bloque toutes les opérations d'écriture (POST, PUT, PATCH, DELETE)
- **Lecture préservée** : Les opérations de lecture (GET) restent fonctionnelles

### SaaS Billing & Module Management
- **Gestion des abonnements** : Visualisation de l'abonnement actuel, jours restants, alertes
- **Gestion des modules** : Activation/désactivation des modules par company et agency
- **Héritage des modules** : Les agences héritent automatiquement des modules de leur company
- **Permissions UserAgency** : Gestion des permissions READ/WRITE/FULL par utilisateur et agence
- **Cycle de vie automatique** : Suspension automatique après expiration, suppression J+100
- **Notifications** : Alertes pour abonnement expirant et factures en retard

### Gestion des Erreurs 403
- **Modules non activés** : Affichage de messages clairs quand un module n'est pas inclus
- **Composants dédiés** : `ModuleNotIncluded` et `FeatureNotIncluded` pour UX optimale
- **Désactivation des actions** : Boutons désactivés si module non actif

---

## 🛠️ Stack Technique

### Frontend
```json
{
  "framework": "Next.js 14.0.4",
  "language": "TypeScript 5.3.3",
  "routing": "Next.js App Router",
  "state_management": "@tanstack/react-query 5.14.2",
  "http_client": "Axios 1.6.2",
  "ui_library": "Tailwind CSS 3.4.0",
  "icons": "Lucide React",
  "calendar": "@fullcalendar/react 6.1.10",
  "forms": "react-hook-form 7.49.2",
  "validation": "zod 3.22.4",
  "notifications": "react-hot-toast 2.6.0"
}
```

**Port de développement:** `3001` (configurable)  
**URL:** `http://localhost:3001/company`

### Backend
```json
{
  "framework": "NestJS 10.3.0",
  "language": "TypeScript 5.3.3",
  "database": "PostgreSQL",
  "orm": "Prisma 5.7.1",
  "authentication": "JWT (Passport)",
  "validation": "class-validator + class-transformer",
  "documentation": "Swagger/OpenAPI",
  "security": "Helmet, CORS, Throttler"
}
```

**Port:** `3000`  
**URL API:** `http://localhost:3000/api/v1` (Version 1)  
**Swagger:** `http://localhost:3000/api/docs`

### Infrastructure
- **Base de données:** PostgreSQL
- **Stockage fichiers:** Système de fichiers local (`/uploads`)
- **Authentification:** JWT avec refresh tokens

---

## 🏗️ Architecture

### Structure Frontend
```
frontend-web/
├── app/
│   ├── company/              # Pages Company Admin
│   │   ├── page.tsx          # Dashboard
│   │   ├── agencies/         # Gestion agences
│   │   │   ├── page.tsx      # Liste
│   │   │   ├── new/          # Création
│   │   │   └── [id]/         # Édition
│   │   ├── users/            # Gestion utilisateurs
│   │   │   ├── page.tsx      # Liste
│   │   │   ├── new/          # Création
│   │   │   └── [id]/         # Édition
│   │   ├── analytics/        # Analytics
│   │   └── planning/         # Planning
│   ├── components/           # Composants réutilisables
│   │   ├── layout/           # Layout avec sidebar
│   │   └── ui/               # Composants UI
│   └── lib/                  # Utilitaires
│       └── api/              # Clients API
```

### Structure Backend
```
backend/
├── src/
│   ├── modules/              # Modules métier
│   │   ├── auth/            # Authentification
│   │   ├── agency/          # Gestion agences
│   │   ├── user/            # Gestion utilisateurs
│   │   ├── planning/        # Planning
│   │   └── analytics/       # Analytics
│   ├── common/              # Services partagés
│   │   ├── prisma/         # Service Prisma
│   │   └── services/       # Services communs
│   └── main.ts             # Point d'entrée
├── prisma/
│   └── schema.prisma        # Schéma de base de données
└── uploads/                 # Stockage fichiers
```

### Flux de Données
```
Frontend Company (Next.js) 
    ↓ (HTTP/HTTPS)
Backend API (NestJS)
    ↓ (Prisma ORM)
PostgreSQL Database
```

---

## 📦 Modules et Fonctionnalités

### 1. Authentification (`/login`)

**Fonctionnalités:**
- Connexion par email et mot de passe
- Gestion des tokens JWT (access + refresh)
- Stockage du token dans les cookies
- Redirection automatique si non authentifié
- **Restriction d'accès** : Seuls les utilisateurs avec le rôle `COMPANY_ADMIN` ou `SUPER_ADMIN` peuvent accéder
- Gestion des erreurs avec messages clairs

**Champs du formulaire:**
- **Email** (obligatoire, type: email)
- **Mot de passe** (obligatoire, type: password)

**Validation:**
- Email valide
- Mot de passe non vide
- Vérification du rôle COMPANY_ADMIN ou SUPER_ADMIN
- Affichage d'erreurs spécifiques

**Permissions:**
- Utilisateurs avec le rôle `COMPANY_ADMIN` : Accès à `/company/*`
- Utilisateurs avec le rôle `SUPER_ADMIN` : Redirigés vers `/admin`

---

### 2. Dashboard (`/company`)

**Fonctionnalités:**
- Statistiques en temps réel (4 cartes cliquables)
- Statistiques financières (3 cartes)
- Actions rapides (4 cartes)
- **Alertes SaaS** (abonnement expirant, factures en retard)
- Liste des agences récentes (5 dernières)
- Liste des locations actives (5 dernières)

**Alertes SaaS:**
- **Abonnement expirant** : Alerte si expiration < 30 jours avec nombre de jours restants
- **Factures en retard** : Alerte si factures non payées avec nombre de factures
- **Statut de l'abonnement** : Affichage du plan actuel et dates
- **Jours restants** : Calcul automatique jusqu'à la date de fin

**Statistiques affichées:**
1. **Agences** - Nombre total d'agences (cliquable → `/company/agencies`)
2. **Utilisateurs** - Nombre total d'utilisateurs actifs (cliquable → `/company/users`)
3. **Véhicules** - Nombre total de véhicules
4. **Locations actives** - Nombre de locations en cours

**Statistiques financières:**
1. **Revenus totaux** - Revenus des locations terminées
2. **Revenus par véhicule** - Moyenne des revenus par véhicule
3. **Taux d'occupation** - Pourcentage de véhicules actuellement loués

**Actions rapides:**
- Gérer les agences
- Gérer les utilisateurs
- Analytics
- Planning

**Sections:**
- **Agences récentes:** Affiche les 5 dernières agences avec :
  - Nom de l'agence
  - Nombre de véhicules
  - Nombre de locations
  - Clic pour voir les détails
- **Locations actives:** Affiche les 5 dernières locations actives avec :
  - Véhicule (marque + modèle)
  - Client
  - Agence
  - Badge de statut

**Interactivité:**
- Cartes cliquables pour navigation rapide
- Hover effects sur les cartes
- Transitions fluides

---

### 3. Gestion des Agences (`/company/agencies`)

**Fonctionnalités:**
- Liste de toutes les agences de l'entreprise avec recherche
- Création d'agence avec formulaire complet
- Modification d'agence existante
- Suppression d'agence (soft delete) avec confirmation
- Filtrage automatique par `companyId`
- **Enterprise:** 
  - Champs d'audit automatiques
  - Logging automatique des événements (AGENCY_CREATED, AGENCY_UPDATED, AGENCY_DELETED)
  - Permissions RBAC : COMPANY_ADMIN peut créer/modifier/supprimer ses propres agences

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Nom | Text | Oui | Nom de l'agence |
| Téléphone | Tel | Non | Numéro de téléphone |
| Adresse | Text | Non | Adresse complète |
| **Statut** | Select | Oui | ACTIVE, SUSPENDED, DELETED (SaaS) |
| **Fuseau horaire** | Select | Non | Timezone (défaut: Africa/Casablanca) |
| **Capacité** | Number | Non | Capacité maximale de l'agence |
| **Modules actifs** | Multi-select | Non | Modules activés pour cette agence |

**Tableau d'affichage:**
- Nom (avec icône)
- Téléphone
- Adresse
- Nombre de véhicules
- Actions (Éditer, Supprimer)

**Recherche:**
- Recherche par nom d'agence
- Filtrage en temps réel

**Validations:**
- Nom obligatoire
- `companyId` automatiquement assigné depuis l'utilisateur connecté
- Vérification des permissions (COMPANY_ADMIN ne peut modifier que ses propres agences)

**Use Cases:**
- **UC-AGY-001:** Créer une nouvelle agence
- **UC-AGY-002:** Modifier une agence existante
- **UC-AGY-003:** Supprimer une agence
- **UC-AGY-004:** Voir la liste de toutes les agences de l'entreprise
- **UC-AGY-005:** Rechercher une agence par nom

---

### 4. Gestion des Utilisateurs (`/company/users`)

**Fonctionnalités:**
- Liste de tous les utilisateurs de l'entreprise avec recherche
- Création d'utilisateur avec formulaire complet
- Modification d'utilisateur existant
- Suppression d'utilisateur (soft delete) avec confirmation
- Réinitialisation de mot de passe
- Attribution de rôles et d'agences
- Filtrage automatique par `companyId`
- **Enterprise:** 
  - Champs d'audit automatiques
  - Logging automatique des événements (USER_CREATED, USER_UPDATED, USER_DELETED)
  - Permissions RBAC : COMPANY_ADMIN peut créer/modifier/supprimer ses propres utilisateurs

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Nom | Text | Oui | Nom complet de l'utilisateur |
| Email | Email | Oui | Adresse email (unique) |
| Rôle | Select | Oui | AGENT, AGENCY_MANAGER, COMPANY_ADMIN |
| Agences | Multi-select | Non | Agences assignées (si AGENCY_MANAGER ou AGENT) |
| **Permissions par agence** | Object | Non | READ, WRITE, FULL par agence (SaaS) |
| Actif | Checkbox | Oui | Statut actif/inactif |

**Tableau d'affichage:**
- Utilisateur (nom avec avatar)
- Email
- Rôle (badge coloré)
- Nombre d'agences assignées
- Statut (Actif/Inactif) avec badge coloré
- Actions (Réinitialiser mot de passe, Éditer, Supprimer)

**Recherche:**
- Recherche par nom, email ou rôle
- Filtrage en temps réel

**Validations:**
- Email unique
- Rôle valide (AGENT, AGENCY_MANAGER, COMPANY_ADMIN)
- `companyId` automatiquement assigné depuis l'utilisateur connecté
- Si AGENCY_MANAGER ou AGENT : Au moins une agence obligatoire

**Use Cases:**
- **UC-USER-001:** Créer un nouvel utilisateur
- **UC-USER-002:** Modifier un utilisateur existant
- **UC-USER-003:** Supprimer un utilisateur
- **UC-USER-004:** Réinitialiser le mot de passe d'un utilisateur
- **UC-USER-005:** Assigner des agences à un utilisateur
- **UC-USER-006:** Activer/Désactiver un utilisateur
- **UC-USER-007:** Rechercher un utilisateur

---

### 5. Planning Entreprise (`/company/planning`)

**Fonctionnalités:**
- Vue calendrier interactive (FullCalendar)
- Affichage des locations, maintenances et temps de préparation de toutes les agences de l'entreprise
- Filtrage par agence
- Événements cliquables avec modal de détails
- Navigation vers les détails complets
- Couleurs distinctes par type d'événement
- **Enterprise:** Permissions RBAC pour l'accès au planning

**Types d'événements:**
- **BOOKING** (Location) - Bleu
- **MAINTENANCE** (Maintenance) - Rouge
- **PREPARATION_TIME** (Temps de préparation) - Orange

**Filtres:**
- Sélection d'agence (toutes les agences ou une agence spécifique)
- Filtrage en temps réel

**Modal de détails:**
- Informations complètes de l'événement
- Client (pour les locations)
- Véhicule
- Agence
- Dates et heures
- Statut
- Bouton pour voir les détails complets

**Interactivité:**
- Clic sur un événement → Modal avec détails
- Navigation vers page de détails
- Hover effects sur les événements
- Couleurs dynamiques selon le statut

**Use Cases:**
- **UC-PLAN-001:** Voir le planning de toutes les agences de l'entreprise
- **UC-PLAN-002:** Filtrer le planning par agence
- **UC-PLAN-003:** Voir les détails d'un événement
- **UC-PLAN-004:** Naviguer vers les détails complets d'une location/maintenance

---

### 6. Analytics Entreprise (`/company/analytics`) - Enterprise Feature

**Fonctionnalités:**
- Dashboard de KPIs en temps réel pour l'entreprise
- Métriques calculées automatiquement depuis les données existantes
- Filtrage par période (date de début et date de fin)
- **Accès:** Seulement pour COMPANY_ADMIN et SUPER_ADMIN

**KPIs disponibles:**

| KPI | Description |
|-----|-------------|
| Agences | Nombre total d'agences |
| Véhicules | Nombre total de véhicules |
| Locations | Nombre total de locations (avec nombre de terminées) |
| Revenus totaux | Revenus totaux en euros (avec revenus par véhicule) |
| Taux d'occupation | Taux d'occupation des véhicules (%) |
| Durée moyenne | Durée moyenne de location (jours) |

**Top Lists:**
- **Top 10 des agences les plus actives** : Classées par nombre de locations
- **Répartition des locations** : Graphique avec locations terminées vs actives

**Filtrage:**
- Date de début (optionnel)
- Date de fin (optionnel)
- Les KPIs sont recalculés selon la période sélectionnée

**Endpoint API:**
```
GET /api/v1/analytics/agency/:agencyId/kpis?startDate=&endDate=
```
(Calculé côté frontend pour toutes les agences de l'entreprise)

**Permissions:**
- `analytics:read` - Seulement COMPANY_ADMIN, SUPER_ADMIN

**Use Cases:**
- **UC-ANAL-001:** Voir les KPIs de l'entreprise
- **UC-ANAL-002:** Filtrer les KPIs par période
- **UC-ANAL-003:** Voir le top 10 des agences les plus actives
- **UC-ANAL-004:** Voir la répartition des locations

---

## 📱 Spécifications des Écrans

### Dashboard (`/company`)

**Layout:**
- Sidebar à gauche (navigation)
- Zone principale avec :
  - Titre "Tableau de bord Entreprise"
  - 4 cartes de statistiques principales (grid 2x2 ou 4 colonnes)
  - 3 cartes de statistiques financières (grid 3 colonnes)
  - 4 cartes d'actions rapides (grid 4 colonnes)
  - 2 sections : Agences récentes et Locations actives

**Cartes de statistiques:**
- Icône colorée
- Valeur en grand
- Label en dessous
- Hover effect avec changement de couleur de bordure
- Clic → Navigation vers la page correspondante

**Section agences récentes:**
- Liste des 5 dernières agences
- Pour chaque agence :
  - Nom
  - Nombre de véhicules et locations
  - Clic pour voir les détails

**Section locations actives:**
- Liste des 5 dernières locations actives
- Pour chaque location :
  - Véhicule (marque + modèle)
  - Client et agence
  - Badge de statut

---

### Gestion des Agences (`/company/agencies`)

**Layout:**
- Header avec titre et bouton "Nouvelle agence"
- Barre de recherche
- Tableau avec toutes les agences
- Page de création/édition avec formulaire

**Tableau:**
- Colonnes : Nom, Téléphone, Adresse, Véhicules, Actions
- Lignes cliquables (hover effect)
- Actions : Éditer, Supprimer

**Page de création/édition:**
- Formulaire avec tous les champs
- Boutons "Annuler" et "Enregistrer"
- Gestion des erreurs et messages de succès
- États de chargement sur les boutons

---

### Gestion des Utilisateurs (`/company/users`)

**Layout:**
- Similaire à la page Agencies
- Header avec titre et bouton "Nouvel utilisateur"
- Barre de recherche
- Tableau avec tous les utilisateurs
- Page de création/édition avec formulaire

**Tableau:**
- Colonnes : Utilisateur, Email, Rôle, Agences, Statut, Actions
- Badges colorés pour le rôle et le statut
- Actions : Réinitialiser mot de passe, Éditer, Supprimer

**Page de création/édition:**
- Formulaire complet avec :
  - Champs de base (nom, email)
  - Sélection de rôle
  - Multi-select d'agences (conditionnel selon le rôle)
  - Checkbox pour statut actif

---

### Planning Entreprise (`/company/planning`)

**Layout:**
- Calendrier FullCalendar en plein écran
- Filtres en haut (sélection d'agence)
- Modal pour détails d'événement

**Calendrier:**
- Vue par défaut : Timeline ou Agenda
- Événements colorés selon le type
- Clic sur événement → Modal avec détails

---

### Analytics Entreprise (`/company/analytics`)

**Layout:**
- Header avec titre et filtres de date
- Grid de cartes de KPIs (6 cartes)
- Sections pour les top lists et graphiques

**Cartes de KPIs:**
- Icône colorée
- Valeur principale en grand
- Sous-valeur (si applicable)
- Label

**Top Lists:**
- Tableaux avec classement
- Nombre de locations
- Informations de l'agence

**Graphiques:**
- Barres de progression pour la répartition
- Couleurs distinctes (vert pour terminées, bleu pour actives)

---

## 🔧 Détails Techniques

### Authentification

**Flow:**
1. Utilisateur saisit email/mot de passe
2. POST `/api/v1/auth/login`
3. Backend vérifie les credentials et le rôle
4. Retourne `accessToken` et `refreshToken`
5. Frontend stocke les tokens dans les cookies
6. Toutes les requêtes suivantes incluent `Authorization: Bearer <token>`

**Stockage:**
- `Cookies.set('accessToken', accessToken)`
- `Cookies.set('refreshToken', refreshToken)`

**Protection des routes:**
- Composant `RouteGuard` vérifie la présence du token et le rôle
- Redirection vers `/login` si non authentifié
- Vérification du rôle COMPANY_ADMIN ou SUPER_ADMIN

---

### Gestion d'État

**React Query:**
- Utilisé pour toutes les requêtes API
- Cache automatique
- Invalidation lors des mutations
- Refetch automatique

**Exemple:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['agencies'],
  queryFn: () => agencyApi.getAll(),
  enabled: !!user?.companyId,
});
```

**Filtrage automatique:**
- Toutes les données sont automatiquement filtrées par `companyId` de l'utilisateur connecté
- Fait côté frontend avec `useMemo` pour optimiser les performances

---

### API Client

**Configuration Axios:**
- Base URL : `/api/v1`
- Intercepteur pour ajouter le token JWT
- Gestion des erreurs centralisée
- Configuration dans `lib/api/*.ts`

**Exemple:**
```typescript
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### UI/UX

**Design System:**
- Couleur principale : Définie dans le design system
- Fond sombre : Thème cohérent avec les autres applications
- Cartes : Composants réutilisables
- Badges : Colorés selon le statut
- Boutons : Avec états de chargement

**Composants réutilisables:**
- Layout avec sidebar
- FormCard pour les formulaires
- Table pour les tableaux
- StatCard pour les statistiques
- LoadingState, EmptyState, ErrorState
- ConfirmDialog pour les confirmations

**Responsive:**
- Grid adaptatif (1 colonne mobile, 2-4 colonnes desktop)
- Tableaux scrollables horizontalement sur mobile
- Modals adaptatifs

---

## 🗄️ Schéma de Base de Données

### Modèles Principaux

#### Agency
```prisma
model Agency {
  id                String   @id @default(cuid())
  name              String
  companyId         String
  phone             String?
  address           String?
  deletedAt         DateTime?
  createdByUserId   String?
  updatedByUserId   String?
  deletedByUserId   String?
  deletedReason     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  company           Company  @relation(...)
  businessEventLogs BusinessEventLog[]
}
```

#### User
```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  password          String
  name              String
  role              Role
  companyId         String?
  isActive          Boolean  @default(true)
  deletedAt         DateTime?
  createdByUserId   String?
  updatedByUserId   String?
  deletedByUserId   String?
  deletedReason     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  company           Company? @relation(...)
  userAgencies      UserAgency[]
}
```

#### BusinessEventLog
```prisma
model BusinessEventLog {
  id                String            @id @default(cuid())
  agencyId          String?
  companyId         String?
  entityType        String
  entityId          String
  eventType         BusinessEventType
  previousState     Json?
  newState          Json?
  triggeredByUserId String?
  createdAt         DateTime          @default(now())
  agency            Agency?           @relation(...)
  company           Company?          @relation(...)
}
```

---

## 🔌 API Endpoints

### Authentification

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| POST | `/api/v1/auth/login` | Connexion | Public |
| POST | `/api/v1/auth/refresh` | Rafraîchir le token | Public |
| GET | `/api/v1/auth/me` | Obtenir l'utilisateur actuel | Authentifié |

### Agencies

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/agencies` | Liste toutes les agences (filtrées par companyId) | COMPANY_ADMIN, SUPER_ADMIN |
| GET | `/api/v1/agencies/:id` | Détails d'une agence | COMPANY_ADMIN, SUPER_ADMIN |
| POST | `/api/v1/agencies` | Créer une agence | COMPANY_ADMIN, SUPER_ADMIN |
| PATCH | `/api/v1/agencies/:id` | Modifier une agence | COMPANY_ADMIN, SUPER_ADMIN |
| DELETE | `/api/v1/agencies/:id` | Supprimer une agence | COMPANY_ADMIN, SUPER_ADMIN |

**Permissions:** Filtrage automatique par `companyId` au niveau backend

### Users

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/users` | Liste tous les utilisateurs (filtrés par companyId) | COMPANY_ADMIN, SUPER_ADMIN |
| GET | `/api/v1/users/:id` | Détails d'un utilisateur | COMPANY_ADMIN, SUPER_ADMIN |
| POST | `/api/v1/users` | Créer un utilisateur | COMPANY_ADMIN, SUPER_ADMIN |
| PATCH | `/api/v1/users/:id` | Modifier un utilisateur | COMPANY_ADMIN, SUPER_ADMIN |
| DELETE | `/api/v1/users/:id` | Supprimer un utilisateur | COMPANY_ADMIN, SUPER_ADMIN |
| POST | `/api/v1/users/:id/reset-password` | Réinitialiser le mot de passe | COMPANY_ADMIN, SUPER_ADMIN |

**Permissions:** Filtrage automatique par `companyId` au niveau backend

### Analytics

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/analytics/agency/:agencyId/kpis` | KPIs d'une agence | COMPANY_ADMIN, SUPER_ADMIN |

**Query Parameters:**
- `startDate` (optionnel) : Date de début (ISO 8601)
- `endDate` (optionnel) : Date de fin (ISO 8601)

**Note:** Les KPIs globaux de l'entreprise sont calculés côté frontend en agrégeant les données de toutes les agences.

### Planning

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/planning/events` | Événements du planning | COMPANY_ADMIN, SUPER_ADMIN |

**Query Parameters:**
- `agencyId` (optionnel) : Filtrer par agence
- `startDate` (optionnel) : Date de début
- `endDate` (optionnel) : Date de fin

---

## ✅ Tests et Validation

### Tests Fonctionnels

**Authentification:**
- ✅ Connexion avec credentials valides
- ✅ Rejet si rôle différent de COMPANY_ADMIN ou SUPER_ADMIN
- ✅ Gestion des erreurs de connexion
- ✅ Stockage du token et redirection

**Dashboard:**
- ✅ Affichage des statistiques correctes
- ✅ Navigation depuis les cartes
- ✅ Liste des agences récentes
- ✅ Liste des locations actives

**Gestion des Agences:**
- ✅ Création d'agence
- ✅ Modification d'agence
- ✅ Suppression d'agence
- ✅ Recherche d'agence
- ✅ Validation des champs obligatoires
- ✅ Gestion des erreurs
- ✅ Filtrage automatique par companyId

**Gestion des Utilisateurs:**
- ✅ Création d'utilisateur
- ✅ Modification d'utilisateur
- ✅ Suppression d'utilisateur
- ✅ Réinitialisation de mot de passe
- ✅ Attribution de rôles et agences
- ✅ Recherche d'utilisateur
- ✅ Validation des permissions
- ✅ Filtrage automatique par companyId

**Analytics:**
- ✅ Affichage des KPIs de l'entreprise
- ✅ Filtrage par période
- ✅ Top 10 des agences les plus actives
- ✅ Répartition des locations

**Planning:**
- ✅ Affichage du planning de toutes les agences
- ✅ Filtrage par agence
- ✅ Détails des événements

### Tests de Performance

- ✅ Chargement initial < 2 secondes
- ✅ Navigation fluide entre les pages
- ✅ Requêtes API optimisées avec React Query
- ✅ Cache efficace
- ✅ Filtrage côté client optimisé avec useMemo

### Tests de Sécurité

- ✅ Protection des routes avec authentification
- ✅ Vérification du rôle COMPANY_ADMIN
- ✅ Tokens JWT valides
- ✅ Filtrage automatique par companyId au niveau backend
- ✅ Validation des permissions au niveau backend

---

## 🚀 Déploiement

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Variables d'environnement configurées

### Variables d'Environnement

**Backend (.env):**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
READ_ONLY_MODE=false
```

**Frontend:**
- Configuration via `next.config.js`
- Variables d'environnement pour l'API

### Build

**Frontend:**
```bash
cd frontend-web
npm run build
```

**Backend:**
```bash
cd backend
npm run build
```

---

## 📝 Notes de Version

### Version 2.0.0 Enterprise

**Nouvelles fonctionnalités:**
- ✅ Gestion complète des agences
- ✅ Gestion complète des utilisateurs
- ✅ Planning entreprise
- ✅ Analytics entreprise
- ✅ Audit trail complet
- ✅ Business event logging
- ✅ RBAC granulaire
- ✅ Read-only mode

**Améliorations:**
- ✅ UI/UX moderne avec composants réutilisables
- ✅ Gestion d'erreurs et messages de succès
- ✅ États de chargement sur les boutons
- ✅ Navigation intuitive
- ✅ Filtrage automatique par companyId
- ✅ Recherche en temps réel

---

**Document généré le:** Décembre 2024  
**Dernière mise à jour:** Décembre 2024  
**Version du document:** 2.0.0 SaaS

