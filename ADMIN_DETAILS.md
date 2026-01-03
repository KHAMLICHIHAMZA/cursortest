# 📋 MalocAuto - Application Super Admin
## Spécifications Techniques et Fonctionnelles Complètes

**Version:** 2.0.0 Enterprise  
**Date:** Décembre 2024  
**Type:** Application Web SaaS - Module Super Administration  
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
MalocAuto Super Admin est une application web moderne permettant aux administrateurs système de gérer l'ensemble de la plateforme multi-tenant. L'application offre une interface intuitive avec un design sombre moderne pour gérer les entreprises, les agences, les utilisateurs, le planning global et les analytics à l'échelle de la plateforme.

### Objectifs
- Gérer les entreprises (Companies) avec leurs configurations SaaS
- Gérer les agences (Agencies) par entreprise
- Gérer les utilisateurs avec leurs rôles et permissions
- **Gérer les abonnements SaaS** (création, modification, suspension, restauration)
- **Surveiller la santé des companies** (statut, paiements, alertes)
- Visualiser le planning global de toutes les agences
- Accéder aux analytics globaux de la plateforme
- Dashboard avec statistiques en temps réel

### Public Cible
- **SUPER_ADMIN** : Administrateurs système avec accès complet à toutes les fonctionnalités

---

## 🏢 Fonctionnalités Enterprise

### Data Governance & Audit Trail
- **Champs d'audit automatiques** : Tous les enregistrements (Companies, Agencies, Users) incluent :
  - `createdByUserId` - Utilisateur qui a créé l'enregistrement
  - `updatedByUserId` - Utilisateur qui a modifié l'enregistrement
  - `deletedByUserId` - Utilisateur qui a supprimé l'enregistrement
  - `deletedReason` - Raison de la suppression (optionnel)
- **Traçabilité complète** : Tous les changements sont automatiquement tracés
- **Exclusion des champs d'audit** : Les champs d'audit ne sont jamais exposés dans les réponses API publiques

### RBAC (Role-Based Access Control)
- **Système de permissions granulaire** :
  - **SUPER_ADMIN** : Accès complet à tous les modules (Companies, Agencies, Users, Analytics)
  - **COMPANY_ADMIN** : Accès limité aux agences et utilisateurs de sa propre entreprise
- **Protection au niveau backend** : Guards de permissions sur tous les endpoints
- **Protection au niveau frontend** : Restriction d'accès basée sur le rôle

### Business Event Logging
- **Logging automatique** : Tous les événements métier sont loggés dans `BusinessEventLog`
- **Types d'événements** : 
  - `COMPANY_CREATED`, `COMPANY_UPDATED`, `COMPANY_DELETED`
  - `AGENCY_CREATED`, `AGENCY_UPDATED`, `AGENCY_DELETED`
  - `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`
- **Stockage** : État avant/après en JSON pour traçabilité complète
- **Performance** : Logging asynchrone et non-bloquant

### Analytics & KPIs Globaux
- **Module Analytics Global** : KPIs calculés en temps réel à l'échelle de la plateforme
- **Métriques disponibles** :
  - Nombre total d'entreprises (actives/inactives)
  - Nombre total d'agences
  - Nombre total d'utilisateurs
  - Nombre total de véhicules
  - Nombre total de locations
  - Revenus totaux et par véhicule
  - Taux d'occupation global
  - Durée moyenne de location
  - Top 10 des entreprises les plus actives
  - Top 10 des agences les plus actives
- **Accès restreint** : Seulement pour SUPER_ADMIN
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
- **Gestion des Plans** : Starter (500 MAD), Pro (1000 MAD), Enterprise (2000 MAD)
- **Gestion des Modules** : VEHICLES, BOOKINGS, INVOICES, MAINTENANCE, FINES, ANALYTICS
- **Cycle de vie automatique** :
  - Suspension automatique après expiration d'abonnement
  - Suppression définitive J+100 après suspension
  - Génération automatique de factures récurrentes (7 jours avant échéance)
- **Cron Jobs** : Tâches automatiques quotidiennes (2h, 3h, 4h du matin)
- **Notifications** : Email + In-App pour les alertes de paiement

### Permissions User ↔ Agency
- **Système de permissions granulaire** : READ, WRITE, FULL
- **Héritage des modules** : Les agences héritent des modules de leur company
- **Désactivation au niveau agence** : Possibilité de désactiver un module hérité
- **Protection** : Impossible d'activer un module non payé au niveau company

---

## 🛠️ Stack Technique

### Frontend
```json
{
  "framework": "React 18.2.0",
  "build_tool": "Vite 5.0.8",
  "routing": "React Router DOM 6.21.1",
  "state_management": "@tanstack/react-query 5.14.2",
  "http_client": "Axios 1.6.2",
  "ui_library": "Tailwind CSS 3.3.6",
  "icons": "Lucide React 0.303.0",
  "calendar": "@fullcalendar/react 6.1.10",
  "language": "TypeScript 5.3.3"
}
```

**Port de développement:** `5173`  
**URL:** `http://localhost:5173`

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
  "security": "Helmet, CORS, Throttler",
  "file_upload": "Multer 2.0.2"
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
frontend-admin/
├── src/
│   ├── pages/              # Pages principales
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Companies.tsx
│   │   ├── Agencies.tsx
│   │   ├── Users.tsx
│   │   ├── Planning.tsx
│   │   └── Analytics.tsx
│   ├── components/         # Composants réutilisables
│   │   └── Layout.tsx      # Layout avec sidebar
│   ├── lib/               # Utilitaires
│   │   ├── axios.ts       # Configuration API
│   │   └── auth.ts        # Gestion authentification
│   └── App.tsx            # Point d'entrée
```

### Structure Backend
```
backend/
├── src/
│   ├── modules/           # Modules métier
│   │   ├── auth/          # Authentification
│   │   ├── company/       # Gestion entreprises
│   │   ├── agency/        # Gestion agences
│   │   ├── user/          # Gestion utilisateurs
│   │   ├── planning/      # Planning global
│   │   └── analytics/     # Analytics global
│   ├── common/            # Services partagés
│   │   ├── prisma/        # Service Prisma
│   │   └── services/      # Services communs
│   └── main.ts            # Point d'entrée
├── prisma/
│   └── schema.prisma      # Schéma de base de données
└── uploads/               # Stockage fichiers
```

### Flux de Données
```
Frontend Admin (React) 
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
- Stockage du token dans `localStorage`
- Redirection automatique si non authentifié
- **Restriction d'accès** : Seuls les utilisateurs avec le rôle `SUPER_ADMIN` peuvent se connecter
- Gestion des erreurs avec messages clairs

**Champs du formulaire:**
- **Email** (obligatoire, type: email)
- **Mot de passe** (obligatoire, type: password)

**Validation:**
- Email valide
- Mot de passe non vide
- Vérification du rôle SUPER_ADMIN
- Affichage d'erreurs spécifiques

**Permissions:**
- Seuls les utilisateurs avec le rôle `SUPER_ADMIN` peuvent accéder à l'application admin

---

### 2. Dashboard (`/`)

**Fonctionnalités:**
- Statistiques en temps réel (4 cartes cliquables)
- Liste des entreprises récentes (5 dernières)
- Navigation rapide vers les modules

**Statistiques affichées:**
1. **Entreprises** - Nombre total d'entreprises (cliquable → `/companies`)
2. **Agences** - Nombre total d'agences (cliquable → `/agencies`)
3. **Utilisateurs** - Nombre total d'utilisateurs (cliquable → `/users`)
4. **Entreprises actives** - Nombre d'entreprises actives (cliquable → `/companies`)

**Sections:**
- **Entreprises récentes:** Affiche les 5 dernières entreprises avec :
  - Nom de l'entreprise
  - Nombre d'agences
  - Nombre d'utilisateurs
  - Statut (Active/Inactive) avec badge coloré

**Interactivité:**
- Cartes cliquables pour navigation rapide
- Hover effects sur les cartes
- Transitions fluides

---

### 3. Gestion des Entreprises (`/companies`)

**Fonctionnalités:**
- Liste de toutes les entreprises avec pagination
- Création d'entreprise avec formulaire complet
- Modification d'entreprise existante
- Suppression d'entreprise (soft delete)
- Activation/Désactivation d'entreprise
- **Enterprise:** 
  - Champs d'audit automatiques (créateur, modificateur, suppresseur)
  - Logging automatique des événements (COMPANY_CREATED, COMPANY_UPDATED, COMPANY_DELETED)
  - Permissions RBAC : Seuls les SUPER_ADMIN peuvent créer/modifier/supprimer

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Nom | Text | Oui | Nom de l'entreprise |
| Téléphone | Tel | Non | Numéro de téléphone |
| Adresse | Textarea | Non | Adresse complète |
| Email admin | Email | Oui | Email de l'administrateur de l'entreprise |
| Nom admin | Text | Oui | Nom de l'administrateur de l'entreprise |

**Tableau d'affichage:**
- Nom
- Téléphone
- Nombre d'agences
- Nombre d'utilisateurs
- Statut (Active/Inactive) avec badge coloré
- Actions (Éditer, Supprimer, Activer/Désactiver)

**Validations:**
- Nom obligatoire
- Email admin valide et obligatoire
- Nom admin obligatoire
- Slug généré automatiquement à partir du nom

**Use Cases:**
- **UC-COMP-001:** Créer une nouvelle entreprise
- **UC-COMP-002:** Modifier une entreprise existante
- **UC-COMP-003:** Supprimer une entreprise
- **UC-COMP-004:** Activer/Désactiver une entreprise
- **UC-COMP-005:** Voir la liste de toutes les entreprises

---

### 4. Gestion des Agences (`/agencies`)

**Fonctionnalités:**
- Liste de toutes les agences avec pagination
- Création d'agence avec formulaire complet
- Modification d'agence existante
- Suppression d'agence (soft delete)
- Filtrage par entreprise
- **Enterprise:** 
  - Champs d'audit automatiques
  - Logging automatique des événements (AGENCY_CREATED, AGENCY_UPDATED, AGENCY_DELETED)
  - Permissions RBAC : SUPER_ADMIN et COMPANY_ADMIN peuvent créer/modifier/supprimer

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Entreprise | Select | Oui | Sélection de l'entreprise |
| Nom | Text | Oui | Nom de l'agence |
| Téléphone | Tel | Non | Numéro de téléphone |
| Adresse | Textarea | Non | Adresse complète |

**Tableau d'affichage:**
- Nom
- Entreprise
- Téléphone
- Adresse
- Actions (Éditer, Supprimer)

**Validations:**
- Nom obligatoire
- Entreprise obligatoire
- Vérification des permissions (COMPANY_ADMIN ne peut modifier que ses propres agences)

**Use Cases:**
- **UC-AGY-001:** Créer une nouvelle agence
- **UC-AGY-002:** Modifier une agence existante
- **UC-AGY-003:** Supprimer une agence
- **UC-AGY-004:** Voir la liste de toutes les agences
- **UC-AGY-005:** Filtrer les agences par entreprise

---

### 5. Gestion des Utilisateurs (`/users`)

**Fonctionnalités:**
- Liste de tous les utilisateurs avec pagination
- Création d'utilisateur avec formulaire complet
- Modification d'utilisateur existant
- Suppression d'utilisateur (soft delete)
- Réinitialisation de mot de passe
- Attribution de rôles et d'agences
- **Enterprise:** 
  - Champs d'audit automatiques
  - Logging automatique des événements (USER_CREATED, USER_UPDATED, USER_DELETED)
  - Permissions RBAC : SUPER_ADMIN et COMPANY_ADMIN peuvent créer/modifier/supprimer

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Nom | Text | Oui | Nom complet de l'utilisateur |
| Email | Email | Oui | Adresse email (unique) |
| Rôle | Select | Oui | SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER, AGENT |
| Entreprise | Select | Non | Entreprise (si COMPANY_ADMIN, AGENCY_MANAGER ou AGENT) |
| Agences | Multi-select | Non | Agences assignées (si AGENCY_MANAGER ou AGENT) |
| Actif | Checkbox | Oui | Statut actif/inactif |

**Tableau d'affichage:**
- Nom
- Email
- Rôle (badge coloré)
- Entreprise
- Agences (liste)
- Statut (Actif/Inactif) avec badge coloré
- Actions (Éditer, Supprimer, Réinitialiser mot de passe)

**Validations:**
- Email unique
- Rôle valide
- Si COMPANY_ADMIN, AGENCY_MANAGER ou AGENT : Entreprise obligatoire
- Si AGENCY_MANAGER ou AGENT : Au moins une agence obligatoire

**Use Cases:**
- **UC-USER-001:** Créer un nouvel utilisateur
- **UC-USER-002:** Modifier un utilisateur existant
- **UC-USER-003:** Supprimer un utilisateur
- **UC-USER-004:** Réinitialiser le mot de passe d'un utilisateur
- **UC-USER-005:** Assigner des agences à un utilisateur
- **UC-USER-006:** Activer/Désactiver un utilisateur

---

### 6. Planning Global (`/planning`)

**Fonctionnalités:**
- Vue calendrier interactive (FullCalendar)
- Affichage des locations, maintenances et temps de préparation de toutes les agences
- Événements cliquables avec modal de détails
- Navigation vers les détails complets
- Filtrage par période
- Couleurs distinctes par type d'événement
- **Enterprise:** Permissions RBAC pour l'accès au planning global

**Types d'événements:**
- **BOOKING** (Location) - Bleu
- **MAINTENANCE** (Maintenance) - Rouge
- **PREPARATION_TIME** (Temps de préparation) - Orange

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
- **UC-PLAN-001:** Voir le planning global de toutes les agences
- **UC-PLAN-002:** Filtrer le planning par période
- **UC-PLAN-003:** Voir les détails d'un événement
- **UC-PLAN-004:** Naviguer vers les détails complets d'une location/maintenance

---

### 7. Gestion des Abonnements SaaS (`/subscriptions`) - Nouveau

**Fonctionnalités:**
- Liste de tous les abonnements avec filtres avancés
- Création d'abonnement pour une company
- Modification d'abonnement (plan, période, dates)
- Suspension/Restauration d'abonnement
- Annulation d'abonnement
- Renouvellement d'abonnement
- Visualisation des modules inclus dans chaque plan
- Gestion des factures et paiements

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Company | Select | Oui | Entreprise concernée |
| Plan | Select | Oui | Plan d'abonnement (Starter/Pro/Enterprise) |
| Période | Select | Oui | MONTHLY, QUARTERLY, YEARLY |
| Date de début | Date | Oui | Date de début de l'abonnement |
| Date de fin | Date | Oui | Date de fin de l'abonnement |
| Montant | Number | Oui | Montant de l'abonnement |

**Tableau d'affichage:**
- Company
- Plan
- Statut (ACTIVE, SUSPENDED, EXPIRED, CANCELLED) avec badge coloré
- Période de facturation
- Dates (début/fin)
- Montant
- Actions (Éditer, Suspendre, Restaurer, Annuler, Renouveler)

**Filtres disponibles:**
- Par statut (ACTIVE, SUSPENDED, EXPIRED, CANCELLED)
- Par plan (Starter, Pro, Enterprise)
- Par company
- Par période de facturation

**Actions disponibles:**
- **Suspendre** : Suspend l'abonnement et la company associée
- **Restaurer** : Restaure un abonnement suspendu (si < 90 jours)
- **Annuler** : Annule définitivement un abonnement
- **Renouveler** : Crée un nouvel abonnement à partir d'un existant
- **Éditer** : Modifie les dates ou le plan

**Use Cases:**
- **UC-SUB-001:** Créer un nouvel abonnement pour une company
- **UC-SUB-002:** Modifier un abonnement existant
- **UC-SUB-003:** Suspendre un abonnement (non-paiement)
- **UC-SUB-004:** Restaurer un abonnement suspendu
- **UC-SUB-005:** Annuler un abonnement
- **UC-SUB-006:** Renouveler un abonnement
- **UC-SUB-007:** Filtrer les abonnements par statut/plan/company

---

### 8. Santé des Companies (`/company-health`) - Nouveau

**Fonctionnalités:**
- Vue d'ensemble de la santé d'une company
- Statut de l'abonnement et jours restants
- Alertes de paiement en attente
- Historique des paiements
- Modules activés
- Actions rapides (suspendre, restaurer, étendre)

**Informations affichées:**
- **Statut de la company** : ACTIVE, SUSPENDED, DELETED avec badge coloré
- **Abonnement actif** : Plan, dates, statut
- **Jours restants** : Calcul automatique jusqu'à la date de fin
- **Alertes** :
  - Paiement en attente (factures non payées)
  - Abonnement expirant bientôt (< 7 jours)
  - Company suspendue depuis X jours
- **Modules activés** : Liste des modules payés et actifs
- **Historique des paiements** : Liste des factures et paiements

**Actions disponibles:**
- **Suspendre** : Suspend la company et son abonnement
- **Restaurer** : Restaure une company suspendue (si < 90 jours)
- **Étendre** : Prolonge l'abonnement de X jours
- **Voir les détails** : Accès à la page complète de gestion

**Use Cases:**
- **UC-HEALTH-001:** Voir l'état de santé d'une company
- **UC-HEALTH-002:** Suspendre une company pour non-paiement
- **UC-HEALTH-003:** Restaurer une company après paiement
- **UC-HEALTH-004:** Voir les alertes de paiement
- **UC-HEALTH-005:** Étendre un abonnement manuellement

---

### 9. Analytics Global (`/analytics`) - Enterprise Feature

**Fonctionnalités:**
- Dashboard de KPIs globaux en temps réel
- Métriques calculées automatiquement depuis les données existantes
- Filtrage par période (date de début et date de fin)
- **Accès:** Seulement pour SUPER_ADMIN

**KPIs disponibles:**

| KPI | Description |
|-----|-------------|
| Entreprises | Nombre total d'entreprises (avec nombre d'actives) |
| Agences | Nombre total d'agences |
| Véhicules | Nombre total de véhicules |
| Utilisateurs | Nombre total d'utilisateurs |
| Locations | Nombre total de locations (avec nombre de terminées) |
| Revenus totaux | Revenus totaux en euros (avec revenus par véhicule) |
| Taux d'occupation | Taux d'occupation global des véhicules (%) |
| Durée moyenne | Durée moyenne de location (jours) |

**Top Lists:**
- **Top 10 des entreprises les plus actives** : Classées par nombre de locations
- **Top 10 des agences les plus actives** : Classées par nombre de locations

**Filtrage:**
- Date de début (optionnel)
- Date de fin (optionnel)
- Les KPIs sont recalculés selon la période sélectionnée

**Endpoint API:**
```
GET /api/v1/analytics/global/kpis?startDate=&endDate=
```

**Permissions:**
- `analytics:read` - Seulement SUPER_ADMIN

**Use Cases:**
- **UC-ANAL-001:** Voir les KPIs globaux de la plateforme
- **UC-ANAL-002:** Filtrer les KPIs par période
- **UC-ANAL-003:** Voir le top 10 des entreprises les plus actives
- **UC-ANAL-004:** Voir le top 10 des agences les plus actives

---

## 📱 Spécifications des Écrans

### Écran de Connexion (`/login`)

**Layout:**
- Centré verticalement et horizontalement
- Fond sombre (`#1D1F23`)
- Formulaire avec bordures arrondies
- Logo/titre "MalocAuto" en haut

**Champs:**
- Email (input type="email")
- Mot de passe (input type="password")
- Bouton "Se connecter"

**Comportement:**
- Validation côté client
- Affichage d'erreurs en cas d'échec
- Redirection vers `/` en cas de succès
- Vérification du rôle SUPER_ADMIN

---

### Dashboard (`/`)

**Layout:**
- Sidebar à gauche (navigation)
- Zone principale avec :
  - Titre "Dashboard"
  - 4 cartes de statistiques (grid 2x2 ou 4 colonnes)
  - Section "Entreprises récentes"

**Cartes de statistiques:**
- Icône colorée
- Valeur en grand
- Label en dessous
- Hover effect avec changement de couleur de bordure
- Clic → Navigation vers la page correspondante

**Section entreprises récentes:**
- Liste des 5 dernières entreprises
- Pour chaque entreprise :
  - Nom
  - Nombre d'agences et utilisateurs
  - Badge de statut (Active/Inactive)

---

### Gestion des Entreprises (`/companies`)

**Layout:**
- Header avec titre et bouton "Nouvelle entreprise"
- Tableau avec toutes les entreprises
- Modal pour créer/modifier une entreprise

**Tableau:**
- Colonnes : Nom, Téléphone, Agences, Utilisateurs, Statut, Actions
- Lignes cliquables (hover effect)
- Badges colorés pour le statut

**Modal:**
- Formulaire avec tous les champs
- Boutons "Annuler" et "Enregistrer"
- Scrollable si contenu trop long (`max-h-[90vh] overflow-y-auto`)
- Gestion des erreurs et messages de succès
- Désactivation des boutons pendant le chargement

---

### Gestion des Agences (`/agencies`)

**Layout:**
- Similaire à la page Companies
- Header avec titre et bouton "Nouvelle agence"
- Tableau avec toutes les agences
- Modal pour créer/modifier une agence

**Tableau:**
- Colonnes : Nom, Entreprise, Téléphone, Adresse, Actions
- Filtrage possible par entreprise

**Modal:**
- Formulaire avec sélection d'entreprise
- Autres champs similaires à Companies

---

### Gestion des Utilisateurs (`/users`)

**Layout:**
- Similaire aux autres pages de gestion
- Header avec titre et bouton "Nouvel utilisateur"
- Tableau avec tous les utilisateurs
- Modal pour créer/modifier un utilisateur

**Tableau:**
- Colonnes : Nom, Email, Rôle, Entreprise, Agences, Statut, Actions
- Badges colorés pour le rôle et le statut

**Modal:**
- Formulaire complet avec :
  - Champs de base (nom, email)
  - Sélection de rôle
  - Sélection d'entreprise (conditionnelle selon le rôle)
  - Multi-select d'agences (conditionnel selon le rôle)
  - Checkbox pour statut actif

---

### Planning Global (`/planning`)

**Layout:**
- Calendrier FullCalendar en plein écran
- Filtres en haut (période)
- Modal pour détails d'événement

**Calendrier:**
- Vue par défaut : Timeline ou Agenda
- Événements colorés selon le type
- Clic sur événement → Modal avec détails

---

### Analytics Global (`/analytics`)

**Layout:**
- Header avec titre et filtres de date
- Grid de cartes de KPIs (6 cartes)
- Sections pour les top lists

**Cartes de KPIs:**
- Icône colorée
- Valeur principale en grand
- Sous-valeur (si applicable)
- Label

**Top Lists:**
- Tableaux avec classement
- Nombre de locations
- Informations de l'entreprise/agence

---

## 🔧 Détails Techniques

### Authentification

**Flow:**
1. Utilisateur saisit email/mot de passe
2. POST `/api/v1/auth/login`
3. Backend vérifie les credentials et le rôle SUPER_ADMIN
4. Retourne `accessToken` et `refreshToken`
5. Frontend stocke les tokens dans `localStorage`
6. Toutes les requêtes suivantes incluent `Authorization: Bearer <token>`

**Stockage:**
- `localStorage.setItem('token', accessToken)`
- `localStorage.setItem('user', JSON.stringify(user))`

**Protection des routes:**
- Composant `ProtectedRoute` vérifie la présence du token
- Redirection vers `/login` si non authentifié

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
  queryKey: ['companies'],
  queryFn: async () => {
    const res = await api.get('/companies');
    return res.data;
  },
});
```

---

### API Client

**Configuration Axios:**
- Base URL : `/api/v1`
- Intercepteur pour ajouter le token JWT
- Gestion des erreurs centralisée
- Proxy configuré dans Vite pour le développement

**Exemple:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### UI/UX

**Design System:**
- Couleur principale : `#3E7BFA` (bleu)
- Fond sombre : `#1D1F23`
- Cartes : `#2C2F36`
- Bordures : `gray-700`
- Texte principal : `white`
- Texte secondaire : `gray-400`

**Composants réutilisables:**
- Layout avec sidebar
- Modals scrollables
- Tableaux avec hover effects
- Badges colorés
- Boutons avec états de chargement

**Responsive:**
- Grid adaptatif (1 colonne mobile, 2-4 colonnes desktop)
- Sidebar collapsible (à implémenter)
- Tableaux scrollables horizontalement sur mobile

---

## 🗄️ Schéma de Base de Données

### Modèles Principaux

#### Company
```prisma
model Company {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  phone             String?
  address           String?
  isActive          Boolean  @default(true)
  logoUrl           String?
  secondaryColor    String?
  faviconUrl        String?
  deletedAt         DateTime?
  createdByUserId   String?
  updatedByUserId   String?
  deletedByUserId   String?
  deletedReason     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  agencies          Agency[]
  users             User[]
  businessEventLogs BusinessEventLog[]
}
```

#### Agency
```prisma
model Agency {
  id                String          @id @default(cuid())
  name              String
  companyId         String
  phone             String?
  address           String?
  
  // SaaS: Cycle de vie et statut
  status            AgencyStatus    @default(ACTIVE)
  suspendedAt       DateTime?
  suspendedReason   String?
  
  // SaaS: Configuration métier
  timezone          String          @default("Africa/Casablanca")
  capacity          Int?
  
  deletedAt         DateTime?
  createdByUserId   String?
  updatedByUserId   String?
  deletedByUserId   String?
  deletedReason     String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  company           Company         @relation(...)
  businessEventLogs BusinessEventLog[]
  agencyModules     AgencyModule[]
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

#### UserAgency
```prisma
model UserAgency {
  id          String                @id @default(cuid())
  userId      String
  agencyId    String
  permission  UserAgencyPermission  @default(FULL)
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
  user        User                  @relation(...)
  agency      Agency                @relation(...)
}
```

#### Plan
```prisma
model Plan {
  id          String      @id @default(cuid())
  name        String
  description String?
  price       Float
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  planModules PlanModule[]
  planQuotas  PlanQuota[]
  subscriptions Subscription[]
}
```

#### Subscription
```prisma
model Subscription {
  id              String            @id @default(cuid())
  companyId       String
  planId          String
  billingPeriod   BillingPeriod
  startDate       DateTime
  endDate         DateTime
  amount          Float
  status          SubscriptionStatus @default(ACTIVE)
  renewedAt       DateTime?
  cancelledAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  company         Company           @relation(...)
  plan            Plan              @relation(...)
  subscriptionModules SubscriptionModule[]
  paymentsSaas    PaymentSaas[]
}
```

#### CompanyModule
```prisma
model CompanyModule {
  id          String      @id @default(cuid())
  companyId   String
  moduleCode  ModuleCode
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  company     Company     @relation(...)
}
```

#### AgencyModule
```prisma
model AgencyModule {
  id          String      @id @default(cuid())
  agencyId    String
  moduleCode  ModuleCode
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  agency      Agency      @relation(...)
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

### Companies

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/companies` | Liste toutes les entreprises | SUPER_ADMIN |
| GET | `/api/v1/companies/:id` | Détails d'une entreprise | SUPER_ADMIN |
| POST | `/api/v1/companies` | Créer une entreprise | SUPER_ADMIN |
| PATCH | `/api/v1/companies/:id` | Modifier une entreprise | SUPER_ADMIN |
| DELETE | `/api/v1/companies/:id` | Supprimer une entreprise | SUPER_ADMIN |

**Permissions:** `@Permissions('super_admin:company:read')`, `@Permissions('super_admin:company:create')`, etc.

### Agencies

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/agencies` | Liste toutes les agences | SUPER_ADMIN, COMPANY_ADMIN |
| GET | `/api/v1/agencies/:id` | Détails d'une agence | SUPER_ADMIN, COMPANY_ADMIN |
| POST | `/api/v1/agencies` | Créer une agence | SUPER_ADMIN, COMPANY_ADMIN |
| PATCH | `/api/v1/agencies/:id` | Modifier une agence | SUPER_ADMIN, COMPANY_ADMIN |
| DELETE | `/api/v1/agencies/:id` | Supprimer une agence | SUPER_ADMIN, COMPANY_ADMIN |

**Permissions:** `@Permissions('super_admin:agency:read', 'company_admin:agency:read')`, etc.

### Users

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/users` | Liste tous les utilisateurs | SUPER_ADMIN, COMPANY_ADMIN |
| GET | `/api/v1/users/:id` | Détails d'un utilisateur | SUPER_ADMIN, COMPANY_ADMIN |
| POST | `/api/v1/users` | Créer un utilisateur | SUPER_ADMIN, COMPANY_ADMIN |
| PATCH | `/api/v1/users/:id` | Modifier un utilisateur | SUPER_ADMIN, COMPANY_ADMIN |
| DELETE | `/api/v1/users/:id` | Supprimer un utilisateur | SUPER_ADMIN |
| POST | `/api/v1/users/:id/reset-password` | Réinitialiser le mot de passe | SUPER_ADMIN, COMPANY_ADMIN |

**Permissions:** `@Permissions('super_admin:user:read', 'company_admin:user:read')`, etc.

### Subscriptions (SaaS)

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/subscriptions` | Liste tous les abonnements | SUPER_ADMIN |
| GET | `/api/v1/subscriptions/:id` | Détails d'un abonnement | SUPER_ADMIN |
| POST | `/api/v1/subscriptions` | Créer un abonnement | SUPER_ADMIN |
| PATCH | `/api/v1/subscriptions/:id` | Modifier un abonnement | SUPER_ADMIN |
| POST | `/api/v1/subscriptions/:id/suspend` | Suspendre un abonnement | SUPER_ADMIN |
| POST | `/api/v1/subscriptions/:id/restore` | Restaurer un abonnement | SUPER_ADMIN |
| POST | `/api/v1/subscriptions/:id/cancel` | Annuler un abonnement | SUPER_ADMIN |
| POST | `/api/v1/subscriptions/:id/renew` | Renouveler un abonnement | SUPER_ADMIN |

**Query Parameters (GET /subscriptions):**
- `status` (optionnel) : Filtrer par statut (ACTIVE, SUSPENDED, EXPIRED, CANCELLED)
- `planId` (optionnel) : Filtrer par plan
- `companyId` (optionnel) : Filtrer par company

### Plans

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/plans` | Liste tous les plans | SUPER_ADMIN |
| GET | `/api/v1/plans/:id` | Détails d'un plan | SUPER_ADMIN |
| POST | `/api/v1/plans` | Créer un plan | SUPER_ADMIN |
| PATCH | `/api/v1/plans/:id` | Modifier un plan | SUPER_ADMIN |
| DELETE | `/api/v1/plans/:id` | Supprimer un plan | SUPER_ADMIN |

### Modules

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/modules/company/:companyId` | Modules d'une company | SUPER_ADMIN, COMPANY_ADMIN |
| GET | `/api/v1/modules/agency/:agencyId` | Modules d'une agence | SUPER_ADMIN, COMPANY_ADMIN |
| POST | `/api/v1/modules/company/:companyId/:moduleCode/activate` | Activer un module company | SUPER_ADMIN |
| DELETE | `/api/v1/modules/company/:companyId/:moduleCode` | Désactiver un module company | SUPER_ADMIN |
| POST | `/api/v1/modules/agency/:agencyId/:moduleCode/activate` | Activer un module agency | SUPER_ADMIN, COMPANY_ADMIN |
| DELETE | `/api/v1/modules/agency/:agencyId/:moduleCode` | Désactiver un module agency | SUPER_ADMIN, COMPANY_ADMIN |

### Analytics

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/api/v1/analytics/global/kpis` | KPIs globaux | SUPER_ADMIN |

**Query Parameters:**
- `startDate` (optionnel) : Date de début (ISO 8601)
- `endDate` (optionnel) : Date de fin (ISO 8601)

**Permissions:** `@Permissions('analytics:read')`

---

## ✅ Tests et Validation

### Tests Fonctionnels

**Authentification:**
- ✅ Connexion avec credentials valides
- ✅ Rejet si rôle différent de SUPER_ADMIN
- ✅ Gestion des erreurs de connexion
- ✅ Stockage du token et redirection

**Dashboard:**
- ✅ Affichage des statistiques correctes
- ✅ Navigation depuis les cartes
- ✅ Liste des entreprises récentes

**Gestion des Entreprises:**
- ✅ Création d'entreprise
- ✅ Modification d'entreprise
- ✅ Suppression d'entreprise
- ✅ Activation/Désactivation
- ✅ Validation des champs obligatoires
- ✅ Gestion des erreurs

**Gestion des Agences:**
- ✅ Création d'agence
- ✅ Modification d'agence
- ✅ Suppression d'agence
- ✅ Filtrage par entreprise
- ✅ Validation des permissions

**Gestion des Utilisateurs:**
- ✅ Création d'utilisateur
- ✅ Modification d'utilisateur
- ✅ Suppression d'utilisateur
- ✅ Réinitialisation de mot de passe
- ✅ Attribution de rôles et agences
- ✅ Validation des permissions

**Analytics:**
- ✅ Affichage des KPIs globaux
- ✅ Filtrage par période
- ✅ Top 10 des entreprises et agences

### Tests de Performance

- ✅ Chargement initial < 2 secondes
- ✅ Navigation fluide entre les pages
- ✅ Requêtes API optimisées avec React Query
- ✅ Cache efficace

### Tests de Sécurité

- ✅ Protection des routes avec authentification
- ✅ Vérification du rôle SUPER_ADMIN
- ✅ Tokens JWT valides
- ✅ Protection CSRF (via SameSite cookies)
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
- Configuration via `vite.config.ts`
- Proxy API configuré pour `/api`

### Build

**Frontend:**
```bash
cd frontend-admin
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
- ✅ Gestion complète des entreprises
- ✅ Gestion complète des agences
- ✅ Gestion complète des utilisateurs
- ✅ Planning global
- ✅ Analytics globaux
- ✅ Audit trail complet
- ✅ Business event logging
- ✅ RBAC granulaire
- ✅ Read-only mode

**Améliorations:**
- ✅ UI/UX améliorée avec modals scrollables
- ✅ Gestion d'erreurs et messages de succès
- ✅ États de chargement sur les boutons
- ✅ Navigation intuitive

---

**Document généré le:** Décembre 2024  
**Dernière mise à jour:** Décembre 2024  
**Version du document:** 2.0.0

