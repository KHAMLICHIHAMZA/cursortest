# 🔗 Alignement Application Mobile Agent - Spécifications Fonctionnelles

## 📋 Vue d'Ensemble

Ce document fait le lien entre les **spécifications fonctionnelles MALOC** (`SPECIFICATIONS_FONCTIONNELLES.md`) et l'**application mobile Agent** existante.

Il garantit que l'implémentation actuelle est conforme aux règles fondamentales et identifie les points d'attention pour les évolutions futures.

---

## ✅ Conformité Actuelle

### 1. Positionnement : Outil d'Exécution Terrain ✅

**Spécification** : L'app Agent est un outil d'EXÉCUTION TERRAIN, pas un outil de pilotage.

**Implémentation actuelle** :
- ✅ L'app permet uniquement l'exécution des tâches (check-in / check-out)
- ✅ Pas d'accès aux charges, amendes, flotte globale
- ✅ Focus sur les actions terrain

**Fichiers concernés** :
- `src/screens/CheckInScreen.tsx`
- `src/screens/CheckOutScreen.tsx`
- `src/screens/BookingsScreen.tsx`

### 2. Planning Agent Dérivé ✅

**Spécification** : Le planning des tâches agents est dérivé des réservations existantes. Aucune entité Task persistée en base.

**Implémentation actuelle** :
- ✅ Les tâches sont calculées depuis les bookings
- ✅ Logique : `CONFIRMED` → tâche "Check-in", `ACTIVE` → tâche "Check-out"
- ✅ Aucune table Task en base de données

**Fichiers concernés** :
- `src/screens/BookingsScreen.tsx` : Filtre et affiche les bookings par statut
- `src/services/booking.service.ts` : Récupération bookings depuis API

**Code actuel** :
```typescript
// BookingsScreen.tsx
const { data: bookings } = useQuery({
  queryKey: ['bookings', agencyId],
  queryFn: () => bookingService.getBookings(agencyId),
});

// Les tâches sont dérivées visuellement :
// - Booking CONFIRMED → Bouton "Check-in"
// - Booking ACTIVE → Bouton "Check-out"
```

### 3. Vue Agent Limitée ✅

**Spécification** : L'agent voit uniquement ses tâches avec infos minimales nécessaires.

**Implémentation actuelle** :
- ✅ Affichage bookings avec infos minimales (véhicule, client, dates)
- ✅ Pas d'accès aux charges
- ✅ Pas d'accès aux amendes
- ✅ Pas de vue flotte globale

**Fichiers concernés** :
- `src/screens/BookingsScreen.tsx` : Liste simplifiée
- `src/screens/BookingDetailsScreen.tsx` : Détails limités à l'exécution

### 4. Offline Conservé ✅

**Spécification** : Le fonctionnement offline existant est conservé. Aucune régression tolérée.

**Implémentation actuelle** :
- ✅ Queue SQLite pour actions offline
- ✅ Synchronisation automatique
- ✅ Check-in/check-out fonctionnent offline
- ✅ Photos et signatures stockées localement

**Fichiers concernés** :
- `src/services/offline.service.ts` : Queue SQLite
- `src/services/sync.service.ts` : Synchronisation
- `src/services/booking.service.ts` : Gestion offline/online

### 5. Aucune Logique Métier Lourde ✅

**Spécification** : Aucune logique métier lourde côté mobile.

**Implémentation actuelle** :
- ✅ Validation Zod côté client (format uniquement)
- ✅ Toute logique métier dans le backend
- ✅ Le mobile fait des appels API et affiche les résultats

**Fichiers concernés** :
- `src/services/booking.service.ts` : Appels API uniquement
- `src/services/auth.service.ts` : Appels API uniquement

### 6. Création Booking Conditionnelle ✅

**Spécification** : Création booking autorisée UNIQUEMENT pour AGENCY_MANAGER.

**Implémentation actuelle** :
- ✅ Vérification rôle dans `CreateBookingScreen`
- ✅ Bouton création visible uniquement si MANAGER

**Fichiers concernés** :
- `src/screens/CreateBookingScreen.tsx`
- `src/navigation/AppStack.tsx` : Condition d'affichage

---

## ⚠️ Points d'Attention

### 1. Calcul Tâches : À Améliorer

**Spécification** : Les tâches doivent être calculées à la volée depuis les bookings.

**État actuel** :
- ✅ Les bookings sont récupérés depuis l'API
- ⚠️ Pas de vue "Planning Tâches" dédiée
- ⚠️ Les tâches sont implicites (boutons Check-in/Check-out)

**Recommandation** :
Créer une vue "Planning" qui affiche explicitement les tâches dérivées :

```typescript
// Exemple de fonction à ajouter
function getAgentTasks(bookings: Booking[]): Task[] {
  return bookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'ACTIVE')
    .map(b => ({
      id: b.id,
      type: b.status === 'CONFIRMED' ? 'CHECK_IN' : 'CHECK_OUT',
      bookingId: b.id,
      vehicle: b.vehicle,
      client: b.client,
      date: b.status === 'CONFIRMED' ? b.startDate : b.endDate,
      location: b.pickupLocation || b.returnLocation,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
```

**Fichiers à modifier** :
- `src/screens/BookingsScreen.tsx` : Ajouter vue "Planning" ou transformer vue actuelle

### 2. Informations Minimales Client

**Spécification** : L'agent voit uniquement les infos minimales nécessaires à l'exécution.

**État actuel** :
- ✅ `BookingDetailsScreen` affiche nom, téléphone, email
- ✅ Boutons appel/WhatsApp pour contacter
- ✅ Pas d'historique complet client

**Conformité** : ✅ OK

### 3. Pas de Persistance Tâches

**Spécification** : Aucune entité Task persistée en base.

**État actuel** :
- ✅ Aucune table Task en base
- ✅ Les tâches sont dérivées des bookings
- ✅ Queue offline contient uniquement les actions (check-in/check-out)

**Conformité** : ✅ OK

---

## 🔄 Évolutions Futures Conformes

### 1. Notifications Push

**Spécification** : Notifications push pour Agent / Client.

**Impact sur l'app mobile** :
- Ajout service notifications (`src/services/notification.service.ts`)
- Écoute notifications push
- Affichage dans l'app
- **Pas de logique métier** : Le backend envoie, le mobile affiche

**Fichiers à créer/modifier** :
- `src/services/notification.service.ts` (nouveau)
- `App.tsx` : Initialisation notifications

### 2. Amélioration Planning Tâches

**Spécification** : Planning des tâches agents dérivé des bookings.

**Évolution possible** :
- Vue "Planning" dédiée avec calendrier
- Filtres par date, type de tâche
- **Toujours dérivé des bookings**, jamais persisté

**Fichiers à créer/modifier** :
- `src/screens/TasksScreen.tsx` (nouveau, optionnel)
- `src/screens/BookingsScreen.tsx` : Améliorer vue planning

### 3. Optimisations UX

**Spécification** : Optimisations UX / performance.

**Évolutions possibles** :
- Amélioration chargement liste bookings
- Cache local amélioré
- Animations fluides
- **Sans changer la logique métier**

---

## 🚫 Évolutions Interdites

### ❌ Ne PAS Ajouter

1. **Module Charges dans l'app Agent**
   - Spécification : Agent ne voit pas les charges
   - ❌ Ne pas ajouter d'écran "Charges"

2. **Module Amendes dans l'app Agent**
   - Spécification : Agent ne voit pas les amendes
   - ❌ Ne pas ajouter d'écran "Amendes"

3. **Vue Flotte Globale**
   - Spécification : Agent ne voit pas la flotte globale
   - ❌ Ne pas ajouter d'écran "Flotte"

4. **Persistance Tâches**
   - Spécification : Aucune entité Task persistée
   - ❌ Ne pas créer de table Task en base
   - ❌ Ne pas stocker les tâches dans SQLite

5. **Logique Métier Complexe**
   - Spécification : Aucune logique métier lourde côté mobile
   - ❌ Ne pas calculer les prix côté mobile
   - ❌ Ne pas valider les règles métier complexes côté mobile

---

## 📝 Checklist de Conformité pour Évolutions

Avant toute modification de l'app mobile Agent, vérifier :

- [ ] La modification respecte-t-elle "outil d'exécution terrain" ?
- [ ] Y a-t-il ajout de logique métier lourde ?
- [ ] Les tâches restent-elles dérivées (non persistées) ?
- [ ] L'agent ne voit-il pas ce qu'il ne doit pas voir ?
- [ ] Le mode offline fonctionne-t-il toujours ?
- [ ] Y a-t-il duplication de données ?
- [ ] La modification est-elle backward compatible ?

---

## 🔗 Liens vers Documentation

- **Spécifications Fonctionnelles** : `../SPECIFICATIONS_FONCTIONNELLES.md`
- **Documentation Technique Mobile** : `DOCUMENTATION_COMPLETE.md`
- **README Mobile** : `README.md`

---

**Date de création** : 2024  
**Version** : 1.0.0  
**Statut** : Document de référence pour évolutions




