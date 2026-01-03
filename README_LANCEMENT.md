# 🚀 Guide de Lancement Rapide - MalocAuto SaaS

## ⚡ Démarrage en 5 Minutes

### 1️⃣ Prérequis
- Node.js 18+ 
- PostgreSQL 14+
- npm 9+

### 2️⃣ Installation

```bash
# Backend
cd backend
npm install
# Windows PowerShell:
Copy-Item -Path ".env.example" -Destination ".env"
# Linux/Mac:
# cp .env.example .env
# ⚠️ Éditer .env avec vos paramètres PostgreSQL

# Frontend  
cd ../frontend-web
npm install
# Créer .env.local avec: NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3️⃣ Base de Données

```bash
# Créer la base
psql -U postgres
CREATE DATABASE malocauto;
\q

# Migrations et Seed
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4️⃣ Lancement

**Terminal 1** (Backend) :
```bash
cd backend
npm run dev
```

**Terminal 2** (Frontend) :
```bash
cd frontend-web
npm run dev
```

### 5️⃣ Accès

- 🌐 **Frontend** : http://localhost:3001
- 📚 **API Docs** : http://localhost:3000/api/docs
- 🗄️ **Prisma Studio** : `npm run prisma:studio` (dans backend/)

### 6️⃣ Connexion

- **Email** : `admin@malocauto.com`
- **Mot de passe** : `admin123`

---

## 📖 Documentation Complète

Pour plus de détails, voir **[TUTORIEL_LANCEMENT_SAAS.md](./TUTORIEL_LANCEMENT_SAAS.md)**

---

## 🔧 Dépannage Rapide

### Erreur de connexion DB
→ Vérifier `DATABASE_URL` dans `backend/.env`

### Port déjà utilisé
→ Changer `PORT` dans `.env` ou tuer le processus

### Erreur de migration
→ `npx prisma migrate reset` (⚠️ supprime les données)

---

**Bon développement ! 🎉**

