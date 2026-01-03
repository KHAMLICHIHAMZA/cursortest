# 🧪 Plan de Test Complet - MalocAuto

**Date :** 2025-01-26  
**Version :** 2.0.0 Enterprise  
**Objectif :** Tests exhaustifs de toutes les applications et use cases

---

## 📋 Structure des Tests

### 4 Applications à Tester

1. **Backend API** (Pilote 1)
2. **Frontend Web - Agency** (Pilote 2)
3. **Frontend Admin - Super Admin** (Pilote 3)
4. **Mobile Agent** (Pilote 4)

---

## 🎯 PILOTE 1 - Backend API

### Objectif
Tester tous les endpoints API, validations backend, règles métier

### Environnement
- **URL :** `http://localhost:3000/api/v1`
- **Swagger :** `http://localhost:3000/api/docs`
- **Outils :** Postman, cURL, ou Swagger UI

### Comptes de Test
```
SUPER_ADMIN: admin@malocauto.com / admin123
COMPANY_ADMIN: admin@autolocation.fr / admin123
AGENCY_MANAGER: manager1@autolocation.fr / manager123
AGENT: agent1@autolocation.fr / agent123
```

### Tests à Effectuer

#### 1. Authentification
- [ ] `POST /auth/login` - Connexion avec chaque rôle
- [ ] `POST /auth/refresh` - Rafraîchir token
- [ ] `GET /auth/me` - Obtenir utilisateur actuel
- [ ] `POST /auth/reset-password` - Réinitialiser mot de passe
- [ ] Test token expiré
- [ ] Test token invalide

#### 2. Règle R1.3 - Validation Permis
- [ ] Créer réservation avec permis valide → ✅ Succès
- [ ] Créer réservation avec permis expiré → ❌ Blocage
- [ ] Créer réservation avec permis expirant avant fin → ❌ Blocage
- [ ] Check-in avec permis expiré → ❌ Blocage
- [ ] Check-in avec permis expirant aujourd'hui → ❌ Blocage
- [ ] Vérifier audit log pour chaque blocage

#### 3. Règle R2.2 - Temps de Préparation
- [ ] Créer réservation chevauchant période préparation → ❌ Blocage
- [ ] Modifier réservation chevauchant période préparation → ❌ Blocage
- [ ] Check-out → Vérifier création période préparation
- [ ] Check-out en retard → Vérifier durée doublée
- [ ] Vérifier `computedEndWithPreparation` calculé

#### 4. Règle R3 - Caution
- [ ] Créer réservation avec caution (montant + source) → ✅ Succès
- [ ] Créer réservation avec `depositRequired=true` mais sans montant → ❌ Erreur
- [ ] Créer réservation avec `depositRequired=true` mais sans source → ❌ Erreur
- [ ] Check-in avec caution requise mais `depositStatusCheckIn=PENDING` → ❌ Blocage
- [ ] Check-in avec caution requise et `depositStatusCheckIn=COLLECTED` → ✅ Succès
- [ ] Vérifier audit log pour chaque blocage

#### 5. Règle R4 - Frais de Retard
- [ ] Check-out à l'heure → `lateFeeAmount = 0`
- [ ] Check-out avec retard ≤ 1h → `lateFeeAmount = 25%` du tarif journalier
- [ ] Check-out avec retard ≤ 2h → `lateFeeAmount = 50%` du tarif journalier
- [ ] Check-out avec retard > 4h → `lateFeeAmount = 100%` du tarif journalier
- [ ] `PATCH /bookings/:id/late-fee` - Override avec justification valide → ✅ Succès
- [ ] `PATCH /bookings/:id/late-fee` - Override sans justification → ❌ Erreur
- [ ] `PATCH /bookings/:id/late-fee` - Override avec justification < 10 caractères → ❌ Erreur
- [ ] Vérifier audit log pour override

#### 6. Règle R5 - Dommages & Litiges
- [ ] Créer incident avec montant < 50% caution → Statut REPORTED
- [ ] Créer incident avec montant > 50% caution → Statut DISPUTED automatique
- [ ] Vérifier `financialClosureBlocked = true` si DISPUTED
- [ ] `POST /bookings/:id/financial-closure` avec incident DISPUTED → ❌ Blocage
- [ ] `POST /bookings/:id/financial-closure` avec `depositStatusFinal=DISPUTED` → ❌ Blocage
- [ ] `POST /bookings/:id/financial-closure` avec montant collecté > caution → ❌ Erreur
- [ ] Résoudre incident DISPUTED → Vérifier déblocage clôture

#### 7. Règle R6 - Facturation
- [ ] Check-out sans litige → Vérifier génération facture automatique
- [ ] Vérifier numérotation incrémentale par agence
- [ ] Vérifier `totalAmount = totalPrice + lateFeeAmount`
- [ ] Clôture financière → Vérifier génération facture si litige résolu
- [ ] `GET /invoices` - Liste factures
- [ ] `GET /invoices/:id` - Détails facture
- [ ] `PATCH /invoices/:id/status` - Mettre à jour statut

#### 8. Endpoints Bookings
- [ ] `GET /bookings` - Liste réservations
- [ ] `GET /bookings/:id` - Détails réservation
- [ ] `POST /bookings` - Créer réservation
- [ ] `PATCH /bookings/:id` - Modifier réservation
- [ ] `DELETE /bookings/:id` - Supprimer réservation
- [ ] `POST /bookings/:id/checkin` - Check-in
- [ ] `POST /bookings/:id/checkout` - Check-out

#### 9. Endpoints Incidents
- [ ] `GET /incidents` - Liste incidents
- [ ] `GET /incidents/:id` - Détails incident
- [ ] `POST /incidents` - Créer incident
- [ ] `PATCH /incidents/:id/status` - Mettre à jour statut

#### 10. Endpoints Invoices
- [ ] `GET /invoices` - Liste factures
- [ ] `GET /invoices/:id` - Détails facture
- [ ] `POST /invoices` - Générer facture manuelle
- [ ] `PATCH /invoices/:id/status` - Mettre à jour statut

#### 11. Permissions & RBAC
- [ ] SUPER_ADMIN peut accéder à tout
- [ ] COMPANY_ADMIN accès limité à sa company
- [ ] AGENCY_MANAGER accès limité à ses agences
- [ ] AGENT accès limité à ses agences
- [ ] Test override frais : Seul AGENCY_MANAGER peut
- [ ] Test clôture financière : Permissions appropriées

#### 12. Audit & Logging
- [ ] Vérifier logs pour chaque validation bloquante
- [ ] Vérifier logs pour override frais
- [ ] Vérifier logs pour clôture financière
- [ ] Vérifier `BusinessEventLog` pour événements métier

---

## 🎯 PILOTE 2 - Frontend Web (Agency)

### Objectif
Tester l'interface agence, formulaires, validations frontend

### Environnement
- **URL :** `http://localhost:3001`
- **Compte :** `manager1@autolocation.fr` / `manager123` (AGENCY_MANAGER)

### Tests à Effectuer

#### 1. Authentification
- [ ] Connexion avec AGENCY_MANAGER
- [ ] Connexion avec AGENT
- [ ] Redirection si non authentifié
- [ ] Déconnexion

#### 2. Dashboard
- [ ] Affichage statistiques
- [ ] Navigation vers modules
- [ ] Liste véhicules en location
- [ ] Liste locations récentes

#### 3. Gestion Véhicules
- [ ] Liste véhicules
- [ ] Créer véhicule
- [ ] Modifier véhicule
- [ ] Supprimer véhicule
- [ ] Upload photo

#### 4. Gestion Clients
- [ ] Liste clients
- [ ] Créer client
- [ ] Modifier client
- [ ] Supprimer client
- [ ] Analyse permis IA
- [ ] Validation permis expiré

#### 5. Gestion Réservations - CRÉATION
- [ ] Accéder formulaire création
- [ ] Sélectionner agence
- [ ] Sélectionner client (avec permis valide)
- [ ] Sélectionner véhicule disponible
- [ ] Définir dates (début < fin)
- [ ] **Caution :**
  - [ ] Cocher "Caution requise"
  - [ ] Saisir montant (obligatoire si coché)
  - [ ] Sélectionner source (COMPANY/AGENCY, obligatoire si coché)
  - [ ] Décocher → Vérifier champs masqués
- [ ] Validation erreur si permis expire avant fin
- [ ] Validation erreur si véhicule non disponible
- [ ] Soumettre → Vérifier succès

#### 6. Gestion Réservations - DÉTAIL
- [ ] Accéder page détail réservation
- [ ] **Informations financières :**
  - [ ] Afficher caution (montant, statut, source)
  - [ ] Afficher frais de retard (si calculés)
  - [ ] Afficher temps de préparation
  - [ ] Afficher montant total
- [ ] **Override frais de retard (AGENCY_MANAGER uniquement) :**
  - [ ] Vérifier bouton visible pour manager
  - [ ] Ouvrir dialog
  - [ ] Saisir nouveau montant
  - [ ] Saisir justification (min 10 caractères)
  - [ ] Validation erreur si justification < 10 caractères
  - [ ] Soumettre → Vérifier succès
  - [ ] Vérifier mise à jour affichage
- [ ] Modifier réservation
- [ ] Supprimer réservation

#### 7. Planning
- [ ] Affichage calendrier
- [ ] Affichage locations
- [ ] Affichage maintenances
- [ ] Affichage périodes préparation
- [ ] Clic sur événement → Modal détails

#### 8. Maintenance
- [ ] Liste maintenances
- [ ] Créer maintenance
- [ ] Modifier maintenance
- [ ] Supprimer maintenance

#### 9. Amendes
- [ ] Liste amendes
- [ ] Créer amende
- [ ] Modifier amende
- [ ] Supprimer amende

#### 10. Analytics (AGENCY_MANAGER uniquement)
- [ ] Accéder analytics
- [ ] Vérifier KPIs affichés
- [ ] Vérifier graphiques
- [ ] Filtrage par période

#### 11. Validation Frontend
- [ ] Validation Zod : Caution requise → Montant obligatoire
- [ ] Validation Zod : Caution requise → Source obligatoire
- [ ] Messages d'erreur clairs
- [ ] Validation dates (début < fin)
- [ ] Validation permis expiré

---

## 🎯 PILOTE 3 - Frontend Admin (Super Admin)

### Objectif
Tester interface Super Admin, gestion entreprises, agences, utilisateurs

### Environnement
- **URL :** `http://localhost:3001/admin` (ou frontend-admin si séparé)
- **Compte :** `admin@malocauto.com` / `admin123` (SUPER_ADMIN)

### Tests à Effectuer

#### 1. Authentification
- [ ] Connexion SUPER_ADMIN
- [ ] Redirection si non authentifié

#### 2. Dashboard
- [ ] Statistiques globales
- [ ] Navigation modules

#### 3. Gestion Entreprises
- [ ] Liste entreprises
- [ ] Créer entreprise
- [ ] Modifier entreprise
- [ ] Supprimer entreprise
- [ ] Activer/Désactiver entreprise

#### 4. Gestion Agences
- [ ] Liste agences
- [ ] Créer agence
- [ ] Modifier agence
- [ ] **Configurer `preparationTimeMinutes`** (default: 60)
- [ ] Supprimer agence

#### 5. Gestion Utilisateurs
- [ ] Liste utilisateurs
- [ ] Créer utilisateur
- [ ] Modifier utilisateur
- [ ] Supprimer utilisateur
- [ ] Assigner agences

#### 6. Santé Companies
- [ ] Accéder page santé
- [ ] Afficher statut company
- [ ] Afficher abonnement
- [ ] Afficher alertes (paiement, expiration)
- [ ] Suspendre company
- [ ] Restaurer company
- [ ] Étendre abonnement

#### 7. Abonnements
- [ ] Liste abonnements
- [ ] Créer abonnement
- [ ] Modifier abonnement
- [ ] Annuler abonnement

#### 8. Analytics Global
- [ ] KPIs globaux
- [ ] Filtrage par période
- [ ] Top entreprises
- [ ] Top agences

#### 9. Audit Logs
- [ ] Consulter logs d'audit
- [ ] Filtrer par action
- [ ] Filtrer par utilisateur
- [ ] Filtrer par date

---

## 🎯 PILOTE 4 - Mobile Agent

### Objectif
Tester application mobile, check-in/check-out, mode offline

### Environnement
- **Plateforme :** iOS ou Android
- **Compte :** `agent1@autolocation.fr` / `agent123` (AGENT)

### Tests à Effectuer

#### 1. Authentification
- [ ] Connexion agent
- [ ] Vérification statut company
- [ ] Déconnexion

#### 2. Multi-langue
- [ ] Sélection langue (FR, EN, Darija)
- [ ] Changement langue
- [ ] Vérifier traductions complètes

#### 3. Liste Missions
- [ ] Affichage missions à venir
- [ ] Affichage missions en cours
- [ ] Affichage missions terminées
- [ ] Badge "Terminée" sur missions complétées
- [ ] Filtrage par section
- [ ] Navigation vers détails

#### 4. Check-In - SCÉNARIO COMPLET
- [ ] Sélectionner mission PENDING/CONFIRMED
- [ ] **Pré-remplissage :**
  - [ ] Vérifier permis client pré-rempli (si disponible)
  - [ ] Vérifier pièce identité pré-remplie (si disponible)
- [ ] **Données véhicule AVANT :**
  - [ ] Saisir kilométrage départ
  - [ ] Sélectionner niveau carburant
  - [ ] Prendre 4+ photos avant
  - [ ] Notes optionnelles
- [ ] **Dommages existants :**
  - [ ] Ajouter dommage (zone, type, sévérité, description, photos)
- [ ] **Documents client :**
  - [ ] Photo permis (obligatoire)
  - [ ] Date expiration permis (obligatoire, > aujourd'hui)
  - [ ] Pièce identité (optionnelle)
- [ ] **Caution :**
  - [ ] Vérifier affichage en lecture seule (montant, type depuis réservation)
  - [ ] Sélectionner statut collection (PENDING ou COLLECTED)
  - [ ] Vérifier avertissement si PENDING et caution requise
- [ ] **Signature client :**
  - [ ] Capturer signature (obligatoire)
- [ ] **Persistance :**
  - [ ] Quitter écran → Revenir → Vérifier données sauvegardées
- [ ] Soumettre → Vérifier succès
- [ ] Vérifier statut mission → ACTIVE

#### 5. Check-In - VALIDATIONS
- [ ] Permis expiré → ❌ Blocage
- [ ] Permis expirant aujourd'hui → ❌ Blocage
- [ ] Caution requise mais PENDING → ❌ Blocage
- [ ] Moins de 4 photos avant → ❌ Erreur
- [ ] Pas de signature → ❌ Erreur
- [ ] Pas de permis photo → ❌ Erreur

#### 6. Check-Out - SCÉNARIO COMPLET
- [ ] Sélectionner mission ACTIVE
- [ ] **Données véhicule APRÈS :**
  - [ ] Saisir kilométrage retour (≥ départ)
  - [ ] Sélectionner niveau carburant
  - [ ] Prendre 4+ photos après
  - [ ] Notes optionnelles
- [ ] **Nouveaux dommages :**
  - [ ] Ajouter dommage si nécessaire
- [ ] **Frais :**
  - [ ] Vérifier frais de retard calculés automatiquement
  - [ ] Frais supplémentaires optionnels
- [ ] **Signature restitution :**
  - [ ] Capturer signature (obligatoire)
- [ ] **Persistance :**
  - [ ] Quitter écran → Revenir → Vérifier données sauvegardées
- [ ] Soumettre → Vérifier succès
- [ ] Vérifier statut mission → COMPLETED
- [ ] Vérifier frais de retard affichés

#### 7. Check-Out - VALIDATIONS
- [ ] Kilométrage retour < départ → ❌ Erreur
- [ ] Moins de 4 photos après → ❌ Erreur
- [ ] Pas de signature restitution → ❌ Erreur

#### 8. Mode Offline
- [ ] Désactiver WiFi/Données
- [ ] Consulter missions déjà chargées
- [ ] Remplir formulaire check-in
- [ ] Vérifier message "En attente de synchronisation"
- [ ] Réactiver connexion
- [ ] Vérifier synchronisation automatique
- [ ] Vérifier compteur actions en attente

#### 9. Consultation Missions Terminées
- [ ] Accéder section "Terminées"
- [ ] Voir détails mission complétée
- [ ] Vérifier informations complètes
- [ ] Pas de modification possible

#### 10. Création Booking (AGENCY_MANAGER uniquement)
- [ ] Vérifier accès si AGENCY_MANAGER
- [ ] Créer réservation
- [ ] Sélectionner client, véhicule, dates
- [ ] Soumettre → Vérifier succès

---

## 📊 Checklist Générale

### Fonctionnalités Critiques
- [ ] Toutes les règles métier fonctionnent
- [ ] Validations backend bloquantes
- [ ] Validations frontend
- [ ] Persistance données mobile
- [ ] Mode offline mobile
- [ ] Audit logs complets
- [ ] Permissions RBAC

### Performance
- [ ] Temps de réponse API < 2s
- [ ] Chargement pages < 3s
- [ ] Synchronisation offline < 5s

### UX/UI
- [ ] Messages d'erreur clairs
- [ ] Feedback utilisateur
- [ ] Navigation intuitive
- [ ] Responsive design

### Sécurité
- [ ] Tokens JWT valides
- [ ] Permissions respectées
- [ ] Données sensibles protégées
- [ ] Audit trail complet

---

## 📝 Rapport de Test

Chaque pilote doit remplir un rapport avec :
- ✅ Tests réussis
- ❌ Tests échoués
- ⚠️ Bugs trouvés
- 💡 Suggestions d'amélioration

---

## 🚀 Scripts de Test

Voir :
- `scripts/test-backend-api.sh` (ou `.ps1`)
- `scripts/test-frontend-agency.sh` (ou `.ps1`)
- `scripts/test-mobile-agent.sh` (ou `.ps1`)

---

**Date de création :** 2025-01-26  
**Statut :** ✅ Prêt pour exécution


