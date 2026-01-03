# 🔍 Problème : Aucune réservation affichée

## Diagnostic

Si vous ne voyez aucune réservation dans l'application mobile, voici les causes possibles et les solutions :

## ✅ Vérifications à faire

### 1. **Vérifier que les réservations existent dans la base de données**

Exécutez le script de vérification :
```bash
cd backend
npx tsx scripts/check-bookings.ts
```

Ce script affichera :
- Les agences de l'utilisateur `agent1@autolocation.fr`
- Toutes les réservations dans la base de données
- Les réservations accessibles par l'utilisateur

### 2. **Vérifier que l'utilisateur a bien des agences**

L'utilisateur `agent1@autolocation.fr` doit être associé à au moins une agence :
- **Agence attendue** : "Agence Paris Centre"
- **ID de l'agence** : Vérifié dans le script `check-bookings.ts`

### 3. **Vérifier que les réservations sont dans la bonne agence**

Les réservations doivent être créées pour l'agence "Agence Paris Centre" (ID: `cmjlrja450005z5jnsctyvi9r`).

## 🔧 Solutions

### Solution 1 : Recréer les réservations de test

Si les réservations n'existent pas ou sont dans la mauvaise agence :

```bash
cd backend
npx tsx scripts/add-test-bookings.ts
```

Ce script crée 4 réservations de test :
- 1 PENDING (à confirmer)
- 1 CONFIRMED (prête pour check-in)
- 1 IN_PROGRESS (prête pour check-out)
- 1 RETURNED (historique)

### Solution 2 : Vérifier les logs de l'application

Dans l'application mobile, ouvrez la console (logs) et vérifiez :
- `📋 Agences disponibles:` - Doit afficher au moins une agence
- `📋 Agence utilisée pour filtrer:` - Doit afficher un ID d'agence
- `📦 Réservations récupérées:` - Affiche le nombre de réservations

### Solution 3 : Vérifier la connexion API

1. **Vérifier que le backend est démarré** :
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Tester l'API directement** :
   - Connectez-vous avec `agent1@autolocation.fr` / `agent123`
   - Testez : `GET /api/v1/bookings`
   - Vérifiez que les réservations sont retournées

### Solution 4 : Vérifier les filtres backend

Le backend filtre les réservations par :
- `user.agencyIds` du token JWT (agences de l'utilisateur)
- `deletedAt: null` (pas de soft delete)

Si l'`agencyId` envoyé en paramètre n'est pas dans `user.agencyIds`, le backend retourne un tableau vide.

## 🐛 Debug ajouté

J'ai ajouté des logs de debug dans `BookingsScreen.tsx` :
- Affiche les agences disponibles
- Affiche l'agence utilisée pour filtrer
- Affiche le nombre de réservations récupérées

**Pour voir les logs** :
- Sur iOS : Ouvrez la console Xcode ou les logs Expo
- Sur Android : Utilisez `adb logcat` ou les logs Expo

## 📝 Notes importantes

1. **Les réservations sont filtrées par agence** : Seules les réservations de l'agence de l'utilisateur sont affichées
2. **Le backend utilise `user.agencyIds` du token JWT** : Assurez-vous que le token contient bien les agences
3. **Les réservations supprimées (soft delete) ne sont pas affichées** : Vérifiez que `deletedAt` est `null`

## 🔄 Si le problème persiste

1. **Déconnectez-vous et reconnectez-vous** pour rafraîchir le token JWT
2. **Vérifiez les logs du backend** pour voir si les requêtes arrivent
3. **Vérifiez les logs de l'application mobile** pour voir les réponses de l'API
4. **Exécutez le script de vérification** pour confirmer que les données existent




