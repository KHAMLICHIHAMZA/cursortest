# 📱 Comment Afficher l'Écran Suivant (Liste des Réservations avec Planning)

## 🎯 Objectif

Afficher l'écran des réservations avec le **planning des tâches amélioré** après la connexion.

---

## ✅ Méthode 1 : Connexion Manuelle (Recommandé)

### Étapes :

1. **Ouvrez** `http://localhost:8081` dans votre navigateur
2. **Saisissez** :
   - Email : `agent1@autolocation.fr`
   - Mot de passe : `agent123`
3. **Cliquez** sur "Connexion"
4. **Vous verrez** :
   - ✅ Liste des réservations
   - ✅ **Résumé des tâches** en haut : "📋 X tâches à effectuer (Y livraisons, Z récupérations)"
   - ✅ **Badges de tâches** sur chaque réservation :
     - 📦 **Livraison** (vert) pour les bookings CONFIRMED
     - 🚗 **Récupération** (orange) pour les bookings ACTIVE
   - ✅ **Informations détaillées** pour chaque tâche :
     - 📅 Date et heure de la tâche
     - 🚙 Véhicule (immatriculation, marque, modèle)
     - 👤 Client (nom)

---

## ✅ Méthode 2 : Script JavaScript Direct

Si la connexion manuelle ne fonctionne pas, exécutez ce script dans la **console du navigateur** (F12) :

```javascript
// 1. Se connecter directement à l'API
async function connecterEtAfficher() {
  try {
    console.log('🔐 Connexion en cours...');
    
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'agent1@autolocation.fr',
        password: 'agent123'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Connexion réussie!', data);
    
    // 2. Stocker les données dans localStorage
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    localStorage.setItem('agencies_data', JSON.stringify(data.agencies || []));
    localStorage.setItem('permissions_data', JSON.stringify(data.permissions || []));
    localStorage.setItem('modules_data', JSON.stringify(data.modules || []));
    
    console.log('✅ Données stockées dans localStorage');
    console.log('🔄 Rechargement de la page...');
    
    // 3. Recharger la page pour voir l'écran suivant
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('Erreur de connexion: ' + error.message);
  }
}

// Exécuter
connecterEtAfficher();
```

**Instructions** :
1. Ouvrez `http://localhost:8081`
2. Appuyez sur **F12** pour ouvrir la console
3. Collez le script ci-dessus
4. Appuyez sur **Entrée**
5. La page se rechargera et vous verrez l'écran des réservations

---

## 📸 Ce que vous devriez voir

### Écran des Réservations avec Planning Amélioré

```
┌─────────────────────────────────────────┐
│  📋 3 tâches à effectuer                │
│  (2 livraisons, 1 récupération)        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  #ABC12345    [📦 Livraison] [Confirmée]│
│  ─────────────────────────────────────  │
│  📅 Livraison : 27/12/2024 10:00        │
│  🚙 AB-123-CD - Peugeot 208             │
│  👤 Sophie Bernard                      │
│  ─────────────────────────────────────  │
│  27/12/2024 - 30/12/2024                │
│  135.00 MAD                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  #DEF67890    [🚗 Récupération] [Active]│
│  ─────────────────────────────────────  │
│  📅 Récupération : 30/12/2024 18:00     │
│  🚙 EF-456-GH - Renault Clio            │
│  👤 Marc Dubois                         │
│  ─────────────────────────────────────  │
│  25/12/2024 - 30/12/2024                │
│  210.00 MAD                             │
└─────────────────────────────────────────┘
```

---

## 🎨 Améliorations Visuelles

### 1. Résumé des Tâches (En Haut)
- **Couleur** : Bleu clair (#E3F2FD)
- **Bordure** : Bleue à gauche
- **Texte** : "📋 X tâches à effectuer (Y livraisons, Z récupérations)"

### 2. Badges de Tâches
- **Livraison** : Badge vert (#4CAF50) avec "📦 Livraison"
- **Récupération** : Badge orange (#FF9800) avec "🚗 Récupération"

### 3. Informations de Tâche
- **Conteneur** : Fond gris clair (#F5F5F5)
- **Date** : Bleu (#1976D2), format français
- **Véhicule** : Gris (#666)
- **Client** : Gris (#666)

### 4. Bordure Bleue
- Les bookings avec tâches ont une **bordure bleue** à gauche (4px)

---

## 🔍 Vérification

### Si vous voyez l'écran de login :
- ✅ L'application fonctionne
- ⚠️ Vous n'êtes pas connecté
- → Utilisez la **Méthode 1** ou **Méthode 2** ci-dessus

### Si vous voyez la liste des réservations :
- ✅ Vous êtes connecté
- ✅ L'application fonctionne
- ✅ Le planning des tâches devrait être visible

### Si vous ne voyez rien :
- ⚠️ Vérifiez que le backend est démarré : `http://localhost:3000/api/docs`
- ⚠️ Vérifiez que l'application mobile est démarrée : `http://localhost:8081`
- ⚠️ Vérifiez la console du navigateur (F12) pour les erreurs

---

## 📝 Fichiers Modifiés

- ✅ `mobile-agent/src/screens/BookingsScreen.tsx` : Planning amélioré
- ✅ `mobile-agent/src/screens/LoginScreen.tsx` : Logs de debug
- ✅ `mobile-agent/test-login-direct.js` : Script de test

---

**Note** : Le navigateur automatisé a des limitations avec React Native Web. Utilisez une des méthodes ci-dessus pour voir l'écran suivant.




