# Ports des Applications - MalocAuto V2

**Date :** 2026-01-28  
**Version :** 2.0.0 (Architecture unifiée)

---

## Ports en développement

| Application | Port | URL | Commande |
|-------------|------|-----|----------|
| **Proxy (point d'entrée unique)** | **8080** | http://localhost:8080 | `npm run dev` (racine) |
| Backend API (NestJS) | 3000 | http://localhost:3000 | `cd backend && npm run dev` |
| Frontend Web (Next.js) | 3001 | http://localhost:3001 | `cd frontend-web && npm run dev -- -p 3001` |
| Mobile Agent (Expo) | 8081 | http://localhost:8081 | `cd mobile-agent && npm start` |

> **Note :** Le proxy sur le port **8080** est le point d'entrée recommandé pour le navigateur.

---

## Routes via le proxy (port 8080)

| URL | Application | Rôles autorisés |
|-----|-------------|-----------------|
| http://localhost:8080/login | Page de connexion | Tous |
| http://localhost:8080/admin/* | Interface Super Admin | SUPER_ADMIN |
| http://localhost:8080/company/* | Interface Company Admin | COMPANY_ADMIN |
| http://localhost:8080/agency/* | Interface Agency | AGENCY_MANAGER, AGENT |
| http://localhost:8080/api/* | Backend API REST | Authentifié (JWT) |
| http://localhost:8080/api/docs | Documentation Swagger | Public |

---

## Lancement

### Tout-en-un (recommandé)

```bash
npm install    # À la racine, installe aussi les dépendances du proxy
npm run dev    # Lance backend + frontend-web + proxy en parallèle
```

Ouvre http://localhost:8080 dans le navigateur.

### Individuellement

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend Web
cd frontend-web && npm run dev -- -p 3001

# Terminal 3 — Proxy (optionnel si accès direct aux ports)
cd proxy && npm run dev

# Terminal 4 — Mobile Agent (si besoin)
cd mobile-agent && npm start
```

---

## Vérification des ports

### PowerShell

```powershell
Get-NetTCPConnection | Where-Object {$_.LocalPort -in @(3000, 3001, 8080, 8081)} | Select-Object LocalPort, State
```

### Linux / macOS

```bash
lsof -i :3000,3001,8080,8081
```

---

## Applications supprimées (V2)

Les anciennes applications Vite ont été supprimées et migrées dans `frontend-web` :

| Application supprimée | Ancien port | Nouvelles routes |
|----------------------|-------------|------------------|
| `frontend-admin/` | 5173 | `/admin/*` dans frontend-web |
| `frontend-agency/` | 8080 | `/agency/*` dans frontend-web |

Le port 5173 n'est plus utilisé.

---

**Dernière mise à jour :** 2026-01-28
