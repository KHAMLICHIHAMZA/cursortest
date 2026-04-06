# MalocAuto Mobile Agent

Application mobile React Native (Expo) pour les agents de MalocAuto.

## 🚀 Stack Technique

- **React Native** + **Expo**
- **TypeScript**
- **React Navigation**
- **TanStack Query**
- **Axios**
- **Zod** (validation)
- **i18next** + **react-i18next** (multilangue)
- **expo-camera**
- **expo-image-picker**
- **expo-file-system**
- **expo-secure-store**
- **expo-sqlite** (offline queue)

## 📱 Fonctionnalités

### Authentification
- Login par email + mot de passe
- Stockage sécurisé du token (SecureStore)
- Vérification du statut de la Company (blocage si désactivée)

### Multi-langue
- **Français** (fr) - langue par défaut
- **Anglais** (en)
- **Darija marocaine** (darija)
- Choix de langue à l'onboarding
- Langue modifiable dans les paramètres

### Rôles et Droits
- **AGENCY_MANAGER** : tous droits terrain + création booking
- **AGENT** : opérations terrain uniquement
- Création de booking autorisée UNIQUEMENT pour AGENCY_MANAGER

### Cycle de Vie Booking
Statuts utilisés :
- PENDING
- CONFIRMED
- ACTIVE
- COMPLETED
- CANCELLED

Transitions autorisées :
- PENDING → CONFIRMED
- CONFIRMED → ACTIVE (check-in)
- ACTIVE → COMPLETED (check-out)

### Formulaires Métier

#### Login
- email : string, obligatoire, format email
- password : string, obligatoire, minimum 8 caractères

#### Création Booking (MANAGER uniquement)
- agencyId : string UUID, obligatoire
- clientId : string, obligatoire
- vehicleId : string, obligatoire
- startDate : datetime ISO, obligatoire, >= now
- endDate : datetime ISO, obligatoire, > startDate
- Vérification permis client (blocage si expiré)

#### Check-in (PASSAGE À ACTIVE)
**Données véhicule AVANT :**
- odometerStart : number, obligatoire, >= 0
- fuelLevelStart : enum (EMPTY, QUARTER, HALF, THREE_QUARTERS, FULL)
- photosBefore : array image, minimum 4, obligatoire
- notesStart : string, optionnel, max 500 caractères

**Dommages existants :**
- Structure Damage avec zone, type, severity, description, photos

**Documents client :**
- driverLicensePhoto : image, obligatoire
- driverLicenseExpiry : date, obligatoire, STRICTEMENT > today
- identityDocument : image ou PDF, optionnel
- extractionStatus : enum (OK, TO_VERIFY)

**Caution (décision prise à la réservation) :**
- Affichage en lecture seule : `depositRequired`, `depositAmount`, `depositType` depuis la réservation
- Sélection statut collection : `depositStatusCheckIn` (PENDING ou COLLECTED)
- Blocage check-in : Si caution requise mais non collectée
- Avertissement : Message si caution requise mais statut PENDING

**Signature client (OBLIGATOIRE) :**
- signature : canvas/base64
- signedAt : datetime auto

#### Check-out (PASSAGE À COMPLETED)
**Données véhicule APRÈS :**
- odometerEnd : number, obligatoire, >= odometerStart
- fuelLevelEnd : enum identique au départ
- photosAfter : array image, minimum 4
- notesEnd : string optionnelle, max 500

**Nouveaux dommages :**
- Même structure que Damage (voir check-in)

**Frais et encaissement terrain :**
- extraFees : number optionnel
- lateFee : number calcul backend
- damageFee : number calcul backend
- cashCollected : boolean
- cashAmount : number si cashCollected
- cashReceipt : fichier optionnel

**Signature restitution (OBLIGATOIRE) :**
- returnSignature : canvas/base64
- returnedAt : datetime auto

### Offline & Synchronisation

Fonctionnalités offline obligatoires :
- consultation des bookings déjà chargés
- prise de photos
- signatures
- formulaires check-in / check-out
- **persistance des données** : AsyncStorage pour sauvegarder les formulaires

Interdictions offline :
- changement de statut final sans synchronisation

Queue SQLite locale :
- actionType
- payload JSON
- fichiers locaux
- retryCount
- lastError

Affichage clair : "En attente de synchronisation" (composant `OfflineIndicator`)

### Persistance des Données

- **AsyncStorage** : Sauvegarde automatique des formulaires check-in/check-out
- **Chargement automatique** : Données restaurées au retour sur l'écran
- **Pré-remplissage** : Données client (permis, pièce d'identité) depuis la réservation

### Missions Terminées

- **Affichage** : Section "Terminées" dans la liste des missions
- **Consultation** : Accès en lecture seule aux missions complétées
- **Badge** : Indicateur visuel "Terminée" sur les cartes

## 📦 Installation

```bash
cd mobile-agent
npm install
```

## 🏃 Démarrage

```bash
# Démarrer Expo
npm start

# iOS
npm run ios

# Android
npm run android
```

## ⚙️ Configuration

### API Backend

L’URL est résolue dans `src/config/api.ts` :

1. **`EXPO_PUBLIC_API_URL`** (recommandé pour **préprod** / prod de test) : fichier `.env` à la racine de `mobile-agent`, voir `.env.example`. Redémarrer Expo après changement.
2. Sinon **`expo.extra.apiUrl`** dans la config Expo.
3. Sinon en **`__DEV__`** : localhost / IP du serveur Metro ; hors dev : `https://api.malocauto.com/api/v1`.

### Permissions

L'application nécessite les permissions suivantes :
- **Camera** : pour prendre des photos
- **Storage** : pour accéder à la galerie

## 🔐 Sécurité

- Token JWT stocké dans SecureStore
- Validation stricte des formulaires avec Zod
- Vérification des permissions et rôles
- Blocage si Company désactivée
- Vérification permis client (blocage si expiré)

## 📝 Notes

- Aucun texte hardcodé (tout passe par i18n)
- Aucune hypothèse métier (règles strictes)
- Architecture extensible
- Mode offline robuste

## 🐛 Debugging

Pour voir les logs :
```bash
npx expo start --clear
```

Pour réinitialiser la base SQLite :
Supprimer l'application et la réinstaller.

