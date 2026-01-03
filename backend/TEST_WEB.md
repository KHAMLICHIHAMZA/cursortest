# 🌐 Tester l'application sur le web

## ⚠️ IMPORTANT : Redémarrage du backend requis

Les modifications CORS nécessitent un **redémarrage complet** du backend.

## 📋 Étapes pour tester sur le web

### 1. Redémarrer le backend

Dans le terminal du backend :
1. Appuyez sur **`Ctrl + C`** pour arrêter
2. Redémarrez :
   ```bash
   npm run start:dev
   ```
3. Attendez de voir :
   ```
   🚀 MalocAuto Backend running on port 3000
   ```

### 2. Démarrer l'application mobile pour le web

Dans un **nouveau terminal** :
```bash
cd mobile-agent
npm run web
```

Ou si Expo est déjà démarré, appuyez sur **`w`** dans le terminal Expo.

### 3. Ouvrir dans le navigateur

L'application s'ouvrira automatiquement dans votre navigateur à :
```
http://localhost:8081
```

### 4. Tester la connexion

Utilisez les identifiants :
- **Email** : `agent1@autolocation.fr`
- **Mot de passe** : `agent123`

## ✅ Vérifications

### Backend accessible ?
Ouvrez dans votre navigateur :
```
http://localhost:3000/api/docs
```
Vous devriez voir la documentation Swagger.

### CORS fonctionne ?
1. Ouvrez la console du navigateur (F12)
2. Essayez de vous connecter
3. L'erreur CORS devrait avoir disparu

## 🐛 Si l'erreur CORS persiste

1. **Vérifiez que le backend est bien redémarré** :
   - Regardez la date/heure dans les logs
   - Si vous avez modifié `main.ts`, il faut redémarrer

2. **Videz le cache du navigateur** :
   - `Ctrl + Shift + R` (hard refresh)
   - Ou testez en navigation privée (`Ctrl + Shift + N`)

3. **Vérifiez les logs du backend** :
   - Quand vous essayez de vous connecter, vous devriez voir :
     ```
     POST /api/v1/auth/login
     ```
   - Si vous ne voyez rien, le backend ne reçoit pas les requêtes

## 🔍 Configuration CORS actuelle

En développement, le backend autorise **TOUTES les origines** (`origin: true`), ce qui inclut :
- ✅ `http://localhost:8081` (Expo web)
- ✅ `http://127.0.0.1:8081` (Expo web alternative)
- ✅ Toutes les autres origines

Un middleware explicite gère aussi les requêtes OPTIONS (preflight).




