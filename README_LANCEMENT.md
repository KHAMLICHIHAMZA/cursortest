# Guide de Lancement Rapide - MalocAuto V2

## Démarrage en 5 minutes

### 1. Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 2. Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Éditer .env : configurer DATABASE_URL avec vos paramètres PostgreSQL

# Frontend Web
cd ../frontend-web
npm install

# Proxy + concurrently (racine)
cd ..
npm install
```

### 3. Base de données

```bash
cd backend

# Créer la base (si pas encore fait)
psql -U postgres -c "CREATE DATABASE malocauto;"

# Migrations et seed
npx prisma migrate dev
npx prisma db seed
```

### 4. Lancement

**Méthode recommandée — Tout-en-un :**

```bash
# À la racine du projet
npm run dev
```

Lance automatiquement :
- Backend API (port 3000)
- Frontend Web (port 3001)
- Proxy (port 8080)

**Une seule adresse :** http://localhost:8080

**Méthode manuelle — Terminaux séparés :**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend-web && npm run dev -- -p 3001

# Terminal 3 (optionnel)
cd proxy && npm run dev
```

### 5. Connexion

Ouvrir http://localhost:8080 et se connecter :

| Rôle | Email | Mot de passe | Espace |
|------|-------|--------------|--------|
| Super Admin | `admin@malocauto.com` | `admin123` | `/admin` |
| Company Admin | `admin@autolocation.fr` | `admin123` | `/company` |
| Agency Manager | `manager1@autolocation.fr` | `manager123` | `/agency` |
| Agent | `agent1@autolocation.fr` | `agent123` | `/agency` |

### 6. URLs utiles

| URL | Description |
|-----|-------------|
| http://localhost:8080 | Application web (proxy) |
| http://localhost:8080/api/docs | Documentation Swagger |
| http://localhost:3000/api/docs | Swagger (accès direct) |

Pour Prisma Studio (exploration base de données) :

```bash
cd backend
npx prisma studio
```

---

## Dépannage rapide

### Erreur de connexion DB

Vérifier `DATABASE_URL` dans `backend/.env`

### Port déjà utilisé

```powershell
# Voir les ports utilisés
Get-NetTCPConnection | Where-Object {$_.LocalPort -in @(3000, 3001, 8080)} | Select-Object LocalPort, OwningProcess
```

### Erreur de migration

```bash
cd backend
npx prisma migrate reset   # Recrée tout (supprime les données)
npx prisma db seed          # Recharge les données de test
```

### Le proxy ne démarre pas

```bash
cd proxy
npm install    # Installer les dépendances du proxy
npm run dev
```

---

## Documentation complète

- [README principal](./README.md)
- [Détails des applications](./APPLICATIONS_DETAILS.md)
- [Tests V2](./TESTS_V2_ET_UNIFICATION.md)
- [Spécifications](./docs/specs.md)

---

**Dernière mise à jour :** 2026-01-28  
**Version :** 2.0.0
