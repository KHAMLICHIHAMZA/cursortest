# 📋 MalocAuto - Application Agence
## Spécifications Techniques et Fonctionnelles Complètes

**Version:** 2.0.0 Enterprise  
**Date:** Décembre 2024  
**Type:** Application Web SaaS - Module Agence  
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
MalocAuto Agence est une application web moderne permettant aux agences de location de véhicules de gérer leur flotte, leurs clients, leurs locations, leurs amendes et leur maintenance. L'application offre une interface intuitive avec un design sombre moderne et des fonctionnalités avancées incluant l'IA pour l'analyse de permis de conduire.

### Objectifs
- Gérer la flotte de véhicules avec photos et détails complets
- Gérer les clients avec analyse automatique de permis de conduire
- Créer et suivre les locations avec validation automatique
- Gérer les amendes avec pièces jointes
- Planifier et suivre la maintenance des véhicules
- Visualiser le planning interactif des véhicules
- Dashboard avec statistiques en temps réel

### Public Cible
- **AGENCY_MANAGER** : Gestionnaires d'agence avec accès complet
- **AGENT** : Agents opérationnels avec accès limité

---

## 🏢 Fonctionnalités Enterprise

### Data Governance & Audit Trail
- **Champs d'audit automatiques** : Tous les enregistrements (Véhicules, Clients, Locations, Maintenance, Amendes) incluent :
  - `createdByUserId` - Utilisateur qui a créé l'enregistrement
  - `updatedByUserId` - Utilisateur qui a modifié l'enregistrement
  - `deletedByUserId` - Utilisateur qui a supprimé l'enregistrement
  - `deletedReason` - Raison de la suppression (optionnel)
- **Traçabilité complète** : Tous les changements sont automatiquement tracés
- **Exclusion des champs d'audit** : Les champs d'audit ne sont jamais exposés dans les réponses API publiques

### RBAC (Role-Based Access Control)
- **Système de permissions granulaire** :
  - **AGENCY_MANAGER** : Accès complet à tous les modules, peut supprimer, accès aux analytics
  - **AGENT** : Lecture sur tous les modules, création/modification de Clients/Locations/Amendes uniquement, pas de suppression
- **Protection au niveau backend** : Guards de permissions sur tous les endpoints
- **Protection au niveau frontend** : Actions masquées selon les permissions (à implémenter)

### Business Event Logging
- **Logging automatique** : Tous les événements métier sont loggés dans `BusinessEventLog`
- **Types d'événements** : CREATED, UPDATED, DELETED, STATUS_CHANGED
- **Stockage** : État avant/après en JSON pour traçabilité complète
- **Performance** : Logging asynchrone et non-bloquant

### Analytics & KPIs
- **Module Analytics** : KPIs calculés en temps réel
- **Métriques disponibles** :
  - Taux d'occupation des véhicules
  - Revenus totaux et par véhicule
  - Durée moyenne de location
  - Top 10 des véhicules les plus loués
- **Accès restreint** : Seulement pour AGENCY_MANAGER

### Operational Resilience
- **Dégradation gracieuse** : L'analyse IA des permis peut échouer sans bloquer l'application
- **Détection de fichiers orphelins** : Système pour identifier les fichiers non référencés
- **Services abstraits** : Prêts pour migration vers S3 (fichiers) et autres providers IA

### API Versioning
- **Version actuelle** : `/api/v1`
- **Structure prête** : Pour futures versions `/api/v2`
- **Swagger mis à jour** : Documentation reflète la versioning

### Read-Only Mode
- **Mode maintenance** : Variable d'environnement `READ_ONLY_MODE=true`
- **Protection** : Bloque toutes les opérations d'écriture (POST, PUT, PATCH, DELETE)
- **Lecture préservée** : Les opérations de lecture (GET) restent fonctionnelles

### SaaS Module Management
- **Protection des modules** : Tous les endpoints sont protégés par `RequireModuleGuard`
- **Modules disponibles** : VEHICLES, BOOKINGS, INVOICES, MAINTENANCE, FINES, ANALYTICS
- **Héritage des modules** : Les agences héritent automatiquement des modules de leur company
- **Désactivation au niveau agence** : Possibilité de désactiver un module hérité
- **Gestion des erreurs 403** : Messages clairs quand un module n'est pas activé
- **Composants dédiés** : `ModuleNotIncluded` et `FeatureNotIncluded` pour UX optimale

### Permissions UserAgency
- **Système de permissions granulaire** : READ, WRITE, FULL par utilisateur et agence
- **Permissions par défaut** : FULL pour tous les utilisateurs
- **Hiérarchie** : READ < WRITE < FULL
- **Intégration avec PermissionGuard** : Les permissions UserAgency surchargent les permissions basiques du rôle
- **Exemple** : Un AGENT avec permission WRITE peut créer des véhicules même si le rôle basique ne le permet pas

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

**Port de développement:** `8080`  
**URL:** `http://localhost:8080`

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
- **IA Vision:** OpenAI API (configurable)
- **Authentification:** JWT avec refresh tokens

---

## 🏗️ Architecture

### Structure Frontend
```
frontend-agency/
├── src/
│   ├── pages/              # Pages principales
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Vehicles.tsx
│   │   ├── Clients.tsx
│   │   ├── Bookings.tsx
│   │   ├── Fines.tsx
│   │   ├── Maintenance.tsx
│   │   └── Planning.tsx
│   ├── components/         # Composants réutilisables
│   │   ├── ImageUpload.tsx
│   │   ├── ColorAutocomplete.tsx
│   │   └── CountryAutocomplete.tsx
│   ├── lib/               # Utilitaires
│   │   ├── axios.ts       # Configuration API
│   │   └── utils/
│   │       └── image-url.ts
│   └── App.tsx            # Point d'entrée
```

### Structure Backend
```
backend/
├── src/
│   ├── modules/           # Modules métier
│   │   ├── auth/          # Authentification
│   │   ├── vehicle/       # Gestion véhicules
│   │   ├── client/        # Gestion clients
│   │   ├── booking/       # Gestion locations
│   │   ├── fine/          # Gestion amendes
│   │   ├── maintenance/   # Gestion maintenance
│   │   └── planning/      # Planning (source de vérité)
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
Frontend (React) 
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
- Gestion des erreurs avec messages clairs
- **Enterprise:** Les événements de connexion sont loggés dans AuditLog

**Champs du formulaire:**
- **Email** (obligatoire, type: email)
- **Mot de passe** (obligatoire, type: password)

**Validation:**
- Email valide
- Mot de passe non vide
- Affichage d'erreurs spécifiques

**Permissions:**
- Tous les utilisateurs peuvent se connecter
- Les permissions sont chargées après connexion selon le rôle

---

### 2. Dashboard (`/`)

**Fonctionnalités:**
- Statistiques en temps réel (4 cartes cliquables)
- Liste des véhicules en location (5 derniers)
- Liste des locations récentes (5 dernières)
- Navigation rapide vers les modules

**Statistiques affichées:**
1. **Véhicules** - Nombre total de véhicules
2. **Clients** - Nombre total de clients
3. **Locations** - Nombre total de locations
4. **Véhicules disponibles** - Nombre de véhicules avec statut AVAILABLE

**Sections:**
- **Véhicules en location:** Affiche les véhicules actuellement loués avec photo, marque/modèle, et client
- **Locations récentes:** Affiche les dernières locations avec photo du véhicule, client, dates et statut

**Interactivité:**
- Cartes cliquables pour navigation rapide
- Hover effects sur les cartes
- Images avec placeholder si absentes

---

### 3. Gestion des Véhicules (`/vehicles`)

**Fonctionnalités:**
- Liste de tous les véhicules avec pagination
- Création de véhicule avec formulaire complet
- Modification de véhicule existant
- Suppression de véhicule (soft delete)
- Upload de photo du véhicule
- Validation des doublons (immatriculation)
- **Protection SaaS** : Vérification que le module VEHICLES est activé
- **Gestion des erreurs 403** : Affichage de `ModuleNotIncluded` si module non activé
- **Enterprise:** 
  - Champs d'audit automatiques (créateur, modificateur, suppresseur)
  - Logging automatique des événements (VEHICLE_CREATED, VEHICLE_UPDATED, VEHICLE_DELETED, VEHICLE_STATUS_CHANGED)
  - Permissions RBAC : Seuls les AGENCY_MANAGER peuvent créer/modifier/supprimer
  - Permissions UserAgency : READ/WRITE/FULL pour les AGENT

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Agence | Select | Oui | Sélection de l'agence |
| Immatriculation | Text | Oui | Numéro d'immatriculation (unique) |
| Marque | Text | Oui | Marque du véhicule |
| Modèle | Text | Oui | Modèle du véhicule |
| Date de mise en service | Date | Oui | Date de première mise en service |
| Kilométrage | Number | Oui | Kilométrage actuel |
| Carburant | Select | Oui | Essence, Diesel, Électrique, Hybride |
| Boîte de vitesse | Select | Oui | Manuelle, Automatique |
| Puissance (CV) | Number | Non | Puissance en chevaux |
| Couleur | Autocomplete | Non | Sélection intelligente de couleur |
| Prix/jour (€) | Number | Oui | Tarif journalier |
| Caution (€) | Number | Oui | Montant de la caution |
| Statut | Select | Oui | AVAILABLE, RENTED, MAINTENANCE, UNAVAILABLE |
| Photo | File | Non | Image du véhicule (JPG, PNG, WEBP) |

**Tableau d'affichage:**
- Photo (thumbnail)
- Marque et Modèle
- Immatriculation
- Agence
- Couleur
- Kilométrage
- Carburant
- Boîte de vitesse
- Caution
- Statut (badge coloré)
- Actions (Éditer, Supprimer)

**Validations:**
- Immatriculation unique par agence
- Champs obligatoires vérifiés
- Format de date valide
- Montants positifs
- Image valide (taille, format)

**Use Cases:**
- **UC-VEH-001:** Créer un nouveau véhicule
- **UC-VEH-002:** Modifier un véhicule existant
- **UC-VEH-003:** Supprimer un véhicule
- **UC-VEH-004:** Uploader une photo de véhicule
- **UC-VEH-005:** Rechercher un véhicule par immatriculation

---

### 4. Gestion des Clients (`/clients`)

**Fonctionnalités:**
- Liste de tous les clients
- Création de client avec formulaire complet
- Modification de client existant
- Suppression de client (soft delete)
- Upload et analyse automatique de permis de conduire (IA)
- Auto-remplissage des données depuis le permis
- Validation des doublons (nom + prénom + date de naissance + numéro de permis)
- Avertissement si permis expiré
- **Enterprise:**
  - Champs d'audit automatiques
  - Logging automatique des événements (CLIENT_CREATED, CLIENT_UPDATED, CLIENT_DELETED)
  - Permissions RBAC : AGENTS peuvent créer/modifier, seuls les MANAGER peuvent supprimer
  - Dégradation gracieuse : Si l'IA échoue, l'utilisateur peut saisir manuellement

**Champs du formulaire:**

#### Informations Personnelles
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Agence | Select | Oui | Sélection de l'agence |
| Nom | Text | Oui | Nom de famille |
| Prénom | Text | Oui | Prénom |
| Email | Email | Non | Adresse email |
| Téléphone | Tel | Non | Numéro de téléphone |
| Date de naissance | Date | Oui | Date de naissance |
| Adresse | Textarea | Non | Adresse complète |

#### Nationalité
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Client marocain | Checkbox | Non | Coche si client marocain |
| Pays d'origine | Autocomplete | Non | Pays si non marocain |

#### Informations du Permis
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Permis étranger | Checkbox | Non | Coche si permis étranger |
| Photo du permis | File | Non | Image du permis (analyse IA) |
| Numéro de permis | Text | **Oui** | Numéro du permis de conduire |
| Type de permis | Select | **Oui** | A, A1, B, BE, C, CE, D, DE |
| Date d'expiration | Date | Non | Date d'expiration du permis |

**Tableau d'affichage:**
- Photo permis (thumbnail)
- Agence
- Prénom
- Nom
- Date de naissance
- Adresse
- Nationalité
- N° Permis
- Type permis
- Exp. Permis
- Actions (Éditer, Supprimer)

**Fonctionnalités IA:**
- Analyse automatique de l'image du permis
- Détection du type de permis (marocain/étranger)
- Extraction automatique des données:
  - Nom et prénom
  - Date de naissance
  - Numéro de permis
  - Date d'expiration
  - Type de permis

**Validations:**
- Doublon: nom + prénom + date de naissance + numéro de permis
- Numéro de permis obligatoire
- Type de permis obligatoire
- Avertissement visuel si permis expiré (non bloquant)

**Use Cases:**
- **UC-CLI-001:** Créer un nouveau client
- **UC-CLI-002:** Modifier un client existant
- **UC-CLI-003:** Supprimer un client
- **UC-CLI-004:** Analyser un permis de conduire avec IA
- **UC-CLI-005:** Auto-remplir les données depuis le permis
- **UC-CLI-006:** Vérifier la validité du permis

---

### 5. Gestion des Locations (`/bookings`)

**Fonctionnalités:**
- Liste de toutes les locations
- Création de location avec validation complète
- Modification de location existante
- Suppression de location (soft delete)
- Validation automatique de disponibilité du véhicule
- Validation du type de permis du client
- **Validation permis expiré** : Blocage si permis expire avant fin de location
- **Gestion caution** : Configuration caution lors de la création
- **Frais de retard** : Calcul automatique et override possible (Agency Manager)
- **Temps de préparation** : Validation chevauchement avec période de préparation
- Calcul automatique du prix total
- Prévention des conflits avec maintenance
- **Enterprise:**
  - Champs d'audit automatiques
  - Logging automatique des événements (BOOKING_CREATED, BOOKING_UPDATED, BOOKING_CANCELLED, BOOKING_STATUS_CHANGED)
  - Permissions RBAC : AGENTS peuvent créer/modifier, seuls les MANAGER peuvent supprimer

**Champs du formulaire (Création):**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Agence | Select | Oui | Sélection de l'agence |
| Client | Select | Oui | Sélection du client |
| Véhicule | Select | Oui | Véhicules disponibles uniquement |
| Date et heure de début | Datetime-local | Oui | Date et heure de début de location |
| Date et heure de fin | Datetime-local | Oui | Date et heure de fin de location |
| Prix total (€) | Number | Oui | Prix total calculé automatiquement |
| Statut | Select | Oui | PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED |
| **Caution requise** | Checkbox | Non | Si coché, caution obligatoire |
| **Montant caution (MAD)** | Number | Conditionnel | Obligatoire si caution requise, > 0 |
| **Source décision caution** | Select | Conditionnel | COMPANY ou AGENCY (obligatoire si caution requise) |

**Page Détail Réservation (`/bookings/[id]`):**

**Informations financières affichées:**
- **Caution** : Montant, statut (PENDING/COLLECTED), source (COMPANY/AGENCY), statut final (REFUNDED/PARTIAL/FORFEITED/DISPUTED)
- **Frais de retard** : Montant, date de calcul, indication si modifié manuellement, justification override
- **Temps de préparation** : Durée (minutes) et date de disponibilité du véhicule
- **Montant total** : Prix de base + frais de retard

**Override frais de retard (Agency Manager uniquement):**
- Bouton "Modifier les frais de retard" visible uniquement pour les managers
- Dialog avec :
  - Champ montant (nombre positif)
  - Champ justification (min 10 caractères, max 500)
- Validation et messages d'erreur
- Audit log automatique

**Tableau d'affichage:**
- Client
- Véhicule (marque + modèle)
- Dates (début → fin avec heures)
- Prix total
- Statut (badge coloré)
- Actions (Éditer, Supprimer)

**Validations:**
- Client doit avoir un permis valide et non expiré
- **Blocage si permis expire avant fin de location** (R1.3)
- Type de permis du client doit correspondre au type de véhicule
- Véhicule doit être disponible pour la période
- **Validation chevauchement avec période de préparation** (R2.2)
- Pas de conflit avec une maintenance en cours
- Date de fin > date de début
- Durée minimum: 1 heure
- Calcul automatique du prix (basé sur le tarif journalier)
- **Si caution requise** : `depositAmount` et `depositDecisionSource` obligatoires (R3)

**Règles Métier Implémentées:**

**R1.3 - Validation Permis:**
- Blocage réservation si permis expire avant fin de location
- Blocage check-in si permis expiré ou expire le jour même
- Audit log pour chaque blocage

**R2.2 - Temps de Préparation:**
- Validation chevauchement lors création/modification
- Création automatique période de préparation après check-out
- Durée doublée si retour en retard
- Configuration par agence (`preparationTimeMinutes`, default: 60)

**R3 - Caution:**
- Validation champs obligatoires si `depositRequired = true`
- Blocage check-in si caution requise mais non collectée
- Statuts : PENDING → COLLECTED → REFUNDED/PARTIAL/FORFEITED/DISPUTED

**R4 - Frais de Retard:**
- Calcul automatique :
  - ≤ 1h : 25% du tarif journalier
  - ≤ 2h : 50% du tarif journalier
  - > 4h : 100% du tarif journalier
- Override possible par Agency Manager avec justification (min 10 caractères)
- Audit log pour tous les overrides

**Calcul du prix:**
- Basé sur le `dailyRate` du véhicule
- Arrondi à la journée supérieure
- Minimum 1 journée
- **Frais de retard ajoutés automatiquement** après check-out

**Use Cases:**
- **UC-BOOK-001:** Créer une nouvelle location
- **UC-BOOK-002:** Modifier une location existante
- **UC-BOOK-003:** Supprimer une location
- **UC-BOOK-004:** Vérifier la disponibilité d'un véhicule
- **UC-BOOK-005:** Valider le type de permis du client
- **UC-BOOK-006:** Calculer le prix total automatiquement
- **UC-BOOK-007:** Configurer une caution pour une location
- **UC-BOOK-008:** Modifier les frais de retard (Agency Manager)
- **UC-BOOK-009:** Consulter les informations financières d'une location

---

### 6. Gestion des Amendes (`/fines`)

**Fonctionnalités:**
- Liste de toutes les amendes
- Création d'amende avec pièce jointe
- Modification d'amende existante
- Suppression d'amende
- Upload de pièce jointe (image ou PDF)
- **Protection SaaS** : Vérification que le module FINES est activé
- **Gestion des erreurs 403** : Affichage de `ModuleNotIncluded` si module non activé
- **Enterprise:**
  - Champs d'audit automatiques
  - Logging automatique des événements (FINE_CREATED, FINE_UPDATED, FINE_DELETED)
  - Permissions RBAC : AGENTS peuvent créer/modifier, seuls les MANAGER peuvent supprimer
  - Permissions UserAgency : READ/WRITE/FULL pour les AGENT

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Agence | Select | Oui | Sélection de l'agence |
| Location | Select | Oui | Location associée |
| Montant (€) | Number | Oui | Montant de l'amende |
| Description | Textarea | Oui | Description de l'amende |
| Numéro | Text | Non | Numéro de l'amende |
| Lieu | Text | Non | Lieu de l'amende |
| Pièce jointe | File | Non | Image ou PDF de l'amende |

**Tableau d'affichage:**
- Client et véhicule (depuis la location)
- Description
- Montant
- Date de création
- Actions (Éditer, Supprimer)

**Use Cases:**
- **UC-FINE-001:** Créer une nouvelle amende
- **UC-FINE-002:** Modifier une amende existante
- **UC-FINE-003:** Supprimer une amende
- **UC-FINE-004:** Uploader une pièce jointe (photo/PDF)

---

### 7. Gestion de la Maintenance (`/maintenance`)

**Fonctionnalités:**
- Liste de toutes les maintenances
- Création de maintenance avec validation
- Modification de maintenance existante
- Suppression de maintenance
- Upload de facture ou devis
- Validation pour éviter les conflits avec locations actives
- Statuts: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
- **Enterprise:**
  - Champs d'audit automatiques
  - Logging automatique des événements (MAINTENANCE_CREATED, MAINTENANCE_UPDATED, MAINTENANCE_STATUS_CHANGED)
  - Permissions RBAC : Seuls les AGENCY_MANAGER peuvent créer/modifier/supprimer (AGENTS en lecture seule)

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Agence | Select | Oui | Sélection de l'agence |
| Véhicule | Select | Oui | Véhicule à maintenir |
| Description | Textarea | Oui | Description de la maintenance |
| Date et heure prévue | Datetime-local | Non | Date et heure prévues |
| Coût (€) | Number | Non | Coût de la maintenance |
| Statut | Select | Oui | PLANNED, IN_PROGRESS, COMPLETED, CANCELLED |
| Facture / Devis | File | Non | Document (facture ou devis) |

**Tableau d'affichage:**
- Véhicule (marque + modèle + immatriculation)
- Description
- Date prévue (avec heures)
- Coût
- Statut (badge coloré)
- Actions (Éditer, Supprimer)

**Validations:**
- Pas de location active pour le véhicule
- Vérification de disponibilité via PlanningService
- Date prévue valide

**Use Cases:**
- **UC-MAINT-001:** Créer une nouvelle maintenance
- **UC-MAINT-002:** Modifier une maintenance existante
- **UC-MAINT-003:** Supprimer une maintenance
- **UC-MAINT-004:** Uploader une facture/devis
- **UC-MAINT-005:** Vérifier l'absence de location active
- **UC-MAINT-006:** Changer le statut de maintenance

---

### 8. Planning (`/planning`)

**Fonctionnalités:**
- Vue calendrier interactive (FullCalendar)
- Affichage des locations, maintenances et temps de préparation
- Événements cliquables avec modal de détails
- Navigation vers les détails complets
- Filtrage par période
- Couleurs distinctes par type d'événement
- **Enterprise:** Permissions RBAC pour l'accès au planning

### 9. Analytics (`/analytics`) - Enterprise Feature

**Fonctionnalités:**
- Dashboard de KPIs en temps réel
- Métriques calculées automatiquement depuis les données existantes
- **Protection SaaS** : Vérification que le module ANALYTICS est activé
- **Gestion des erreurs 403** : Affichage de `ModuleNotIncluded` si module non activé
- **Accès:** Seulement pour AGENCY_MANAGER

**KPIs disponibles:**
- Taux d'occupation des véhicules (%)
- Revenus totaux (€)
- Revenus par véhicule (€)
- Durée moyenne de location (jours)
- Top 10 des véhicules les plus loués

**Endpoint API:**
```
GET /api/v1/analytics/agency/:agencyId/kpis?startDate=&endDate=
```

**Permissions:**
- `analytics:read` - Seulement AGENCY_MANAGER, COMPANY_ADMIN, SUPER_ADMIN

**Types d'événements:**
- **BOOKING** (Location) - Bleu
- **MAINTENANCE** (Maintenance) - Rouge
- **PREPARATION_TIME** (Temps de préparation) - Orange

**Modal de détails:**
- Informations complètes de l'événement
- Client (pour les locations)
- Véhicule
- Dates et heures
- Statut
- Bouton pour voir les détails complets

**Interactivité:**
- Clic sur un événement → Modal avec détails
- Navigation vers page de détails
- Hover effects sur les événements
- Couleurs dynamiques selon le statut

**Use Cases:**
- **UC-PLAN-001:** Visualiser le planning des véhicules
- **UC-PLAN-002:** Voir les détails d'un événement
- **UC-PLAN-003:** Naviguer vers les détails complets
- **UC-PLAN-004:** Filtrer par période

---

## 🎨 Spécifications des Écrans

### Design System

**Couleurs principales:**
- Fond principal: `#1D1F23`
- Fond secondaire: `#2C2F36`
- Fond hover: `#353840`
- Bordure: `#374151` (gray-700)
- Texte principal: `#FFFFFF`
- Texte secondaire: `#9CA3AF` (gray-400)
- Accent: `#3E7BFA` (bleu)
- Accent hover: `#2E6BEA`

**Typographie:**
- Police: System fonts (sans-serif)
- Titres: Bold, 3xl (30px)
- Sous-titres: Semibold, xl (20px)
- Corps: Regular, base (16px)
- Petits textes: Regular, sm (14px)

**Composants UI:**
- Boutons: Rounded-lg, padding px-4 py-2
- Inputs: Rounded-lg, bg-[#1D1F23], border-gray-600
- Modals: max-w-md ou max-w-2xl, max-h-[90vh], scrollable
- Cards: Rounded-lg, border-gray-700, hover effects

### Structure des Modals

Tous les modals suivent la même structure:
```
┌─────────────────────────────────┐
│ Header (fixe)                   │
│ ─────────────────────────────── │
│                                 │
│ Contenu (scrollable)            │
│ - Formulaire                   │
│ - Champs                       │
│ - Validations                  │
│                                 │
│ ─────────────────────────────── │
│ Footer (fixe)                   │
│ [Annuler] [Créer/Modifier]      │
└─────────────────────────────────┘
```

**Caractéristiques:**
- Header avec titre et bordure inférieure
- Contenu scrollable avec `overflow-y-auto`
- Footer fixe avec boutons d'action
- Scrollbar visible quand nécessaire
- Boutons toujours accessibles

---

## 📊 Use Cases par Module

### Module Authentification

**UC-AUTH-001: Connexion**
- **Acteur:** Utilisateur (Manager/Agent)
- **Précondition:** Aucune
- **Scénario principal:**
  1. L'utilisateur accède à `/login`
  2. Saisit son email et mot de passe
  3. Clique sur "Se connecter"
  4. Le système valide les credentials
  5. Le système génère un token JWT
  6. L'utilisateur est redirigé vers le dashboard
- **Scénario alternatif:** Credentials invalides → Message d'erreur affiché

**UC-AUTH-002: Déconnexion**
- **Acteur:** Utilisateur connecté
- **Scénario:** L'utilisateur clique sur "Déconnexion" → Token supprimé → Redirection vers `/login`

### Module Véhicules

**UC-VEH-001: Créer un véhicule**
- **Acteur:** Manager
- **Précondition:** Utilisateur connecté avec rôle AGENCY_MANAGER
- **Scénario principal:**
  1. Accède à `/vehicles`
  2. Clique sur "+ Nouveau véhicule"
  3. Remplit le formulaire (tous les champs obligatoires)
  4. Upload une photo (optionnel)
  5. Clique sur "Créer"
  6. Le système valide les données
  7. Le système vérifie l'unicité de l'immatriculation
  8. Le véhicule est créé
  9. Message de succès affiché
  10. La liste est mise à jour
- **Scénario alternatif:** Immatriculation déjà existante → Message d'erreur

**UC-VEH-002: Modifier un véhicule**
- **Acteur:** Manager
- **Scénario:** Similaire à UC-VEH-001 mais avec données pré-remplies

**UC-VEH-003: Supprimer un véhicule**
- **Acteur:** Manager
- **Scénario:** Clic sur icône poubelle → Confirmation → Soft delete

### Module Clients

**UC-CLI-001: Créer un client avec analyse IA**
- **Acteur:** Manager/Agent
- **Scénario principal:**
  1. Accède à `/clients`
  2. Clique sur "+ Nouveau client"
  3. Remplit les informations personnelles
  4. Upload une photo de permis
  5. Clique sur "Analyser le permis"
  6. Le système envoie l'image à l'API IA
  7. Les données sont extraites automatiquement
  8. Le formulaire est pré-rempli
  9. L'utilisateur vérifie et complète
  10. Clique sur "Créer"
  11. Le système valide (doublons, permis obligatoire)
  12. Le client est créé
- **Scénario alternatif:** Permis invalide ou expiré → Avertissement affiché

**UC-CLI-002: Vérifier validité permis**
- **Acteur:** Système
- **Scénario:** Lors de la création/modification, si `licenseExpiryDate < now()` → Avertissement visuel (non bloquant)

### Module Locations

**UC-BOOK-001: Créer une location**
- **Acteur:** Manager/Agent
- **Précondition:** Client avec permis valide, véhicule disponible
- **Scénario principal:**
  1. Accède à `/bookings`
  2. Clique sur "+ Nouvelle location"
  3. Sélectionne client, véhicule, dates (datetime)
  4. Le système calcule automatiquement le prix
  5. Clique sur "Créer"
  6. Le système valide:
     - Permis valide et non expiré
     - Type de permis approprié
     - Disponibilité du véhicule
     - Pas de conflit avec maintenance
  7. La location est créée
  8. La page se recharge pour afficher la nouvelle location
- **Scénario alternatif:** Conflit détecté → Message d'erreur détaillé

**UC-BOOK-002: Valider type de permis**
- **Acteur:** Système
- **Scénario:** Lors de la création, vérifier que le type de permis du client correspond au type de véhicule (B pour voitures, C pour camions, D pour bus)

### Module Amendes

**UC-FINE-001: Créer une amende avec pièce jointe**
- **Acteur:** Manager/Agent
- **Scénario:**
  1. Accède à `/fines`
  2. Clique sur "+ Nouvelle amende"
  3. Sélectionne la location
  4. Saisit montant et description
  5. Optionnel: Numéro et lieu
  6. Upload une pièce jointe (image/PDF)
  7. Clique sur "Créer"
  8. L'amende est créée avec pièce jointe

### Module Maintenance

**UC-MAINT-001: Créer une maintenance**
- **Acteur:** Manager
- **Précondition:** Aucune location active pour le véhicule
- **Scénario principal:**
  1. Accède à `/maintenance`
  2. Clique sur "+ Nouvelle maintenance"
  3. Sélectionne véhicule, description, date (datetime)
  4. Optionnel: Coût et document
  5. Clique sur "Créer"
  6. Le système valide l'absence de location active
  7. La maintenance est créée
- **Scénario alternatif:** Location active → Message d'erreur

### Module Planning

**UC-PLAN-001: Visualiser le planning**
- **Acteur:** Manager/Agent
- **Scénario:**
  1. Accède à `/planning`
  2. Le calendrier s'affiche avec tous les événements
  3. Les événements sont colorés par type
  4. Clic sur un événement → Modal avec détails
  5. Clic sur "Voir détails" → Navigation vers page complète

---

## 🔧 Détails Techniques

### Authentification

**JWT Token:**
- Access token: Stocké dans `localStorage`
- Refresh token: Géré par le backend
- Expiration: Configurée côté backend
- Injection automatique dans les headers via Axios interceptor

**Sécurité:**
- CORS configuré pour `localhost:8080` et `localhost:3001`
- Helmet pour les headers de sécurité
- Rate limiting avec Throttler
- Validation des inputs avec class-validator

### Upload de Fichiers

**Véhicules:**
- Chemin: `/uploads/vehicles/`
- Formats acceptés: JPG, PNG, WEBP
- Taille max: Configurée dans Multer

**Clients (Permis):**
- Chemin: `/uploads/licenses/`
- Formats acceptés: JPG, PNG, WEBP
- Analyse IA: OpenAI Vision API

**Amendes:**
- Chemin: `/uploads/fines/`
- Formats acceptés: JPG, PNG, PDF

**Maintenance:**
- Chemin: `/uploads/maintenance/`
- Formats acceptés: JPG, PNG, PDF

### Validation des Données

**Frontend:**
- Validation HTML5 (required, type, pattern)
- Validation React (state management)
- Messages d'erreur affichés dans le formulaire

**Backend:**
- DTOs avec class-validator
- Validation automatique via ValidationPipe
- Messages d'erreur structurés

### Gestion des Erreurs

**Frontend:**
- Try-catch dans les mutations
- Affichage des erreurs dans le formulaire
- Messages utilisateur-friendly

**Backend:**
- Exceptions NestJS (BadRequestException, ConflictException, etc.)
- Messages d'erreur détaillés
- Logging avec Logger

### Performance

**Optimisations:**
- React Query pour le cache et la synchronisation
- Requêtes optimisées avec Prisma (select spécifique)
- Images servies statiquement
- Lazy loading des composants (si nécessaire)

---

## 🗄️ Schéma de Base de Données

### Modèles Principaux

#### Vehicle
```prisma
model Vehicle {
  id                 String        @id
  agencyId           String
  registrationNumber String        @unique
  brand              String
  model              String
  year               Int
  mileage            Int
  fuel               String?
  gearbox            String?
  dailyRate          Float
  depositAmount      Float
  status             VehicleStatus
  imageUrl           String?
  horsepower         Int?
  color              String?
  deletedAt          DateTime?
  createdAt          DateTime
  updatedAt          DateTime
  
  // Enterprise: Audit fields
  createdByUserId    String?
  updatedByUserId    String?
  deletedByUserId    String?
  deletedReason      String?
}
```

#### Client
```prisma
model Client {
  id                 String   @id
  agencyId           String
  name               String
  email              String?
  phone              String?
  note               String?
  licenseImageUrl    String?
  isMoroccan         Boolean
  countryOfOrigin    String?
  licenseNumber      String?
  licenseExpiryDate  DateTime?
  isForeignLicense   Boolean
  deletedAt          DateTime?
  createdAt          DateTime
  updatedAt          DateTime
  
  // Enterprise: Audit fields
  createdByUserId    String?
  updatedByUserId    String?
  deletedByUserId    String?
  deletedReason      String?
}
```

#### Booking
```prisma
model Booking {
  id         String        @id
  agencyId   String
  vehicleId  String
  clientId   String
  startDate  DateTime
  endDate    DateTime
  totalPrice Float
  status     BookingStatus
  deletedAt  DateTime?
  createdAt  DateTime
  updatedAt  DateTime
  
  // Enterprise: Audit fields
  createdByUserId    String?
  updatedByUserId    String?
  deletedByUserId    String?
  deletedReason      String?
}
```

#### Maintenance
```prisma
model Maintenance {
  id          String            @id
  agencyId    String
  vehicleId   String
  description String
  plannedAt   DateTime?
  cost        Float?
  status      MaintenanceStatus
  documentUrl String?
  deletedAt   DateTime?
  createdAt   DateTime
  updatedAt   DateTime
  
  // Enterprise: Audit fields
  createdByUserId    String?
  updatedByUserId    String?
  deletedByUserId    String?
  deletedReason      String?
}
```

#### Fine
```prisma
model Fine {
  id            String   @id
  agencyId      String
  bookingId     String
  amount        Float
  description   String
  number        String?
  location      String?
  attachmentUrl String?
  createdAt     DateTime
  updatedAt     DateTime @default(now()) @updatedAt
  
  // Enterprise: Audit fields
  createdByUserId    String?
  updatedByUserId    String?
  deletedByUserId    String?
  deletedReason      String?
}
```

#### BusinessEventLog (Enterprise)
```prisma
model BusinessEventLog {
  id                String            @id
  agencyId          String
  entityType        String            // "Booking", "Vehicle", etc.
  entityId          String
  eventType         BusinessEventType  // CREATED, UPDATED, DELETED, etc.
  previousState     Json?             // État avant (pour updates)
  newState          Json              // État après
  triggeredByUserId String?
  createdAt         DateTime
}
```

### Relations

- `Vehicle` → `Agency` (Many-to-One)
- `Client` → `Agency` (Many-to-One)
- `Booking` → `Vehicle`, `Client`, `Agency` (Many-to-One)
- `Maintenance` → `Vehicle`, `Agency` (Many-to-One)
- `Fine` → `Booking`, `Agency` (Many-to-One)

---

## 🌐 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token

### Véhicules
- `GET /api/vehicles` - Liste des véhicules
- `POST /api/vehicles` - Créer un véhicule
- `GET /api/vehicles/:id` - Détails d'un véhicule
- `PATCH /api/vehicles/:id` - Modifier un véhicule
- `DELETE /api/vehicles/:id` - Supprimer un véhicule
- `POST /api/vehicles/upload-image` - Upload photo véhicule

### Clients
- `GET /api/clients` - Liste des clients
- `POST /api/clients` - Créer un client
- `GET /api/clients/:id` - Détails d'un client
- `PATCH /api/clients/:id` - Modifier un client
- `DELETE /api/clients/:id` - Supprimer un client
- `POST /api/clients/analyze-license` - Analyser un permis (IA)

### Locations
- `GET /api/bookings` - Liste des locations
- `POST /api/bookings` - Créer une location
- `GET /api/bookings/:id` - Détails d'une location
- `PATCH /api/bookings/:id` - Modifier une location
- `DELETE /api/bookings/:id` - Supprimer une location

### Amendes
- `GET /api/fines` - Liste des amendes
- `POST /api/fines` - Créer une amende
- `GET /api/fines/:id` - Détails d'une amende
- `PATCH /api/fines/:id` - Modifier une amende
- `DELETE /api/fines/:id` - Supprimer une amende
- `POST /api/fines/upload-attachment` - Upload pièce jointe

### Maintenance
- `GET /api/maintenance` - Liste des maintenances
- `POST /api/maintenance` - Créer une maintenance
- `GET /api/maintenance/:id` - Détails d'une maintenance
- `PATCH /api/maintenance/:id` - Modifier une maintenance
- `DELETE /api/maintenance/:id` - Supprimer une maintenance
- `POST /api/maintenance/upload-document` - Upload facture/devis

### Planning
- `GET /api/planning` - Récupérer le planning
- `POST /api/planning/check-availability` - Vérifier disponibilité

**Documentation complète:** `http://localhost:3000/api/docs` (Swagger)

---

## ✅ Tests et Validation

### Tests Fonctionnels

**Scénarios testés:**
1. ✅ Connexion avec credentials valides
2. ✅ Connexion avec credentials invalides
3. ✅ Création de véhicule avec toutes les données
4. ✅ Création de véhicule avec immatriculation dupliquée
5. ✅ Upload de photo de véhicule
6. ✅ Création de client avec analyse IA du permis
7. ✅ Auto-remplissage depuis le permis
8. ✅ Validation des doublons de clients
9. ✅ Création de location avec validation complète
10. ✅ Prévention des conflits de location/maintenance
11. ✅ Création d'amende avec pièce jointe
12. ✅ Création de maintenance avec validation
13. ✅ Affichage du planning interactif
14. ✅ Navigation depuis le planning

### Validations Techniques

**Frontend:**
- ✅ Pas d'erreurs de linting
- ✅ TypeScript strict mode
- ✅ Tous les composants fonctionnels
- ✅ Gestion des erreurs complète
- ✅ Responsive design

**Backend:**
- ✅ Pas d'erreurs de compilation
- ✅ Tous les endpoints fonctionnels
- ✅ Validation des DTOs
- ✅ Gestion des permissions
- ✅ Soft delete implémenté

### Points d'Attention

**À améliorer:**
- Tests unitaires (Jest)
- Tests E2E (Cypress/Playwright)
- Gestion des erreurs réseau
- Optimisation des images (compression)
- Cache des requêtes API

---

## 📸 Captures d'Écran (À Ajouter)

> **Note:** Les captures d'écran doivent être ajoutées manuellement dans ce document ou dans un dossier séparé.

### Écrans à Documenter:
1. Page de connexion (`/login`)
2. Dashboard (`/`)
3. Liste des véhicules (`/vehicles`)
4. Formulaire de création véhicule
5. Liste des clients (`/clients`)
6. Formulaire de création client avec analyse IA
7. Liste des locations (`/bookings`)
8. Formulaire de création location
9. Liste des amendes (`/fines`)
10. Liste des maintenances (`/maintenance`)
11. Planning interactif (`/planning`)

---

## 🚀 Déploiement

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Installation

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL et autres variables
npx prisma migrate dev
npx prisma generate
npm run dev
```

**Frontend:**
```bash
cd frontend-agency
npm install
cp .env.example .env
# Configurer NEXT_PUBLIC_API_URL
npm run dev
```

### Variables d'Environnement

**Backend (.env):**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
VISION_API_KEY="..." # Pour l'analyse IA
VISION_PROVIDER="openai" # ou "google" ou "none"
PORT=3000
FRONTEND_AGENCY_URL="http://localhost:8080"

# Enterprise Features
READ_ONLY_MODE=false # true pour activer le mode read-only
UPLOAD_PATH=./uploads # Chemin de stockage des fichiers
```

**Frontend (.env):**
```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
```

---

## 📝 Notes de Version

### Version 2.0.0 Enterprise (Décembre 2024)

#### Fonctionnalités Enterprise
- ✅ **Data Governance** : Champs d'audit automatiques sur tous les enregistrements
- ✅ **RBAC** : Système de permissions granulaire (AGENCY_MANAGER vs AGENT)
- ✅ **Business Event Logging** : Logging automatique de tous les événements métier
- ✅ **Analytics Module** : KPIs et métriques business en temps réel
- ✅ **API Versioning** : Endpoints sous `/api/v1`
- ✅ **Read-Only Mode** : Mode maintenance avec variable d'environnement
- ✅ **Operational Resilience** : Services abstraits, dégradation gracieuse
- ✅ **SaaS Module Management** : Protection des modules, héritage, gestion des erreurs 403
- ✅ **Permissions UserAgency** : Système de permissions READ/WRITE/FULL par utilisateur et agence
- ✅ **Gestion des erreurs 403** : Composants dédiés pour modules non activés

#### Fonctionnalités Existant
- ✅ Migration complète vers NestJS
- ✅ Interface React moderne avec Vite
- ✅ Analyse IA des permis de conduire
- ✅ Planning interactif avec FullCalendar
- ✅ Validation complète des locations et maintenances
- ✅ Upload de fichiers pour véhicules, permis, amendes, maintenance
- ✅ Gestion des doublons
- ✅ Modals scrollables avec boutons fixes

---

## 📞 Support

Pour toute question ou problème:
- Consulter la documentation Swagger: `http://localhost:3000/api/docs`
- Vérifier les logs du backend
- Vérifier la console du navigateur (F12)

---

**Document généré le:** Décembre 2024  
**Dernière mise à jour:** Décembre 2024  
**Version du document:** 2.0.0 SaaS

