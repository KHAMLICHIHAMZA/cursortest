# 📱 Documentation Complète - Application Mobile Agent MalocAuto

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Stack Technologique](#stack-technologique)
4. [Structure du Projet](#structure-du-projet)
5. [Fonctionnalités Détaillées](#fonctionnalités-détaillées)
6. [Services et APIs](#services-et-apis)
7. [Navigation et Routing](#navigation-et-routing)
8. [Gestion d'État](#gestion-détat)
9. [Internationalisation (i18n)](#internationalisation-i18n)
10. [Authentification et Sécurité](#authentification-et-sécurité)
11. [Synchronisation Offline](#synchronisation-offline)
12. [Composants UI](#composants-ui)
13. [Écrans (Screens)](#écrans-screens)
14. [Tests](#tests)
15. [Configuration et Déploiement](#configuration-et-déploiement)
16. [Dépendances Principales](#dépendances-principales)

---

## 🎯 Vue d'ensemble

**MalocAuto Agent** est une application mobile React Native développée avec Expo SDK 54, conçue pour les agents et managers d'agences de location de véhicules. L'application permet de gérer le cycle de vie complet des réservations (bookings) : création, check-in, check-out, avec support offline complet.

### Objectifs Principaux

- **Gestion des réservations** : Création, consultation, modification des réservations
- **Check-in/Check-out** : Processus complet de remise et récupération de véhicules
- **Mode offline** : Fonctionnement complet sans connexion internet
- **Multi-langue** : Support français, anglais, et darija marocaine
- **Sécurité** : Authentification JWT, stockage sécurisé, validation stricte

---

## 🏗️ Architecture Technique

### Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx (Root)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │         QueryClientProvider (TanStack)           │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │         AuthProvider (Context)             │ │   │
│  │  │  ┌──────────────────────────────────────┐  │ │   │
│  │  │  │    NavigationContainer               │  │ │   │
│  │  │  │  ┌──────────────────────────────┐   │  │ │   │
│  │  │  │  │  AuthStack / AppStack         │   │  │ │   │
│  │  │  │  │  └─ Screens                   │   │  │ │   │
│  │  │  │  └──────────────────────────────┘   │  │ │   │
│  │  │  └──────────────────────────────────────┘  │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                    OfflineIndicator                     │
└─────────────────────────────────────────────────────────┘
```

### Flux de Données

1. **Authentification** : `LoginScreen` → `authService` → `AuthContext` → `AppStack`
2. **Réservations** : `BookingsScreen` → `bookingService` → `API` → `Backend`
3. **Offline** : `bookingService` → `offlineService` (SQLite) → `syncService` → `API`

### Patterns Utilisés

- **Service Layer Pattern** : Séparation logique métier / UI
- **Context API** : Gestion état global (authentification)
- **React Query (TanStack Query)** : Gestion cache et synchronisation serveur
- **Repository Pattern** : Abstraction accès données (offline/online)

---

## 🛠️ Stack Technologique

### Core

- **React Native** : `0.81.5` - Framework mobile cross-platform
- **Expo** : `^54.0.30` - Outils et services pour React Native
- **TypeScript** : `^5.1.3` - Typage statique
- **React** : `19.1.0` - Bibliothèque UI

### Navigation

- **@react-navigation/native** : `^6.1.9` - Navigation principale
- **@react-navigation/native-stack** : `^6.9.17` - Navigation par pile
- **@react-navigation/bottom-tabs** : `^6.5.11` - Navigation par onglets

### State Management & Data Fetching

- **@tanstack/react-query** : `^5.17.0` - Gestion cache, synchronisation, requêtes
- **React Context API** : Gestion état authentification

### API & Network

- **axios** : `^1.6.2` - Client HTTP
- **@react-native-community/netinfo** : `11.4.1` - Détection connexion réseau

### Validation

- **zod** : `^3.22.4` - Validation schémas TypeScript-first

### Internationalisation

- **i18next** : `^23.7.6` - Framework i18n
- **react-i18next** : `^14.0.0` - Intégration React

### Storage

- **expo-secure-store** : `~15.0.8` - Stockage sécurisé (tokens, données sensibles)
- **expo-sqlite** : `~16.0.10` - Base de données locale (queue offline)
- **@react-native-async-storage/async-storage** : `2.2.0` - Stockage clé-valeur (fallback web)

### Media & Files

- **expo-camera** : `~17.0.10` - Accès caméra
- **expo-image-picker** : `~17.0.10` - Sélection images galerie/caméra
- **expo-file-system** : `~19.0.21` - Gestion fichiers locaux

### UI Components

- **react-native-signature-canvas** : `^3.0.0` - Capture signatures
- **react-native-webview** : `13.15.0` - WebView (pour signature canvas)
- **react-native-worklets** : `^0.7.1` - Worklets pour animations
- **@expo/vector-icons** : `^15.0.3` - Icônes
- **@react-native-picker/picker** : `2.11.1` - Sélecteurs
- **@react-native-community/datetimepicker** : `8.4.4` - Sélecteur date/heure

### Testing

- **jest** : `^30.2.0` - Framework tests
- **@testing-library/react-native** : `^13.3.3` - Tests composants React Native
- **jest-expo** : `^54.0.16` - Configuration Jest pour Expo

### Web Support

- **react-native-web** : `^0.21.0` - Support web
- **react-dom** : `19.1.0` - DOM pour React

---

## 📁 Structure du Projet

```
mobile-agent/
├── App.tsx                          # Point d'entrée principal
├── app.json                          # Configuration Expo
├── package.json                      # Dépendances et scripts
├── tsconfig.json                     # Configuration TypeScript
├── babel.config.js                   # Configuration Babel
├── metro.config.js                   # Configuration Metro bundler
├── jest.config.js                    # Configuration Jest
├── jest.setup.js                     # Setup tests
│
├── src/
│   ├── components/                   # Composants réutilisables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── PhotoPicker.tsx
│   │   ├── SignaturePad.tsx
│   │   ├── DamageForm.tsx
│   │   ├── OfflineIndicator.tsx
│   │   └── __tests__/                # Tests composants
│   │
│   ├── screens/                      # Écrans de l'application
│   │   ├── LanguageSelectionScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── BookingsScreen.tsx
│   │   ├── BookingDetailsScreen.tsx
│   │   ├── CreateBookingScreen.tsx
│   │   ├── CheckInScreen.tsx
│   │   ├── CheckOutScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── __tests__/                # Tests écrans
│   │
│   ├── services/                     # Services métier
│   │   ├── api.ts                    # Client Axios configuré
│   │   ├── auth.service.ts           # Authentification
│   │   ├── booking.service.ts        # Gestion réservations
│   │   ├── offline.service.ts        # Queue offline SQLite
│   │   ├── sync.service.ts           # Synchronisation
│   │   └── __tests__/                # Tests services
│   │
│   ├── navigation/                   # Configuration navigation
│   │   ├── AuthStack.tsx             # Stack authentification
│   │   └── AppStack.tsx              # Stack application
│   │
│   ├── contexts/                     # Contextes React
│   │   └── AuthContext.tsx           # Contexte authentification
│   │
│   ├── config/                       # Configuration
│   │   └── api.ts                    # Configuration API
│   │
│   ├── types/                        # Types TypeScript
│   │   └── index.ts                  # Types globaux
│   │
│   ├── i18n/                         # Internationalisation
│   │   ├── index.ts                  # Configuration i18n
│   │   ├── fr.json                   # Traductions français
│   │   ├── en.json                   # Traductions anglais
│   │   └── darija.json               # Traductions darija
│   │
│   └── utils/                        # Utilitaires
│       └── __tests__/                # Tests utilitaires
│
├── assets/                           # Assets statiques
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── favicon.png
│
├── scripts/                          # Scripts utilitaires
│   └── run-all-tests.js
│
└── .maestro/                         # Tests E2E Maestro
    ├── config.yaml
    ├── login.yaml
    ├── bookings-flow.yaml
    └── checkin-flow.yaml
```

---

## 🎨 Fonctionnalités Détaillées

### 1. Authentification

#### Flux d'Authentification

1. **Sélection de langue** (`LanguageSelectionScreen`)
   - Choix entre français, anglais, darija
   - Stockage préférence dans `SecureStore` (ou `localStorage` sur web)
   - Navigation vers `LoginScreen`

2. **Connexion** (`LoginScreen`)
   - Formulaire email + mot de passe
   - Validation Zod :
     - Email : format email valide
     - Mot de passe : minimum 8 caractères
   - Appel API : `POST /api/v1/auth/login`
   - Réponse backend :
     ```json
     {
       "access_token": "jwt_token",
       "user": { ... },
       "agencies": [ ... ],
       "permissions": [ ... ],
       "modules": [ ... ]
     }
     ```
   - Stockage :
     - Token JWT → `SecureStore` (clé `auth_token`)
     - User data → `SecureStore` (clé `user_data`)
     - Agencies → `SecureStore` (clé `agencies_data`)
     - Permissions → `SecureStore` (clé `permissions_data`)
     - Modules → `SecureStore` (clé `modules_data`)

3. **Vérifications Post-Login**
   - Statut Company : Si désactivée → blocage
   - Modules actifs : Affichage uniquement des modules actifs
   - Permissions : Vérification droits utilisateur

#### Rôles et Permissions

- **AGENCY_MANAGER** :
  - Tous droits terrain (check-in, check-out)
  - Création de réservations
  - Consultation toutes réservations agence

- **AGENT** :
  - Droits terrain uniquement (check-in, check-out)
  - Consultation réservations agence
  - **Interdiction** : Création réservations

### 2. Cycle de Vie des Réservations

#### Statuts

```typescript
type BookingStatus = 
  | 'PENDING'      // En attente de confirmation
  | 'CONFIRMED'     // Confirmée, prête pour check-in
  | 'ACTIVE'        // En cours (véhicule loué)
  | 'COMPLETED'     // Terminée (véhicule rendu)
  | 'CANCELLED';    // Annulée
```

#### Transitions Autorisées

```
PENDING → CONFIRMED → ACTIVE → COMPLETED
   ↓
CANCELLED
```

#### Mapping Backend ↔ Mobile

Le backend utilise `IN_PROGRESS` et `RETURNED`, le mobile les mappe :
- `IN_PROGRESS` → `ACTIVE`
- `RETURNED` → `COMPLETED`

### 3. Création de Réservation

**Accès** : Uniquement pour `AGENCY_MANAGER`

**Formulaire** (`CreateBookingScreen`) :
- `agencyId` : UUID, obligatoire
- `clientId` : UUID, obligatoire
- `vehicleId` : UUID, obligatoire
- `startDate` : Date ISO, obligatoire, >= maintenant
- `endDate` : Date ISO, obligatoire, > startDate

**Validations** :
- Vérification permis client : Si expiré → blocage
- Vérification disponibilité véhicule
- Calcul prix automatique (backend)

### 4. Check-in (PASSAGE À ACTIVE)

**Écran** : `CheckInScreen`

**Données Véhicule AVANT** :
- `odometerStart` : Nombre, obligatoire, >= 0
- `fuelLevelStart` : Enum (`EMPTY`, `QUARTER`, `HALF`, `THREE_QUARTERS`, `FULL`)
- `photosBefore` : Array images, minimum 4, obligatoire
- `notesStart` : String optionnel, max 500 caractères

**Dommages Existants** :
- Structure `Damage` :
  ```typescript
  {
    zone: 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT' | 'ROOF' | 'INTERIOR' | 'WHEELS' | 'WINDOWS',
    type: 'SCRATCH' | 'DENT' | 'BROKEN' | 'PAINT' | 'GLASS' | 'OTHER',
    severity: 'LOW' | 'MEDIUM' | 'HIGH',
    description?: string,
    photos: string[]
  }
  ```

**Documents Client** :
- `driverLicensePhoto` : Image, obligatoire
- `driverLicenseExpiry` : Date, obligatoire, **STRICTEMENT > aujourd'hui**
- `identityDocument` : Image ou PDF, optionnel
- `extractionStatus` : Enum (`OK`, `TO_VERIFY`)

**Caution (Paramétrable par Company)** :
- `depositRequired` : Boolean
- `depositAmount` : Nombre (obligatoire si `depositRequired`)
- `depositType` : Enum (`CASH`, `CARD_HOLD`, `TRANSFER`, `CHEQUE`, `OTHER`)
- `depositDate` : Date
- `depositStatus` : Enum (`PENDING`, `COLLECTED`, `REFUNDED`, `PARTIAL`, `FORFEITED`)
- `depositReference` : String optionnelle
- `depositDocument` : Fichier optionnel

**Signature Client (OBLIGATOIRE)** :
- `signature` : Canvas/base64
- `signedAt` : Datetime auto

### 5. Check-out (PASSAGE À COMPLETED)

**Écran** : `CheckOutScreen`

**Données Véhicule APRÈS** :
- `odometerEnd` : Nombre, obligatoire, >= `odometerStart`
- `fuelLevelEnd` : Enum identique au départ
- `photosAfter` : Array images, minimum 4
- `notesEnd` : String optionnelle, max 500

**Nouveaux Dommages** :
- Même structure que `Damage` (voir check-in)

**Frais et Encaissement** :
- `extraFees` : Nombre optionnel (frais supplémentaires)
- `lateFee` : Nombre calculé backend (retard)
- `damageFee` : Nombre calculé backend (dommages)
- **Prolongation** : Si `endDate` > `originalEndDate` :
  - Calcul automatique montant prolongation
  - Affichage optionnel ajout aux frais supplémentaires
- **Méthode de paiement** :
  - `paymentMethod` : `'CASH'` | `'CARD'`
  - Si `CASH` :
    - `cashCollected` : `true`
    - `cashAmount` : Nombre
    - `cashReceipt` : Fichier optionnel

**Signature Restitution (OBLIGATOIRE)** :
- `returnSignature` : Canvas/base64
- `returnedAt` : Datetime auto

### 6. Mode Offline

#### Fonctionnalités Offline Disponibles

✅ **Consultation** :
- Liste réservations déjà chargées
- Détails réservations en cache

✅ **Saisie** :
- Prise de photos
- Signatures
- Formulaires check-in / check-out complets

❌ **Interdictions Offline** :
- Changement statut final sans synchronisation
- Création réservation (nécessite vérifications backend)

#### Queue SQLite Locale

**Table** : `offline_actions`

```sql
CREATE TABLE offline_actions (
  id TEXT PRIMARY KEY,
  actionType TEXT NOT NULL,        -- 'CREATE_BOOKING', 'CHECK_IN', 'CHECK_OUT'
  payload TEXT NOT NULL,            -- JSON string
  files TEXT,                       -- JSON array of local file URIs
  retryCount INTEGER DEFAULT 0,
  lastError TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Structure Action** :
```typescript
interface OfflineAction {
  id: string;
  actionType: string;
  payload: string;        // JSON stringified
  files?: string[];       // Local file URIs
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Synchronisation Automatique

- **Déclenchement** : Toutes les 30 secondes si connecté
- **Processus** :
  1. Vérification connexion (`NetInfo`)
  2. Récupération actions en attente
  3. Pour chaque action :
     - Upload fichiers locaux → URLs serveur
     - Remplacement URIs locales par URLs serveur dans payload
     - Envoi requête API
     - Si succès : Suppression action queue
     - Si erreur : Incrémentation `retryCount`, stockage `lastError`
  4. Affichage indicateur : "En attente de synchronisation"

#### Fallback Web

Sur web, `expo-sqlite` n'est pas disponible. Utilisation `localStorage` :
- Clé : `offline_actions`
- Valeur : JSON array d'actions
- Même logique de synchronisation

---

## 🔌 Services et APIs

### 1. Service API (`api.ts`)

**Responsabilités** :
- Configuration client Axios
- Intercepteurs requêtes/réponses
- Gestion token JWT
- Gestion langue (header `Accept-Language`)
- Gestion erreurs 401 (déconnexion automatique)

**Configuration** :
```typescript
const API_CONFIG = {
  baseURL: 'http://localhost:3000/api/v1',  // Dev web
  // ou 'http://192.168.1.99:3000/api/v1',  // Dev mobile
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};
```

**Intercepteurs** :
- **Request** : Ajout token JWT, langue
- **Response** : Gestion 401 → logout

**Stockage Token** :
- Mobile : `expo-secure-store`
- Web : `localStorage` (fallback)

### 2. Service Authentification (`auth.service.ts`)

**Méthodes** :
- `login(data: LoginInput)` : Connexion, stockage données
- `getUser()` : Récupération user stocké
- `getAgencies()` : Récupération agences stockées
- `getPermissions()` : Récupération permissions stockées
- `getModules()` : Récupération modules stockés
- `logout()` : Suppression données stockées
- `isAuthenticated()` : Vérification présence token

**Schéma Validation** (Zod) :
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### 3. Service Réservations (`booking.service.ts`)

**Méthodes** :
- `getBookings(agencyId?)` : Liste réservations
- `getBooking(id)` : Détails réservation
- `createBooking(data)` : Création (online/offline)
- `checkIn(data)` : Check-in (online/offline)
- `checkOut(data)` : Check-out (online/offline)

**Gestion Offline** :
- Vérification connexion (`syncService.isOnline()`)
- Si offline : Ajout queue SQLite
- Si online : Upload fichiers → Envoi API

**Mapping Statuts** :
- Backend `IN_PROGRESS` → Mobile `ACTIVE`
- Backend `RETURNED` → Mobile `COMPLETED`

**Mapping Prix** :
- Backend `totalPrice` → Mobile `price`

### 4. Service Offline (`offline.service.ts`)

**Responsabilités** :
- Initialisation base SQLite
- Ajout actions queue
- Récupération actions en attente
- Mise à jour erreurs
- Suppression actions synchronisées

**Méthodes** :
- `init()` : Création tables
- `addAction(actionType, payload, files?)` : Ajout action
- `getPendingActions()` : Liste actions en attente
- `updateActionError(id, error)` : Mise à jour erreur
- `removeAction(id)` : Suppression action
- `clearAllActions()` : Vidage queue
- `getActionCount()` : Nombre actions en attente

**Fallback Web** :
- Utilisation `localStorage` si `Platform.OS === 'web'`

### 5. Service Synchronisation (`sync.service.ts`)

**Responsabilités** :
- Détection connexion réseau
- Synchronisation automatique périodique
- Upload fichiers locaux → URLs serveur
- Traitement actions queue

**Méthodes** :
- `startAutoSync(intervalMs?)` : Démarrage sync auto (30s par défaut)
- `stopAutoSync()` : Arrêt sync auto
- `syncPendingActions()` : Synchronisation manuelle
- `isOnline()` : Vérification connexion
- `uploadFile(localUri)` : Upload fichier → URL serveur

**Processus Upload Fichier** :
1. Lecture fichier local (`FileSystem.readAsStringAsync`)
2. Conversion base64
3. Envoi `POST /api/v1/upload` avec `file` (base64)
4. Retour URL serveur
5. Remplacement URI locale par URL serveur dans payload

---

## 🧭 Navigation et Routing

### Structure Navigation

```
App.tsx
├── AuthStack (si non authentifié)
│   ├── LanguageSelectionScreen
│   └── LoginScreen
│
└── AppStack (si authentifié)
    ├── BookingsStack (Tab)
    │   ├── BookingsList (BookingsScreen)
    │   ├── BookingDetails (BookingDetailsScreen)
    │   ├── CreateBooking (CreateBookingScreen) [MANAGER uniquement]
    │   ├── CheckIn (CheckInScreen)
    │   └── CheckOut (CheckOutScreen)
    │
    └── Settings (SettingsScreen) (Tab)
```

### Navigation Stacks

#### AuthStack (`AuthStack.tsx`)

- **LanguageSelection** : Sélection langue (première fois)
- **Login** : Connexion

#### AppStack (`AppStack.tsx`)

- **Bookings** (Tab) : Stack réservations
  - Liste réservations
  - Détails réservation
  - Création (si MANAGER)
  - Check-in
  - Check-out
- **Settings** (Tab) : Paramètres
  - Changement langue
  - Déconnexion

### Navigation Conditionnelle

- **Modules** : Affichage onglet "Bookings" uniquement si module `BOOKINGS` actif
- **Rôles** : Bouton "Créer réservation" uniquement si `AGENCY_MANAGER`

---

## 🗄️ Gestion d'État

### 1. Authentification (Context API)

**Fichier** : `src/contexts/AuthContext.tsx`

**État** :
```typescript
{
  user: User | null;
  agencies: Agency[];
  permissions: Permission[];
  modules: Module[];
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Méthodes** :
- `login(data)` : Connexion, initialisation offline/sync
- `logout()` : Déconnexion, arrêt sync
- `refreshUser()` : Rafraîchissement données user

**Provider** : `AuthProvider` enveloppe toute l'application

**Hook** : `useAuth()` pour accès contexte

### 2. Cache Serveur (TanStack Query)

**Configuration** :
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

**Utilisation** :
- `useQuery` : Récupération données (bookings, booking details)
- `useMutation` : Modifications (login, check-in, check-out)

**Exemple** :
```typescript
const { data: bookings, isLoading } = useQuery({
  queryKey: ['bookings', agencyId],
  queryFn: () => bookingService.getBookings(agencyId),
});
```

---

## 🌍 Internationalisation (i18n)

### Configuration

**Fichier** : `src/i18n/index.ts`

**Langues Supportées** :
- `fr` : Français (défaut)
- `en` : Anglais
- `darija` : Darija marocaine

**Stockage Préférence** :
- Mobile : `expo-secure-store` (clé `app_language`)
- Web : `localStorage` (fallback)

### Structure Traductions

**Fichiers** : `src/i18n/{fr,en,darija}.json`

**Structure** :
```json
{
  "common": {
    "error": "Erreur",
    "success": "Succès",
    "loading": "Chargement...",
    ...
  },
  "auth": {
    "login": "Connexion",
    "email": "Email",
    "password": "Mot de passe",
    ...
  },
  "booking": {
    "title": "Réservations",
    "status": {
      "PENDING": "En attente",
      "CONFIRMED": "Confirmée",
      ...
    },
    ...
  },
  ...
}
```

### Utilisation

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Simple
<Text>{t('auth.login')}</Text>

// Avec paramètres
<Text>{t('common.minPhotos', { count: 4 })}</Text>
```

### Changement Langue

```typescript
import { setStoredLanguage } from '../i18n';
import i18n from '../i18n';

await setStoredLanguage('en');
i18n.changeLanguage('en');
```

---

## 🔐 Authentification et Sécurité

### JWT Token

- **Stockage** : `expo-secure-store` (mobile) / `localStorage` (web)
- **Clé** : `auth_token`
- **Header** : `Authorization: Bearer {token}`
- **Expiration** : Gérée backend
- **Renouvellement** : Endpoint `/api/v1/auth/refresh` (non implémenté mobile)

### Stockage Sécurisé

**Données Stockées** :
- Token JWT
- User data
- Agencies
- Permissions
- Modules
- Langue préférée

**Clés** :
- `auth_token`
- `user_data`
- `agencies_data`
- `permissions_data`
- `modules_data`
- `app_language`

### Validation Formulaires

**Bibliothèque** : Zod

**Exemples** :
```typescript
// Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Check-in
const checkInSchema = z.object({
  odometerStart: z.number().min(0),
  fuelLevelStart: z.enum(['EMPTY', 'QUARTER', ...]),
  photosBefore: z.array(z.string()).min(4),
  driverLicenseExpiry: z.string().refine(
    (date) => new Date(date) > new Date(),
    { message: 'Must be in the future' }
  ),
  ...
});
```

### Vérifications Backend

- **Company Status** : Si désactivée → blocage connexion
- **Permissions** : Vérification droits par endpoint
- **Modules** : Filtrage fonctionnalités selon modules actifs

---

## 📡 Synchronisation Offline

### Architecture

```
┌─────────────────────────────────────────┐
│         User Action (Check-in)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      bookingService.checkIn()           │
└──────────────┬──────────────────────────┘
               │
               ▼
      ┌────────────────┐
      │  Is Online?     │
      └────────┬────────┘
               │
      ┌────────┴────────┐
      │                  │
      ▼                  ▼
┌──────────┐      ┌──────────────┐
│  Online  │      │   Offline    │
└────┬─────┘      └──────┬───────┘
     │                   │
     │                   ▼
     │            ┌──────────────┐
     │            │ offlineService│
     │            │ .addAction() │
     │            └──────┬───────┘
     │                   │
     │                   ▼
     │            ┌──────────────┐
     │            │  SQLite DB   │
     │            │  (Queue)    │
     │            └──────────────┘
     │
     ▼
┌──────────────┐
│  Upload Files│
│  → Server    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  API Request │
│  (Check-in)  │
└──────────────┘
```

### Processus Synchronisation

1. **Détection Connexion** : `NetInfo.fetch()`
2. **Récupération Actions** : `offlineService.getPendingActions()`
3. **Pour Chaque Action** :
   - Upload fichiers locaux → URLs serveur
   - Remplacement URIs locales dans payload
   - Envoi requête API
   - Si succès : Suppression action
   - Si erreur : Incrémentation `retryCount`, stockage `lastError`
4. **Répétition** : Toutes les 30 secondes

### Gestion Fichiers

**Upload Fichier** :
```typescript
// 1. Lecture fichier local
const base64 = await FileSystem.readAsStringAsync(localUri, {
  encoding: FileSystem.EncodingType.Base64,
});

// 2. Upload serveur
const response = await api.post('/upload', {
  file: base64,
  filename: 'photo.jpg',
});

// 3. Récupération URL serveur
const serverUrl = response.data.url;

// 4. Remplacement dans payload
payload.photosBefore = payload.photosBefore.map(
  uri => uri === localUri ? serverUrl : uri
);
```

---

## 🧩 Composants UI

### 1. Button (`Button.tsx`)

**Props** :
- `title: string`
- `onPress: () => void`
- `loading?: boolean`
- `disabled?: boolean`
- `style?: ViewStyle`

**Fonctionnalités** :
- État loading (spinner)
- État disabled
- Style personnalisable

### 2. Input (`Input.tsx`)

**Props** :
- `label: string`
- `value: string`
- `onChangeText: (text: string) => void`
- `error?: string`
- `required?: boolean`
- `keyboardType?`, `secureTextEntry?`, etc.

**Fonctionnalités** :
- Label
- Affichage erreur
- Indicateur requis
- Types clavier personnalisables

### 3. PhotoPicker (`PhotoPicker.tsx`)

**Props** :
- `photos: string[]`
- `onPhotosChange: (photos: string[]) => void`
- `minPhotos?: number` (défaut: 0)
- `maxPhotos?: number` (défaut: 10)
- `label?: string`
- `required?: boolean`

**Fonctionnalités** :
- Prise photo caméra
- Sélection galerie (multiple)
- Affichage miniatures
- Suppression photos
- Validation min/max
- Messages erreur i18n

### 4. SignaturePad (`SignaturePad.tsx`)

**Props** :
- `onSignature: (signature: string) => void`
- `label?: string`
- `required?: boolean`

**Fonctionnalités** :
- Canvas signature (WebView)
- Capture base64
- Effacement
- Validation présence signature

### 5. DamageForm (`DamageForm.tsx`)

**Props** :
- `damages: Damage[]`
- `onDamagesChange: (damages: Damage[]) => void`

**Fonctionnalités** :
- Ajout dommage
- Sélection zone, type, sévérité
- Description
- Photos dommage
- Suppression dommage

### 6. OfflineIndicator (`OfflineIndicator.tsx`)

**Fonctionnalités** :
- Affichage indicateur offline
- Compteur actions en attente
- Position : Bas écran (overlay)

---

## 📺 Écrans (Screens)

### 1. LanguageSelectionScreen

**Rôle** : Sélection langue première utilisation

**Fonctionnalités** :
- Affichage 3 langues (fr, en, darija)
- Sélection → Stockage → Navigation Login
- Vérification langue stockée → Skip si existe

### 2. LoginScreen

**Rôle** : Connexion utilisateur

**Formulaire** :
- Email
- Mot de passe
- Bouton connexion

**Validations** :
- Email format
- Mot de passe min 8 caractères

**Actions** :
- Connexion → Stockage données → Navigation AppStack

### 3. BookingsScreen

**Rôle** : Liste réservations

**Fonctionnalités** :
- Filtrage par agence (si plusieurs)
- Affichage liste :
  - Numéro réservation (6 derniers caractères)
  - Client (nom)
  - Véhicule (marque, modèle)
  - Dates (début, fin)
  - Statut (badge coloré)
  - Prix
- Pull-to-refresh
- Navigation détails

**Requête** :
```typescript
useQuery({
  queryKey: ['bookings', agencyId],
  queryFn: () => bookingService.getBookings(agencyId),
});
```

### 4. BookingDetailsScreen

**Rôle** : Détails réservation complète

**Sections** :
- **Informations Réservation** :
  - Numéro (6 derniers caractères, uppercase)
  - Statut
  - Dates
  - Prix
- **Client** :
  - Nom, prénom
  - Téléphone (bouton appel)
  - WhatsApp (bouton)
  - Email
  - Pièce identité
  - Permis
- **Véhicule** :
  - Marque, modèle
  - Immatriculation
- **État Véhicule** :
  - Kilométrage (début/fin)
  - Niveau carburant (début/fin)
  - Photos (avant/après)
- **Actions** :
  - Check-in (si `CONFIRMED`)
  - Check-out (si `ACTIVE`)

### 5. CreateBookingScreen

**Rôle** : Création réservation (MANAGER uniquement)

**Formulaire** :
- Agence (sélection)
- Client (sélection)
- Véhicule (sélection, filtré par agence)
- Date début
- Date fin

**Validations** :
- Dates valides (début >= maintenant, fin > début)
- Permis client non expiré

### 6. CheckInScreen

**Rôle** : Check-in réservation

**Sections** :
1. **État Véhicule** :
   - Kilométrage départ
   - Niveau carburant départ
   - Photos avant (min 4)
   - Notes départ
2. **Dommages Existants** :
   - Formulaire dommages (DamageForm)
3. **Documents Client** :
   - Photo permis (obligatoire)
   - Date expiration permis (obligatoire, > aujourd'hui)
   - Document identité (optionnel)
   - Statut extraction
4. **Caution** :
   - Requis ? (checkbox)
   - Montant (si requis)
   - Type
   - Date
   - Statut
   - Référence
   - Document
5. **Signature Client** :
   - SignaturePad (obligatoire)

**Validation** : Schéma Zod complet

**Soumission** : Online → API, Offline → Queue

### 7. CheckOutScreen

**Rôle** : Check-out réservation

**Sections** :
1. **État Véhicule Retour** :
   - Kilométrage fin (>= départ)
   - Niveau carburant fin
   - Photos après (min 4)
   - Notes retour
2. **Nouveaux Dommages** :
   - Formulaire dommages (DamageForm)
3. **Frais et Encaissement** :
   - Frais supplémentaires
   - **Prolongation** : Calcul automatique si `endDate` > `originalEndDate`
     - Montant calculé
     - Option ajout aux frais supplémentaires
   - Méthode paiement : Carte ou Espèces
     - Si Espèces :
       - Montant encaissé
       - Reçu (optionnel)
4. **Signature Restitution** :
   - SignaturePad (obligatoire)

**Validation** : Schéma Zod complet

**Soumission** : Online → API, Offline → Queue

### 8. SettingsScreen

**Rôle** : Paramètres application

**Fonctionnalités** :
- Changement langue
- Déconnexion
- Informations version

---

## 🧪 Tests

### Structure Tests

```
src/
├── components/__tests__/
│   ├── Button.test.tsx
│   ├── Input.test.tsx
│   ├── PhotoPicker.test.tsx
│   └── SignaturePad.test.tsx
│
├── screens/__tests__/
│   ├── LoginScreen.test.tsx
│   └── BookingsScreen.test.tsx
│
├── services/__tests__/
│   ├── auth.service.test.ts
│   ├── booking.service.test.ts
│   └── loginSchema.test.ts
│
└── __tests__/
    └── zod-validation.test.ts
```

### Configuration Jest

**Fichier** : `jest.config.js`

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-worklets|react-native-webview)',
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

### Mocks (`jest.setup.js`)

- `expo-secure-store`
- `expo-file-system`
- `@react-native-community/netinfo`
- `expo-sqlite`
- `expo-constants`
- `react-native` (complet)

### Tests Unitaires

**Exemple** : `auth.service.test.ts`

```typescript
describe('authService', () => {
  it('should login successfully', async () => {
    // Mock API response
    (api.post as jest.Mock).mockResolvedValue({
      data: { access_token: 'token', user: {...} },
    });

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.access_token).toBe('token');
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
  });
});
```

### Tests E2E (Maestro)

**Fichiers** : `.maestro/*.yaml`

**Flows** :
- `login.yaml` : Connexion
- `bookings-flow.yaml` : Navigation réservations
- `checkin-flow.yaml` : Processus check-in

**Exécution** :
```bash
npm run test:e2e
```

---

## ⚙️ Configuration et Déploiement

### Configuration API

**Fichier** : `src/config/api.ts`

**Détection Automatique** :
- Web : `http://localhost:3000/api/v1`
- Mobile : `http://192.168.1.99:3000/api/v1` (IP locale)
- Production : `https://api.malocauto.com/api/v1`

**Configuration Expo** : `app.json`

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.99:3000/api/v1"
    }
  }
}
```

### Configuration Expo

**Fichier** : `app.json`

**Points Clés** :
- SDK Version : `54.0.0`
- Bundle ID iOS : `com.malocauto.agent`
- Package Android : `com.malocauto.agent`
- Permissions : Camera, Storage

### Scripts NPM

```json
{
  "scripts": {
    "start": "expo start --lan",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "maestro test .maestro"
  }
}
```

### Variables d'Environnement

**Développement** :
- API URL : Détection automatique (voir `api.ts`)
- Backend : `http://localhost:3000` (web) ou IP locale (mobile)

**Production** :
- API URL : `https://api.malocauto.com/api/v1`
- Backend : `https://api.malocauto.com`

### Build et Déploiement

**Expo Build** :
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

**Expo Go** :
- Développement : Scan QR code
- Tunnel : `expo start --tunnel`

---

## 📦 Dépendances Principales

### Core Dependencies

| Package | Version | Usage |
|---------|---------|-------|
| `react` | `19.1.0` | Bibliothèque UI |
| `react-native` | `0.81.5` | Framework mobile |
| `expo` | `^54.0.30` | Outils Expo |
| `typescript` | `^5.1.3` | Typage statique |

### Navigation

| Package | Version | Usage |
|---------|---------|-------|
| `@react-navigation/native` | `^6.1.9` | Navigation core |
| `@react-navigation/native-stack` | `^6.9.17` | Stack navigation |
| `@react-navigation/bottom-tabs` | `^6.5.11` | Tab navigation |

### State & Data

| Package | Version | Usage |
|---------|---------|-------|
| `@tanstack/react-query` | `^5.17.0` | Cache & sync |
| `axios` | `^1.6.2` | HTTP client |

### Storage

| Package | Version | Usage |
|---------|---------|-------|
| `expo-secure-store` | `~15.0.8` | Stockage sécurisé |
| `expo-sqlite` | `~16.0.10` | Base données locale |
| `@react-native-async-storage/async-storage` | `2.2.0` | Storage clé-valeur |

### Media

| Package | Version | Usage |
|---------|---------|-------|
| `expo-camera` | `~17.0.10` | Caméra |
| `expo-image-picker` | `~17.0.10` | Sélection images |
| `expo-file-system` | `~19.0.21` | Gestion fichiers |

### UI

| Package | Version | Usage |
|---------|---------|-------|
| `react-native-signature-canvas` | `^3.0.0` | Signatures |
| `react-native-webview` | `13.15.0` | WebView (signatures) |
| `@expo/vector-icons` | `^15.0.3` | Icônes |

### Validation & i18n

| Package | Version | Usage |
|---------|---------|-------|
| `zod` | `^3.22.4` | Validation |
| `i18next` | `^23.7.6` | i18n |
| `react-i18next` | `^14.0.0` | i18n React |

### Network

| Package | Version | Usage |
|---------|---------|-------|
| `@react-native-community/netinfo` | `11.4.1` | Détection réseau |

---

## 🔍 Points d'Attention pour Analyse

### 1. Compatibilité Web

- **SecureStore** : Fallback `localStorage` sur web
- **SQLite** : Fallback `localStorage` sur web
- **Metro Config** : Configuration WASM pour `expo-sqlite` web

### 2. Gestion Erreurs

- **401** : Déconnexion automatique
- **Network** : Queue offline
- **Validation** : Messages i18n

### 3. Performance

- **React Query** : Cache 5 minutes
- **Images** : Compression 0.8 qualité
- **Sync** : Intervalle 30 secondes

### 4. Sécurité

- **Tokens** : Stockage sécurisé uniquement
- **Validation** : Zod strict
- **Permissions** : Vérification backend

### 5. Offline

- **Queue** : SQLite (mobile) / localStorage (web)
- **Fichiers** : Upload différé
- **Indicateur** : Compteur actions en attente

---

## 📚 Ressources Complémentaires

### Documentation Officielle

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zod](https://zod.dev/)

### Fichiers de Référence

- `README.md` : Vue d'ensemble rapide
- `CONNEXION_MOBILE.md` : Guide connexion
- `GUIDE_TESTS_AUTOMATISES.md` : Guide tests

---

## ✅ Checklist pour Reprendre le Projet

- [ ] Lire cette documentation complète
- [ ] Examiner `package.json` pour dépendances
- [ ] Examiner `app.json` pour configuration Expo
- [ ] Examiner `src/types/index.ts` pour types
- [ ] Examiner `src/services/` pour logique métier
- [ ] Examiner `src/screens/` pour UI
- [ ] Examiner `src/navigation/` pour routing
- [ ] Examiner `src/i18n/` pour traductions
- [ ] Tester localement avec `npm start`
- [ ] Examiner tests pour comprendre comportements attendus

---

**Documentation générée le** : 2024  
**Version Application** : 1.0.0  
**Expo SDK** : 54.0.0




