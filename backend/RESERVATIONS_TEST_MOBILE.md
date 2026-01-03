# 📱 Réservations de Test pour Mobile

**Date de création** : $(date)  
**Statut** : ✅ Créées avec succès

---

## ✅ Réservations créées

### 1. Réservation PENDING
- **Client** : Sophie Bernard
- **Véhicule** : Peugeot 208 (AB-123-CD)
- **Dates** : 26/12/2025 → 28/12/2025
- **Prix** : 450 MAD
- **Statut** : PENDING
- **Usage** : Test de confirmation de réservation

### 2. Réservation CONFIRMED
- **Client** : Sophie Bernard
- **Véhicule** : Renault Clio (EF-456-GH)
- **Dates** : 26/12/2025 → 30/12/2025
- **Prix** : 750 MAD
- **Statut** : CONFIRMED
- **Usage** : Test de check-in (prête pour check-in)

### 3. Réservation IN_PROGRESS
- **Client** : Sophie Bernard
- **Véhicule** : Peugeot 208 (AB-123-CD)
- **Dates** : 24/12/2025 → 30/12/2025
- **Prix** : 900 MAD
- **Statut** : IN_PROGRESS
- **Usage** : Test de check-out (en cours, prête pour check-out)

### 4. Réservation RETURNED
- **Client** : Sophie Bernard
- **Véhicule** : Renault Clio (EF-456-GH)
- **Dates** : 18/12/2025 → 22/12/2025
- **Prix** : 600 MAD
- **Statut** : RETURNED
- **Usage** : Test d'historique (réservation terminée)

---

## 🧪 Tests possibles avec ces réservations

### ✅ Affichage de la liste
- Voir toutes les réservations dans la liste
- Vérifier l'affichage des différents statuts
- Vérifier les dates et prix

### ✅ Filtrage par statut
- Filtrer par PENDING
- Filtrer par CONFIRMED
- Filtrer par IN_PROGRESS
- Filtrer par RETURNED

### ✅ Check-in
- Utiliser la réservation **CONFIRMED** (#2)
- Tester le formulaire de check-in complet
- Vérifier le changement de statut vers IN_PROGRESS

### ✅ Check-out
- Utiliser la réservation **IN_PROGRESS** (#3)
- Tester le formulaire de check-out complet
- Vérifier le changement de statut vers RETURNED

### ✅ Détails d'une réservation
- Cliquer sur chaque réservation
- Vérifier l'affichage des détails
- Vérifier les informations client/véhicule

### ✅ Historique
- Voir la réservation **RETURNED** (#4)
- Vérifier l'affichage des réservations terminées

---

## 🔄 Relancer le script

Pour recréer les réservations (après suppression ou modification) :

```bash
cd backend
npx ts-node scripts/add-test-bookings.ts
```

---

## 📝 Notes

- Les réservations utilisent les véhicules et clients existants du seed
- Si moins de 4 véhicules/clients sont disponibles, le script réutilise ceux disponibles
- Les dates sont calculées dynamiquement (aujourd'hui, demain, hier, etc.)
- Les statuts des véhicules sont mis à jour automatiquement (RENTED pour IN_PROGRESS, AVAILABLE pour RETURNED)

---

**✅ Prêt pour les tests mobile !**




