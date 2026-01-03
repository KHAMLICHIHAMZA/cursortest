# 📋 Tâches et Actions Disponibles pour un Agent

## 🎯 Vue d'Ensemble

L'application mobile Agent est un **outil d'EXÉCUTION TERRAIN** qui permet à un agent de gérer les opérations de livraison et récupération de véhicules.

---

## ✅ Tâches Actuelles (Dérivées des Bookings)

### 1. 📦 **Livraison / Check-in** (`CHECK_IN`)

**Quand** : Booking avec statut `CONFIRMED`  
**Date** : Date de début de la réservation (`startDate`)

**Actions possibles** :
- ✅ Vérifier l'état du véhicule (kilométrage, carburant)
- ✅ Prendre des photos du véhicule (minimum 4 photos)
- ✅ Documenter les dommages existants (zones, types, sévérité)
- ✅ Prendre une photo du permis de conduire du client
- ✅ Vérifier la date d'expiration du permis
- ✅ Prendre une photo de la pièce d'identité (optionnel)
- ✅ Faire signer le contrat de location (signature électronique)
- ✅ Collecter la caution (si nécessaire)
- ✅ Ajouter des notes de livraison
- ✅ Confirmer l'état d'extraction (OK / À vérifier)

**Écran** : `CheckInScreen.tsx`

---

### 2. 🚗 **Récupération / Check-out** (`CHECK_OUT`)

**Quand** : Booking avec statut `ACTIVE`  
**Date** : Date de fin de la réservation (`endDate`)

**Actions possibles** :
- ✅ Vérifier le kilométrage final (doit être >= kilométrage de départ)
- ✅ Vérifier le niveau de carburant final
- ✅ Prendre des photos du véhicule après location (minimum 4 photos)
- ✅ Documenter les nouveaux dommages (zones, types, sévérité)
- ✅ Ajouter des notes de retour
- ✅ Calculer les frais supplémentaires (prolongation, dommages, retard)
- ✅ Collecter les paiements (espèces ou carte)
- ✅ Prendre une photo du reçu de paiement (si espèces)
- ✅ Faire signer le document de restitution (signature électronique)
- ✅ Gérer les montants de prolongation (si la réservation a été prolongée)

**Écran** : `CheckOutScreen.tsx`

---

## 🔍 Autres Actions Disponibles

### 3. 📋 **Consultation des Réservations**

**Actions possibles** :
- ✅ Voir la liste de toutes les réservations de son agence
- ✅ Filtrer par agence (si plusieurs agences)
- ✅ Voir les détails d'une réservation :
  - Informations client (nom, téléphone, email, pièce d'identité, permis)
  - Informations véhicule (marque, modèle, immatriculation)
  - Dates de location
  - Statut de la réservation
  - Prix total
  - État du véhicule (kilométrage, carburant, photos)
- ✅ Contacter le client (appel téléphonique, WhatsApp)
- ✅ Rafraîchir la liste (pull-to-refresh)

**Écran** : `BookingsScreen.tsx`, `BookingDetailsScreen.tsx`

---

### 4. ➕ **Création de Réservation** (AGENCY_MANAGER uniquement)

**Quand** : Si l'agent a le rôle `AGENCY_MANAGER`

**Actions possibles** :
- ✅ Créer une nouvelle réservation
- ✅ Sélectionner l'agence
- ✅ Sélectionner le client
- ✅ Sélectionner le véhicule (filtré par agence)
- ✅ Définir les dates de début et fin
- ✅ Validation automatique (permis non expiré, dates valides)

**Écran** : `CreateBookingScreen.tsx`

---

### 5. ⚙️ **Paramètres**

**Actions possibles** :
- ✅ Changer la langue (Français, English, Darija)
- ✅ Se déconnecter
- ✅ Voir les informations de l'utilisateur

**Écran** : `SettingsScreen.tsx`

---

## 📊 Résumé des Capacités

| Type d'Action | Disponible | Description |
|---------------|------------|-------------|
| **Livraison (Check-in)** | ✅ | Exécution complète avec photos, signatures, documents |
| **Récupération (Check-out)** | ✅ | Exécution complète avec photos, signatures, paiements |
| **Consultation réservations** | ✅ | Lecture seule, détails complets |
| **Création réservation** | ⚠️ | Uniquement pour AGENCY_MANAGER |
| **Paramètres** | ✅ | Langue, déconnexion |
| **Mode Offline** | ✅ | Toutes les actions fonctionnent offline avec synchronisation automatique |

---

## 🚫 Ce que l'Agent NE PEUT PAS FAIRE

Selon les spécifications MALOC, l'agent **NE VOIT PAS** et **NE PEUT PAS** :

- ❌ **Charges** (module véhicule)
- ❌ **Amendes** (module séparé)
- ❌ **Flotte globale** (tous les véhicules de toutes les agences)
- ❌ **Autres agents** (planning, tâches des autres agents)
- ❌ **Planning global des véhicules** (vue d'ensemble)
- ❌ **Données financières** (revenus, profits, etc.)
- ❌ **Gestion des véhicules** (création, modification, suppression)
- ❌ **Gestion des clients** (création, modification, suppression)
- ❌ **Module Charges** (entretien, réparations, etc.)
- ❌ **Module Amendes** (gestion des amendes)

---

## 🚀 Évolutions Futures Possibles

Selon les spécifications (`SPECIFICATIONS_FONCTIONNELLES.md`), les évolutions futures pourraient inclure :

### ✅ Notifications Push
- Notifications pour nouvelles tâches
- Alertes pour tâches urgentes
- Rappels de tâches

### ✅ App Client (Moyen terme)
- Consultation des contrats par le client
- Consultation des amendes par le client
- Réservations par le client

### ⚠️ Contraintes pour Toutes Évolutions
- ✅ Doivent rester dans le cadre d'**outil d'exécution terrain**
- ✅ Aucune logique métier lourde côté mobile
- ✅ Pas d'accès aux charges, amendes, flotte globale
- ✅ Pas de duplication de données
- ✅ Backward compatibility obligatoire

---

## 📱 Écrans Disponibles

1. **LanguageSelectionScreen** - Sélection de la langue (première utilisation)
2. **LoginScreen** - Connexion
3. **BookingsScreen** - Liste des réservations
4. **BookingDetailsScreen** - Détails d'une réservation
5. **CreateBookingScreen** - Création réservation (MANAGER uniquement)
6. **CheckInScreen** - Livraison / Check-in
7. **CheckOutScreen** - Récupération / Check-out
8. **SettingsScreen** - Paramètres

---

## 🔄 Flux de Travail Typique

### Scénario 1 : Livraison d'un Véhicule

1. Agent ouvre l'app → Voir la liste des réservations
2. Agent voit une réservation `CONFIRMED` → Badge "📦 Livraison"
3. Agent clique sur la réservation → Détails complets
4. Agent clique sur "Check-in" → Écran de livraison
5. Agent remplit le formulaire :
   - Kilométrage de départ
   - Niveau de carburant
   - Photos du véhicule (min 4)
   - Dommages existants (si présents)
   - Photo du permis
   - Signature du contrat
6. Agent valide → Booking passe à `ACTIVE`

### Scénario 2 : Récupération d'un Véhicule

1. Agent ouvre l'app → Voir la liste des réservations
2. Agent voit une réservation `ACTIVE` → Badge "🚗 Récupération"
3. Agent clique sur la réservation → Détails complets
4. Agent clique sur "Check-out" → Écran de récupération
5. Agent remplit le formulaire :
   - Kilométrage final
   - Niveau de carburant final
   - Photos du véhicule (min 4)
   - Nouveaux dommages (si présents)
   - Notes de retour
   - Frais supplémentaires (si prolongation)
   - Méthode de paiement (espèces/carte)
   - Signature de restitution
6. Agent valide → Booking passe à `COMPLETED`

---

## 📝 Notes Techniques

### Calcul des Tâches

Les tâches sont **DÉRIVÉES** des bookings, jamais persistées en base :

```typescript
// Logique de dérivation
CONFIRMED → CHECK_IN (Livraison)
ACTIVE → CHECK_OUT (Récupération)
COMPLETED / CANCELLED → Aucune tâche
```

### Mode Offline

Toutes les actions fonctionnent **offline** :
- ✅ Actions mises en queue SQLite locale
- ✅ Synchronisation automatique quand connexion disponible
- ✅ Upload fichiers différé
- ✅ Indicateur visuel "En attente de synchronisation"

---

**Dernière mise à jour** : 2024  
**Conformité** : `SPECIFICATIONS_FONCTIONNELLES.md`




