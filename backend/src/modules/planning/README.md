# Module Planning - Source de Vérité Absolue

## 🎯 Rôle

Le PlanningService est la **source de vérité unique** pour la disponibilité des véhicules. Aucun booking ne peut contourner le planning.

## 🔑 Fonctionnalités

### 1. Calcul de Disponibilité (`getVehicleAvailability`)
- Vérifie les bookings actifs
- Vérifie les maintenances
- Vérifie les événements de planning (blocages, temps de préparation)
- Vérifie le statut du véhicule
- Retourne `true` uniquement si le véhicule est vraiment disponible

### 2. Détection de Conflits (`detectConflicts`)
- Détecte tous les conflits dans une période donnée
- Retourne la liste des conflits avec type, ID, dates
- Utilisé pour afficher les raisons d'indisponibilité

### 3. Prochaine Disponibilité (`getNextAvailability`)
- Calcule la prochaine date réelle de disponibilité
- Prend en compte tous les blocages
- Retourne `null` si aucune disponibilité prévue

### 4. Temps de Préparation (`createPreparationTime`)
- Créé automatiquement après chaque retour de véhicule
- **1h standard** si retour à l'heure
- **2h si retard** (isLate = true)
- Bloque le planning pendant cette période
- Visible agence, invisible client

### 5. Gestion des Événements
- `createBookingEvent` : Créer événement pour un booking
- `createMaintenanceEvent` : Créer événement pour une maintenance
- `deleteBookingEvents` : Supprimer événements d'un booking
- `deleteMaintenanceEvents` : Supprimer événements d'une maintenance

## 📋 Intégration avec BookingService

Le BookingService utilise le PlanningService pour :
- ✅ Vérifier la disponibilité avant création
- ✅ Détecter les conflits avant modification
- ✅ Créer automatiquement les événements de planning
- ✅ Créer le temps de préparation après retour

## 🚫 Règles Métier Strictes

1. **Aucun booking sans vérification de disponibilité**
2. **Temps de préparation automatique après retour**
3. **Tous les conflits sont détectés et signalés**
4. **Le planning est la seule source de vérité**

## 📡 Endpoints API

- `GET /api/planning` - Données du planning
- `POST /api/planning/check-availability` - Vérifier disponibilité
- `GET /api/planning/next-availability/:vehicleId` - Prochaine disponibilité
- `POST /api/planning/preparation-time` - Créer temps de préparation





