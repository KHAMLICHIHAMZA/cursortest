# 🧪 Plan de Test - Use Cases Complets

## 📋 Mode Agent Live - Tests Automatiques

**Date** : 2024-12-26  
**Agent** : Auto (Cursor AI)  
**Mode** : Tests en direct via navigateur interne

---

## 🎯 Use Cases à Tester

### 1. Application Mobile Agent (Web - Port 8081)

#### UC-001 : Sélection de Langue
- **Objectif** : Vérifier la sélection de langue au démarrage
- **Étapes** :
  1. Ouvrir `http://localhost:8081`
  2. Vérifier l'affichage de l'écran de sélection de langue
  3. Sélectionner "Français"
  4. Vérifier la navigation vers l'écran de connexion

#### UC-002 : Connexion Agent
- **Objectif** : Vérifier la connexion d'un agent
- **Étapes** :
  1. Saisir email : `agent1@autolocation.fr`
  2. Saisir mot de passe : `agent123`
  3. Cliquer sur "Connexion"
  4. Vérifier la navigation vers l'écran des réservations
  5. Vérifier l'affichage des données utilisateur

#### UC-003 : Liste des Réservations
- **Objectif** : Vérifier l'affichage de la liste des réservations
- **Étapes** :
  1. Vérifier l'affichage de la liste des réservations
  2. Vérifier les informations affichées (numéro, statut, dates, prix)
  3. Vérifier le filtrage par agence
  4. Tester le pull-to-refresh

#### UC-004 : Détails d'une Réservation
- **Objectif** : Vérifier l'affichage des détails d'une réservation
- **Étapes** :
  1. Cliquer sur une réservation
  2. Vérifier l'affichage des informations complètes
  3. Vérifier les informations client (nom, téléphone, email)
  4. Vérifier les boutons d'action (appel, WhatsApp)
  5. Vérifier les informations véhicule

#### UC-005 : Check-in d'une Réservation
- **Objectif** : Vérifier le processus de check-in
- **Prérequis** : Réservation avec statut `CONFIRMED`
- **Étapes** :
  1. Ouvrir une réservation `CONFIRMED`
  2. Cliquer sur "Check-in"
  3. Remplir le formulaire :
     - Kilométrage départ
     - Niveau carburant
     - Photos avant (minimum 4)
     - Photo permis de conduire
     - Date expiration permis
     - Signature
  4. Soumettre le formulaire
  5. Vérifier le changement de statut à `ACTIVE`

#### UC-006 : Check-out d'une Réservation
- **Objectif** : Vérifier le processus de check-out
- **Prérequis** : Réservation avec statut `ACTIVE`
- **Étapes** :
  1. Ouvrir une réservation `ACTIVE`
  2. Cliquer sur "Check-out"
  3. Remplir le formulaire :
     - Kilométrage fin (>= départ)
     - Niveau carburant fin
     - Photos après (minimum 4)
     - Notes retour
     - Méthode de paiement (Carte/Espèces)
     - Signature restitution
  4. Soumettre le formulaire
  5. Vérifier le changement de statut à `COMPLETED`

#### UC-007 : Création de Réservation (Manager uniquement)
- **Objectif** : Vérifier la création de réservation
- **Prérequis** : Utilisateur avec rôle `AGENCY_MANAGER`
- **Étapes** :
  1. Se connecter avec compte manager
  2. Cliquer sur "Nouvelle réservation"
  3. Remplir le formulaire :
     - Sélectionner agence
     - Sélectionner client
     - Sélectionner véhicule
     - Dates début et fin
  4. Soumettre le formulaire
  5. Vérifier la création de la réservation

#### UC-008 : Mode Offline
- **Objectif** : Vérifier le fonctionnement offline
- **Étapes** :
  1. Désactiver la connexion réseau
  2. Essayer de faire un check-in
  3. Vérifier que les données sont mises en queue
  4. Vérifier l'indicateur "En attente de synchronisation"
  5. Réactiver la connexion
  6. Vérifier la synchronisation automatique

#### UC-009 : Changement de Langue
- **Objectif** : Vérifier le changement de langue
- **Étapes** :
  1. Aller dans Paramètres
  2. Sélectionner une autre langue (Anglais/Darija)
  3. Vérifier la mise à jour de l'interface
  4. Vérifier la persistance du choix

#### UC-010 : Déconnexion
- **Objectif** : Vérifier la déconnexion
- **Étapes** :
  1. Aller dans Paramètres
  2. Cliquer sur "Déconnexion"
  3. Vérifier la navigation vers l'écran de connexion
  4. Vérifier la suppression des données stockées

---

### 2. Frontend Web (Port 3001)

#### UC-011 : Connexion Admin
- **Objectif** : Vérifier la connexion admin
- **Étapes** :
  1. Ouvrir `http://localhost:3001`
  2. Saisir email : `admin@malocauto.com`
  3. Saisir mot de passe : `admin123`
  4. Cliquer sur "Connexion"
  5. Vérifier la navigation vers le dashboard

#### UC-012 : Gestion des Réservations
- **Objectif** : Vérifier la gestion des réservations
- **Étapes** :
  1. Naviguer vers "Réservations"
  2. Vérifier l'affichage de la liste
  3. Créer une nouvelle réservation
  4. Modifier une réservation
  5. Vérifier les filtres et recherches

#### UC-013 : Planning Global Véhicules
- **Objectif** : Vérifier le planning global
- **Étapes** :
  1. Naviguer vers "Planning"
  2. Vérifier l'affichage du planning global
  3. Vérifier les états des véhicules
  4. Vérifier les filtres par date/agence

---

## 🔄 Ordre d'Exécution Recommandé

### Phase 1 : Préparation
1. Démarrer le backend (port 3000)
2. Démarrer l'application mobile web (port 8081)
3. Vérifier l'accessibilité

### Phase 2 : Tests Authentification
1. UC-001 : Sélection de Langue
2. UC-002 : Connexion Agent
3. UC-011 : Connexion Admin (si frontend-web disponible)

### Phase 3 : Tests Consultation
1. UC-003 : Liste des Réservations
2. UC-004 : Détails d'une Réservation

### Phase 4 : Tests Actions
1. UC-005 : Check-in
2. UC-006 : Check-out
3. UC-007 : Création Réservation (si manager)

### Phase 5 : Tests Fonctionnalités
1. UC-008 : Mode Offline
2. UC-009 : Changement de Langue
3. UC-010 : Déconnexion

---

## 📊 Résultats Attendus

Pour chaque use case, documenter :
- ✅ **Succès** : Test passé
- ❌ **Échec** : Test échoué avec raison
- ⚠️ **Partiel** : Test partiellement réussi
- ⏸️ **Skip** : Test non exécuté (prérequis non remplis)

---

## 🐛 Problèmes Connus

1. **Backend non démarré** : Les tests nécessitent le backend sur port 3000
2. **Application non démarrée** : Les tests nécessitent l'app sur port 8081 ou 3001
3. **Base de données non seedée** : Certains tests nécessitent des données de test

---

**Document créé** : 2024-12-26  
**Statut** : Prêt pour exécution




