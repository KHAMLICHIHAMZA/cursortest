# MalocAuto - SaaS de Gestion de Location Automobile

Plateforme SaaS multi-tenant pour la gestion complète de location de véhicules.

## 🏗️ Architecture

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Base de données**: PostgreSQL
- **Authentification**: JWT (Access + Refresh tokens)

## 📁 Structure du Projet

```
cursortest/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── modules/  # Modules métier (Auth, Company, Agency, etc.)
│   │   ├── common/   # Utilitaires partagés
│   │   └── main.ts   # Point d'entrée
│   └── prisma/       # Schéma Prisma + migrations
│
├── frontend-web/     # Application Next.js
│   ├── app/          # Pages et routes
│   ├── components/   # Composants React
│   └── lib/          # Utilitaires et API clients
│
└── docs/             # Documentation
    └── specs.md      # Spécifications complètes
```

## 🚀 Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL dans .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Le serveur démarre sur `http://localhost:3000`
API Documentation: `http://localhost:3000/api/docs`

### Frontend

```bash
cd frontend-web
npm install
cp .env.example .env
# Configurer NEXT_PUBLIC_API_URL dans .env
npm run dev
```

L'application démarre sur `http://localhost:3001`

## 🔐 Comptes de Test

Après le seed, vous pouvez vous connecter avec :

- **Super Admin**: `admin@malocauto.com` / `admin123`
- **Company Admin**: `admin@autolocation.fr` / `admin123`
- **Agency Manager**: `manager1@autolocation.fr` / `manager123`
- **Agent**: `agent1@autolocation.fr` / `agent123`

## 📚 Documentation

- [Spécifications complètes](./docs/specs.md)
- [API Documentation](http://localhost:3000/api/docs) (Swagger)
- [Guide de migration NestJS](./backend/MIGRATION_NESTJS.md)

## 🎯 Fonctionnalités

### SaaS Backoffice (Super Admin)
- Gestion des entreprises
- Gestion des agences
- Gestion des utilisateurs
- Planning global

### Espace Agence
- Gestion des véhicules
- Gestion des clients
- Gestion des réservations
- Gestion de la maintenance
- Gestion des amendes
- Planning des véhicules (FullCalendar Timeline)

## 🔒 Sécurité

- JWT avec refresh token rotation
- Rate limiting
- Audit logs complets
- Soft delete pour les données critiques
- Validation des entrées (Zod/class-validator)

## 🧪 Tests

```bash
cd backend
npm test
```

## 📝 License

Propriétaire - MalocAuto
