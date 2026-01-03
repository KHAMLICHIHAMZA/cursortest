# 🧪 Guide de Test Manuel - MalocAuto SaaS

**Date:** Décembre 2024  
**Version:** 2.0.0 Enterprise

---

## 📋 Prérequis

### Serveurs à lancer
1. **Backend:** `cd backend && npm run dev` (port 3000)
2. **Frontend Agency:** `cd frontend-agency && npm run dev` (port 8080)
3. **Frontend Admin:** `cd frontend-admin && npm run dev` (port 5173)

### Comptes de Test
- **SUPER_ADMIN:** `admin@malocauto.com` / `admin123`
- **AGENCY_MANAGER:** `manager1@autolocation.fr` / `manager123`
- **AGENT:** `agent1@autolocation.fr` / `agent123`

---

## ✅ CHECKLIST DE TEST

### 🔐 1. AUTHENTIFICATION

#### 1.1 Frontend Agency - Login
- [ ] Ouvrir `http://localhost:8080/login`
- [ ] Se connecter avec `manager1@autolocation.fr` / `manager123`
- [ ] ✅ Vérifier: Redirection vers dashboard
- [ ] ✅ Vérifier: Token stocké dans localStorage
- [ ] Se connecter avec `agent1@autolocation.fr` / `agent123`
- [ ] ✅ Vérifier: Accès limité (pas de création Vehicle/Maintenance)
- [ ] Tenter connexion avec `admin@malocauto.com` / `admin123`
- [ ] ✅ Vérifier: Message d'erreur "Accès réservé aux agences"

#### 1.2 Frontend Admin - Login
- [ ] Ouvrir `http://localhost:5173/login`
- [ ] Se connecter avec `admin@malocauto.com` / `admin123`
- [ ] ✅ Vérifier: Redirection vers dashboard
- [ ] ✅ Vérifier: Token stocké dans localStorage
- [ ] Tenter connexion avec `manager1@autolocation.fr` / `manager123`
- [ ] ✅ Vérifier: Message d'erreur "Accès réservé aux administrateurs"

#### 1.3 Déconnexion
- [ ] Cliquer sur "Déconnexion" dans les deux applications
- [ ] ✅ Vérifier: Redirection vers /login
- [ ] ✅ Vérifier: Token supprimé du localStorage

---

### 🌐 2. API VERSIONING

#### 2.1 Vérifier Endpoints /api/v1
- [ ] Ouvrir Swagger: `http://localhost:3000/api/docs`
- [ ] ✅ Vérifier: Tous les endpoints sous `/api/v1`
- [ ] ✅ Vérifier: Documentation Swagger à jour

---

### 📊 3. FRONTEND AGENCY - DASHBOARD

#### 3.1 Affichage
- [ ] Se connecter en tant qu'AGENCY_MANAGER
- [ ] ✅ Vérifier: Statistiques affichées (Véhicules, Clients, Locations)
- [ ] ✅ Vérifier: Photos des véhicules dans "Véhicules en location"
- [ ] ✅ Vérifier: Liste des locations récentes

#### 3.2 Navigation
- [ ] Cliquer sur la carte "Véhicules"
- [ ] ✅ Vérifier: Navigation vers `/vehicles`
- [ ] Cliquer sur la carte "Clients"
- [ ] ✅ Vérifier: Navigation vers `/clients`
- [ ] Cliquer sur la carte "Locations"
- [ ] ✅ Vérifier: Navigation vers `/bookings`

---

### 🚗 4. FRONTEND AGENCY - VÉHICULES

#### 4.1 Liste
- [ ] Aller sur `/vehicles`
- [ ] ✅ Vérifier: Toutes les colonnes affichées (Photo, Agence, Immatriculation, Marque/Modèle, Couleur, Kilométrage, Carburant, Boîte, Caution, Statut)
- [ ] ✅ Vérifier: Photos des véhicules affichées

#### 4.2 Création
- [ ] Cliquer sur "+ Nouveau véhicule"
- [ ] ✅ Vérifier: Modal s'ouvre et est scrollable
- [ ] Remplir le formulaire:
  - Agence: Sélectionner
  - Immatriculation: `TEST-12345`
  - Marque: `Test`
  - Modèle: `Model`
  - Date de mise en service: `2024-01-01`
  - Kilométrage: `10000`
  - Carburant: Sélectionner (Essence)
  - Boîte: Sélectionner (Manuelle)
  - Prix/jour: `50`
  - Caution: `500`
  - Statut: `AVAILABLE`
  - Couleur: Utiliser ColorAutocomplete (ex: "Rouge")
  - Photo: Uploader une image
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Message de succès affiché
- [ ] ✅ Vérifier: Véhicule apparaît dans la liste
- [ ] ✅ Vérifier: Photo affichée

#### 4.3 Validation Doublons
- [ ] Tenter de créer un véhicule avec la même immatriculation `TEST-12345`
- [ ] ✅ Vérifier: Message d'erreur "Un véhicule avec l'immatriculation TEST-12345 existe déjà"

#### 4.4 Modification
- [ ] Cliquer sur l'icône "Éditer" d'un véhicule
- [ ] ✅ Vérifier: Modal s'ouvre avec données pré-remplies
- [ ] Modifier le kilométrage
- [ ] Cliquer sur "Modifier"
- [ ] ✅ Vérifier: Modifications sauvegardées

#### 4.5 Suppression
- [ ] Cliquer sur l'icône "Supprimer"
- [ ] ✅ Vérifier: Confirmation demandée
- [ ] Confirmer
- [ ] ✅ Vérifier: Véhicule supprimé (soft delete)

---

### 👥 5. FRONTEND AGENCY - CLIENTS

#### 5.1 Liste
- [ ] Aller sur `/clients`
- [ ] ✅ Vérifier: Toutes les colonnes affichées (Photo permis, Agence, Prénom, Nom, Date naissance, Adresse, Nationalité, N° Permis, Type permis, Exp. Permis)

#### 5.2 Création avec Analyse IA
- [ ] Cliquer sur "+ Nouveau client"
- [ ] ✅ Vérifier: Modal scrollable
- [ ] Remplir:
  - Agence: Sélectionner
  - Prénom: `Jean`
  - Nom: `Dupont`
  - Email: `jean.dupont@test.fr`
  - Téléphone: `+33612345678`
  - Nationalité: Cocher "Marocain" OU utiliser CountryAutocomplete
  - Upload photo permis: Uploader une image de permis
  - Cliquer sur "Analyser le permis" (si IA configurée)
  - ✅ Vérifier: Données auto-remplies (si IA fonctionne)
  - Numéro de permis: `123456789` (obligatoire)
  - Type de permis: Sélectionner "B" (obligatoire)
  - Date d'expiration: `2025-12-31`
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Client créé avec succès

#### 5.3 Avertissement Permis Expiré
- [ ] Créer un client avec date d'expiration dans le passé
- [ ] ✅ Vérifier: Avertissement non-bloquant affiché (fond jaune/orange)

#### 5.4 Validation Doublons
- [ ] Tenter de créer un client avec même nom + prénom + numéro de permis
- [ ] ✅ Vérifier: Message d'erreur "Un client avec le même nom..."

---

### 📅 6. FRONTEND AGENCY - LOCATIONS

#### 6.1 Création
- [ ] Aller sur `/bookings`
- [ ] Cliquer sur "+ Nouvelle location"
- [ ] ✅ Vérifier: Modal scrollable
- [ ] Remplir:
  - Agence: Sélectionner
  - Client: Sélectionner (doit avoir permis valide)
  - Véhicule: Sélectionner (doit être disponible)
  - Date et heure début: `2024-12-20T10:00`
  - Date et heure fin: `2024-12-25T18:00`
  - Prix total: Calculé automatiquement
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Location créée
- [ ] ✅ Vérifier: Page rechargée avec nouvelle location dans la liste

#### 6.2 Validation Type Permis
- [ ] Tenter de louer un véhicule nécessitant permis C avec un client ayant permis B
- [ ] ✅ Vérifier: Message d'erreur approprié

#### 6.3 Validation Disponibilité
- [ ] Tenter de créer une location pour un véhicule déjà loué
- [ ] ✅ Vérifier: Message d'erreur de conflit

#### 6.4 Validation Maintenance
- [ ] Tenter de créer une location pour un véhicule en maintenance
- [ ] ✅ Vérifier: Message d'erreur

---

### ⚠️ 7. FRONTEND AGENCY - AMENDES

#### 7.1 Création
- [ ] Aller sur `/fines`
- [ ] Cliquer sur "+ Nouvelle amende"
- [ ] ✅ Vérifier: Modal scrollable
- [ ] Remplir:
  - Agence: Sélectionner
  - Location: Sélectionner
  - Montant: `150`
  - Description: `Amende stationnement`
  - Numéro: `12345` (optionnel)
  - Lieu: `Paris` (optionnel)
  - Pièce jointe: Uploader image/PDF
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Amende créée

---

### 🔧 8. FRONTEND AGENCY - MAINTENANCE

#### 8.1 Création
- [ ] Aller sur `/maintenance`
- [ ] Cliquer sur "+ Nouvelle maintenance"
- [ ] ✅ Vérifier: Modal scrollable
- [ ] Remplir:
  - Agence: Sélectionner
  - Véhicule: Sélectionner (doit être disponible)
  - Description: `Révision générale`
  - Date et heure prévue: `2024-12-22T09:00`
  - Coût: `200`
  - Statut: `PLANNED`
  - Facture/Devis: Uploader document
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Maintenance créée

#### 8.2 Validation Conflit Location
- [ ] Tenter de créer une maintenance pour un véhicule avec location active
- [ ] ✅ Vérifier: Message d'erreur

---

### 📆 9. FRONTEND AGENCY - PLANNING

#### 9.1 Affichage
- [ ] Aller sur `/planning`
- [ ] ✅ Vérifier: FullCalendar affiché
- [ ] ✅ Vérifier: Événements colorés (locations, maintenances)

#### 9.2 Interactivité
- [ ] Cliquer sur un événement de location
- [ ] ✅ Vérifier: Modal avec détails s'ouvre
- [ ] ✅ Vérifier: Bouton "Voir détails" fonctionne
- [ ] Cliquer sur un événement de maintenance
- [ ] ✅ Vérifier: Modal avec détails s'ouvre

---

### 🏢 10. FRONTEND ADMIN - DASHBOARD

#### 10.1 Affichage
- [ ] Se connecter en tant que SUPER_ADMIN
- [ ] ✅ Vérifier: Statistiques affichées (Entreprises, Agences, Utilisateurs)
- [ ] ✅ Vérifier: Liste entreprises récentes

#### 10.2 Navigation
- [ ] Cliquer sur carte "Entreprises"
- [ ] ✅ Vérifier: Navigation vers `/companies`
- [ ] Cliquer sur carte "Agences"
- [ ] ✅ Vérifier: Navigation vers `/agencies`

---

### 🏢 11. FRONTEND ADMIN - ENTREPRISES

#### 11.1 Création
- [ ] Aller sur `/companies`
- [ ] Cliquer sur "+ Nouvelle entreprise"
- [ ] ✅ Vérifier: Modal scrollable
- [ ] Remplir:
  - Nom: `Test Company`
  - Téléphone: `+33123456789`
  - Adresse: `123 Test Street`
  - Email admin: `admin@testcompany.fr` (optionnel)
  - Nom admin: `Admin Test` (optionnel)
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Entreprise créée
- [ ] ✅ Vérifier: Admin user créé si email fourni

#### 11.2 Modification
- [ ] Cliquer sur "Éditer"
- [ ] Modifier le nom
- [ ] ✅ Vérifier: Modifications sauvegardées

#### 11.3 Toggle Actif/Inactif
- [ ] Cliquer sur l'icône "Power"
- [ ] ✅ Vérifier: Statut changé

---

### 🏢 12. FRONTEND ADMIN - AGENCES

#### 12.1 Création
- [ ] Aller sur `/agencies`
- [ ] Cliquer sur "+ Nouvelle agence"
- [ ] ✅ Vérifier: Modal scrollable
- [ ] Remplir:
  - Entreprise: Sélectionner
  - Nom: `Test Agency`
  - Téléphone: `+33123456790`
  - Adresse: `456 Test Avenue`
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Agence créée

---

### 👤 13. FRONTEND ADMIN - UTILISATEURS

#### 13.1 Création
- [ ] Aller sur `/users`
- [ ] Cliquer sur "+ Nouvel utilisateur"
- [ ] ✅ Vérifier: Modal scrollable
- [ ] Remplir:
  - Nom: `Test User`
  - Email: `testuser@test.fr`
  - Rôle: Sélectionner (AGENCY_MANAGER)
  - Entreprise: Sélectionner
  - Agences: Cocher plusieurs agences
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Utilisateur créé
- [ ] ✅ Vérifier: Email de bienvenue envoyé (si configuré)

#### 13.2 Réinitialisation Mot de Passe
- [ ] Cliquer sur l'icône "Key" d'un utilisateur
- [ ] ✅ Vérifier: Email de réinitialisation envoyé

---

### 📊 14. FRONTEND ADMIN - ANALYTICS

#### 14.1 Affichage KPIs
- [ ] Aller sur `/analytics`
- [ ] ✅ Vérifier: KPIs globaux affichés
- [ ] ✅ Vérifier: Statistiques (Entreprises, Agences, Véhicules, Utilisateurs, Locations, Revenus)

#### 14.2 Filtres Date
- [ ] Sélectionner une date de début
- [ ] Sélectionner une date de fin
- [ ] ✅ Vérifier: KPIs recalculés pour la période

#### 14.3 Top Entreprises/Agences
- [ ] ✅ Vérifier: Top 10 entreprises actives affiché
- [ ] ✅ Vérifier: Top 10 agences actives affiché

---

### 🔒 15. TESTS RBAC (PERMISSIONS)

#### 15.1 Agent - Restrictions
- [ ] Se connecter en tant qu'AGENT
- [ ] Aller sur `/vehicles`
- [ ] ✅ Vérifier: Pas de bouton "+ Nouveau véhicule" (ou désactivé)
- [ ] Aller sur `/maintenance`
- [ ] ✅ Vérifier: Pas de bouton "+ Nouvelle maintenance" (ou désactivé)
- [ ] Aller sur `/analytics` (si accessible)
- [ ] ✅ Vérifier: Accès refusé ou page vide

#### 15.2 Manager - Accès Complet
- [ ] Se connecter en tant qu'AGENCY_MANAGER
- [ ] ✅ Vérifier: Peut créer Vehicle, Maintenance
- [ ] ✅ Vérifier: Accès analytics (si implémenté)

---

### 📝 16. TESTS BACKEND - AUDIT FIELDS

#### 16.1 Vérifier dans Base de Données
- [ ] Se connecter à PostgreSQL
- [ ] Exécuter: `SELECT id, name, "createdByUserId", "updatedByUserId" FROM "Company" WHERE "deletedAt" IS NULL LIMIT 5;`
- [ ] ✅ Vérifier: createdByUserId et updatedByUserId sont remplis
- [ ] Exécuter: `SELECT id, name, "createdByUserId", "updatedByUserId" FROM "Agency" WHERE "deletedAt" IS NULL LIMIT 5;`
- [ ] ✅ Vérifier: Champs d'audit remplis

#### 16.2 Vérifier Exclusion des Réponses API
- [ ] Faire un GET /api/v1/companies (avec token)
- [ ] ✅ Vérifier: createdByUserId, updatedByUserId, deletedByUserId, deletedReason ABSENTS de la réponse

---

### 📊 17. TESTS BACKEND - BUSINESS EVENT LOGGING

#### 17.1 Vérifier Events dans Base
- [ ] Exécuter: `SELECT "entityType", "eventType", "triggeredByUserId", "createdAt" FROM "BusinessEventLog" ORDER BY "createdAt" DESC LIMIT 20;`
- [ ] ✅ Vérifier: Events loggés pour Company, Agency, User, Vehicle, Client, Booking, Maintenance, Fine
- [ ] ✅ Vérifier: previousState et newState stockés en JSON

---

### 🔒 18. TESTS BACKEND - READ-ONLY MODE

#### 18.1 Activer Read-Only Mode
- [ ] Dans `backend/.env`, ajouter: `READ_ONLY_MODE=true`
- [ ] Redémarrer le backend
- [ ] Tenter de créer une Company via API
- [ ] ✅ Vérifier: Erreur 503 "ServiceUnavailableException: The application is currently in read-only mode"
- [ ] Faire un GET /api/v1/companies
- [ ] ✅ Vérifier: Lecture fonctionne normalement

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

- [ ] Tous les tests passent
- [ ] Pas de régressions
- [ ] Performance acceptable
- [ ] UX cohérente
- [ ] Toutes les fonctionnalités enterprise fonctionnent

---

**Status:** Prêt pour exécution manuelle  
**Testeur:** À compléter  
**Date:** Décembre 2024



