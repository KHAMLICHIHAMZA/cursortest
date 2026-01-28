# 📋 Ports des Applications - Mode Développement

**Date :** 2025-01-26  
**Environnement :** Développement

---

## 🚀 Ports Configurés

| Application | Port | URL | Configuration |
|------------|------|-----|---------------|
| **Backend API** | **3000** | http://localhost:3000 | NestJS (défaut) |
| **Frontend Web** | **3001** | http://localhost:3001 | Next.js (à spécifier) |
| **Frontend Agency** | **8080** | http://localhost:8080 | Vite (configuré) |
| **Frontend Admin** | **5173** | http://localhost:5173 | Vite (configuré) |
| **Mobile Agent** | **8081** | http://localhost:8081 | Expo (défaut) |

---

## 📝 Détails par Application

### 1. Backend API - Port 3000

**Répertoire :** `backend/`  
**Framework :** NestJS  
**Port :** 3000 (défaut NestJS)

**Commande de démarrage :**
```bash
cd backend
npm run dev
```

**URLs :**
- API : http://localhost:3000
- API Docs (Swagger) : http://localhost:3000/api/docs
- Health Check : http://localhost:3000/health

**Configuration :**
- Port défini dans `backend/src/main.ts` (généralement 3000 par défaut)
- Peut être modifié via variable d'environnement `PORT`

---

### 2. Frontend Web (Agency) - Port 3001

**Répertoire :** `frontend-web/`  
**Framework :** Next.js  
**Port :** 3001 (à spécifier car Next.js utilise 3000 par défaut)

**Commande de démarrage :**
```bash
cd frontend-web
npm run dev -- -p 3001
```

**URL :** http://localhost:3001

**Configuration :**
- Next.js utilise le port 3000 par défaut
- **IMPORTANT :** Spécifier `-p 3001` pour éviter le conflit avec le backend
- Peut être configuré via variable d'environnement `PORT=3001`

**Note :** Le script `npm run dev` dans `package.json` ne spécifie pas de port, donc il faut l'ajouter manuellement ou modifier le script.

---

### 3. Frontend Agency - Port 8080

**Répertoire :** `frontend-agency/`  
**Framework :** Vite + React  
**Port :** 8080 (configuré)

**Commande de démarrage :**
```bash
cd frontend-agency
npm run dev
```

**URL :** http://localhost:8080

**Configuration :**
- Port défini dans `frontend-agency/package.json` :
  ```json
  "dev": "vite --port 8080"
  ```

---

### 4. Frontend Admin - Port 5173

**Répertoire :** `frontend-admin/`  
**Framework :** Vite + React  
**Port :** 5173 (configuré)

**Commande de démarrage :**
```bash
cd frontend-admin
npm run dev
```

**URL :** http://localhost:5173

**Configuration :**
- Port défini dans `frontend-admin/vite.config.ts` :
  ```typescript
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  }
  ```

---

### 5. Mobile Agent - Port 8081

**Répertoire :** `mobile-agent/`  
**Framework :** Expo  
**Port :** 8081 (défaut Expo)

**Commande de démarrage :**
```bash
cd mobile-agent
npm start
```

**URL :** http://localhost:8081

**Configuration :**
- Expo utilise le port 8081 par défaut pour le serveur de développement
- Le QR code est accessible sur cette URL
- Peut être modifié via variable d'environnement `EXPO_PORT=8081`

---

## 🔧 Scripts de Démarrage

### Démarrer toutes les applications

Utiliser le script PowerShell :
```bash
powershell -ExecutionPolicy Bypass -File scripts/demarrer-toutes-applications.ps1
```

### Démarrer uniquement les frontends

```bash
powershell -ExecutionPolicy Bypass -File scripts/relancer-frontends.ps1
```

### Arrêter toutes les applications

```bash
powershell -ExecutionPolicy Bypass -File scripts/arreter-applications.ps1
```

---

## ⚠️ Notes Importantes

1. **Conflit de ports :**
   - Next.js (Frontend Web) utilise 3000 par défaut
   - Le backend utilise aussi 3000
   - **Solution :** Spécifier `-p 3001` pour Next.js

2. **Ordre de démarrage recommandé :**
   1. Backend API (port 3000)
   2. Frontend Web (port 3001)
   3. Frontend Agency (port 8080)
   4. Frontend Admin (port 5173)
   5. Mobile Agent (port 8081)

3. **Vérification des ports :**
   ```powershell
   Get-NetTCPConnection | Where-Object {$_.LocalPort -in @(3000, 3001, 8080, 5173, 8081)} | Select-Object LocalPort, State
   ```

---

## 📝 Modifications Recommandées

### Frontend Web - Ajouter le port dans package.json

Pour éviter de spécifier le port à chaque fois, modifier `frontend-web/package.json` :

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3001"
  }
}
```

---

**Dernière mise à jour :** 2025-01-26





