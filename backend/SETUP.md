# Guide de Configuration Backend

## 📋 Prérequis

- Node.js 18+ installé
- PostgreSQL 14+ installé et démarré
- npm ou yarn

## 🔧 Configuration étape par étape

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Configuration de la base de données

Créez un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Éditez `.env` et configurez :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/malocauto?schema=public"
```

### 3. Création de la base de données

```bash
# Option 1: Via psql
psql -U postgres
CREATE DATABASE malocauto;

# Option 2: Via createdb
createdb malocauto
```

### 4. Exécution des migrations

```bash
npx prisma migrate dev
```

Cette commande :
- Crée toutes les tables
- Applique toutes les migrations
- Génère le client Prisma

### 5. Seeding de la base de données

```bash
npx prisma db seed
```

Cela crée :
- 1 Super Admin
- 2 Entreprises
- Plusieurs agences
- Plusieurs utilisateurs avec différents rôles
- Des véhicules, clients, réservations, etc.

### 6. Démarrage du serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## ✅ Vérification

1. **API Health Check**
   ```bash
   curl http://localhost:3000/api/docs
   ```

2. **Test de connexion**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@malocauto.com","password":"admin123"}'
   ```

## 🔍 Commandes utiles

```bash
# Visualiser la base de données
npx prisma studio

# Créer une nouvelle migration
npx prisma migrate dev --name nom_migration

# Réinitialiser la base (ATTENTION: supprime toutes les données)
npx prisma migrate reset

# Générer le client Prisma
npx prisma generate
```

## 🐛 Dépannage

### Erreur: "Environment variable not found: DATABASE_URL"
- Vérifiez que le fichier `.env` existe
- Vérifiez que `DATABASE_URL` est bien défini

### Erreur: "Can't reach database server"
- Vérifiez que PostgreSQL est démarré
- Vérifiez les credentials dans `DATABASE_URL`
- Vérifiez que la base de données existe

### Erreur de migration
- Vérifiez que la base de données est vide ou compatible
- Utilisez `npx prisma migrate reset` pour réinitialiser (⚠️ supprime les données)
