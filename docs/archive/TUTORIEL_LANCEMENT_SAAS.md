# 🚀 Tutoriel : Lancer Toutes les Applications du SAAS MalocAuto

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Base de Données](#base-de-données)
5. [Lancement des Applications](#lancement-des-applications)
6. [Vérification](#vérification)
7. [Dépannage](#dépannage)

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

### Logiciels Requis

1. **Node.js** (version 18 ou supérieure)
   ```bash
   node --version
   # Doit afficher v18.x.x ou supérieur
   ```

2. **npm** (généralement inclus avec Node.js)
   ```bash
   npm --version
   # Doit afficher 9.x.x ou supérieur
   ```

3. **PostgreSQL** (version 14 ou supérieure)
   ```bash
   psql --version
   # Doit afficher psql (PostgreSQL) 14.x ou supérieur
   ```

4. **Git** (pour cloner le projet si nécessaire)
   ```bash
   git --version
   ```

### Vérification des Ports

Assurez-vous que les ports suivants sont disponibles :
- **Port 3000** : Backend API
- **Port 3001** : Frontend Web (Company Admin)
- **Port 5173** : Frontend Admin (Super Admin)
- **Port 8080** : Frontend Agency
- **Port 5432** : PostgreSQL (par défaut)

**Note** : Toutes les applications sont configurées pour être accessibles depuis le réseau (0.0.0.0) et en local (localhost).

---

## 🔧 Installation

### Étape 1 : Cloner le Projet (si nécessaire)

Si vous n'avez pas encore le projet :
```bash
git clone <url-du-repo>
cd cursortest
```

### Étape 2 : Installer les Dépendances Backend

```bash
cd backend
npm install
```

**Temps estimé** : 2-5 minutes

### Étape 3 : Installer les Dépendances Frontend

```bash
cd ../frontend-web
npm install
```

**Temps estimé** : 2-5 minutes

---

## ⚙️ Configuration

### Étape 1 : Configuration Backend

1. **Créer le fichier `.env` dans le dossier `backend/`** :

**Windows (PowerShell)** :
```powershell
cd backend
Copy-Item -Path ".env.example" -Destination ".env"
```

**Linux/Mac** :
```bash
cd backend
cp .env.example .env
```

**Note** : Si le fichier `.env.example` n'existe pas, vous pouvez le créer manuellement ou copier depuis `env.example` :
```powershell
# Windows
Copy-Item -Path "env.example" -Destination ".env.example"
Copy-Item -Path ".env.example" -Destination ".env"
```

2. **Éditer le fichier `.env`** avec vos paramètres :

```env
# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5432/malocauto?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@malocauto.com

# S3 Compatible Storage (Optionnel)
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=

# CMI Payment (Optionnel - pour les tests)
CMI_MERCHANT_ID=
CMI_SECRET_KEY=
CMI_TEST_MODE=true

# WhatsApp Business API (Optionnel)
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# AI Services (Optionnel)
OPENAI_API_KEY=
VISION_API_KEY=
GOOGLE_VISION_API_KEY=

# FCM Push Notifications (Optionnel)
FCM_SERVER_KEY=
FCM_PROJECT_ID=

# 2FA
TWO_FACTOR_ISSUER=MalocAuto
```

**⚠️ Important** : 
- Remplacez `postgres` et `password` dans `DATABASE_URL` par vos identifiants PostgreSQL
- Changez les secrets JWT (`JWT_SECRET` et `JWT_REFRESH_SECRET`) par des valeurs sécurisées (générez avec `openssl rand -base64 32`)
- Les variables optionnelles (S3, CMI, WhatsApp, AI, FCM) peuvent être laissées vides pour le développement
- Pour l'email, utilisez un "App Password" Gmail si vous utilisez Gmail (pas votre mot de passe normal)

### Étape 2 : Configuration Frontend

1. **Créer le fichier `.env.local` dans le dossier `frontend-web/`** :

```bash
cd ../frontend-web
```

Créer un fichier `.env.local` avec :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🗄️ Base de Données

### Étape 1 : Créer la Base de Données PostgreSQL

1. **Se connecter à PostgreSQL** :

```bash
psql -U postgres
```

2. **Créer la base de données** :

```sql
CREATE DATABASE malocauto;
\q
```

### Étape 2 : Configurer Prisma

1. **Générer le client Prisma** :

```bash
cd backend
npm run prisma:generate
```

2. **Exécuter les migrations** :

```bash
npm run prisma:migrate
```

**Note** : Si c'est la première fois, cela créera toutes les tables. Vous pouvez aussi utiliser :
```bash
npx prisma migrate dev
```

### Étape 3 : Peupler la Base de Données (Seed)

```bash
npm run prisma:seed
```

**Ce que fait le seed** :
- Crée un Super Admin (email: `admin@malocauto.com`, password: `admin123`)
- Crée 2 entreprises fictives
- Crée plusieurs agences
- Crée des utilisateurs avec différents rôles
- Crée des véhicules, clients, réservations, etc.

**⚠️ Important** : Le mot de passe par défaut du Super Admin est `admin123`. Changez-le en production !

---

## 🚀 Lancement des Applications

### Option 1 : Lancement Manuel (Recommandé pour le développement)

#### Terminal 1 : Backend

```bash
cd backend
npm run dev
```

**Note** : La commande `npm run dev` est équivalente à `npm run start:dev` (voir package.json)

**Vous devriez voir** :
```
🚀 MalocAuto Backend running on port 3000
📚 API Documentation: http://localhost:3000/api/docs
```

#### Terminal 2 : Frontend

```bash
cd frontend-web
npm run dev
```

**Vous devriez voir** :
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3001
  - Network:      http://[VOTRE_IP]:3001
  - ready started server on 0.0.0.0:3001
```

#### Terminal 3 : Frontend Admin (Super Admin)

```bash
cd frontend-admin
npm run dev
```

**Vous devriez voir** :
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://[VOTRE_IP]:5173/
```

**Note** : Remplacez `[VOTRE_IP]` par votre adresse IP locale (ex: `192.168.1.100`). Vous pouvez la trouver avec :
- **Windows** : `ipconfig` (cherchez "IPv4 Address")
- **Linux/Mac** : `ifconfig` ou `ip addr`

### Option 2 : Scripts de Lancement Automatique (Optionnel)

Vous pouvez créer des scripts pour lancer les deux en même temps :

**Windows (PowerShell)** :
```powershell
# Créer un fichier start-all.ps1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend-web; npm run dev"
```

**Linux/Mac** :
```bash
# Créer un fichier start-all.sh
#!/bin/bash
cd backend && npm run start:dev &
sleep 3
cd frontend-web && npm run dev
```

---

## ✅ Vérification

### 1. Vérifier le Backend

1. **Ouvrir dans le navigateur** :
   - API : http://localhost:3000/api/docs (Swagger)
   - Health check : http://localhost:3000/api (devrait retourner une réponse)

2. **Tester l'API avec curl** :
```bash
curl http://localhost:3000/api/docs
```

### 2. Vérifier le Frontend

#### Frontend Web (Company Admin)
1. **Ouvrir dans le navigateur** :
   - Local : http://localhost:3001
   - Réseau : http://[VOTRE_IP]:3001

2. **Se connecter** :
   - Email : `admin@autolocation.fr` (Company Admin)
   - Mot de passe : `admin123`

#### Frontend Admin (Super Admin)
1. **Ouvrir dans le navigateur** :
   - Local : http://localhost:5173
   - Réseau : http://[VOTRE_IP]:5173

2. **Se connecter** :
   - Email : `admin@malocauto.com`
   - Mot de passe : `admin123`

#### Frontend Agency
1. **Ouvrir dans le navigateur** :
   - Local : http://localhost:8080
   - Réseau : http://[VOTRE_IP]:8080

2. **Se connecter** :
   - Email : `manager1@autolocation.fr` (Agency Manager)
   - Mot de passe : `manager123`

### 3. Vérifier la Base de Données

```bash
cd backend
npm run prisma:studio
```

Cela ouvrira Prisma Studio sur http://localhost:5555 où vous pourrez voir toutes les données.

---

## 🎯 Utilisation

### Comptes de Test Créés par le Seed

#### Super Admin
- **Email** : `admin@malocauto.com`
- **Mot de passe** : `admin123`
- **Rôle** : SUPER_ADMIN
- **Accès** : Toutes les fonctionnalités

#### Company Admin 1
- **Email** : `admin@autolocation.fr`
- **Mot de passe** : `admin123`
- **Rôle** : COMPANY_ADMIN
- **Accès** : Gestion de sa société (AutoLocation)

#### Agency Managemanager1@autolocation.frr 1
- **Email** : `manager1@autolocation.fr`
- **Mot de passe** : `manager123`
- **Rôle** : AGENCY_MANAGER
- **Accès** : Gestion de ses agences assignées

**Note** : Le seed crée plusieurs autres comptes. Consultez la console après l'exécution du seed pour voir tous les comptes créés.

### Fonctionnalités Disponibles

#### En tant que Super Admin
- ✅ Gestion des entreprises (CRUD)
- ✅ Gestion des agences (CRUD)
- ✅ Gestion des utilisateurs (CRUD)
- ✅ Planning global
- ✅ Modules (placeholder)

#### En tant qu'Agency Manager / Agent
- ✅ Gestion des véhicules
- ✅ Gestion des clients
- ✅ Gestion des réservations
- ✅ Gestion des maintenances
- ✅ Gestion des amendes
- ✅ Planning de l'agence

---

## 🔧 Dépannage

### Problème 1 : Erreur de Connexion à la Base de Données

**Erreur** : `Can't reach database server`

**Solutions** :
1. Vérifier que PostgreSQL est démarré :
   ```bash
   # Windows
   services.msc → PostgreSQL
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Vérifier les identifiants dans `.env` :
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/malocauto"
   ```

3. Tester la connexion :
   ```bash
   psql -U username -d malocauto
   ```

### Problème 2 : Port Déjà Utilisé

**Erreur** : `EADDRINUSE: address already in use :::3000`

**Solutions** :
1. Trouver le processus utilisant le port :
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. Tuer le processus ou changer le port dans `.env`

### Problème 3 : Erreur de Migration Prisma

**Erreur** : `Migration failed`

**Solutions** :
1. Réinitialiser la base de données (⚠️ Supprime toutes les données) :
   ```bash
   cd backend
   npx prisma migrate reset
   npm run prisma:seed
   ```

2. Vérifier le schéma Prisma :
   ```bash
   npx prisma validate
   ```

### Problème 4 : Frontend Ne Se Connecte Pas au Backend

**Erreur** : `Network Error` ou `CORS Error`

**Solutions** :
1. Vérifier que le backend est démarré sur le port 3000
2. Vérifier `.env.local` du frontend :
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```
3. Vérifier CORS dans `backend/src/main.ts`

### Problème 5 : Erreur de Build

**Erreur** : `TypeScript errors` ou `Compilation failed`

**Solutions** :
1. Nettoyer et réinstaller :
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Vérifier les versions de Node.js :
   ```bash
   node --version  # Doit être >= 18
   ```

---

## 📝 Commandes Utiles

### Backend

```bash
# Démarrer en mode développement
npm run start:dev

# Démarrer en mode production
npm run build
npm run start:prod

# Générer le client Prisma
npm run prisma:generate

# Exécuter les migrations
npm run prisma:migrate

# Peupler la base de données
npm run prisma:seed

# Ouvrir Prisma Studio
npm run prisma:studio

# Lancer les tests
npm test
```

### Frontend Web (Company Admin)

```bash
cd frontend-web
# Démarrer en mode développement (accessible depuis le réseau)
npm run dev

# Build pour production
npm run build

# Démarrer en mode production (accessible depuis le réseau)
npm run start

# Linter
npm run lint
```

### Frontend Admin (Super Admin)

```bash
cd frontend-admin
# Démarrer en mode développement (accessible depuis le réseau)
npm run dev

# Build pour production
npm run build

# Preview de la build
npm run preview
```

### Frontend Agency

```bash
cd frontend-agency
# Démarrer en mode développement (accessible depuis le réseau)
npm run dev

# Build pour production
npm run build

# Preview de la build
npm run preview
```

---

## 🎉 Félicitations !

Vous avez maintenant lancé toutes les applications du SAAS MalocAuto !

### Prochaines Étapes

1. **Explorer l'API** : http://localhost:3000/api/docs
2. **Se connecter au frontend** : http://localhost:3001
3. **Explorer Prisma Studio** : `npm run prisma:studio` dans le dossier backend

### Support

Si vous rencontrez des problèmes :
1. Vérifier la section [Dépannage](#dépannage)
2. Vérifier les logs dans les terminaux
3. Consulter la documentation dans les dossiers `README.md`

---

## 📚 Ressources

- **Documentation Prisma** : https://www.prisma.io/docs
- **Documentation NestJS** : https://docs.nestjs.com
- **Documentation Next.js** : https://nextjs.org/docs
- **Documentation PostgreSQL** : https://www.postgresql.org/docs

---

**Bon développement ! 🚀**

