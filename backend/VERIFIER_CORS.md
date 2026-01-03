# 🔍 Vérification CORS

## ⚠️ IMPORTANT : Redémarrage obligatoire

Après modification de `main.ts`, vous **DEVEZ** redémarrer le backend :

1. **Arrêter le backend** : `Ctrl + C` dans le terminal
2. **Redémarrer** : `npm run start:dev`

## ✅ Vérification que le backend est démarré

Vous devriez voir dans le terminal :
```
🚀 MalocAuto Backend running on port 3000
```

## 🧪 Test rapide

Ouvrez dans votre navigateur :
```
http://localhost:3000/api/docs
```

Si vous voyez la documentation Swagger, le backend est bien démarré.

## 🔧 Configuration CORS actuelle

En **développement**, la configuration autorise **TOUTES les origines** (`origin: true`).

Cela inclut :
- ✅ `http://localhost:8081` (Expo web)
- ✅ `http://127.0.0.1:8081` (Expo web alternative)
- ✅ `http://localhost:3001` (Frontend web)
- ✅ `http://192.168.x.x:8081` (Mobile sur réseau local)
- ✅ Toutes les autres origines en développement

## 🐛 Si l'erreur persiste

1. **Vérifiez que le backend est bien redémarré** :
   - Regardez la date/heure de démarrage dans les logs
   - Si vous avez modifié `main.ts`, il faut redémarrer

2. **Vérifiez NODE_ENV** :
   ```powershell
   echo $env:NODE_ENV
   ```
   Si c'est `production`, définissez-le à `development` :
   ```powershell
   $env:NODE_ENV = "development"
   npm run start:dev
   ```

3. **Videz le cache du navigateur** :
   - Appuyez sur `Ctrl + Shift + R` (hard refresh)
   - Ou ouvrez en navigation privée

4. **Vérifiez les logs du backend** :
   - Quand vous essayez de vous connecter, vous devriez voir des logs dans le terminal du backend
   - Si vous ne voyez rien, le backend ne reçoit pas les requêtes




