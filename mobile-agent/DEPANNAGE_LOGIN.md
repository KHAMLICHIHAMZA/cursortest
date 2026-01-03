# 🔧 Dépannage - Problèmes de connexion après seed

## ✅ Vérifications effectuées

Les utilisateurs et mots de passe sont corrects dans la base de données :
- ✅ `agent1@autolocation.fr` / `agent123` - Mot de passe correct
- ✅ `manager1@autolocation.fr` / `manager123` - Mot de passe correct  
- ✅ `admin@autolocation.fr` / `admin123` - Mot de passe correct

La company et les modules sont correctement configurés :
- ✅ Company: AutoLocation Premium (ACTIVE)
- ✅ Modules: VEHICLES, BOOKINGS, INVOICES, MAINTENANCE (tous actifs)
- ✅ Agences: Agence Paris Centre, Agence Paris Nord (toutes actives)

## 🔍 Diagnostic

Si la connexion ne fonctionne pas, vérifiez les points suivants :

### 1. Backend démarré ?

Vérifiez que le backend est bien démarré :
```bash
cd backend
npm run start:dev
```

Vous devriez voir :
```
[Nest] Application successfully started on port 3000
```

### 2. URL de l'API correcte ?

Vérifiez dans `mobile-agent/src/config/api.ts` que l'URL pointe vers votre backend :
- **Local** : `http://localhost:3000/api/v1` (pour émulateur/simulateur)
- **Réseau local** : `http://192.168.1.99:3000/api/v1` (pour iPhone physique)
- **Tunnel** : `https://votre-url.exp.direct/api/v1` (si vous utilisez un tunnel)

### 3. CORS configuré ?

Vérifiez que le backend autorise les requêtes depuis votre application mobile dans `backend/src/main.ts` :
```typescript
app.enableCors({
  origin: true, // En développement, autorise toutes les origines
  credentials: true,
});
```

### 4. Backend accessible depuis le mobile ?

Si vous testez sur un iPhone physique :
- Le backend doit écouter sur `0.0.0.0` et non `localhost`
- Vérifiez dans `backend/src/main.ts` :
  ```typescript
  await app.listen(port, '0.0.0.0');
  ```

### 5. Erreur dans la console ?

Ouvrez la console de l'application mobile et vérifiez les erreurs :
- **Sur web** : Ouvrez les DevTools (F12) → Console
- **Sur iOS** : Xcode → Console
- **Sur Android** : `adb logcat` ou React Native Debugger

### 6. Stockage local (localStorage/SecureStore) ?

Si vous testez sur le web, vérifiez que `localStorage` fonctionne :
- Ouvrez la console du navigateur
- Tapez : `localStorage.getItem('auth_token')`
- Si cela retourne `null`, le token n'est pas stocké

### 7. Réinitialiser le stockage

Si le problème persiste, réinitialisez le stockage :
- **Sur web** : Ouvrez la console et tapez `localStorage.clear()`
- **Sur mobile** : Désinstallez et réinstallez l'application

## 🧪 Test manuel de l'API

Testez directement l'API avec curl ou Postman :

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent1@autolocation.fr","password":"agent123"}'
```

Vous devriez recevoir :
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": { ... },
  "agencies": [ ... ],
  "permissions": [ ... ],
  "modules": [ ... ]
}
```

## 🔄 Solutions rapides

### Solution 1 : Redémarrer le backend
```bash
cd backend
# Arrêter le serveur (Ctrl+C)
npm run start:dev
```

### Solution 2 : Vérifier les logs du backend
Regardez les logs du backend quand vous essayez de vous connecter. Vous devriez voir :
- La requête POST `/auth/login`
- Le résultat (succès ou erreur)

### Solution 3 : Vérifier les erreurs réseau
Dans la console du navigateur (si vous testez sur web), vérifiez l'onglet "Network" :
- La requête vers `/auth/login` est-elle envoyée ?
- Quelle est la réponse (200, 401, 500, etc.) ?

### Solution 4 : Re-exécuter le seed
Si vous avez modifié la base de données, ré-exécutez le seed :
```bash
cd backend
npx prisma db seed
```

## 📝 Logs à vérifier

### Backend (terminal)
```
POST /api/v1/auth/login
[AuthService] Login attempt: agent1@autolocation.fr
[AuthService] Login successful: agent1@autolocation.fr
```

### Mobile (console)
```
📋 Agences disponibles: [...]
📦 Réservations récupérées: X
```

## 🆘 Si rien ne fonctionne

1. **Vérifiez que le backend est accessible** :
   - Ouvrez `http://localhost:3000/api/v1` dans votre navigateur
   - Vous devriez voir une réponse (même si c'est une erreur 404)

2. **Vérifiez les credentials** :
   - Utilisez exactement : `agent1@autolocation.fr` / `agent123`
   - Pas d'espaces avant/après

3. **Vérifiez la version de la base de données** :
   ```bash
   cd backend
   npx prisma db push
   ```

4. **Contactez le support** avec :
   - Les logs du backend
   - Les logs de l'application mobile
   - Le message d'erreur exact




