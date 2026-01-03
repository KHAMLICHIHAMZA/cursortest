# 📊 Analyse Métier Complète - MalocAuto SaaS

**Date:** Décembre 2024  
**Version:** 1.0.0  
**Statut:** Analyse basée sur l'existant du codebase

---

## 📋 Table des Matières

1. [État des Lieux Réel](#1-état-des-lieux-réel)
2. [Organisation Métier Transverse](#2-organisation-métier-transverse)
3. [Règles Métier Transverses](#3-règles-métier-transverses)
4. [Incohérences & Risques Métier](#4-incohérences--risques-métier)
5. [Synthèse Finale Décisionnelle](#5-synthèse-finale-décisionnelle)

---

## 1. ÉTAT DES LIEUX RÉEL

### 1.1 Application Admin (Super Admin)

#### ✅ Fonctionnalités Existantes

- **Authentification** : Login avec rôle SUPER_ADMIN uniquement
- **Dashboard** : Statistiques globales (entreprises, agences, utilisateurs, entreprises actives)
- **Gestion des Entreprises** : CRUD complet avec audit trail
- **Gestion des Agences** : CRUD complet avec filtrage par entreprise
- **Gestion des Utilisateurs** : CRUD complet avec attribution de rôles et agences
- **Planning Global** : Visualisation de toutes les locations/maintenances de toutes les agences
- **Analytics Global** : KPIs à l'échelle plateforme (revenus, taux d'occupation, top entreprises/agences)
- **Gestion des Abonnements SaaS** : Création, modification, suspension, restauration, annulation, renouvellement
- **Santé des Companies** : Vue d'ensemble statut, alertes paiement, jours restants
- **Business Event Logging** : Traçabilité complète des événements métier
- **RBAC** : Système de permissions granulaire
- **Read-Only Mode** : Mode maintenance

#### ⚠️ Fonctionnalités Partiellement Implémentées

- **Gestion des Modules** : Structure existante mais interface de gestion limitée
- **Gestion des Plans** : CRUD existant mais pas d'interface complète de configuration

#### ❌ Fonctionnalités Manquantes

- **Gestion des Quotas** : Pas d'interface pour configurer les quotas par plan
- **Gestion des Dépendances de Modules** : Pas d'interface pour définir les dépendances
- **Notifications SaaS** : Pas de système de notifications pour alertes paiement/expiration
- **Facturation Automatique** : Pas de génération automatique de factures PDF
- **Rapports Financiers** : Pas de rapports détaillés sur les revenus SaaS

#### 🔍 Zones Floues ou Incohérentes

- **Décision métier manquante** : Quels sont les seuils d'alerte pour les paiements en retard ? (actuellement < 30 jours mentionné mais pas configurable)
- **Décision métier manquante** : Quelle est la politique de suspension automatique ? (J+90 mentionné mais pas clairement documenté)
- **Incohérence** : Le champ `isActive` existe encore sur Company alors que `status` (ACTIVE/SUSPENDED/DELETED) est la source de vérité

---

### 1.2 Application Company (Company Admin)

#### ✅ Fonctionnalités Existantes

- **Authentification** : Login avec rôles COMPANY_ADMIN ou SUPER_ADMIN
- **Dashboard** : Statistiques entreprise (agences, utilisateurs, véhicules, locations actives) + alertes SaaS
- **Gestion des Agences** : CRUD complet avec filtrage automatique par companyId
- **Gestion des Utilisateurs** : CRUD complet avec attribution de rôles et agences
- **Planning Entreprise** : Visualisation planning de toutes les agences de l'entreprise
- **Analytics Entreprise** : KPIs calculés pour l'entreprise (agrégation des agences)
- **Gestion des Modules** : Visualisation des modules activés (héritage Company → Agency)
- **Permissions UserAgency** : Gestion des permissions READ/WRITE/FULL par utilisateur et agence
- **Business Event Logging** : Traçabilité complète
- **RBAC** : Filtrage automatique par companyId

#### ⚠️ Fonctionnalités Partiellement Implémentées

- **Gestion des Modules** : Visualisation mais pas de désactivation au niveau agence depuis cette interface
- **Alertes SaaS** : Affichage mais pas de gestion des notifications

#### ❌ Fonctionnalités Manquantes

- **Gestion Financière** : Pas d'accès aux factures SaaS, historique paiements
- **Gestion des Paramètres Entreprise** : Pas d'interface pour configurer les règles métier (BusinessRules)
- **Gestion des Notifications** : Pas d'interface pour configurer les préférences de notification
- **Rapports Entreprise** : Pas de rapports détaillés exportables

#### 🔍 Zones Floues ou Incohérentes

- **Décision métier manquante** : Un COMPANY_ADMIN peut-il créer des agences sans limite ? (pas de quota visible)
- **Incohérence** : Les modules sont hérités mais pas de visibilité claire sur les modules désactivés au niveau agence

---

### 1.3 Application Agency (Agence)

#### ✅ Fonctionnalités Existantes

- **Authentification** : Login avec rôles AGENCY_MANAGER ou AGENT
- **Dashboard** : Statistiques agence (véhicules, clients, locations, véhicules disponibles)
- **Gestion des Véhicules** : CRUD complet avec upload photos, validation doublons immatriculation
- **Gestion des Clients** : CRUD complet avec analyse IA du permis de conduire, validation doublons
- **Gestion des Locations** : CRUD complet avec validation disponibilité, validation permis, calcul prix automatique
- **Gestion des Amendes** : CRUD complet avec upload pièces jointes
- **Gestion de la Maintenance** : CRUD complet avec validation conflits locations, upload factures/devis
- **Planning** : Vue calendrier interactive (FullCalendar) avec événements cliquables
- **Analytics** : KPIs agence (taux d'occupation, revenus, durée moyenne, top véhicules)
- **Business Event Logging** : Traçabilité complète
- **RBAC** : Permissions différenciées AGENCY_MANAGER vs AGENT
- **Permissions UserAgency** : READ/WRITE/FULL par utilisateur et agence
- **Protection Modules SaaS** : Vérification modules activés avec messages d'erreur clairs

#### ⚠️ Fonctionnalités Partiellement Implémentées

- **Gestion des Documents** : Stockage existant mais pas d'interface de consultation complète
- **Gestion des Paiements** : Structure existante mais pas d'interface complète de gestion
- **Gestion des Incidents** : Modèle existant mais pas d'interface dédiée (utilisé via amendes)

#### ❌ Fonctionnalités Manquantes

- **Gestion des Contrats** : Pas d'interface pour visualiser/générer les contrats
- **Gestion des Factures Clients** : Pas d'interface pour générer des factures
- **Gestion des Charges** : Module mentionné dans les spécifications mais pas d'interface
- **Gestion des Règles Métier** : Pas d'interface pour configurer les BusinessRules (temps de préparation, etc.)
- **Notifications** : Pas de système de notifications pour alertes (permis expirant, maintenance due, etc.)

#### 🔍 Zones Floues ou Incohérentes

- **Décision métier manquante** : Les amendes sont liées à un booking, mais que se passe-t-il si l'amende arrive après la fin de location ?
- **Incohérence** : Le modèle `Fine` existe encore alors que `Incident` avec type `FINE` devrait être utilisé
- **Décision métier manquante** : Quelle est la règle pour le calcul des frais de retard ? (backend calcule mais pas de configuration visible)
- **Décision métier manquante** : Quelle est la règle pour le calcul des frais de dommages ? (backend calcule mais pas de configuration visible)

---

### 1.4 Application Agent (Mobile)

#### ✅ Fonctionnalités Existantes

- **Authentification** : Login avec vérification statut Company (blocage si désactivée)
- **Multi-langue** : Support français, anglais, darija avec sélection onboarding
- **Liste des Réservations** : Affichage filtré par agence avec pull-to-refresh
- **Détails Réservation** : Affichage complet (client, véhicule, état, actions)
- **Création Réservation** : Uniquement pour AGENCY_MANAGER avec validation complète
- **Check-in** : Formulaire complet avec validation explicite, photos, dommages, documents, caution, signature
- **Check-out** : Formulaire complet avec validation, photos, dommages, frais, paiement espèces, signature
- **Mode Offline** : Fonctionnement complet avec queue SQLite et synchronisation automatique
- **Persistance Locale** : Sauvegarde automatique des formulaires (AsyncStorage)
- **Validation Explicite** : Messages d'erreur détaillés pour chaque champ
- **UI/UX** : Date pickers auto-fermants, dropdowns modaux, formulaires persistants

#### ⚠️ Fonctionnalités Partiellement Implémentées

- **Gestion des Tâches** : Dérivées des bookings mais pas d'interface dédiée de planning
- **Notifications Push** : Structure préparée mais pas d'implémentation

#### ❌ Fonctionnalités Manquantes

- **Consultation des Contrats** : Pas d'accès aux contrats signés
- **Consultation des Amendes** : Pas d'accès aux amendes (conforme aux spécifications)
- **Consultation des Charges** : Pas d'accès aux charges (conforme aux spécifications)
- **Historique des Actions** : Pas d'historique des check-in/check-out effectués
- **Statistiques Personnelles** : Pas de stats pour l'agent (nombre de check-in/check-out)

#### 🔍 Zones Floues ou Incohérentes

- **Décision métier manquante** : Le champ `depositReference` a été retiré de l'UI mais existe toujours dans le schéma backend
- **Incohérence** : Le mapping des statuts backend (`IN_PROGRESS`/`RETURNED`) vers mobile (`ACTIVE`/`COMPLETED`) n'est pas documenté clairement
- **Décision métier manquante** : Quelle est la politique de synchronisation offline ? (actuellement automatique mais pas de contrôle utilisateur)

---

## 2. ORGANISATION MÉTIER TRANSVERSE

### 2.1 Les Acteurs Métier

#### a) Admin SAAS (SUPER_ADMIN)

**Ce qu'il PEUT faire :**
- Gérer toutes les entreprises (création, modification, suppression, activation/désactivation)
- Gérer toutes les agences de toutes les entreprises
- Gérer tous les utilisateurs de toutes les entreprises
- Créer et gérer les abonnements SaaS (plans, périodes, montants)
- Suspendre/Restaurer des entreprises pour non-paiement
- Visualiser le planning global de toutes les agences
- Accéder aux analytics globaux de la plateforme
- Configurer les plans et modules disponibles

**Ce qu'il NE DOIT JAMAIS faire :**
- Créer des locations, véhicules, clients (réservé aux agences)
- Effectuer des check-in/check-out (réservé aux agents)
- Modifier les données opérationnelles des agences

**Responsabilités Métier Réelles :**
- Assurer la santé financière de la plateforme
- Gérer le cycle de vie des abonnements (création, suspension, restauration, suppression)
- Surveiller les alertes de paiement et prendre les décisions de suspension
- Maintenir la cohérence des données multi-tenant
- Assurer la traçabilité complète (audit trail)

---

#### b) Company Owner / Manager (COMPANY_ADMIN)

**Ce qu'il PEUT faire :**
- Gérer les agences de son entreprise (création, modification, suppression)
- Gérer les utilisateurs de son entreprise (création, modification, suppression, attribution agences)
- Visualiser le planning de toutes les agences de son entreprise
- Accéder aux analytics de son entreprise (agrégation des agences)
- Configurer les permissions des utilisateurs par agence (READ/WRITE/FULL)
- Visualiser l'état de son abonnement SaaS (plan, jours restants, alertes)

**Ce qu'il NE DOIT JAMAIS faire :**
- Créer des locations, véhicules, clients (réservé aux agences)
- Effectuer des check-in/check-out (réservé aux agents)
- Modifier les données d'autres entreprises
- Gérer les abonnements SaaS (réservé au Super Admin)

**Responsabilités Métier Réelles :**
- Assurer la gestion opérationnelle de son entreprise
- Organiser la structure des agences et des équipes
- Surveiller les performances de ses agences (analytics)
- Respecter les quotas de son plan d'abonnement
- Maintenir la cohérence des données de son entreprise

---

#### c) Agency Manager (AGENCY_MANAGER)

**Ce qu'il PEUT faire :**
- Gérer la flotte de véhicules de son agence (CRUD complet)
- Gérer les clients de son agence (CRUD complet)
- Créer et gérer les locations de son agence (CRUD complet)
- Gérer les amendes de son agence (CRUD complet)
- Gérer la maintenance des véhicules de son agence (CRUD complet)
- Visualiser le planning de son agence
- Accéder aux analytics de son agence
- Effectuer des check-in/check-out (opérations terrain)
- Créer des réservations depuis l'application mobile

**Ce qu'il NE DOIT JAMAIS faire :**
- Modifier les données d'autres agences
- Gérer les utilisateurs (réservé au Company Admin)
- Modifier les paramètres de l'entreprise (réservé au Company Admin)

**Responsabilités Métier Réelles :**
- Assurer la gestion opérationnelle quotidienne de l'agence
- Valider les locations et s'assurer de la disponibilité des véhicules
- Gérer les relations clients et la qualité de service
- Superviser les opérations terrain (check-in/check-out)
- Assurer la conformité des documents (permis, contrats)

---

#### d) Agent Terrain (AGENT)

**Ce qu'il PEUT faire :**
- Consulter les réservations de son agence
- Effectuer des check-in (livraison véhicules)
- Effectuer des check-out (récupération véhicules)
- Prendre des photos (véhicules, documents)
- Faire signer les contrats et documents de restitution
- Collecter les cautions et paiements espèces
- Documenter les dommages (avant/après)

**Ce qu'il NE DOIT JAMAIS faire :**
- Créer des réservations (réservé au Manager, sauf si AGENCY_MANAGER)
- Modifier les véhicules, clients (réservé au Manager)
- Gérer les amendes (réservé au Manager)
- Gérer la maintenance (réservé au Manager)
- Accéder aux analytics (réservé au Manager)
- Accéder aux charges (non disponible dans l'app)

**Responsabilités Métier Réelles :**
- Exécuter les opérations terrain avec précision
- Respecter les procédures de check-in/check-out
- Documenter correctement l'état des véhicules (photos, kilométrage, carburant)
- Vérifier la validité des documents clients (permis, identité)
- Collecter les informations nécessaires (signatures, cautions, paiements)

---

#### e) Client Final

**Statut Actuel :** Non pris en compte (application client prévue moyen terme)

**Ce qu'il DEVRAIT pouvoir faire (futur) :**
- Consulter ses contrats de location
- Consulter ses amendes
- Effectuer des réservations en ligne
- Recevoir des notifications (confirmations, rappels)

**Ce qu'il NE DEVRAIT JAMAIS faire :**
- Modifier les données de location
- Accéder aux données d'autres clients
- Accéder aux données de l'agence

---

### 2.2 Workflow MÉTIER GLOBAL (de bout en bout)

#### Étape 1 : Création / Réception d'une Réservation

**Qui agit ?**
- **Agency Manager** (back-office ou mobile) ou **Agent** si AGENCY_MANAGER (mobile uniquement)
- **Client** (futur : application client)

**Dans quelle application ?**
- **Agency** (back-office web) : Interface complète
- **Agent** (mobile) : Interface limitée (uniquement pour AGENCY_MANAGER)

**Quelles données sont créées / modifiées ?**
- **Booking** : Créé avec statut `DRAFT` ou `PENDING`
- **PlanningEvent** : Généré automatiquement (type `BOOKING`)
- **Contrat** : Généré automatiquement (1 location = 1 contrat) - **⚠️ Décision métier manquante : Où est stocké le contrat ?**

**Quelles validations sont obligatoires ?**
- Client doit avoir un permis valide et non expiré
- Type de permis du client doit correspondre au type de véhicule
- Véhicule doit être disponible pour la période
- Pas de conflit avec une maintenance en cours
- Date de fin > date de début
- Durée minimum : 1 heure

**Quels sont les cas bloquants ?**
- Permis client expiré → **Blocage**
- Véhicule non disponible → **Blocage**
- Conflit avec maintenance → **Blocage**
- Dates invalides → **Blocage**

---

#### Étape 2 : Préparation du Véhicule

**Qui agit ?**
- **Agency Manager** ou **Agent** (selon organisation interne)

**Dans quelle application ?**
- **Agency** (back-office) : Gestion maintenance/préparation
- **Agent** (mobile) : Consultation planning

**Quelles données sont créées / modifiées ?**
- **PlanningEvent** : Type `PREPARATION_TIME` (temps de préparation)
- **Vehicle** : Statut peut passer à `TEMP_UNAVAILABLE` pendant préparation

**Quelles validations sont obligatoires ?**
- Aucune validation automatique (processus manuel)

**Quels sont les cas bloquants ?**
- Aucun blocage automatique (processus informatif)

**⚠️ Décision métier manquante :** Le temps de préparation est-il configurable par agence ? (BusinessRule `preparation_time_standard` existe mais pas d'interface)

---

#### Étape 3 : Check-in Terrain

**Qui agit ?**
- **Agent** (mobile uniquement)

**Dans quelle application ?**
- **Agent** (mobile) : Écran `CheckInScreen`

**Quelles données sont créées / modifiées ?**
- **Booking** : Statut passe de `CONFIRMED` à `IN_PROGRESS` (mappé `ACTIVE` en mobile)
- **Document** : Photos avant (minimum 4), photo permis, pièce identité (optionnel), document caution (optionnel), données check-in (JSON)
- **Payment** : Si caution collectée (méthode CASH, CARD_HOLD, TRANSFER, CHEQUE, OTHER)
- **PlanningEvent** : Mise à jour statut véhicule

**Quelles validations sont obligatoires ?**
- Kilométrage départ >= 0
- Niveau carburant départ (EMPTY, QUARTER, HALF, THREE_QUARTERS, FULL)
- Photos avant : minimum 4
- Photo permis : obligatoire
- Date expiration permis : **STRICTEMENT > aujourd'hui** (bloquant)
- Signature client : obligatoire (mobile uniquement, optionnel web)
- Si caution requise : montant, type, statut obligatoires

**Quels sont les cas bloquants ?**
- Permis expiré → **Blocage check-in**
- Moins de 4 photos avant → **Blocage**
- Pas de signature → **Blocage** (mobile)
- Booking pas en statut `CONFIRMED` → **Blocage**

**⚠️ Décision métier manquante :** La caution est-elle obligatoire par défaut ? (actuellement paramétrable mais pas de règle par Company/Agency)

---

#### Étape 4 : Période de Location

**Qui agit ?**
- **Client** (conduit le véhicule)
- **Agent** (surveillance, suivi)

**Dans quelle application ?**
- **Agency** (back-office) : Suivi des locations actives
- **Agent** (mobile) : Consultation détails location

**Quelles données sont créées / modifiées ?**
- **Booking** : Statut `IN_PROGRESS` (ou `LATE` si retard)
- **Incident** : Si amende reçue (type `FINE`) ou dommage signalé (type `DAMAGE`)
- **Fine** : Si amende créée manuellement (legacy, devrait utiliser Incident)

**Quelles validations sont obligatoires ?**
- Aucune validation automatique pendant la location

**Quels sont les cas bloquants ?**
- Aucun blocage automatique

**⚠️ Décision métier manquante :** Comment sont gérées les amendes reçues après la fin de location ? (actuellement liées à booking mais pas de workflow clair)

---

#### Étape 5 : Check-out Terrain

**Qui agit ?**
- **Agent** (mobile uniquement)

**Dans quelle application ?**
- **Agent** (mobile) : Écran `CheckOutScreen`

**Quelles données sont créées / modifiées ?**
- **Booking** : Statut passe de `IN_PROGRESS` (ou `LATE`) à `RETURNED` (mappé `COMPLETED` en mobile)
- **Document** : Photos après (minimum 4), données check-out (JSON)
- **Payment** : Si paiement espèces collecté (méthode CASH)
- **Incident** : Si nouveaux dommages détectés (type `DAMAGE`)
- **PlanningEvent** : Mise à jour statut véhicule

**Quelles validations sont obligatoires ?**
- Kilométrage fin >= kilométrage départ
- Niveau carburant fin (même enum que départ)
- Photos après : minimum 4
- Signature restitution : obligatoire (mobile uniquement, optionnel web)
- Si paiement espèces : montant obligatoire

**Quels sont les cas bloquants ?**
- Kilométrage fin < kilométrage départ → **Blocage**
- Moins de 4 photos après → **Blocage**
- Pas de signature → **Blocage** (mobile)
- Booking pas en statut `IN_PROGRESS` ou `LATE` → **Blocage**

**⚠️ Décision métier manquante :** Comment sont calculés les frais de retard ? (backend calcule mais pas de configuration visible)
**⚠️ Décision métier manquante :** Comment sont calculés les frais de dommages ? (backend calcule mais pas de configuration visible)

---

#### Étape 6 : Clôture Financière & Administrative

**Qui agit ?**
- **Agency Manager** (back-office)

**Dans quelle application ?**
- **Agency** (back-office) : Gestion paiements, factures

**Quelles données sont créées / modifiées ?**
- **Payment** : Paiements en ligne (CMI) ou espèces
- **Booking** : Statut final `RETURNED`
- **Incident** : Résolution des incidents (dommages, amendes)

**Quelles validations sont obligatoires ?**
- Aucune validation automatique (processus manuel)

**Quels sont les cas bloquants ?**
- Aucun blocage automatique

**⚠️ Décision métier manquante :** Où sont générées les factures clients ? (pas d'interface visible)
**⚠️ Décision métier manquante :** Comment sont gérés les remboursements de caution ? (structure Payment existe mais pas de workflow clair)

---

### 2.3 Focus Critique : CAUTION

#### Pourquoi la Caution Existe

La caution (dépôt de garantie) sert à :
- **Protéger l'agence** contre les dommages causés au véhicule
- **Garantir le paiement** des frais supplémentaires (retard, dommages, carburant)
- **Réduire les risques** de non-retour du véhicule ou de litiges

#### Quand elle est Collectée

**Moment de collecte :** Lors du **check-in** (livraison du véhicule)

**Méthodes de collecte :**
- **CASH** : Espèces (encaissement immédiat)
- **CARD_HOLD** : Blocage sur carte bancaire (non débité, libéré au check-out)
- **TRANSFER** : Virement bancaire (avant check-in)
- **CHEQUE** : Chèque (encaissement différé)
- **OTHER** : Autre méthode (à documenter)

**⚠️ Décision métier manquante :** La caution est-elle obligatoire par défaut ? (actuellement paramétrable mais pas de règle par Company/Agency)

---

#### Qui Décide de son Statut

**Lors du Check-in :**
- **Agent** : Collecte la caution et définit le statut initial (`PENDING` ou `COLLECTED`)
- **Statuts possibles :**
  - `PENDING` : En attente de collecte
  - `COLLECTED` : Collectée

**Lors du Check-out :**
- **Agent** : Documente l'état du véhicule
- **Agency Manager** : Décide du statut final de la caution selon les constatations

**Statuts finaux possibles :**
- `REFUNDED` : Remboursée totalement (véhicule en bon état)
- `PARTIAL` : Remboursée partiellement (frais déduits)
- `FORFEITED` : Retenue totalement (dommages importants ou litige)

---

#### La Différence entre Statut Check-in et Statut Check-out

**Statut Check-in :** Indique si la caution a été **collectée** ou est **en attente**
- `PENDING` : Pas encore collectée (ex: virement en attente)
- `COLLECTED` : Collectée (espèces, virement reçu, chèque encaissé, carte bloquée)

**Statut Check-out :** Indique le **sort final** de la caution après vérification du véhicule
- `REFUNDED` : Remboursée totalement au client
- `PARTIAL` : Remboursée partiellement (frais déduits)
- `FORFEITED` : Retenue totalement par l'agence

**⚠️ Incohérence :** Le statut `COLLECTED` peut être utilisé à la fois au check-in et au check-out, ce qui peut créer de la confusion.

---

#### Les Cas : Remboursement Total, Partiel, Retenue Totale, Litige

**Remboursement Total (`REFUNDED`) :**
- **Quand :** Véhicule rendu en bon état, pas de frais supplémentaires
- **Action :** Libération du blocage carte ou remboursement espèces/virement
- **Qui décide :** Agent ou Manager selon l'organisation

**Remboursement Partiel (`PARTIAL`) :**
- **Quand :** Frais supplémentaires à déduire (retard, carburant manquant, dommages mineurs)
- **Action :** Déduction des frais, remboursement du solde
- **Calcul :** `Montant caution - Frais supplémentaires = Montant remboursé`
- **Qui décide :** Manager (validation des frais)

**Retenue Totale (`FORFEITED`) :**
- **Quand :** Dommages importants, non-retour du véhicule, litige non résolu
- **Action :** Aucun remboursement
- **Qui décide :** Manager (après expertise si nécessaire)

**Litige :**
- **Quand :** Désaccord client sur les frais ou dommages
- **Action :** Statut `FORFEITED` temporaire, résolution manuelle
- **⚠️ Décision métier manquante :** Comment est géré le workflow de litige ? (pas de statut `DISPUTED` pour la caution)

---

## 3. RÈGLES MÉTIER TRANSVERSES

### 3.1 Règles Documents

#### ✅ Déjà Implémentées

- **Permis de conduire obligatoire** : Validation au check-in (bloquant si expiré)
- **Photo permis obligatoire** : Minimum 1 photo au check-in
- **Pièce d'identité optionnelle** : Upload possible mais pas obligatoire
- **Photos véhicule** : Minimum 4 photos avant et après check-in/check-out
- **Signature client** : Obligatoire au check-in (mobile uniquement)
- **Signature restitution** : Obligatoire au check-out (mobile uniquement)

#### ⚠️ Partiellement Implémentées

- **Validation permis expiré** : Bloquant au check-in mais pas d'alerte préventive lors de la création de location
- **Documents manquants** : Validation frontend mais pas de workflow de relance

#### ❌ Absentes

- **Règle de validité pièce d'identité** : Pas de validation de date d'expiration
- **Règle de validité passeport** : Pas de validation de date d'expiration
- **Règle de renouvellement documents** : Pas d'alerte pour documents expirant bientôt
- **Règle de documents requis par type de client** : Pas de différenciation marocain/non-marocain

**⚠️ Décision métier manquante :** Quels documents sont obligatoires pour un client non-marocain ? (passeport ? visa ?)

---

### 3.2 Règles Paiement

#### ✅ Déjà Implémentées

- **Paiement en ligne (CMI)** : Intégration complète avec callbacks
- **Paiement espèces** : Collecte au check-out avec reçu optionnel
- **Caution collectée au check-in** : Support multiple méthodes (CASH, CARD_HOLD, TRANSFER, CHEQUE, OTHER)
- **Validation montant espèces** : Si `cashCollected = true`, `cashAmount` obligatoire et > 0

#### ⚠️ Partiellement Implémentées

- **Acompte** : Structure `isDeposit` et `depositAmount` existe mais pas d'interface de gestion
- **Remboursement caution** : Structure `depositHeld` et `depositReturned` existe mais pas de workflow clair

#### ❌ Absentes

- **Règle de retard de paiement** : Pas de calcul automatique des intérêts
- **Règle de paiement partiel** : Pas de gestion des paiements échelonnés
- **Règle de remboursement** : Pas de workflow de remboursement (annulation, erreur)
- **Règle de facturation** : Pas de génération automatique de factures

**⚠️ Décision métier manquante :** Quelle est la politique de paiement ? (acompte obligatoire ? paiement total à la réservation ?)

---

### 3.3 Règles de Responsabilité

#### ✅ Déjà Implémentées

- **Traçabilité complète** : Audit trail sur tous les enregistrements (createdBy, updatedBy, deletedBy)
- **Business Event Logging** : Logging automatique de tous les événements métier
- **Permissions UserAgency** : Responsabilité claire par utilisateur et agence

#### ⚠️ Partiellement Implémentées

- **Responsabilité agent vs agence** : Pas de distinction claire dans les logs
- **Responsabilité company vs agency** : Pas de distinction claire dans les logs

#### ❌ Absentes

- **Règle de responsabilité en cas d'erreur** : Pas de workflow de correction d'erreur
- **Règle de responsabilité en cas de litige** : Pas de workflow de résolution de litige
- **Règle de responsabilité en cas de dommage** : Pas de workflow d'expertise

**⚠️ Décision métier manquante :** Qui est responsable en cas d'erreur de saisie agent ? (agent ? manager ? agence ?)

---

### 3.4 Règles de Blocage

#### ✅ Déjà Implémentées

- **Blocage permis expiré** : Check-in impossible si permis expiré
- **Blocage véhicule non disponible** : Location impossible si véhicule non disponible
- **Blocage conflit maintenance** : Location impossible si maintenance en cours
- **Blocage company désactivée** : Login impossible si company suspendue/supprimée
- **Blocage module non activé** : Accès impossible si module non payé

#### ⚠️ Partiellement Implémentées

- **Blocage quota dépassé** : Structure existe mais pas de validation automatique

#### ❌ Absentes

- **Règle de blocage client en litige** : Pas de blacklist clients
- **Règle de blocage véhicule en maintenance** : Pas de blocage automatique si maintenance prévue
- **Règle de blocage location si caution non collectée** : Pas de validation automatique

**⚠️ Décision métier manquante :** Une location peut-elle être créée si la caution n'est pas encore collectée ? (actuellement possible)

---

## 4. INCOHÉRENCES & RISQUES MÉTIER

### 4.1 Incohérences entre Applications

#### Incohérence 1 : Mapping des Statuts Booking

**Problème :**
- Backend utilise : `DRAFT`, `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `LATE`, `RETURNED`, `CANCELLED`, `NO_SHOW`
- Mobile utilise : `PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`
- Agency (back-office) utilise : `DRAFT`, `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `RETURNED`, `CANCELLED`, `LATE`, `NO_SHOW`

**Impact :** Risque de confusion lors de la communication entre équipes

**Recommandation :** Documenter clairement le mapping et harmoniser les libellés dans les interfaces

---

#### Incohérence 2 : Modèle Fine vs Incident

**Problème :**
- Le modèle `Fine` existe encore et est utilisé dans l'application Agency
- Le modèle `Incident` avec type `FINE` devrait être utilisé selon les spécifications

**Impact :** Duplication de données, risque d'incohérence

**Recommandation :** Migrer vers `Incident` et déprécier `Fine`

---

#### Incohérence 3 : Champ isActive vs status sur Company

**Problème :**
- Le champ `isActive` (Boolean) existe encore sur Company
- Le champ `status` (ACTIVE/SUSPENDED/DELETED) est la source de vérité

**Impact :** Risque de confusion, données incohérentes

**Recommandation :** Supprimer `isActive` et utiliser uniquement `status`

---

#### Incohérence 4 : Champ depositReference

**Problème :**
- Le champ `depositReference` existe dans le schéma backend et DTO
- Il a été retiré de l'UI mobile (CheckInScreen)
- Il n'est pas utilisé dans l'application Agency

**Impact :** Données inutilisées, confusion

**Recommandation :** Soit le réintégrer dans l'UI, soit le supprimer du schéma

---

### 4.2 Zones Dangereuses (Risque Fraude, Litige, Erreur Terrain)

#### Risque 1 : Caution Non Collectée

**Scénario :** Agent crée un check-in sans collecter la caution (statut `PENDING`) mais oublie de la collecter ensuite

**Impact :** Perte financière si dommages ou non-retour

**Recommandation :** Alerte automatique si caution `PENDING` > 24h après check-in

---

#### Risque 2 : Permis Expiré Non Détecté

**Scénario :** Location créée avec permis valide, mais permis expire avant le check-in

**Impact :** Check-in bloqué, client mécontent, perte de revenus

**Recommandation :** Vérification automatique de la validité du permis lors de la création de location

---

#### Risque 3 : Dommages Non Documentés

**Scénario :** Agent oublie de documenter des dommages existants au check-in

**Impact :** Litige au check-out, responsabilité non claire

**Recommandation :** Validation obligatoire : "Aucun dommage existant" si liste vide

---

#### Risque 4 : Kilométrage Incohérent

**Scénario :** Agent saisit un kilométrage fin inférieur au kilométrage départ (erreur de saisie)

**Impact :** Données incohérentes, impossibilité de facturer les kilomètres supplémentaires

**Recommandation :** Validation backend déjà en place, mais améliorer le message d'erreur

---

#### Risque 5 : Paiement Espèces Non Traçable

**Scénario :** Agent collecte espèces au check-out mais ne prend pas de photo du reçu

**Impact :** Pas de preuve de paiement, risque de fraude

**Recommandation :** Rendre la photo du reçu obligatoire si paiement espèces

---

### 4.3 Décisions Métier Manquantes

#### Décision 1 : Politique de Caution

**Question :** La caution est-elle obligatoire par défaut ? Si oui, quel montant minimum ?

**Impact :** Incohérence entre agences, risque financier

**Priorité :** **HAUTE**

---

#### Décision 2 : Calcul des Frais de Retard

**Question :** Comment sont calculés les frais de retard ? (montant fixe ? pourcentage ? par jour ?)

**Impact :** Incohérence entre agences, litiges clients

**Priorité :** **HAUTE**

---

#### Décision 3 : Calcul des Frais de Dommages

**Question :** Comment sont calculés les frais de dommages ? (barème ? expertise ?)

**Impact :** Incohérence entre agences, litiges clients

**Priorité :** **HAUTE**

---

#### Décision 4 : Workflow de Litige

**Question :** Comment est géré un litige sur la caution ou les dommages ?

**Impact :** Pas de processus clair, résolution manuelle

**Priorité :** **MOYENNE**

---

#### Décision 5 : Génération de Factures

**Question :** Où et comment sont générées les factures clients ?

**Impact :** Pas de traçabilité financière complète

**Priorité :** **MOYENNE**

---

#### Décision 6 : Temps de Préparation

**Question :** Le temps de préparation est-il configurable par agence ? Quelle est la valeur par défaut ?

**Impact :** Planning imprécis, surbooking possible

**Priorité :** **MOYENNE**

---

#### Décision 7 : Documents Obligatoires par Type de Client

**Question :** Quels documents sont obligatoires pour un client non-marocain ?

**Impact :** Conformité légale, risque de location invalide

**Priorité :** **MOYENNE**

---

#### Décision 8 : Politique de Paiement

**Question :** Acompte obligatoire ? Paiement total à la réservation ? Paiement au check-in ?

**Impact :** Incohérence entre agences, risque financier

**Priorité :** **MOYENNE**

---

## 5. SYNTHÈSE FINALE DÉCISIONNELLE

### 5.1 Ce qui est Solide

#### Architecture & Infrastructure

- ✅ **Multi-tenant** : Architecture SaaS solide avec isolation des données
- ✅ **RBAC** : Système de permissions granulaire et bien implémenté
- ✅ **Audit Trail** : Traçabilité complète sur tous les enregistrements
- ✅ **Business Event Logging** : Logging automatique de tous les événements métier
- ✅ **API Versioning** : Structure prête pour évolutions futures
- ✅ **Offline Mobile** : Fonctionnement offline complet avec synchronisation automatique

#### Fonctionnalités Métier

- ✅ **Cycle de vie Booking** : Workflow complet de la réservation au retour
- ✅ **Validation Documents** : Validation stricte des permis (bloquant si expiré)
- ✅ **Gestion Caution** : Structure complète avec support multiple méthodes
- ✅ **Planning** : Source de vérité centralisée avec génération automatique
- ✅ **Analytics** : KPIs calculés en temps réel à tous les niveaux

---

### 5.2 Ce qui est à Corriger

#### Corrections Techniques

1. **Harmoniser les Statuts Booking** : Documenter et harmoniser le mapping entre backend/mobile/agency
2. **Migrer Fine vers Incident** : Déprécier le modèle `Fine` et utiliser uniquement `Incident`
3. **Supprimer isActive** : Retirer le champ `isActive` de Company et utiliser uniquement `status`
4. **Clarifier depositReference** : Soit réintégrer dans l'UI, soit supprimer du schéma

#### Corrections Métier

1. **Valider Permis à la Création** : Vérifier la validité du permis lors de la création de location (alerte si expire avant check-in)
2. **Alerte Caution Non Collectée** : Alerte automatique si caution `PENDING` > 24h après check-in
3. **Validation Dommages** : Validation obligatoire "Aucun dommage existant" si liste vide au check-in
4. **Photo Reçu Obligatoire** : Rendre la photo du reçu obligatoire si paiement espèces

---

### 5.3 Ce qui est à Décider Rapidement

#### Décisions Critiques (Priorité HAUTE)

1. **Politique de Caution** : Obligatoire par défaut ? Montant minimum ?
2. **Calcul Frais de Retard** : Montant fixe ? Pourcentage ? Par jour ?
3. **Calcul Frais de Dommages** : Barème ? Expertise ? Montant fixe ?

#### Décisions Importantes (Priorité MOYENNE)

4. **Workflow de Litige** : Processus de résolution des litiges caution/dommages
5. **Génération de Factures** : Où et comment générer les factures clients ?
6. **Temps de Préparation** : Configurable par agence ? Valeur par défaut ?
7. **Documents Obligatoires** : Liste des documents par type de client
8. **Politique de Paiement** : Acompte obligatoire ? Paiement total à la réservation ?

---

### 5.4 Les Priorités Métier Avant Toute Nouvelle Feature

#### Priorité 1 : Clarifier et Documenter les Règles Métier

**Actions :**
- Valider avec MOA les décisions métier manquantes (caution, frais, litiges)
- Documenter les règles de calcul des frais (retard, dommages)
- Définir les workflows de litige et remboursement

**Délai :** 1-2 semaines

---

#### Priorité 2 : Corriger les Incohérences Techniques

**Actions :**
- Harmoniser les statuts booking entre applications
- Migrer Fine vers Incident
- Supprimer isActive de Company
- Clarifier depositReference

**Délai :** 1 semaine

---

#### Priorité 3 : Implémenter les Validations Manquantes

**Actions :**
- Validation permis à la création de location
- Alerte caution non collectée
- Validation dommages obligatoire
- Photo reçu obligatoire si espèces

**Délai :** 1 semaine

---

#### Priorité 4 : Compléter les Interfaces Manquantes

**Actions :**
- Interface de gestion des contrats
- Interface de génération de factures
- Interface de gestion des remboursements
- Interface de configuration des BusinessRules

**Délai :** 2-3 semaines

---

#### Priorité 5 : Améliorer la Traçabilité Financière

**Actions :**
- Workflow complet de gestion des paiements
- Génération automatique de factures PDF
- Historique complet des transactions
- Rapports financiers exportables

**Délai :** 2-3 semaines

---

## 📝 Conclusion

Le système MalocAuto est **architecturalement solide** avec une base technique robuste (multi-tenant, RBAC, audit trail, offline). Cependant, plusieurs **décisions métier critiques** doivent être prises rapidement pour éviter les incohérences et les risques opérationnels.

Les **priorités absolues** sont :
1. **Clarifier les règles de caution, frais de retard et frais de dommages**
2. **Corriger les incohérences techniques** (statuts, modèles, champs)
3. **Implémenter les validations manquantes** pour réduire les risques terrain

Une fois ces éléments en place, le système sera prêt pour une utilisation en production avec confiance.

---

**Document généré le :** Décembre 2024  
**Version :** 1.0.0  
**Auteur :** Analyse basée sur l'existant du codebase


