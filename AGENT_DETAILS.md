# 📱 MalocAuto - Application Mobile Agent
## Spécifications Techniques et Fonctionnelles Complètes

**Version:** 2.0.0 Enterprise  
**Date:** Janvier 2025  
**Type:** Application Mobile React Native (Expo) - Module Agent Terrain  
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
8. [Règles Métier Implémentées](#règles-métier-implémentées)
9. [API Endpoints](#api-endpoints)
10. [Tests et Validation](#tests-et-validation)

---

## 🎯 Vue d'ensemble

### Description
MalocAuto Agent est une application mobile React Native développée avec Expo SDK 54, conçue pour les agents et managers d'agences de location de véhicules. L'application permet de gérer le cycle de vie complet des réservations (bookings) : création, check-in, check-out, avec support offline complet et persistance des données.

### Objectifs
- **Gestion des réservations** : Création (managers uniquement), consultation, modification des réservations
- **Check-in/Check-out** : Processus complet de remise et récupération de véhicules avec validation stricte
- **Mode offline** : Fonctionnement complet sans connexion internet avec synchronisation automatique
- **Multi-langue** : Support français, anglais, et darija marocaine
- **Sécurité** : Authentification JWT, stockage sécurisé, validation stricte des règles métier
- **Persistance** : Sauvegarde automatique des formulaires avec AsyncStorage

### Public Cible
- **AGENCY_MANAGER** : Managers d'agence avec droits complets + création de réservations
- **AGENT** : Agents opérationnels avec droits terrain uniquement (check-in/check-out)

---

## 🏢 Fonctionnalités Enterprise

### Data Governance & Audit Trail
- **Validation backend stricte** : Toutes les règles métier sont validées côté serveur
- **Traçabilité complète** : Toutes les actions sont loggées dans `AuditLog` et `BusinessEventLog`
- **Validation permis** : Blocage automatique si permis expiré ou expirant
- **Validation caution** : Blocage check-in si caution requise mais non collectée

### RBAC (Role-Based Access Control)
- **Système de permissions granulaire** :
  - **AGENCY_MANAGER** : Tous droits terrain + création booking
  - **AGENT** : Opérations terrain uniquement (check-in/check-out)
- **Protection au niveau backend** : Guards de permissions sur tous les endpoints
- **Protection au niveau frontend** : Actions masquées selon les permissions

### Business Event Logging
- **Logging automatique** : Tous les événements métier sont loggés dans `BusinessEventLog`
- **Types d'événements** : 
  - `BOOKING_CREATED`, `BOOKING_UPDATED`, `BOOKING_STATUS_CHANGED`
  - `CHECK_IN`, `CHECK_OUT`
- **Stockage** : État avant/après en JSON pour traçabilité complète
- **Performance** : Logging asynchrone et non-bloquant

### Offline-First Architecture
- **Fonctionnement offline complet** : Consultation, formulaires, photos, signatures
- **Queue SQLite locale** : Actions mises en queue pour synchronisation ultérieure
- **Synchronisation automatique** : Dès que la connexion est rétablie
- **Indicateur visuel** : `OfflineIndicator` affiche le statut et les actions en attente

### Persistance des Données
- **AsyncStorage** : Sauvegarde automatique des formulaires check-in/check-out
- **Chargement automatique** : Données restaurées au retour sur l'écran
- **Pré-remplissage** : Données client (permis, pièce d'identité) depuis la réservation

---

## 🛠️ Stack Technique

### Frontend
```json
{
  "framework": "React Native 0.81.5",
  "build_tool": "Expo SDK 54",
  "navigation": "@react-navigation/native 6.1.9",
  "state_management": "@tanstack/react-query 5.17.0",
  "http_client": "axios 1.6.2",
  "validation": "zod 3.22.4",
  "i18n": "i18next 23.7.6 + react-i18next 14.0.0",
  "storage": "expo-secure-store 15.0.8 + @react-native-async-storage/async-storage 2.2.0",
  "database": "expo-sqlite 16.0.10",
  "camera": "expo-camera 17.0.10",
  "image_picker": "expo-image-picker 17.0.10",
  "signature": "react-native-signature-canvas 3.0.0",
  "language": "TypeScript 5.1.3"
}
```

**Plateformes supportées :**
- iOS (iPhone, iPad)
- Android (téléphones, tablettes)
- Web (développement uniquement)

### Backend
```json
{
  "framework": "NestJS 10.3.0",
  "database": "PostgreSQL",
  "orm": "Prisma 5.7.1",
  "authentication": "JWT (Passport)",
  "api_version": "/api/v1"
}
```

**URL API :** `http://localhost:3000/api/v1` (développement)  
**Swagger :** `http://localhost:3000/api/docs`

---

## 🏗️ Architecture

### Structure Frontend
```
mobile-agent/
├── src/
│   ├── screens/              # Écrans de l'application
│   │   ├── LanguageSelectionScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── BookingsScreen.tsx
│   │   ├── BookingDetailsScreen.tsx
│   │   ├── CreateBookingScreen.tsx
│   │   ├── CheckInScreen.tsx
│   │   ├── CheckOutScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/           # Composants réutilisables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── PhotoPicker.tsx
│   │   ├── SignaturePad.tsx
│   │   ├── DamageForm.tsx
│   │   ├── Dropdown.tsx
│   │   └── OfflineIndicator.tsx
│   ├── services/             # Services métier
│   │   ├── api.ts            # Client Axios configuré
│   │   ├── auth.service.ts   # Authentification
│   │   ├── booking.service.ts # Gestion réservations
│   │   ├── offline.service.ts # Queue offline SQLite
│   │   └── sync.service.ts   # Synchronisation
│   ├── navigation/           # Configuration navigation
│   │   ├── AuthStack.tsx    # Stack authentification
│   │   └── AppStack.tsx      # Stack application
│   ├── contexts/             # Contextes React
│   │   └── AuthContext.tsx   # Contexte authentification
│   ├── config/               # Configuration
│   │   └── api.ts           # Configuration API
│   ├── types/                # Types TypeScript
│   │   └── index.ts         # Types globaux
│   ├── i18n/                 # Internationalisation
│   │   ├── fr.json          # Français
│   │   ├── en.json          # Anglais
│   │   └── darija.json      # Darija marocaine
│   ├── utils/                # Utilitaires
│   │   ├── tasks.utils.ts   # Dérivation tâches depuis bookings
│   │   └── validation.ts    # Helpers validation
│   └── App.tsx              # Point d'entrée
```

### Flux de Données
```
User Action
    ↓
Screen Component
    ↓
Service Layer (booking.service.ts, auth.service.ts)
    ↓
API Client (api.ts)
    ↓
Backend API (NestJS)
    ↓
Database (PostgreSQL)
```

### Mode Offline
```
User Action (Offline)
    ↓
Service Layer
    ↓
Offline Service (SQLite Queue)
    ↓
[Connexion rétablie]
    ↓
Sync Service
    ↓
API Client
    ↓
Backend API
```

---

## 📦 Modules et Fonctionnalités

### 1. Authentification (`/login`)

**Fonctionnalités:**
- Connexion par email et mot de passe
- Stockage sécurisé du token (SecureStore)
- Vérification du statut de la Company (blocage si désactivée)
- Gestion des tokens JWT (access + refresh)
- Redirection automatique si non authentifié
- **Enterprise:** Les événements de connexion sont loggés dans AuditLog

**Champs du formulaire:**
- **Email** (obligatoire, type: email)
- **Mot de passe** (obligatoire, type: password, minimum 8 caractères)

**Validation:**
- Email valide
- Mot de passe non vide
- Affichage d'erreurs spécifiques

**Permissions:**
- Tous les utilisateurs peuvent se connecter
- Les permissions sont chargées après connexion selon le rôle

**Use Cases:**
- **UC-AUTH-001:** Se connecter avec email et mot de passe
- **UC-AUTH-002:** Vérifier le statut de la company
- **UC-AUTH-003:** Gérer les tokens JWT
- **UC-AUTH-004:** Se déconnecter

---

### 2. Sélection de Langue (`/language-selection`)

**Fonctionnalités:**
- Sélection de langue au premier lancement
- Support français, anglais, darija marocaine
- Sauvegarde de la préférence
- Changement de langue dans les paramètres

**Langues disponibles:**
- **Français (fr)** - Langue par défaut
- **Anglais (en)**
- **Darija marocaine (darija)**

**Use Cases:**
- **UC-LANG-001:** Sélectionner la langue au premier lancement
- **UC-LANG-002:** Changer la langue dans les paramètres
- **UC-LANG-003:** Vérifier les traductions complètes

---

### 3. Liste des Missions (`/bookings`)

**Fonctionnalités:**
- Liste de toutes les missions dérivées des bookings
- Groupement par sections : "En retard", "Aujourd'hui", "À venir", "Terminées"
- Filtrage par type de tâche (CHECK_IN, CHECK_OUT)
- Affichage des informations essentielles (client, véhicule, dates, statut)
- Badge "Terminée" pour les missions complétées
- Pull-to-refresh pour actualiser
- Navigation vers détails ou action (check-in/check-out)

**Sections de missions:**
- **En retard** : Missions avec date < aujourd'hui
- **Aujourd'hui** : Missions avec date = aujourd'hui
- **À venir** : Missions avec date > aujourd'hui
- **Terminées** : Missions avec statut COMPLETED (consultation seule)

**Informations affichées:**
- Nom du client
- Véhicule (marque + modèle)
- Dates (début → fin avec heures)
- Statut (badge coloré)
- Type de tâche (CHECK_IN ou CHECK_OUT)
- Badge "Terminée" si applicable

**Actions disponibles:**
- **"DÉMARRER LA MISSION"** : Pour missions actives (CHECK_IN ou CHECK_OUT)
- **"Voir les détails"** : Pour missions terminées
- **Clic sur carte** : Navigation vers détails ou action

**Use Cases:**
- **UC-BOOK-001:** Voir la liste des missions
- **UC-BOOK-002:** Filtrer par section
- **UC-BOOK-003:** Actualiser la liste
- **UC-BOOK-004:** Naviguer vers une mission
- **UC-BOOK-005:** Consulter une mission terminée

---

### 4. Détails d'une Mission (`/bookings/:id`)

**Fonctionnalités:**
- Affichage des détails complets d'une réservation
- Informations client (nom, téléphone, email)
- Informations véhicule (marque, modèle, immatriculation, photo)
- Dates et heures (début, fin)
- Statut de la réservation
- Boutons d'action selon le statut
- Informations caution (si applicable)

**Informations affichées:**
- **Client** : Nom, téléphone, email
- **Véhicule** : Marque, modèle, immatriculation, photo
- **Dates** : Début et fin avec heures
- **Statut** : Badge coloré
- **Caution** : Montant, type, statut (si applicable)

**Actions disponibles:**
- **"DÉMARRER LA MISSION"** : Si statut CONFIRMED (check-in) ou ACTIVE (check-out)
- **"Voir les détails"** : Si statut COMPLETED
- **Boutons contact** : Appel, WhatsApp (si disponibles)

**Use Cases:**
- **UC-DETAIL-001:** Voir les détails d'une mission
- **UC-DETAIL-002:** Démarrer une mission (check-in/check-out)
- **UC-DETAIL-003:** Contacter le client

---

### 5. Création de Réservation (`/bookings/new`) - AGENCY_MANAGER uniquement

**Fonctionnalités:**
- Création de réservation (uniquement pour AGENCY_MANAGER)
- Sélection agence, client, véhicule
- Définition dates début et fin
- Validation automatique (permis, disponibilité)
- Calcul automatique du prix

**Champs du formulaire:**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Agence | Select | Oui | Sélection de l'agence |
| Client | Select | Oui | Sélection du client |
| Véhicule | Select | Oui | Véhicules disponibles uniquement |
| Date et heure de début | Datetime | Oui | Date et heure de début de location |
| Date et heure de fin | Datetime | Oui | Date et heure de fin de location |

**Validations:**
- Client doit avoir un permis valide et non expiré
- **Blocage si permis expire avant fin de location** (R1.3)
- Véhicule doit être disponible pour la période
- **Validation chevauchement avec période de préparation** (R2.2)
- Date de fin > date de début
- Durée minimum: 1 heure

**Permissions:**
- **AGENCY_MANAGER** : ✅ Accès autorisé
- **AGENT** : ❌ Accès refusé (bouton masqué)

**Use Cases:**
- **UC-CREATE-001:** Créer une nouvelle réservation (AGENCY_MANAGER)
- **UC-CREATE-002:** Valider le permis du client
- **UC-CREATE-003:** Vérifier la disponibilité du véhicule

---

### 6. Check-In (`/checkin/:bookingId`)

**Fonctionnalités:**
- Processus complet de livraison de véhicule
- Saisie données véhicule avant location
- Documentation dommages existants
- Vérification documents client (permis, pièce d'identité)
- Gestion caution (affichage et statut collection)
- Capture signature client
- **Persistance automatique** avec AsyncStorage
- **Pré-remplissage** depuis données réservation

**Champs du formulaire:**

#### Données Véhicule AVANT
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Kilométrage départ | Number | Oui | Kilométrage actuel (>= 0) |
| Niveau carburant | Enum | Oui | EMPTY, QUARTER, HALF, THREE_QUARTERS, FULL |
| Photos avant | Array Image | Oui | Minimum 4 photos obligatoires |
| Notes départ | String | Non | Notes optionnelles (max 500 caractères) |

#### Dommages Existants
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Zone | String | Oui | Zone du dommage (ex: "Pare-chocs avant") |
| Type | Enum | Oui | RAYURE, BOSSE, CASSÉ, AUTRE |
| Sévérité | Enum | Oui | MINEUR, MOYEN, MAJEUR |
| Description | String | Oui | Description détaillée |
| Photos | Array Image | Oui | Photos du dommage |

#### Documents Client
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Photo permis | Image | Oui | Photo du permis de conduire |
| Date expiration permis | Date | Oui | **STRICTEMENT > aujourd'hui** |
| Pièce identité | Image/PDF | Non | Photo ou scan de la pièce d'identité |
| Statut extraction | Enum | Non | OK, TO_VERIFY |

#### Caution (Décision prise à la réservation)
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Caution requise | Boolean | - | Affiché en lecture seule depuis réservation |
| Montant caution | Number | - | Affiché en lecture seule depuis réservation |
| Type caution | Enum | - | Affiché en lecture seule depuis réservation |
| Statut collection | Enum | Conditionnel | PENDING ou COLLECTED (obligatoire si caution requise) |

#### Signature Client
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Signature | Canvas/Base64 | Oui | Signature électronique du client |
| Date signature | DateTime | Auto | Générée automatiquement |

**Validations:**
- **R1.3 - Permis** : Blocage si permis expiré ou expirant aujourd'hui
- **R3 - Caution** : Blocage si caution requise mais `depositStatusCheckIn = PENDING`
- Minimum 4 photos avant obligatoires
- Signature client obligatoire
- Kilométrage >= 0

**Persistance:**
- Sauvegarde automatique dans AsyncStorage
- Chargement automatique au retour sur l'écran
- Données conservées même après fermeture de l'app

**Pré-remplissage:**
- Permis client (si disponible dans réservation)
- Pièce d'identité (si disponible dans réservation)
- Informations caution depuis réservation

**Use Cases:**
- **UC-CHECKIN-001:** Effectuer un check-in complet
- **UC-CHECKIN-002:** Documenter les dommages existants
- **UC-CHECKIN-003:** Vérifier le permis du client
- **UC-CHECKIN-004:** Gérer la caution
- **UC-CHECKIN-005:** Capturer la signature
- **UC-CHECKIN-006:** Sauvegarder et reprendre plus tard

---

### 7. Check-Out (`/checkout/:bookingId`)

**Fonctionnalités:**
- Processus complet de récupération de véhicule
- Saisie données véhicule après location
- Documentation nouveaux dommages
- Calcul automatique frais de retard (backend)
- Gestion frais supplémentaires
- Capture signature restitution
- **Persistance automatique** avec AsyncStorage

**Champs du formulaire:**

#### Données Véhicule APRÈS
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Kilométrage retour | Number | Oui | Kilométrage final (>= kilométrage départ) |
| Niveau carburant | Enum | Oui | EMPTY, QUARTER, HALF, THREE_QUARTERS, FULL |
| Photos après | Array Image | Oui | Minimum 4 photos obligatoires |
| Notes retour | String | Non | Notes optionnelles (max 500 caractères) |

#### Nouveaux Dommages
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Zone | String | Oui | Zone du dommage |
| Type | Enum | Oui | RAYURE, BOSSE, CASSÉ, AUTRE |
| Sévérité | Enum | Oui | MINEUR, MOYEN, MAJEUR |
| Description | String | Oui | Description détaillée |
| Photos | Array Image | Oui | Photos du dommage |

#### Frais et Encaissement
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Frais de retard | Number | Auto | Calculé automatiquement par le backend (R4) |
| Frais supplémentaires | Number | Non | Frais additionnels |
| Encaissement espèces | Boolean | Non | Si paiement en espèces |
| Montant espèces | Number | Conditionnel | Si encaissement espèces |
| Reçu espèces | Image | Non | Photo du reçu si espèces |

#### Signature Restitution
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Signature restitution | Canvas/Base64 | Oui | Signature électronique du client |
| Date signature | DateTime | Auto | Générée automatiquement |

**Validations:**
- Kilométrage retour >= kilométrage départ
- Minimum 4 photos après obligatoires
- Signature restitution obligatoire

**Calcul Frais de Retard (R4):**
- ≤ 1h : 25% du tarif journalier
- ≤ 2h : 50% du tarif journalier
- > 4h : 100% du tarif journalier
- Calculé automatiquement par le backend

**Persistance:**
- Sauvegarde automatique dans AsyncStorage
- Chargement automatique au retour sur l'écran
- Données conservées même après fermeture de l'app

**Use Cases:**
- **UC-CHECKOUT-001:** Effectuer un check-out complet
- **UC-CHECKOUT-002:** Documenter les nouveaux dommages
- **UC-CHECKOUT-003:** Vérifier le calcul des frais de retard
- **UC-CHECKOUT-004:** Gérer l'encaissement
- **UC-CHECKOUT-005:** Capturer la signature restitution
- **UC-CHECKOUT-006:** Sauvegarder et reprendre plus tard

---

### 8. Paramètres (`/settings`)

**Fonctionnalités:**
- Changement de langue
- Déconnexion
- Informations utilisateur
- Informations version

**Options disponibles:**
- **Langue** : Sélectionner français, anglais, ou darija
- **Déconnexion** : Se déconnecter et retourner à l'écran de connexion

**Use Cases:**
- **UC-SETTINGS-001:** Changer la langue
- **UC-SETTINGS-002:** Se déconnecter

---

### 9. Mode Offline

**Fonctionnalités:**
- Consultation des missions déjà chargées
- Remplissage des formulaires check-in/check-out
- Prise de photos
- Capture de signatures
- Queue SQLite locale pour actions
- Synchronisation automatique dès connexion rétablie
- Indicateur visuel (`OfflineIndicator`)

**Queue SQLite:**
- `actionType` : Type d'action (CHECK_IN, CHECK_OUT, etc.)
- `payload` : Données JSON de l'action
- `files` : Fichiers locaux (photos, signatures)
- `retryCount` : Nombre de tentatives
- `lastError` : Dernière erreur (si échec)

**Indicateur Offline:**
- Affichage du statut de connexion
- Compteur d'actions en attente (ex: "2 En attente de synchronisation")
- Bouton de synchronisation manuelle (optionnel)

**Use Cases:**
- **UC-OFFLINE-001:** Consulter les missions en offline
- **UC-OFFLINE-002:** Remplir un formulaire en offline
- **UC-OFFLINE-003:** Vérifier la synchronisation automatique
- **UC-OFFLINE-004:** Voir les actions en attente

---

## 📋 Règles Métier Implémentées

### R1.3 - Validation Permis de Conduire
- **Blocage réservation** : Impossible si permis expire avant fin de location
- **Blocage check-in** : Impossible si permis expiré ou expire le jour même
- **Audit log** : Chaque blocage est loggé avec contexte complet

### R2.2 - Temps de Préparation
- **Validation chevauchement** : Blocage si réservation chevauche période de préparation
- **Création automatique** : Période de préparation créée après check-out
- **Durée doublée** : Si retour en retard, temps de préparation doublé

### R3 - Caution (Dépôt)
- **Affichage en lecture seule** : Montant, type depuis réservation
- **Statut collection** : Sélection PENDING ou COLLECTED
- **Blocage check-in** : Impossible si caution requise mais non collectée
- **Avertissement** : Message si caution requise mais statut PENDING

### R4 - Frais de Retard
- **Calcul automatique** : 
  - ≤ 1h : 25% du tarif journalier
  - ≤ 2h : 50% du tarif journalier
  - > 4h : 100% du tarif journalier
- **Affichage** : Montant calculé affiché dans check-out

### R5 - Dommages & Litiges
- **Statut DISPUTED automatique** : Si dommage > 50% du montant caution
- **Blocage clôture financière** : Si incident DISPUTED

### R6 - Facturation
- **Génération automatique** : Après check-out (si pas de litige)
- **Numérotation incrémentale** : Par agence

---

## 🔐 Authentification et Sécurité

### JWT Tokens
- **Access token** : 15 minutes
- **Refresh token** : 7 jours
- **Stockage** : SecureStore (sécurisé)
- **Rotation automatique** : Gestion des refresh tokens

### Validation
- **Zod schemas** : Validation stricte des formulaires
- **Backend validation** : Double validation côté serveur
- **Messages d'erreur** : Clairs et traduits

### Permissions
- **Vérification backend** : Guards de permissions sur tous les endpoints
- **Vérification frontend** : Actions masquées selon les permissions
- **Blocage Company** : Si company désactivée, connexion refusée

---

## 🌍 Internationalisation (i18n)

### Langues Supportées
- **Français (fr)** : Langue par défaut
- **Anglais (en)** : Traduction complète
- **Darija marocaine (darija)** : Traduction complète

### Fichiers de Traduction
- `src/i18n/fr.json` : Français
- `src/i18n/en.json` : Anglais
- `src/i18n/darija.json` : Darija

### Utilisation
- Aucun texte hardcodé
- Toutes les chaînes passent par i18n
- Changement de langue en temps réel

---

## 📊 API Endpoints

### Authentification
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Rafraîchir le token
- `GET /api/v1/auth/me` - Obtenir l'utilisateur actuel

### Réservations
- `GET /api/v1/bookings` - Liste des réservations
- `GET /api/v1/bookings/:id` - Détails d'une réservation
- `POST /api/v1/bookings` - Créer une réservation (AGENCY_MANAGER)
- `POST /api/v1/bookings/:id/checkin` - Check-in
- `POST /api/v1/bookings/:id/checkout` - Check-out

---

## 🧪 Tests et Validation

### Tests Unitaires
- Composants UI (Button, Input, PhotoPicker, SignaturePad)
- Écrans (LoginScreen, BookingsScreen)
- Services (auth.service, booking.service)

### Tests d'Intégration
- Flux complet check-in
- Flux complet check-out
- Mode offline
- Synchronisation

### Validation
- Validation Zod des formulaires
- Validation backend des règles métier
- Messages d'erreur clairs et traduits

---

## 📱 Spécifications des Écrans

### Écran 1 : Sélection de Langue
- **Objectif** : Permettre à l'utilisateur de choisir sa langue
- **Affichage** : 3 boutons (FR, EN, Darija)
- **Action** : Sauvegarde de la préférence et navigation vers login

### Écran 2 : Connexion
- **Objectif** : Authentifier l'utilisateur
- **Champs** : Email, Mot de passe
- **Actions** : Connexion, Gestion erreurs

### Écran 3 : Liste des Missions
- **Objectif** : Afficher toutes les missions de l'agent
- **Sections** : En retard, Aujourd'hui, À venir, Terminées
- **Actions** : Navigation vers détails ou action

### Écran 4 : Détails Mission
- **Objectif** : Afficher les détails d'une mission
- **Informations** : Client, véhicule, dates, statut
- **Actions** : Démarrer mission, Contacter client

### Écran 5 : Check-In
- **Objectif** : Effectuer le check-in d'une réservation
- **Sections** : Véhicule, Dommages, Documents, Caution, Signature
- **Actions** : Soumettre, Sauvegarder (auto)

### Écran 6 : Check-Out
- **Objectif** : Effectuer le check-out d'une réservation
- **Sections** : Véhicule, Dommages, Frais, Signature
- **Actions** : Soumettre, Sauvegarder (auto)

### Écran 7 : Création Réservation (AGENCY_MANAGER)
- **Objectif** : Créer une nouvelle réservation
- **Champs** : Agence, Client, Véhicule, Dates
- **Actions** : Créer, Annuler

### Écran 8 : Paramètres
- **Objectif** : Gérer les paramètres de l'application
- **Options** : Langue, Déconnexion
- **Actions** : Changer langue, Se déconnecter

---

## 🎨 Design System

### Couleurs
- **Primary** : `#3E7BFA` (Bleu)
- **Background** : `#FFFFFF` (Blanc)
- **Text** : `#1D1F23` (Noir)
- **Error** : `#EF4444` (Rouge)
- **Success** : `#10B981` (Vert)
- **Warning** : `#F59E0B` (Orange)

### Typographie
- **Font Family** : System default
- **Sizes** : 12px, 14px, 16px, 18px, 24px, 32px

### Composants UI
- **Button** : Styles primary, secondary, danger
- **Input** : Styles text, number, date, picker
- **Card** : Cartes pour missions
- **Badge** : Badges pour statuts

---

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI
- iOS Simulator (Mac) ou Android Emulator

### Installation
```bash
cd mobile-agent
npm install
```

### Démarrage
```bash
# Démarrer Expo
npm start

# iOS
npm run ios

# Android
npm run android
```

### Configuration
Modifier `src/config/api.ts` pour configurer l'URL de l'API :
```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.malocauto.com/api/v1';
```

---

## 📝 Notes Importantes

### Architecture
- **Offline-first** : Fonctionnement complet sans connexion
- **Persistance** : Sauvegarde automatique des formulaires
- **Validation** : Double validation (frontend + backend)
- **Sécurité** : Tokens JWT sécurisés

### Règles Métier
- **Aucune hypothèse** : Toutes les règles sont strictes
- **Validation backend** : Toutes les validations critiques côté serveur
- **Audit trail** : Toutes les actions sont loggées

### Performance
- **Cache React Query** : Optimisation des requêtes
- **Lazy loading** : Chargement à la demande
- **Optimisation images** : Compression et cache

---

## ✅ Checklist Fonctionnalités

### Authentification
- [x] Connexion par email/mot de passe
- [x] Stockage sécurisé tokens
- [x] Vérification statut company
- [x] Déconnexion

### Multi-langue
- [x] Sélection langue au démarrage
- [x] Changement langue dans paramètres
- [x] Traductions complètes (FR, EN, Darija)

### Réservations
- [x] Liste missions groupées par sections
- [x] Détails mission
- [x] Création réservation (AGENCY_MANAGER)
- [x] Missions terminées en consultation

### Check-In
- [x] Formulaire complet
- [x] Validation permis (R1.3)
- [x] Gestion caution (R3)
- [x] Persistance données
- [x] Pré-remplissage depuis réservation

### Check-Out
- [x] Formulaire complet
- [x] Calcul frais de retard (R4)
- [x] Persistance données
- [x] Gestion dommages

### Offline
- [x] Consultation missions
- [x] Remplissage formulaires
- [x] Queue SQLite
- [x] Synchronisation automatique
- [x] Indicateur visuel

---

**Date de création :** 2025-01-26  
**Version :** 2.0.0 Enterprise  
**Statut :** ✅ Production Ready


