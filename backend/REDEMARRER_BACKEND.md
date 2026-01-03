# 🔄 Redémarrer le backend pour corriger CORS

## ⚠️ IMPORTANT : Redémarrage requis

Les modifications de la configuration CORS nécessitent un **redémarrage complet** du backend.

## 📋 Étapes pour redémarrer

### 1. Arrêter le backend actuel
Dans le terminal où le backend tourne :
- Appuyez sur **`Ctrl + C`** pour arrêter le serveur

### 2. Redémarrer le backend
```bash
cd backend
npm run start:dev
```

### 3. Vérifier que le backend est démarré
Vous devriez voir :
```
🚀 MalocAuto Backend running on port 3000
📚 API Documentation: http://localhost:3000/api/docs
```

## ✅ Après le redémarrage

1. **Rechargez la page web** (F5 ou Ctrl+R)
2. **Essayez de vous connecter** avec :
   - Email : `agent1@autolocation.fr`
   - Mot de passe : `agent123`

## 🔍 Vérification

Si l'erreur CORS persiste après le redémarrage :

1. **Vérifiez que le backend est bien démarré** :
   - Ouvrez `http://localhost:3000/api/docs` dans votre navigateur
   - Vous devriez voir la documentation Swagger

2. **Vérifiez les logs du backend** :
   - Quand vous essayez de vous connecter, vous devriez voir des logs dans le terminal du backend
   - Si vous ne voyez rien, le backend ne reçoit pas les requêtes

3. **Vérifiez l'URL de l'API** :
   - Dans la console du navigateur (F12), vérifiez l'URL exacte de la requête
   - Elle doit être `http://localhost:3000/api/v1/auth/login`

## 🆘 Si ça ne marche toujours pas

Vérifiez que `NODE_ENV` n'est pas défini à `production` :
```bash
echo $env:NODE_ENV
```

Si c'est `production`, définissez-le à `development` :
```bash
$env:NODE_ENV = "development"
npm run start:dev
```




