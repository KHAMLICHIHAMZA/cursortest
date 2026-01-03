# 📱 TUTORIEL DÉTAILLÉ - Lancer l'application sur iPhone

## 🎯 Objectif
Lancer l'application MalocAuto Agent sur votre iPhone en utilisant Expo Go.

---

## 📋 PRÉREQUIS

### 1. Vérifier que le Backend est démarré

**Ouvrir un terminal** et exécuter :

```bash
cd backend
npm run start:dev
```

**Vérifier** :
- ✅ Le backend démarre sans erreur
- ✅ Message : "🚀 MalocAuto Backend running on port 3000"
- ✅ Swagger accessible sur `http://localhost:3000/api/docs`

**Si le backend n'est pas démarré** : L'application mobile ne pourra pas se connecter à l'API.

---

### 2. Vérifier votre IP locale

**Sur Windows (PowerShell)** :
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object IPAddress, InterfaceAlias
```

**Notez votre IP Wi-Fi** (exemple : `192.168.1.99`)

**Important** : Votre ordinateur et votre iPhone doivent être sur le **même réseau Wi-Fi**.

---

### 3. Configurer l'URL API dans le mobile

**Fichier** : `mobile-agent/src/config/api.ts`

**Vérifier** que l'URL contient votre IP locale :

```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.99:3000/api/v1'  // REMPLACER par votre IP
  : 'https://api.malocauto.com/api/v1';
```

**Si l'IP est différente** : Modifier la ligne avec votre IP locale.

---

## 📲 ÉTAPE 1 : Installer Expo Go sur iPhone

### Option A : Depuis l'App Store

1. **Ouvrir l'App Store** sur votre iPhone
2. **Rechercher** : "Expo Go"
3. **Installer** l'application (gratuite)
4. **Ouvrir** Expo Go après installation

### Option B : Lien direct

1. **Ouvrir Safari** sur votre iPhone
2. **Aller sur** : https://apps.apple.com/app/expo-go/id982107779
3. **Installer** depuis l'App Store

---

## 💻 ÉTAPE 2 : Démarrer l'application mobile

### Sur votre ordinateur

**Ouvrir un nouveau terminal** (garder le terminal du backend ouvert) :

```bash
cd mobile-agent
npm start
```

**Attendre** que Expo démarre. Vous devriez voir :

```
› Metro waiting on exp://192.168.1.99:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**Important** : 
- ✅ L'URL doit commencer par `exp://192.168.1.XXX:8081` (votre IP locale)
- ❌ **PAS** `exp://127.0.0.1:8081` (ne fonctionnera pas depuis iPhone)

---

## 📸 ÉTAPE 3 : Scanner le QR code avec iPhone

### Méthode 1 : Appareil photo natif (Recommandé)

1. **Ouvrir l'appareil photo** natif de l'iPhone (pas Expo Go)
2. **Pointer** vers le QR code affiché dans le terminal
3. **Une notification** apparaît en haut de l'écran
4. **Appuyer** sur la notification
5. **Expo Go s'ouvre** automatiquement et charge l'application

### Méthode 2 : Depuis Expo Go

1. **Ouvrir Expo Go** sur votre iPhone
2. **Appuyer** sur "Scan QR Code" (en bas)
3. **Scanner** le QR code dans le terminal
4. **L'application se charge** automatiquement

---

## ⚙️ ÉTAPE 4 : Vérifier la connexion

### Si tout fonctionne :

- ✅ Expo Go charge l'application
- ✅ L'écran de sélection de langue s'affiche
- ✅ Pas d'erreur de connexion

### Si vous voyez des erreurs :

Voir la section **DÉPANNAGE** ci-dessous.

---

## 🔧 DÉPANNAGE

### ❌ Problème 1 : "Could not connect to server"

**Symptômes** :
- Expo Go ne peut pas se connecter
- Message d'erreur dans Expo Go

**Solutions** :

#### A. Vérifier le mode de connexion Expo

Dans le terminal Expo, appuyer sur :
- **`shift + m`** : Changer le mode de connexion
- Choisir **"LAN"** (pas "localhost" ou "tunnel")

#### B. Vérifier le pare-feu Windows

1. **Ouvrir** "Pare-feu Windows Defender"
2. **Cliquer** sur "Paramètres avancés"
3. **Vérifier** que le port **8081** est autorisé pour les connexions entrantes
4. **Si nécessaire** : Ajouter une règle pour autoriser le port 8081

#### C. Vérifier que vous êtes sur le même Wi-Fi

- ✅ Ordinateur connecté au Wi-Fi
- ✅ iPhone connecté au **même** Wi-Fi
- ❌ Pas de réseau différent (ex: iPhone en 4G, ordinateur en Wi-Fi)

#### D. Utiliser le mode tunnel (si LAN ne fonctionne pas)

Dans le terminal Expo :
```bash
# Arrêter Expo (Ctrl+C)
npx expo start --tunnel
```

**Note** : Le mode tunnel est plus lent mais fonctionne même si vous n'êtes pas sur le même réseau.

---

### ❌ Problème 2 : "Network request failed" dans l'app

**Symptômes** :
- L'app se charge mais ne peut pas se connecter à l'API
- Erreur lors du login

**Solutions** :

#### A. Vérifier que le backend est démarré

```bash
# Dans le terminal backend
# Vérifier que vous voyez : "🚀 MalocAuto Backend running on port 3000"
```

#### B. Vérifier l'URL API

**Fichier** : `mobile-agent/src/config/api.ts`

**Vérifier** que l'IP est correcte :
```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.99:3000/api/v1'  // Votre IP locale
  : 'https://api.malocauto.com/api/v1';
```

#### C. Tester l'API depuis l'iPhone

**Sur votre iPhone** (Safari) :
- Aller sur : `http://192.168.1.99:3000/api/docs`
- Si la page s'affiche : L'API est accessible ✅
- Si erreur : Vérifier le pare-feu ou l'IP

#### D. Vérifier CORS du backend

**Fichier** : `backend/src/main.ts`

**Vérifier** que CORS autorise les requêtes depuis l'iPhone :
```typescript
app.enableCors({
  origin: true, // Autorise toutes les origines en dev
  // ou spécifier : origin: ['http://192.168.1.99:8081']
});
```

---

### ❌ Problème 3 : QR code affiche "exp://127.0.0.1:8081"

**Symptôme** : Le QR code contient `127.0.0.1` au lieu de votre IP locale

**Solution** :

1. **Dans le terminal Expo**, appuyer sur **`shift + m`**
2. **Choisir** "LAN" (pas "localhost")
3. **Attendre** que le QR code se régénère
4. **Vérifier** que l'URL contient maintenant votre IP locale

**Alternative** : Redémarrer Expo avec le flag `--lan` :
```bash
# Arrêter Expo (Ctrl+C)
npm start
# ou
npx expo start --lan
```

---

### ❌ Problème 4 : L'app se charge mais reste sur l'écran de chargement

**Symptômes** :
- Expo Go charge l'app
- Écran de chargement infini

**Solutions** :

#### A. Vider le cache Expo

Dans le terminal Expo :
```bash
# Arrêter Expo (Ctrl+C)
npx expo start --clear
```

#### B. Redémarrer l'app dans Expo Go

1. **Fermer** Expo Go complètement (swipe up)
2. **Rouvrir** Expo Go
3. **Scanner** le QR code à nouveau

#### C. Vérifier les logs dans le terminal

Regarder les erreurs dans le terminal Expo pour identifier le problème.

---

### ❌ Problème 5 : Erreur "Camera permission denied"

**Symptôme** : Impossible de scanner le QR code

**Solution** :

1. **Aller dans** Réglages iPhone
2. **Appareil photo** → Autoriser l'accès à l'appareil photo pour Expo Go
3. **Réessayer** de scanner

---

## ✅ VÉRIFICATION FINALE

Une fois l'application lancée, vous devriez voir :

1. ✅ **Écran de sélection de langue** (FR, EN, Darija)
2. ✅ **Sélectionner une langue** → Navigation vers Login
3. ✅ **Écran de login** avec champs email/password
4. ✅ **Pas d'erreur** de connexion réseau

---

## 🧪 TESTER LA CONNEXION

### Test rapide :

1. **Sélectionner** une langue (ex: Français)
2. **Aller** sur l'écran Login
3. **Entrer** : `agent1@autolocation.fr` / `agent123`
4. **Cliquer** sur "Connexion"
5. **Si login réussit** : ✅ Tout fonctionne !

---

## 📝 COMMANDES UTILES DANS LE TERMINAL EXPO

Pendant que Expo tourne, vous pouvez utiliser ces commandes :

- **`r`** : Redémarrer le serveur Metro
- **`shift + m`** : Changer le mode de connexion (LAN/Tunnel/Localhost)
- **`i`** : Ouvrir sur simulateur iOS (macOS uniquement)
- **`a`** : Ouvrir sur émulateur Android
- **`w`** : Ouvrir dans le navigateur web
- **`c`** : Effacer le cache
- **`Ctrl + C`** : Arrêter Expo

---

## 🎯 RÉCAPITULATIF RAPIDE

1. ✅ Backend démarré (`cd backend && npm run start:dev`)
2. ✅ IP locale notée (ex: `192.168.1.99`)
3. ✅ URL API configurée dans `api.ts` avec votre IP
4. ✅ Expo Go installé sur iPhone
5. ✅ Ordinateur et iPhone sur le même Wi-Fi
6. ✅ Expo démarré (`cd mobile-agent && npm start`)
7. ✅ QR code scanné avec l'appareil photo iPhone
8. ✅ Application chargée dans Expo Go

---

## 🆘 BESOIN D'AIDE ?

Si vous rencontrez toujours des problèmes :

1. **Vérifier** les logs dans le terminal Expo
2. **Vérifier** les logs dans le terminal Backend
3. **Vérifier** que tous les prérequis sont remplis
4. **Essayer** le mode tunnel : `npx expo start --tunnel`

---

**Date** : $(date)  
**Version** : 1.0  
**Statut** : ✅ Prêt pour iPhone





