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

### Tout sur un seul port (8080)

Pour lancer **backend + tous les frontends** derrière une seule URL :

```bash
# À la racine du projet
npm install
# Si des serveurs tournent déjà sur 3000/3001/3080/5173/8080 :
./scripts/kill-dev-ports.sh
npm run dev
```

**Une seule adresse :** http://localhost:8080

| Chemin | Application |
|--------|-------------|
| http://localhost:8080/ | Frontend Web (Next.js) |
| http://localhost:8080/agency | Frontend Agence |
| http://localhost:8080/admin | Frontend Admin |
| http://localhost:8080/api | Backend API (ex. /api/docs pour Swagger) |

Le proxy (`proxy/`) route le trafic vers chaque app en interne. Pour faire évoluer les chemins ou les ports, modifier `proxy/server.cjs` et les `base` Vite (agency/admin).

## 🔐 Comptes de Test

Après le seed, vous pouvez vous connecter avec :

- **Super Admin**: `admin@malocauto.com` / `admin123`
- **Company Admin**: `admin@autolocation.fr` / `admin123`
- **Agency Manager**: `manager1@autolocation.fr` / `manager123`
- **Agent**: `agent1@autolocation.fr` / `agent123`

## 📚 Documentation

### Documentation Principale
- [Détails des Applications](./APPLICATIONS_DETAILS.md) - Vue d'ensemble complète de toutes les applications
- [Spécifications complètes](./docs/specs.md)
- [API Documentation](http://localhost:3000/api/docs) (Swagger)
- [Ports des Applications](./PORTS_APPLICATIONS.md) - Configuration des ports en développement

### Guides de Pilotes
- [PILOTE 1 - Backend API](./GUIDE_PILOTE_1_BACKEND.md)
- [PILOTE 2 - Frontend Agency](./GUIDE_PILOTE_2_FRONTEND_AGENCY.md)
- [PILOTE 3 - Frontend Admin](./GUIDE_PILOTE_3_FRONTEND_ADMIN.md)
- [PILOTE 4 - Mobile Agent](./GUIDE_PILOTE_4_MOBILE_AGENT.md)

### Pré-production
- [Checklist Préprod](./PREPROD_CHECKLIST.md)
- [Checklist Secrets](./CHECKLIST_SECRETS.md)
- [Sécurité JWT](./backend/SECURITE_JWT.md)
- [Nettoyage Préprod](./NETTOYAGE_PREPROD_COMPLET.md)

### Statut du Projet
- [Ce Qui Reste À Faire](./CE_QUI_RESTE_A_FAIRE.md) - État actuel et tâches restantes
- [Tout Dans L'Ordre](./TOUT_DANS_L_ORDRE.md) - Historique complet des travaux

## 🎯 Applications

MalocAuto comprend **5 applications**. En mode « un seul port » (`npm run dev` à la racine), tout est accessible sur **http://localhost:8080** :

1. **Backend API** — exposé sous `/api` (ex. `/api/docs` pour Swagger)
2. **Frontend Admin** — http://localhost:8080/admin
3. **Frontend Agency** — http://localhost:8080/agency
4. **Frontend Web** — http://localhost:8080/
5. **Mobile Agent** (Expo) — à lancer à part sur le port 8081

**Voir [APPLICATIONS_DETAILS.md](./APPLICATIONS_DETAILS.md) pour les détails complets de chaque application.**

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
