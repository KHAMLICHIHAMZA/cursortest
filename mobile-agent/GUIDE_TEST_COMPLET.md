# 🧪 GUIDE DE TEST COMPLET - Application Mobile

## 📋 CE QUI RESTE À TESTER

D'après les tests pilotes précédents, voici ce qui doit être vérifié :

### ⚠️ TESTS À VÉRIFIER (Marqués "À VÉRIFIER" dans les tests précédents)

#### 1. ✅ UC-001 : Sélection de langue à l'onboarding
**À vérifier** : Navigation automatique si langue déjà sélectionnée
- [ ] Lancer l'app fraîchement installée → Écran sélection langue s'affiche
- [ ] Sélectionner une langue → Navigation vers Login
- [ ] Fermer et rouvrir l'app → Navigation automatique vers Login (langue déjà stockée)

#### 2. ✅ UC-002 : Login avec credentials valides
**À vérifier** : Format réponse API et stockage des données
- [ ] Login avec `agent1@autolocation.fr` / `agent123`
- [ ] Vérifier que `access_token` est stocké
- [ ] Vérifier que `user`, `agencies`, `permissions`, `modules` sont stockés
- [ ] Vérifier navigation vers AppStack

#### 3. ✅ UC-010 : Création booking valide (AGENCY_MANAGER uniquement)
**À vérifier** : Format API et création réussie
- [ ] Login avec compte AGENCY_MANAGER
- [ ] Créer un booking avec toutes les données valides
- [ ] Vérifier que le booking apparaît dans la liste
- [ ] Vérifier le statut (PENDING ou CONFIRMED)

#### 4. ✅ UC-013 : Check-in complet valide
**À vérifier** : Format API, upload fichiers, transition de statut
- [ ] Sélectionner un booking CONFIRMED
- [ ] Remplir TOUS les champs (odometer, fuel, 4+ photos, permis, signature)
- [ ] Vérifier upload des photos avant envoi
- [ ] Vérifier que le booking passe à ACTIVE
- [ ] Vérifier que les photos sont visibles dans les détails

#### 5. ✅ UC-017 : Check-out complet valide
**À vérifier** : Format API, calcul frais, transition de statut
- [ ] Sélectionner un booking ACTIVE
- [ ] Remplir TOUS les champs (odometer, fuel, 4+ photos, signature)
- [ ] Ajouter des frais si nécessaire
- [ ] Vérifier upload des photos avant envoi
- [ ] Vérifier que le booking passe à COMPLETED
- [ ] Vérifier calcul des frais (lateFee, damageFee)

#### 6. ✅ UC-024 : Vérification traductions complètes
**À vérifier** : Aucun texte hardcodé
- [ ] Parcourir tous les écrans en FR
- [ ] Changer en EN → Vérifier toutes les traductions
- [ ] Changer en Darija → Vérifier toutes les traductions
- [ ] Vérifier qu'aucun texte n'est hardcodé

#### 7. ✅ UC-026 : Vérification modules actifs
**À vérifier** : Masquage des écrans si module désactivé
- [ ] Désactiver module BOOKINGS côté Company (backend)
- [ ] Se reconnecter dans l'app
- [ ] Vérifier que l'onglet Bookings est masqué
- [ ] Réactiver le module → Vérifier réapparition

---

### ✅ TESTS FONCTIONNELS COMPLETS À EFFECTUER

#### A. AUTHENTIFICATION

1. **Login avec différents rôles**
   - [ ] AGENCY_MANAGER → Vérifier bouton "Créer réservation" visible
   - [ ] AGENT → Vérifier bouton "Créer réservation" absent
   - [ ] Vérifier navigation selon rôle

2. **Gestion erreurs login**
   - [ ] Email invalide → Message d'erreur affiché
   - [ ] Password trop court → Message d'erreur affiché
   - [ ] Credentials invalides → Message d'erreur affiché
   - [ ] Company désactivée → Message d'erreur approprié

3. **Logout**
   - [ ] Déconnexion → Retour à l'écran Login
   - [ ] Token supprimé
   - [ ] Données utilisateur supprimées

#### B. NAVIGATION

1. **Navigation principale**
   - [ ] Onglet Bookings → Liste des bookings
   - [ ] Onglet Settings → Paramètres
   - [ ] Navigation vers détails booking

2. **Permissions par rôle**
   - [ ] AGENT ne peut pas accéder à CreateBooking (même via URL)
   - [ ] AGENCY_MANAGER peut créer des bookings

#### C. GESTION BOOKINGS

1. **Liste des bookings**
   - [ ] Affichage correct des bookings
   - [ ] Filtrage par agence (si plusieurs agences)
   - [ ] Statuts affichés correctement (PENDING, CONFIRMED, ACTIVE, COMPLETED)

2. **Détails booking**
   - [ ] Informations complètes affichées
   - [ ] Boutons Check-in/Check-out selon statut
   - [ ] Photos visibles si présentes

3. **Création booking (AGENCY_MANAGER)**
   - [ ] Validation formulaire (dates, client, véhicule)
   - [ ] Blocage si permis client expiré
   - [ ] Création réussie → Apparition dans la liste

#### D. CHECK-IN

1. **Formulaire check-in**
   - [ ] Tous les champs requis présents
   - [ ] Validation Zod active
   - [ ] Minimum 4 photos obligatoires
   - [ ] Permis obligatoire avec date expiration > aujourd'hui
   - [ ] Signature obligatoire

2. **Upload fichiers**
   - [ ] Photos avant uploadées avant envoi
   - [ ] Photo permis uploadée
   - [ ] Document identité uploadé (si fourni)
   - [ ] Document caution uploadé (si fourni)

3. **Dommages existants**
   - [ ] Ajout de dommages avec photos
   - [ ] Validation des champs dommage

4. **Transition de statut**
   - [ ] Booking CONFIRMED → ACTIVE après check-in
   - [ ] Véhicule passe à RENTED

#### E. CHECK-OUT

1. **Formulaire check-out**
   - [ ] Tous les champs requis présents
   - [ ] Validation odometerEnd >= odometerStart
   - [ ] Minimum 4 photos obligatoires
   - [ ] Signature obligatoire

2. **Upload fichiers**
   - [ ] Photos après uploadées avant envoi
   - [ ] Photo reçu cash uploadée (si cashCollected)

3. **Nouveaux dommages**
   - [ ] Ajout de nouveaux dommages avec photos
   - [ ] Upload des photos de dommages

4. **Frais et encaissement**
   - [ ] Calcul automatique lateFee (backend)
   - [ ] Calcul automatique damageFee (backend)
   - [ ] Encaissement cash avec montant
   - [ ] Reçu cash uploadé

5. **Transition de statut**
   - [ ] Booking ACTIVE → COMPLETED après check-out
   - [ ] Véhicule passe à AVAILABLE

#### F. MODE OFFLINE

1. **Création booking offline**
   - [ ] Désactiver réseau
   - [ ] Créer un booking
   - [ ] Vérifier message "En attente de synchronisation"
   - [ ] Vérifier booking visible dans la liste (local)
   - [ ] Réactiver réseau → Vérifier synchronisation automatique

2. **Check-in offline**
   - [ ] Désactiver réseau
   - [ ] Effectuer un check-in complet
   - [ ] Vérifier photos stockées localement
   - [ ] Vérifier action dans la queue
   - [ ] Réactiver réseau → Vérifier upload et synchronisation

3. **Check-out offline**
   - [ ] Désactiver réseau
   - [ ] Effectuer un check-out complet
   - [ ] Vérifier photos stockées localement
   - [ ] Réactiver réseau → Vérifier synchronisation

4. **Synchronisation automatique**
   - [ ] Créer plusieurs actions en offline
   - [ ] Réactiver réseau
   - [ ] Vérifier traitement dans l'ordre
   - [ ] Vérifier queue vidée après succès

5. **Indicateur offline**
   - [ ] Affichage correct quand offline
   - [ ] Masquage quand online
   - [ ] Nombre d'actions en attente affiché

#### G. MULTI-LANGUE

1. **Sélection langue**
   - [ ] 3 langues disponibles (FR, EN, Darija)
   - [ ] Changement immédiat après sélection
   - [ ] Persistance après redémarrage

2. **Traductions complètes**
   - [ ] Tous les écrans traduits
   - [ ] Tous les messages d'erreur traduits
   - [ ] Aucun texte hardcodé

3. **Changement langue dans Settings**
   - [ ] Changement immédiat
   - [ ] Tous les textes mis à jour
   - [ ] Persistance

#### H. GESTION ERREURS

1. **Erreurs réseau**
   - [ ] Message approprié affiché
   - [ ] Action mise en queue si applicable
   - [ ] Pas de crash de l'app

2. **Erreurs 401 (Unauthorized)**
   - [ ] Logout automatique
   - [ ] Redirection vers Login
   - [ ] Message approprié

3. **Erreurs 403 (Forbidden)**
   - [ ] Message approprié affiché
   - [ ] Pas d'accès à la fonctionnalité

4. **Erreurs validation**
   - [ ] Messages d'erreur clairs et traduits
   - [ ] Pas d'appel API si validation échoue

#### I. PERFORMANCE

1. **Chargement des données**
   - [ ] Liste bookings charge rapidement
   - [ ] Pas de freeze lors du chargement
   - [ ] Indicateurs de chargement visibles

2. **Upload de fichiers**
   - [ ] Upload progressif (pas de freeze)
   - [ ] Gestion des gros fichiers
   - [ ] Timeout géré correctement

3. **Mode offline**
   - [ ] Pas de ralentissement en offline
   - [ ] Synchronisation non-bloquante

---

## 🚀 PROCÉDURE DE LANCEMENT

### Étape 1 : Vérifier le Backend

```bash
cd backend
npm run start:dev
```

**Vérifier** :
- ✅ Backend accessible sur `http://localhost:3000`
- ✅ Swagger sur `http://localhost:3000/api/docs`
- ✅ Base de données connectée

### Étape 2 : Trouver votre IP locale

**Windows PowerShell** :
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object IPAddress, InterfaceAlias
```

**Exemple** : `192.168.1.100`

### Étape 3 : Configurer l'URL API dans le mobile

Modifier `mobile-agent/src/config/api.ts` :

```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000/api/v1'  // REMPLACER par votre IP
  : 'https://api.malocauto.com/api/v1';
```

### Étape 4 : Démarrer l'application mobile

```bash
cd mobile-agent
npm start
```

**Puis** :
- Appuyer sur `a` pour Android (émulateur)
- Appuyer sur `i` pour iOS (simulateur - macOS uniquement)
- Scanner le QR code avec Expo Go (téléphone physique)

### Étape 5 : Vérifier la connexion

- ✅ QR code affiche `exp://192.168.1.XXX:8081` (pas `127.0.0.1`)
- ✅ App se connecte au serveur Expo
- ✅ Pas d'erreur de connexion réseau

---

## 📝 COMPTES DE TEST

D'après le README principal :

- **Super Admin** : `admin@malocauto.com` / `admin123`
- **Company Admin** : `admin@autolocation.fr` / `admin123`
- **Agency Manager** : `manager1@autolocation.fr` / `manager123`
- **Agent** : `agent1@autolocation.fr` / `agent123`

---

## ✅ CHECKLIST RAPIDE

Avant de commencer les tests :

- [ ] Backend démarré et accessible
- [ ] IP locale trouvée et configurée dans `api.ts`
- [ ] Application mobile démarrée
- [ ] Connexion Expo réussie (QR code scanné)
- [ ] Pas d'erreur de connexion réseau
- [ ] Comptes de test disponibles dans la base

---

## 🐛 DÉPANNAGE

### Erreur : "Network request failed"
- Vérifier que le backend est démarré
- Vérifier l'IP dans `api.ts` (doit être l'IP locale, pas localhost)
- Vérifier que le téléphone et l'ordinateur sont sur le même Wi-Fi
- Vérifier le pare-feu Windows (port 3000)

### Erreur : "Could not connect to Expo"
- Vérifier que le QR code affiche une IP locale (pas 127.0.0.1)
- Appuyer sur `shift+m` dans le terminal Expo pour changer le mode
- Essayer le mode tunnel : `npx expo start --tunnel`

### Erreur : "401 Unauthorized"
- Vérifier que les comptes de test existent dans la base
- Vérifier que le backend génère correctement les tokens
- Vérifier le format de réponse de l'API login

---

**Date de création** : $(date)  
**Statut** : 📋 Prêt pour tests





