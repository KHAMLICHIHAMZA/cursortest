# 🤖 Guide Complet - Tests Automatisés

## ✅ Ce qui a été créé

### 1. Tests Unitaires (Jest)

#### Configuration
- ✅ `jest.config.js` - Configuration Jest pour Expo
- ✅ `jest.setup.js` - Mocks des modules Expo et React Native

#### Tests créés

**Services** :
- ✅ `src/services/__tests__/auth.service.test.ts` - Tests AuthService
- ✅ `src/services/__tests__/booking.service.test.ts` - Tests BookingService

**Composants** :
- ✅ `src/components/__tests__/Input.test.tsx` - Tests Input
- ✅ `src/components/__tests__/Button.test.tsx` - Tests Button
- ✅ `src/components/__tests__/PhotoPicker.test.tsx` - Tests PhotoPicker
- ✅ `src/components/__tests__/SignaturePad.test.tsx` - Tests SignaturePad

**Écrans** :
- ✅ `src/screens/__tests__/LoginScreen.test.tsx` - Tests LoginScreen
- ✅ `src/screens/__tests__/BookingsScreen.test.tsx` - Tests BookingsScreen

---

### 2. Tests E2E (Maestro)

#### Configuration
- ✅ `.maestro/config.yaml` - Configuration Maestro
- ✅ Scripts npm : `test:e2e`, `test:e2e:login`, `test:e2e:bookings`, `test:e2e:checkin`

#### Tests créés
- ✅ `.maestro/login.yaml` - Test de login complet
- ✅ `.maestro/bookings-flow.yaml` - Test du flux de réservations
- ✅ `.maestro/checkin-flow.yaml` - Test du flux de check-in

---

## 🚀 Utilisation

### Tests Unitaires

```bash
# Tous les tests
npm test

# Mode watch (re-exécute à chaque changement)
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

### Tests E2E

**Prérequis** :
1. Installer Maestro CLI : `npm install -g @maestro/cli`
2. Lancer l'app sur un appareil/simulateur
3. S'assurer que l'app est accessible

**Lancer les tests** :
```bash
# Tous les tests E2E
npm run test:e2e

# Test de login uniquement
npm run test:e2e:login

# Test du flux de réservations
npm run test:e2e:bookings

# Test du flux de check-in
npm run test:e2e:checkin
```

---

## 📋 Structure des Tests

### Tests Unitaires

#### AuthService Tests
- ✅ Validation loginSchema (email, password)
- ✅ Login réussi (stockage token et données)
- ✅ Gestion erreurs API
- ✅ isAuthenticated (vérification token)

#### BookingService Tests
- ✅ getBookings (mapping statuts)
- ✅ createBooking (online et offline)
- ✅ checkIn (upload fichiers)

#### Composants Tests
- ✅ Rendu correct
- ✅ Interactions (onPress, onChangeText)
- ✅ États (disabled, loading, error)
- ✅ Variants et styles

#### Écrans Tests
- ✅ Rendu correct
- ✅ Validation des formulaires
- ✅ Navigation
- ✅ Appels API

### Tests E2E

#### Login Flow
1. Lance l'app
2. Vérifie l'affichage de "MalocAuto"
3. Remplit email et password
4. Clique sur login
5. Vérifie la navigation vers l'écran des réservations

#### Bookings Flow
1. Login
2. Vérifie l'affichage des réservations
3. Teste la création de réservation (si AGENCY_MANAGER)

#### Check-in Flow
1. Login
2. Navigue vers une réservation
3. Remplit le formulaire de check-in
4. Ajoute des photos
5. Ajoute une signature
6. Soumet et vérifie le changement de statut

---

## 🔧 Configuration

### Jest

Le fichier `jest.config.js` configure :
- Preset Expo
- Transform ignore patterns pour les modules natifs
- Module name mapper pour les alias `@/`
- Test environment (jsdom pour les composants)

Le fichier `jest.setup.js` mock :
- Modules Expo (SecureStore, FileSystem, SQLite, etc.)
- React Navigation
- TanStack Query
- react-i18next

### Maestro

Les fichiers `.maestro/*.yaml` définissent :
- L'app ID (host.exp.Exponent pour Expo Go)
- Les actions (tapOn, inputText, assertVisible, etc.)
- Les flux de test complets

---

## 🐛 Dépannage

### Tests Unitaires

**Erreur : "Cannot find module"**
- Vérifier que les mocks sont correctement configurés dans `jest.setup.js`
- Vérifier les `transformIgnorePatterns` dans `jest.config.js`

**Erreur : "ReferenceError: You are trying to import a file outside of the scope"**
- Vérifier que `testEnvironment` est défini dans `jest.config.js`
- Vérifier que les mocks sont définis avant les imports

### Tests E2E

**Maestro ne trouve pas l'app**
- Vérifier que l'app est lancée sur l'appareil/simulateur
- Vérifier l'`appId` dans les fichiers `.maestro/*.yaml`
- Pour Expo Go, utiliser `host.exp.Exponent`

**Les sélecteurs ne fonctionnent pas**
- Utiliser les textes de traduction (ex: `"auth.email"`)
- Utiliser les IDs de test (ex: `testID="email-input"`)
- Utiliser des sélecteurs partiels (ex: `"#booking-"`)

---

## 📊 Couverture

Pour voir la couverture des tests :

```bash
npm run test:coverage
```

Cela génère un rapport dans `coverage/` avec :
- Couverture par fichier
- Lignes couvertes/non couvertes
- Branches couvertes/non couvertes

---

## 🎯 Prochaines Étapes

1. **Ajouter plus de tests unitaires** :
   - Tests pour CheckInScreen
   - Tests pour CheckOutScreen
   - Tests pour CreateBookingScreen
   - Tests pour DamageForm

2. **Améliorer les tests E2E** :
   - Tests pour check-out
   - Tests pour mode offline
   - Tests pour multi-langue

3. **Intégrer dans CI/CD** :
   - Exécuter les tests automatiquement à chaque commit
   - Générer des rapports de couverture
   - Notifier en cas d'échec

---

## 📝 Notes

- Les tests unitaires sont rapides et peuvent être exécutés fréquemment
- Les tests E2E sont plus lents mais testent l'expérience utilisateur complète
- Combiner les deux approches donne la meilleure couverture de tests




