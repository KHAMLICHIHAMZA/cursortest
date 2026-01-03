# 📋 Plan de Test Complet - MalocAuto SaaS

**Date:** Décembre 2024  
**Version:** 2.0.0 Enterprise  
**Objectif:** Valider toutes les fonctionnalités et use cases

---

## 🎯 Scope de Test

### Applications à Tester
1. **Backend API** (`http://localhost:3000/api/v1`)
2. **Frontend Agency** (`http://localhost:8080`)
3. **Frontend Super Admin** (`http://localhost:5173`)

---

## 1️⃣ TESTS D'AUTHENTIFICATION

### 1.1 Login Agency
- [ ] ✅ Connexion avec credentials valides (AGENCY_MANAGER)
- [ ] ✅ Connexion avec credentials valides (AGENT)
- [ ] ✅ Rejet si SUPER_ADMIN tente de se connecter
- [ ] ✅ Rejet avec credentials invalides
- [ ] ✅ Message d'erreur clair affiché
- [ ] ✅ Redirection vers dashboard après connexion
- [ ] ✅ Token stocké dans localStorage

### 1.2 Login Super Admin
- [ ] ✅ Connexion avec credentials valides (SUPER_ADMIN)
- [ ] ✅ Rejet si non-SUPER_ADMIN tente de se connecter
- [ ] ✅ Rejet avec credentials invalides
- [ ] ✅ Message d'erreur clair affiché
- [ ] ✅ Redirection vers dashboard après connexion
- [ ] ✅ Token stocké dans localStorage

### 1.3 Déconnexion
- [ ] ✅ Déconnexion depuis Agency
- [ ] ✅ Déconnexion depuis Super Admin
- [ ] ✅ Token supprimé du localStorage
- [ ] ✅ Redirection vers /login

---

## 2️⃣ TESTS BACKEND - API VERSIONING

### 2.1 Endpoints /api/v1
- [ ] ✅ Tous les endpoints accessibles sous /api/v1
- [ ] ✅ Swagger documentation à jour
- [ ] ✅ Pas de breaking changes

---

## 3️⃣ TESTS BACKEND - AUDIT FIELDS

### 3.1 Company
- [ ] ✅ Création : createdByUserId auto-populé
- [ ] ✅ Modification : updatedByUserId auto-populé
- [ ] ✅ Suppression : deletedByUserId + deletedReason auto-populés
- [ ] ✅ Champs d'audit exclus des réponses publiques

### 3.2 Agency
- [ ] ✅ Création : createdByUserId auto-populé
- [ ] ✅ Modification : updatedByUserId auto-populé
- [ ] ✅ Suppression : deletedByUserId + deletedReason auto-populés
- [ ] ✅ Champs d'audit exclus des réponses publiques

### 3.3 User
- [ ] ✅ Création : createdByUserId auto-populé
- [ ] ✅ Modification : updatedByUserId auto-populé
- [ ] ✅ Suppression : deletedByUserId + deletedReason auto-populés
- [ ] ✅ Champs d'audit exclus des réponses publiques

### 3.4 Vehicle, Client, Booking, Maintenance, Fine
- [ ] ✅ Vérifier que tous ont les champs d'audit
- [ ] ✅ Vérifier exclusion des réponses publiques

---

## 4️⃣ TESTS BACKEND - BUSINESS EVENT LOGGING

### 4.1 Events Loggés
- [ ] ✅ COMPANY_CREATED lors création entreprise
- [ ] ✅ COMPANY_UPDATED lors modification entreprise
- [ ] ✅ COMPANY_DELETED lors suppression entreprise
- [ ] ✅ AGENCY_CREATED lors création agence
- [ ] ✅ AGENCY_UPDATED lors modification agence
- [ ] ✅ AGENCY_DELETED lors suppression agence
- [ ] ✅ USER_CREATED lors création utilisateur
- [ ] ✅ USER_UPDATED lors modification utilisateur
- [ ] ✅ USER_DELETED lors suppression utilisateur
- [ ] ✅ VEHICLE_CREATED, UPDATED, DELETED, STATUS_CHANGED
- [ ] ✅ CLIENT_CREATED, UPDATED, DELETED
- [ ] ✅ BOOKING_CREATED, UPDATED, CANCELLED, STATUS_CHANGED
- [ ] ✅ MAINTENANCE_CREATED, UPDATED, STATUS_CHANGED
- [ ] ✅ FINE_CREATED, UPDATED, DELETED

### 4.2 Structure des Events
- [ ] ✅ previousState stocké pour updates
- [ ] ✅ newState stocké
- [ ] ✅ triggeredByUserId stocké
- [ ] ✅ agencyId correct (ou null pour Company/User)

---

## 5️⃣ TESTS BACKEND - RBAC (PERMISSIONS)

### 5.1 SUPER_ADMIN
- [ ] ✅ Accès complet à toutes les ressources
- [ ] ✅ Peut créer/modifier/supprimer Company, Agency, User
- [ ] ✅ Accès aux analytics globaux

### 5.2 AGENCY_MANAGER
- [ ] ✅ Accès complet aux modules agency (Vehicle, Client, Booking, etc.)
- [ ] ✅ Peut créer/modifier/supprimer Vehicle, Maintenance
- [ ] ✅ Accès aux analytics de son agence
- [ ] ❌ Ne peut pas accéder aux analytics globaux

### 5.3 AGENT
- [ ] ✅ Lecture sur tous les modules
- [ ] ✅ Peut créer/modifier Client, Booking, Fine
- [ ] ❌ Ne peut pas créer/modifier Vehicle, Maintenance
- [ ] ❌ Ne peut pas supprimer
- [ ] ❌ Ne peut pas accéder aux analytics

### 5.4 PermissionGuard
- [ ] ✅ Bloque les accès non autorisés
- [ ] ✅ Messages d'erreur clairs (403 Forbidden)

---

## 6️⃣ TESTS BACKEND - READ-ONLY MODE

### 6.1 Activation
- [ ] ✅ READ_ONLY_MODE=true bloque les écritures
- [ ] ✅ GET endpoints fonctionnent normalement
- [ ] ✅ POST/PUT/PATCH/DELETE bloqués avec message clair

### 6.2 Endpoints Sûrs
- [ ] ✅ Analytics accessibles en read-only mode

---

## 7️⃣ TESTS FRONTEND AGENCY

### 7.1 Dashboard
- [ ] ✅ Statistiques affichées correctement
- [ ] ✅ Cartes cliquables (navigation vers pages)
- [ ] ✅ Photos des véhicules affichées
- [ ] ✅ Liste des locations récentes

### 7.2 Véhicules
- [ ] ✅ Liste des véhicules avec toutes les colonnes
- [ ] ✅ Création véhicule avec formulaire complet
- [ ] ✅ Upload photo fonctionne
- [ ] ✅ ColorAutocomplete fonctionne
- [ ] ✅ Validation doublons (immatriculation)
- [ ] ✅ Modification véhicule
- [ ] ✅ Suppression véhicule (soft delete)
- [ ] ✅ Modal scrollable avec boutons visibles
- [ ] ✅ Messages d'erreur/succès affichés

### 7.3 Clients
- [ ] ✅ Liste des clients avec toutes les colonnes
- [ ] ✅ Création client avec formulaire complet
- [ ] ✅ Upload photo permis
- [ ] ✅ Analyse IA du permis (si configuré)
- [ ] ✅ Auto-remplissage depuis permis
- [ ] ✅ CountryAutocomplete fonctionne
- [ ] ✅ Validation doublons (nom + permis)
- [ ] ✅ Avertissement si permis expiré (non bloquant)
- [ ] ✅ Type de permis obligatoire
- [ ] ✅ Modification client
- [ ] ✅ Suppression client
- [ ] ✅ Modal scrollable avec boutons visibles

### 7.4 Locations
- [ ] ✅ Liste des locations
- [ ] ✅ Création location avec validation
- [ ] ✅ Validation type de permis
- [ ] ✅ Validation disponibilité véhicule
- [ ] ✅ Prévention conflits avec maintenance
- [ ] ✅ Calcul automatique prix
- [ ] ✅ Datetime-local pour dates
- [ ] ✅ Rechargement liste après création
- [ ] ✅ Modification location
- [ ] ✅ Suppression location
- [ ] ✅ Modal scrollable avec boutons visibles

### 7.5 Amendes
- [ ] ✅ Liste des amendes
- [ ] ✅ Création amende avec pièce jointe
- [ ] ✅ Champs numéro et lieu (optionnels)
- [ ] ✅ Upload attachment (image/PDF)
- [ ] ✅ Modification amende
- [ ] ✅ Suppression amende
- [ ] ✅ Modal scrollable avec boutons visibles

### 7.6 Maintenance
- [ ] ✅ Liste des maintenances
- [ ] ✅ Création maintenance avec validation
- [ ] ✅ Prévention si location active
- [ ] ✅ Upload facture/devis
- [ ] ✅ Datetime-local pour date prévue
- [ ] ✅ Modification maintenance
- [ ] ✅ Suppression maintenance
- [ ] ✅ Modal scrollable avec boutons visibles

### 7.7 Planning
- [ ] ✅ Affichage FullCalendar
- [ ] ✅ Événements cliquables
- [ ] ✅ Modal détails événement
- [ ] ✅ Navigation vers détails complets
- [ ] ✅ Couleurs distinctes par type
- [ ] ✅ Filtrage par période

---

## 8️⃣ TESTS FRONTEND SUPER ADMIN

### 8.1 Dashboard
- [ ] ✅ Statistiques affichées
- [ ] ✅ Cartes cliquables (navigation)
- [ ] ✅ Liste entreprises récentes

### 8.2 Entreprises
- [ ] ✅ Liste des entreprises
- [ ] ✅ Création entreprise
- [ ] ✅ Création admin user automatique (si email fourni)
- [ ] ✅ Modification entreprise
- [ ] ✅ Toggle actif/inactif
- [ ] ✅ Modal scrollable avec boutons visibles
- [ ] ✅ Messages d'erreur/succès

### 8.3 Agences
- [ ] ✅ Liste des agences
- [ ] ✅ Création agence
- [ ] ✅ Modification agence
- [ ] ✅ Suppression agence
- [ ] ✅ Modal scrollable avec boutons visibles
- [ ] ✅ Messages d'erreur/succès

### 8.4 Utilisateurs
- [ ] ✅ Liste des utilisateurs
- [ ] ✅ Création utilisateur
- [ ] ✅ Attribution agences
- [ ] ✅ Modification utilisateur
- [ ] ✅ Réinitialisation mot de passe
- [ ] ✅ Suppression utilisateur
- [ ] ✅ Modal scrollable avec boutons visibles
- [ ] ✅ Messages d'erreur/succès

### 8.5 Planning
- [ ] ✅ Affichage planning global
- [ ] ✅ Filtrage par agence
- [ ] ✅ FullCalendar fonctionne

### 8.6 Analytics
- [ ] ✅ Page Analytics accessible
- [ ] ✅ KPIs globaux affichés
- [ ] ✅ Filtres par date fonctionnent
- [ ] ✅ Top entreprises actives
- [ ] ✅ Top agences actives
- [ ] ✅ Métriques supplémentaires

---

## 9️⃣ TESTS FRONTEND COMPANY ADMIN

### 9.1 Dashboard
- [ ] ✅ Statistiques affichées (Agences, Utilisateurs, Véhicules, Locations actives)
- [ ] ✅ Cartes cliquables (navigation)
- [ ] ✅ Liste agences récentes
- [ ] ✅ Liste locations actives
- [ ] ✅ Filtrage automatique par companyId

### 9.2 Agences
- [ ] ✅ Liste des agences de l'entreprise uniquement
- [ ] ✅ Création agence avec companyId automatique
- [ ] ✅ Modification agence
- [ ] ✅ Suppression agence (soft delete)
- [ ] ✅ Recherche d'agence
- [ ] ✅ Modal scrollable avec boutons visibles
- [ ] ✅ Messages d'erreur/succès
- [ ] ✅ Validation des champs

### 9.3 Utilisateurs
- [ ] ✅ Liste des utilisateurs de l'entreprise uniquement
- [ ] ✅ Création utilisateur avec companyId automatique
- [ ] ✅ Modification utilisateur
- [ ] ✅ Réinitialisation mot de passe
- [ ] ✅ Suppression utilisateur (soft delete)
- [ ] ✅ Attribution de rôles et agences
- [ ] ✅ Recherche d'utilisateur
- [ ] ✅ Modal scrollable avec boutons visibles
- [ ] ✅ Messages d'erreur/succès
- [ ] ✅ Validation des champs

### 9.4 Analytics
- [ ] ✅ KPIs de l'entreprise affichés
- [ ] ✅ Filtrage par période
- [ ] ✅ Top 10 agences actives (de l'entreprise)
- [ ] ✅ Répartition des locations
- [ ] ✅ Métriques supplémentaires
- [ ] ✅ Filtrage automatique par companyId

### 9.5 Planning
- [ ] ✅ Affichage planning de toutes les agences de l'entreprise
- [ ] ✅ Filtrage par agence
- [ ] ✅ FullCalendar fonctionne
- [ ] ✅ Détails des événements
- [ ] ✅ Navigation dans le calendrier

---

## 🔟 TESTS CROSS-CUTTING

### 9.1 Gestion d'Erreurs
- [ ] ✅ Erreurs réseau affichées
- [ ] ✅ Erreurs validation affichées
- [ ] ✅ Erreurs serveur affichées
- [ ] ✅ Messages d'erreur clairs et compréhensibles

### 9.2 États de Chargement
- [ ] ✅ Boutons désactivés pendant chargement
- [ ] ✅ Indicateurs de chargement visibles
- [ ] ✅ Pas de double soumission

### 9.3 Validation
- [ ] ✅ Validation côté client
- [ ] ✅ Validation côté serveur
- [ ] ✅ Messages de validation clairs

### 9.4 Responsive Design
- [ ] ✅ Interface responsive
- [ ] ✅ Modals adaptées mobile
- [ ] ✅ Tables scrollables sur mobile

---

## 1️⃣1️⃣ TESTS DE PERFORMANCE

### 10.1 Temps de Réponse
- [ ] ✅ Pages chargent rapidement
- [ ] ✅ Requêtes API < 2s
- [ ] ✅ Pas de lag dans l'interface

### 10.2 Optimisations
- [ ] ✅ Requêtes optimisées (pas de N+1)
- [ ] ✅ Pagination si nécessaire
- [ ] ✅ Images optimisées

---

## 📊 RÉSULTATS DES TESTS

### Tests Réussis: ___ / ___
### Tests Échoués: ___ / ___
### Tests Bloquants: ___

---

## 🐛 BUGS DÉCOUVERTS

### Critique (Bloquant)
- 

### Majeur
- 

### Mineur
- 

---

## ✅ VALIDATION FINALE

- [ ] ✅ Tous les use cases fonctionnent
- [ ] ✅ Toutes les fonctionnalités enterprise intégrées
- [ ] ✅ Pas de régressions
- [ ] ✅ Performance acceptable
- [ ] ✅ UX cohérente

---

**Testeur:** Auto (AI Assistant)  
**Date:** Décembre 2024


