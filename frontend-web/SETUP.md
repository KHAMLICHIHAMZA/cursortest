# Guide de Configuration Frontend

## 📋 Prérequis

- Node.js 18+ installé
- Backend API démarré et accessible

## 🔧 Configuration étape par étape

### 1. Installation des dépendances

```bash
cd frontend-web
npm install
```

### 2. Configuration de l'environnement

Créez un fichier `.env.local` :

```bash
cp .env.example .env.local
```

Éditez `.env.local` et configurez :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=MalocAuto
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3. Démarrage du serveur de développement

```bash
npm run dev
```

L'application démarre sur `http://localhost:3001`

## ✅ Vérification

1. Ouvrez `http://localhost:3001` dans votre navigateur
2. Vous devriez voir la page d'accueil
3. Cliquez sur "Se connecter" pour accéder à la page de login

## 🔐 Connexion

Utilisez les identifiants du seed :
- Email: `admin@malocauto.com`
- Password: `admin123`

## 🛠️ Scripts disponibles

```bash
npm run dev      # Développement (port 3001)
npm run build    # Build production
npm run start    # Démarrer en production
npm run lint     # Vérifier le code
```

## 🐛 Dépannage

### Erreur: "Network Error" ou "Connection refused"
- Vérifiez que le backend est démarré sur `http://localhost:3000`
- Vérifiez `NEXT_PUBLIC_API_URL` dans `.env.local`

### Erreur: "401 Unauthorized"
- Vérifiez que vous êtes connecté
- Vérifiez que les tokens JWT sont valides
- Essayez de vous reconnecter

### Erreur de build
- Supprimez `.next` et `node_modules`
- Réinstallez: `npm install`
- Rebuild: `npm run build`



