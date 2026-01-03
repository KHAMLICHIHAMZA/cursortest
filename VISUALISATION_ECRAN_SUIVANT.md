# 📱 Visualisation de l'Écran Suivant - Planning des Tâches

## 🎯 Écran des Réservations avec Planning Amélioré

Après la connexion, vous verrez cet écran :

---

## 📊 Structure de l'Écran

### 1. Résumé des Tâches (En Haut)

```
┌─────────────────────────────────────────────────────┐
│  📋 3 tâches à effectuer                            │
│  (2 livraisons, 1 récupération)                    │
└─────────────────────────────────────────────────────┘
```

**Style** :
- Fond bleu clair (#E3F2FD)
- Bordure bleue à gauche (4px)
- Texte bleu foncé (#1976D2)
- Police : 14px, gras

---

### 2. Carte de Réservation avec Tâche "Livraison"

```
┌─────────────────────────────────────────────────────┐
│  #ABC12345    [📦 Livraison]          [Confirmée]    │
│  ─────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────┐  │
│  │ 📅 Livraison : 27/12/2024 10:00              │  │
│  │ 🚙 AB-123-CD - Peugeot 208                   │  │
│  │ 👤 Sophie Bernard                            │  │
│  └──────────────────────────────────────────────┘  │
│  ─────────────────────────────────────────────────  │
│  27/12/2024 - 30/12/2024                            │
│  135.00 MAD                                         │
└─────────────────────────────────────────────────────┘
```

**Éléments** :
- **Bordure bleue** à gauche (4px) pour indiquer une tâche
- **Badge "Livraison"** : Vert (#4CAF50) avec icône 📦
- **Badge "Confirmée"** : Bleu (#007AFF)
- **Informations de tâche** : Fond gris clair (#F5F5F5)
  - Date/heure en bleu (#1976D2)
  - Véhicule en gris (#666)
  - Client en gris (#666)

---

### 3. Carte de Réservation avec Tâche "Récupération"

```
┌─────────────────────────────────────────────────────┐
│  #DEF67890    [🚗 Récupération]      [Active]       │
│  ─────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────┐  │
│  │ 📅 Récupération : 30/12/2024 18:00           │  │
│  │ 🚙 EF-456-GH - Renault Clio                  │  │
│  │ 👤 Marc Dubois                               │  │
│  └──────────────────────────────────────────────┘  │
│  ─────────────────────────────────────────────────  │
│  25/12/2024 - 30/12/2024                            │
│  210.00 MAD                                         │
└─────────────────────────────────────────────────────┘
```

**Éléments** :
- **Bordure bleue** à gauche (4px) pour indiquer une tâche
- **Badge "Récupération"** : Orange (#FF9800) avec icône 🚗
- **Badge "Active"** : Vert (#34C759)
- **Informations de tâche** : Fond gris clair (#F5F5F5)

---

### 4. Carte de Réservation sans Tâche

```
┌─────────────────────────────────────────────────────┐
│  #GHI90123                          [Terminée]      │
│  ─────────────────────────────────────────────────  │
│  20/12/2024 - 23/12/2024                            │
│  152.00 MAD                                         │
└─────────────────────────────────────────────────────┘
```

**Éléments** :
- **Pas de bordure bleue** (pas de tâche)
- **Pas de badge de tâche**
- **Pas d'informations de tâche**
- **Badge "Terminée"** : Gris (#8E8E93)

---

## 🎨 Codes Couleurs

### Badges de Statut
- **En attente** : Orange (#FFA500)
- **Confirmée** : Bleu (#007AFF)
- **Active** : Vert (#34C759)
- **Terminée** : Gris (#8E8E93)
- **Annulée** : Rouge (#FF3B30)

### Badges de Tâches
- **Livraison** : Vert (#4CAF50)
- **Récupération** : Orange (#FF9800)

### Bordures
- **Booking avec tâche** : Bleu (#2196F3), 4px à gauche
- **Booking sans tâche** : Pas de bordure spéciale

---

## 📋 Logique d'Affichage

### Tâches Dérivées

Les tâches sont **calculées automatiquement** depuis les bookings :

1. **Booking CONFIRMED** → Tâche "Livraison / Check-in"
   - Badge vert "📦 Livraison"
   - Date : `startDate` du booking
   - Action : Permet de faire le check-in

2. **Booking ACTIVE** → Tâche "Récupération / Check-out"
   - Badge orange "🚗 Récupération"
   - Date : `endDate` du booking
   - Action : Permet de faire le check-out

3. **Booking COMPLETED / CANCELLED** → Aucune tâche
   - Pas de badge de tâche
   - Pas de bordure bleue
   - Affichage normal

---

## 🔍 Détails Techniques

### Calcul des Tâches

```typescript
// Les tâches sont calculées via getAgentTasks()
const agentTasks = useMemo(() => {
  if (!bookings) return [];
  return getAgentTasks(bookings);
}, [bookings]);
```

### Affichage Conditionnel

```typescript
// Vérifier si un booking génère une tâche
const task = getTaskForBooking(booking.id);
const isTask = task !== undefined;

// Afficher les informations de tâche si présente
{isTask && (
  <View style={styles.taskInfo}>
    <Text style={styles.taskDate}>
      📅 {task.type === 'CHECK_IN' ? 'Livraison' : 'Récupération'} : ...
    </Text>
    ...
  </View>
)}
```

---

## ✅ Checklist de Vérification

Après connexion, vérifiez :

- [ ] Le résumé des tâches s'affiche en haut
- [ ] Les bookings CONFIRMED ont un badge "📦 Livraison"
- [ ] Les bookings ACTIVE ont un badge "🚗 Récupération"
- [ ] Les bookings avec tâches ont une bordure bleue à gauche
- [ ] Les informations de tâche (date, véhicule, client) s'affichent
- [ ] Les bookings COMPLETED/CANCELLED n'ont pas de badge de tâche
- [ ] Le compteur de tâches est correct

---

**Note** : Les tâches sont **dérivées** des bookings, jamais persistées en base. Elles sont calculées à la volée pour l'affichage.




