# Specifications Fonctionnelles et Architecturales - MALOC SaaS

## Document de Reference

**Ce document fait foi fonctionnellement et architecturalement pour toutes les evolutions du SaaS MALOC.**

**Date de creation** : 2024
**Derniere mise a jour** : 28 Janvier 2026
**Version** : 2.1.0
**Statut** : Phase de developpement FINAL (pas MVP)

---

## Table des Matieres

1. [Contexte General](#contexte-general)
2. [Regles Fondamentales (Non Negociables)](#regles-fondamentales-non-negociables)
3. [Roles et Permissions](#roles-et-permissions)
4. [Heritage Dynamique COMPANY_ADMIN (Gerant Solo)](#heritage-dynamique-company_admin-gerant-solo)
5. [Systeme de Modules](#systeme-de-modules)
6. [Numero de Booking (bookingNumberMode)](#numero-de-booking-bookingnumbermode)
7. [Modele Vehicule-Agence](#modele-vehicule-agence)
8. [Perimetres Planning (Company vs Agence)](#perimetres-planning-company-vs-agence)
9. [Depot (Deposit) - Regles Metier](#depot-deposit---regles-metier)
10. [Soft Delete et Tracabilite](#soft-delete-et-tracabilite)
11. [Audit et Journal Technique](#audit-et-journal-technique)
12. [Back-office Agence](#back-office-agence)
13. [Planning](#planning)
14. [Location (Booking)](#location-booking)
15. [Contrat](#contrat)
16. [Vehicule](#vehicule)
17. [Charges](#charges)
18. [Amendes](#amendes)
19. [Application Mobile Agent](#application-mobile-agent)
20. [Securite et RBAC](#securite-et-rbac)
21. [Evolutions Futures](#evolutions-futures)
22. [Matrice des Responsabilites](#matrice-des-responsabilites)
23. [Glossaire et Definitions](#glossaire-et-definitions)

---

## Contexte General

### Vue d'Ensemble

**MALOC** est un SaaS de location de vehicules multi-agences pour le marche marocain.

### Phase de Developpement

- **Statut actuel** : Phase de developpement **FINAL** (pas MVP)
- **Validation** : Le noyau metier a ete valide par :
  - CTO
  - DSI
  - MOA
  - Tech Lead

### Applications Existantes

1. **Back-office Web** (Next.js / frontend-web)
   - Espace SUPER_ADMIN (administration SaaS)
   - Espace COMPANY_ADMIN (gestion entreprise)
   - Espace Agence (AGENCY_MANAGER + AGENT)
   - Gestion des locations, vehicules, clients
   - Module Charges, Module Amendes
   - Planning global des vehicules

2. **Frontend Admin** (React + Vite / frontend-admin)
   - Interface d'administration SaaS simplifiee

3. **Frontend Agence** (React + Vite / frontend-agency)
   - Interface operationnelle agence simplifiee

4. **Application Mobile Agent** (Expo / React Native / mobile-agent)
   - Execution terrain (check-in / check-out)
   - Planning des taches agents
   - Mode offline complet

### Applications Prevues

5. **Application Client** (Web + Mobile) - **Moyen terme**
   - Consultation contrats
   - Consultation amendes
   - Reservations

---

## Regles Fondamentales (Non Negociables)

### 1. MALOC est la SOURCE DE VERITE

- Toutes les donnees metier sont centralisees dans MALOC
- Aucune duplication de donnees entre applications
- Le backend est l'unique source de verite

### 2. La LOCATION est le PIVOT Central du Systeme

- Toute action metier est liee a une location
- Les contrats, occupations vehicules, actions terrain sont derives de la location
- La location genere automatiquement les entites associees

### 3. Aucune Duplication de Donnees

- **Client** : Stocke une seule fois, reference partout
- **Contrat** : 1 location = 1 contrat, genere automatiquement
- **Vehicule** : Donnees centralisees, pas de duplication

### 4. Aucune Logique Metier Lourde Cote Mobile

- Le mobile est un **outil d'execution terrain**
- Toute logique metier complexe est dans le backend
- Le mobile fait des appels API et affiche les resultats

### 5. Aucun Automatisme Bloquant

- **Alertes uniquement** (informatives)
- Aucun blocage automatique de processus
- L'utilisateur garde le controle

### 6. Backward Compatibility

- Toute evolution doit rester compatible avec les versions precedentes
- Pas de breaking changes sans migration planifiee
- Versioning API : `/api/v1`, `/api/v2`, etc.

### 7. Separation Stricte des Responsabilites

- Chaque application a un perimetre clair et defini
- Pas de chevauchement de fonctionnalites
- Communication via API uniquement

### 8. Modules CHARGES et AMENDES Distincts

- **Charges** : Rattachees au vehicule, gestion agence
- **Amendes** : Module separe, intermediaire administratif
- Aucune confusion entre les deux

### 9. Compatibilite Future App Client

- Toute evolution doit prendre en compte la future app client
- Pas de decision qui bloquerait l'integration client
- Architecture extensible

### 10. Pas de Librairies Externes Payantes

- Aucune librairie externe payante (FullCalendar Timeline, etc.)
- Composants custom developpes en interne
- Dependances uniquement open-source et gratuites

---

## Roles et Permissions

### Hierarchie des Roles

| Role | Niveau | Description |
|------|--------|-------------|
| **SUPER_ADMIN** | SaaS | Administrateur de la plateforme SaaS |
| **COMPANY_ADMIN** | Entreprise | Administrateur d'une entreprise cliente |
| **AGENCY_MANAGER** | Agence | Gestionnaire d'une ou plusieurs agences |
| **AGENT** | Terrain | Profil operationnel, acces limite |

### SUPER_ADMIN

- Gere les entreprises clientes (Companies)
- Gere la facturation et les modules
- Gere l'etat des comptes (active/desactive)
- Acces total a toutes les fonctionnalites SaaS

### COMPANY_ADMIN

- Admin d'une entreprise cliente
- Peut creer/agencer ses agences
- Peut creer des utilisateurs et leur attribuer des agences
- **Heritage dynamique** : comble les roles manquants (voir section dediee)

### AGENCY_MANAGER

- Gere une seule ou plusieurs agences
- Gere les vehicules, locations, amendes, maintenance, contrats, factures, journal, KPI
- Gere les agents de son agence
- Acces complet a tous les menus operationnels de l'agence

### AGENT

- Profil operationnel (terrain)
- Peut creer des locations et gerer des clients
- Peut consulter les vehicules (lecture seule de la flotte)
- Peut consulter le planning
- **NE PEUT PAS** :
  - Creer/modifier/supprimer des vehicules
  - Acceder aux amendes
  - Acceder aux charges
  - Acceder a la maintenance
  - Acceder au journal
  - Acceder aux factures
  - Acceder aux contrats
  - Acceder au KPI / GPS Eco
  - Supprimer quoi que ce soit

### Matrice d'Acces Detaillee

| Action | SUPER_ADMIN | COMPANY_ADMIN | AGENCY_MANAGER | AGENT |
|--------|:-----------:|:-------------:|:--------------:|:-----:|
| Creer entreprise | Oui | Non | Non | Non |
| Creer agence | Non | Oui | Non | Non |
| Creer utilisateurs | Non | Oui | Partiel (ses agences) | Non |
| Gerer flotte (CRUD vehicules) | Non | Partiel | Oui | Lecture seule |
| Gerer locations | Non | Partiel | Oui | Oui |
| Gerer clients | Non | Partiel | Oui | Oui |
| Gerer amendes | Non | Partiel | Oui | **Non** |
| Gerer charges | Non | Partiel | Oui | **Non** |
| Gerer maintenance | Non | Partiel | Oui | **Non** |
| Acceder planning | Non | Partiel | Oui | Oui |
| Gerer factures | Non | Partiel | Oui | **Non** |
| Gerer contrats | Non | Partiel | Oui | **Non** |
| Voir journal | Non | Partiel | Oui | **Non** |
| Voir KPI | Non | Partiel | Oui | **Non** |
| Voir GPS Eco | Non | Partiel | Oui | **Non** |

> **Partiel** = acces conditionnel via heritage dynamique (voir section suivante)

---

## Heritage Dynamique COMPANY_ADMIN (Gerant Solo)

### Principe

Le COMPANY_ADMIN **comble dynamiquement les roles manquants** dans sa company. S'il est seul, il fait tout. Des qu'il cree des collaborateurs, il delegue progressivement.

### Logique de Detection

Le systeme analyse les utilisateurs existants de la company (hors le COMPANY_ADMIN lui-meme) :

```
otherUsers = tous les users de la company sauf le COMPANY_ADMIN
hasManager = otherUsers contient au moins un AGENCY_MANAGER
hasAgent   = otherUsers contient au moins un AGENT
```

### Tableau d'Heritage

| Situation | hasManager | hasAgent | Role herite | Menus agence visibles |
|-----------|:----------:|:--------:|-------------|----------------------|
| **Solo** (aucun autre user) | Non | Non | BOTH (Manager + Agent) | **Tous** les menus agence |
| **A des agents seulement** | Non | Oui | AGENCY_MANAGER | Menus **manager** : Factures, Contrats, Journal, Amendes, Maintenance, KPI, GPS Eco + menus partages |
| **A des managers seulement** | Oui | Non | AGENT | Menus **agent** : Vehicules, Clients, Locations, Planning, Notifications |
| **A manager + agent** | Oui | Oui | null (aucun) | **Aucun** menu agence (mode entreprise normal) |

### Menus par Niveau de Role

**Menus accessibles a AGENT** :
- Tableau de bord agence
- Vehicules (lecture seule)
- Clients
- Locations
- Planning agence
- Notifications

**Menus reserves a AGENCY_MANAGER** (en plus des menus agent) :
- Factures
- Contrats
- Journal
- Amendes
- Maintenance
- KPI
- GPS Eco

### Comportement Dynamique

Le passage d'un mode a l'autre est **automatique et instantane** :
- Le COMPANY_ADMIN demarre seul → il voit tous les menus (entreprise + agence)
- Il cree un agent → les menus agent disparaissent, il garde les menus manager
- Il cree aussi un manager → tous les menus agence disparaissent
- Il supprime tous les autres utilisateurs → il revient en mode solo complet

### Separateur Visuel

Quand le COMPANY_ADMIN herite de menus agence, un separateur visuel **"Operations Agence"** s'affiche dans le sidebar entre la section Entreprise et la section Agence.

### Implementation Technique

**`main-layout.tsx`** : Detecte le role effectif en fetchant les users de la company
**`sidebar.tsx`** : Recoit `effectiveAgencyRole` ('BOTH' | 'AGENCY_MANAGER' | 'AGENT' | null) et filtre les menus en consequence

---

## Systeme de Modules

### Principe

Chaque agence a des modules actifs/inactifs qui conditionnent l'acces aux fonctionnalites.

### Modules Disponibles

| Code Module | Description | Routes associees |
|-------------|-------------|-----------------|
| VEHICLES | Gestion de la flotte | /agency/vehicles |
| BOOKINGS | Gestion des locations | /agency/bookings, /agency/planning, /agency/contracts, /agency/kpi |
| INVOICES | Facturation | /agency/invoices |
| MAINTENANCE | Maintenance vehicules | /agency/maintenance |
| FINES | Gestion des amendes | /agency/fines |
| ANALYTICS | Analytique avancee | /company/analytics |
| GPS | Suivi GPS / Eco | /agency/gps-kpi |

### Double Filtrage Menus

Les menus du sidebar sont filtres par **deux couches** :
1. **Role** : Le role de l'utilisateur determine les menus autorises
2. **Module** : Seuls les menus dont le module est actif s'affichent

Un menu s'affiche uniquement si les DEUX conditions sont remplies.

### Routes Sans Module Requis

Certaines routes sont toujours visibles (pas de module requis) :
- Dashboard (/agency)
- Clients (/agency/clients)
- Journal (/agency/journal)
- Notifications (/agency/notifications)

---

## Numero de Booking (bookingNumberMode)

### Principe

Chaque Company a un mode de numerotation des bookings : **AUTO** ou **MANUAL**.

### Mode AUTO (par defaut)

- Le numero est genere automatiquement a la creation du booking
- Format : `AAAA` + 6 chiffres (ex: `2026000001`, `2026000002`)
- Sequence atomique par Company et par annee (table `BookingNumberSequence`)
- Reset annuel automatique
- Si le booking fournit un `bookingNumber`, il est **rejete** (erreur)

### Mode MANUAL

- Le numero est **obligatoire** a la creation du booking
- Validation : alphanumerique, max 32 caracteres, pas d'espaces, normalise en majuscules
- Si le numero n'est pas fourni, erreur 400

### Unicite

- Contrainte DB : `@@unique([companyId, bookingNumber])`
- Unicite au **niveau Company** (pas global, pas par agence)
- Verification applicative avant insertion (double controle)

### Modification

- Autorisee tant qu'aucune **facture** n'a ete emise pour ce booking
- Apres emission de facture : le numero est **verrouille** (ForbiddenException)
- Validation d'unicite lors de la modification
- Evenement `BookingNumberEdited` emis

### Recherche et Filtrage

- Recherche par `bookingNumber` dans les listings de bookings
- Recherche dans le planning (champ de recherche global)
- Filtre `contains` (recherche partielle, insensible a la casse)

---

## Modele Vehicule-Agence

### Decision : Option A (Simple) — 1 vehicule = 1 agence

Un vehicule appartient a **exactement une agence** a tout instant.

```
Vehicle.agencyId (String, OBLIGATOIRE, FK Agency)
```

### Pas de Partage Cross-Agence

- Pas de table `VehicleAgency` (junction)
- Pas de champ `assignedAgencyId` ou `ownerCompanyId`
- Le vehicule est scope a son agence pour toutes les operations

### Transfert de Vehicule

Un vehicule peut etre **transfere** d'une agence a l'autre :
- Via mise a jour du champ `agencyId`
- Operation manuelle (pas d'automatisme)
- Historique du transfert trace dans le `BusinessEventLog`

### Visibilite Multi-Agence

La visibilite multi-agence existe via les **permissions utilisateur**, pas via le vehicule :
- COMPANY_ADMIN : voit les vehicules de toutes ses agences dans le planning
- AGENCY_MANAGER : voit les vehicules de ses agences rattachees (UserAgency)
- AGENT : voit les vehicules de ses agences rattachees (UserAgency)

> **Clarification** : Quand la spec mentionne "ressources partagees (vehicules)", cela signifie que les utilisateurs multi-agences peuvent **voir** les vehicules de plusieurs agences, pas que les vehicules sont partages entre agences.

---

## Perimetres Planning (Company vs Agence)

### Planning Entreprise (`/company/planning`)

| Aspect | Regle |
|--------|-------|
| **Acces** | COMPANY_ADMIN, SUPER_ADMIN |
| **Scope par defaut** | Toutes les agences de la company |
| **Filtre agence** | Optionnel (dropdown "Toutes les agences" ou agence specifique) |
| **Donnees** | Vehicules + bookings + maintenances + events de toutes les agences accessibles |

### Planning Agence (`/agency/planning`)

| Aspect | Regle |
|--------|-------|
| **Acces** | AGENCY_MANAGER, AGENT (+ COMPANY_ADMIN en mode solo) |
| **Scope par defaut** | Agences rattachees a l'utilisateur (via UserAgency) |
| **Filtre agence** | Optionnel (si multi-agence) |
| **Donnees** | Vehicules + bookings + maintenances + events des agences accessibles uniquement |

### Backend : Calcul des Agences Accessibles

```
SUPER_ADMIN     → toutes les agences (ou filtre par agencyId)
COMPANY_ADMIN   → toutes les agences de sa company (ou filtre par agencyId)
AGENCY_MANAGER  → ses agences rattachees via UserAgency (ou filtre par agencyId si autorise)
AGENT           → ses agences rattachees via UserAgency (ou filtre par agencyId si autorise)
```

Si aucune agence accessible : retourne `{ resources: [], events: [] }`.

---

## Depot (Deposit) - Regles Metier

### Champs Schema

| Champ | Type | Description |
|-------|------|-------------|
| `depositRequired` | Boolean (defaut: false) | Le depot est-il requis pour ce booking ? |
| `depositAmount` | Decimal? | Montant du depot (obligatoire si depositRequired=true) |
| `depositDecisionSource` | DepositDecisionSource? | Qui a decide : COMPANY ou AGENCY |

### Enum DepositDecisionSource

| Valeur | Signification |
|--------|---------------|
| `COMPANY` | Politique definie au niveau de la company (regle globale) |
| `AGENCY` | Decision prise au niveau de l'agence (cas par cas) |

### Regles de Validation

1. **A la creation du booking** :
   - Si `depositRequired = true` → `depositAmount` et `depositDecisionSource` sont **obligatoires**
   - Si `depositRequired = false` → `depositAmount` et `depositDecisionSource` ignorees
   - Validation DTO + validation service

2. **Au check-in** :
   - Si `depositRequired = true` → le champ `depositStatusCheckIn` doit etre `COLLECTED`
   - Sinon → check-in bloque (BadRequestException)

3. **Qui peut modifier** :
   - AGENCY_MANAGER : peut modifier le depot sur un booking
   - AGENT : ne peut **pas** modifier le depot
   - COMPANY_ADMIN : peut modifier (si heritage dynamique actif)

### Logique Metier

Le depot n'est **PAS un automatisme bloquant** au sens general :
- Le blocage au check-in est une **verification operationnelle** (le vehicule ne part pas sans depot collecte)
- Aucun blocage automatique a la creation du booking (on peut creer un booking avec depot requis, il sera collecte plus tard)

---

## Soft Delete et Tracabilite

### Entites avec Soft Delete

Les entites suivantes supportent le soft delete (`deletedAt`, `deletedByUserId`, `deletedReason`) :

| Entite | Soft Delete | Raison |
|--------|:-----------:|--------|
| **Company** | Oui | Tracabilite client SaaS |
| **Agency** | Oui | Historique agence |
| **User** | Oui | Tracabilite utilisateur + RGPD |
| **Vehicle** | Oui | Historique flotte |
| **Client** | Oui | Tracabilite client + RGPD |
| **Booking** | Oui | Tracabilite location (pivot central) |
| **Maintenance** | Oui | Historique interventions |

### Entites avec Hard Delete

| Entite | Hard Delete | Raison |
|--------|:-----------:|--------|
| **Fine** | Oui* | *A migrer vers soft delete (document administratif) |
| **Charge** | Oui* | *A migrer vers soft delete (document financier) |
| **JournalEntry** | Oui | Entree de log, suppression rare |
| **PlanningEvent** | Oui | Projection temporelle |
| **PasswordResetToken** | Oui | Token temporaire |
| **UserAgency** | Oui | Junction table, cascade |

> **Evolution prevue** : Fine et Charge doivent migrer vers le soft delete pour conserver la trace des documents administratifs/financiers.

### Filtrage Standard

Toutes les requetes sur les entites soft-delete incluent `deletedAt: null` dans leur clause WHERE.

### Champs d'Audit

Service commun `AuditService` fournit :
- `addCreateAuditFields(user)` → ajoute `createdByUserId`, `updatedByUserId`
- `addUpdateAuditFields(user)` → ajoute `updatedByUserId`
- `addDeleteAuditFields(user, reason?)` → ajoute `deletedByUserId`, `deletedReason`, `deletedAt`
- `removeAuditFields(data)` → retire les champs d'audit des reponses API

---

## Audit et Journal Technique

### Double Systeme d'Audit

Le systeme dispose de **deux tables complementaires** pour l'audit :

### 1. AuditLog (Actions Techniques)

Table `AuditLog` — trace les actions utilisateur avec contexte technique.

| Champ | Description |
|-------|-------------|
| `userId` | Utilisateur ayant effectue l'action |
| `companyId` | Company concernee |
| `agencyId` | Agence concernee |
| `action` | Type d'action (enum) |
| `entityType` | Type d'entite concernee |
| `entityId` | ID de l'entite |
| `description` | Description textuelle |
| `metadata` | JSON libre (details supplementaires) |
| `ipAddress` | Adresse IP de l'utilisateur |
| `userAgent` | User-Agent du navigateur |
| `createdAt` | Horodatage |

**Actions tracees** :

| Action | Description |
|--------|-------------|
| CREATE | Creation d'entite |
| UPDATE | Modification d'entite |
| DELETE | Suppression d'entite |
| LOGIN | Connexion utilisateur |
| LOGOUT | Deconnexion utilisateur |
| EXPORT | Export de donnees |
| IMPORT | Import de donnees |
| PAYMENT | Paiement effectue |
| BOOKING_STATUS_CHANGE | Changement de statut booking |
| OTHER | Autre action |

### 2. BusinessEventLog (Evenements Metier)

Table `BusinessEventLog` — trace les evenements metier avec etat avant/apres.

| Champ | Description |
|-------|-------------|
| `agencyId` | Agence concernee |
| `companyId` | Company concernee |
| `entityType` | Type d'entite (Booking, Vehicle, Client, etc.) |
| `entityId` | ID de l'entite |
| `eventType` | Type d'evenement (30+ types) |
| `previousState` | Etat avant modification (JSON) |
| `newState` | Etat apres modification (JSON) |
| `triggeredByUserId` | Utilisateur declencheur |
| `createdAt` | Horodatage |

**Evenements traces** :
- CREATED, UPDATED, DELETED (toutes entites)
- STATUS_CHANGED (Booking, Vehicle, Maintenance)
- BOOKING_STATUS_CHANGED, BOOKING_NUMBER_ASSIGNED, BOOKING_NUMBER_EDITED
- VEHICLE_STATUS_CHANGED
- MAINTENANCE_STATUS_CHANGED
- CONTRACT_CREATED, CONTRACT_SIGNED
- INVOICE_GENERATED
- Et 20+ autres...

### Couverture d'Audit

| Evenement | AuditLog | BusinessEventLog |
|-----------|:--------:|:----------------:|
| Connexion/Deconnexion | Oui | - |
| Changement statut booking | Oui | Oui |
| Signature contrat | Oui | Oui |
| Changement module | - | Oui |
| Creation/suspension user | Oui | Oui |
| Creation/suspension agency | Oui | Oui |
| Creation/suspension company | Oui | Oui |
| CRUD vehicule | Oui | Oui |
| CRUD client | Oui | Oui |
| CRUD amende | Oui | Oui |

---

## Back-office Agence

### Sidebar Navigation

Le sidebar est fixe a gauche (largeur 256px) et affiche les menus selon le role + modules.

#### Menus SUPER_ADMIN
- Tableau de bord
- Entreprises
- Agences
- Utilisateurs
- Abonnements
- Sante comptes
- Notifications

#### Menus COMPANY_ADMIN (mode normal)
- Tableau de bord
- Agences
- Utilisateurs
- Analytics (si module actif)
- Planning

#### Menus AGENCY_MANAGER
- Tableau de bord
- Vehicules
- Clients
- Locations
- Planning agence
- Factures
- Contrats
- Journal
- Amendes
- Maintenance
- KPI
- GPS Eco
- Notifications

#### Menus AGENT
- Tableau de bord
- Vehicules (lecture seule, pas de bouton creation)
- Clients
- Locations
- Planning agence
- Notifications

---

## Planning

### Vue Planning Global Vehicules

Le back-office affiche **UNIQUEMENT** le planning **GLOBAL DES VOITURES**.

### Composant Technique

Le planning utilise un **composant timeline custom** developpe en interne (`PlanningBoard.tsx`).

> **IMPORTANT** : On n'utilise PAS FullCalendar (librairie payante pour Timeline View). Le composant est 100% custom, open-source.

### Structure d'Affichage

- Chaque **ligne** = un vehicule
- Chaque **bloc/evenement** = une location, maintenance, preparation, ou autre
- Affichage horizontal par temps (heure/jour/semaine/mois)

### Vues Disponibles

| Vue | Description |
|-----|-------------|
| **Jour** | Creneaux de 30 min de 6h a 22h |
| **Semaine** | 7 jours affiches |
| **Mois** | Jours du mois affiches |

### Navigation

- Bouton **Precedent** (fleche gauche)
- Bouton **Aujourd'hui** (recentre sur la date du jour)
- Bouton **Suivant** (fleche droite)

### Types d'Evenements et Couleurs

| Type | Couleur | Description |
|------|---------|-------------|
| **Location** (Booking) | Bleu | Reservation ou location active |
| **Maintenance** | Rouge | Intervention de maintenance |
| **Preparation** | Vert | Temps de preparation vehicule |
| **Autre** | Gris | Evenement divers |

### Legende

Une legende visuelle est affichee sous les filtres avec les 4 types et leurs couleurs.

### Filtres du Planning

| Filtre | Type | Description |
|--------|------|-------------|
| **Agence** | Dropdown | Filtre par agence (en haut de page, composant AgencyFilter) |
| **Vehicule** | Dropdown | "Filtrer par vehicule" - selectionne un vehicule specifique |
| **Marque** | Dropdown | "Marque" - filtre par marque de vehicule (liste dynamique) |
| **Statut vehicule** | Dropdown | "Statut vehicule" - filtre par statut (AVAILABLE, RENTED, etc.) |
| **Type d'evenement** | Boutons toggle | 4 boutons : Booking, Maintenance, Prepa, Autres (activables/desactivables) |
| **Recherche** | Champ texte | Recherche par numero de booking, client, plaque, modele |
| **Reinitialiser** | Bouton | Remet tous les filtres a zero (visible uniquement quand des filtres sont actifs) |

### Etats Vehicule dans le Planning

Un vehicule peut etre dans l'un des etats suivants :

| Etat | Icone | Description |
|------|-------|-------------|
| **AVAILABLE** | Vert | Vehicule disponible pour location |
| **RESERVED** | Bleu | Vehicule reserve (booking CONFIRMED) |
| **RENTED** | Orange | Vehicule en location active (booking IN_PROGRESS) |
| **IN_DELIVERY** | Camion | Vehicule en cours de livraison (check-in en cours) |
| **IN_RECOVERY** | Retour | Vehicule en cours de recuperation (check-out en cours) |
| **IN_MAINTENANCE** | Rouge | Vehicule en maintenance (hors location) |
| **OUT_OF_SERVICE** | Noir | Vehicule hors service |

### Limitations

- Le back-office **ne gere PAS** le planning detaille des taches agents
- Le back-office **ne voit PAS** les taches individuelles des agents
- Le back-office voit uniquement l'etat global de chaque vehicule

---

## Location (Booking)

### Creation

Une location :

1. **Est creee AVANT toute action terrain**
   - La location peut etre creee depuis :
     - Back-office
     - Telephone / WhatsApp (saisie manuelle)
     - Future app client (reservation en ligne)

2. **Genere automatiquement** :
   - Un **contrat** (1 location = 1 contrat)
   - Une **occupation vehicule** (planning)
   - Des **actions terrain** (check-in / check-out)

### Statuts de Location

| Statut | Description | Etat vehicule |
|--------|-------------|---------------|
| PENDING | En attente de confirmation | - |
| CONFIRMED | Confirmee, prete pour check-in | RESERVED |
| IN_PROGRESS | En cours (vehicule loue) | RENTED |
| COMPLETED | Terminee (vehicule rendu) | AVAILABLE |
| CANCELLED | Annulee | AVAILABLE |

### Transition de Statut Vehicule

- Booking passe a **CONFIRMED** → vehicule passe a **RESERVED**
- Booking passe a **IN_PROGRESS** → vehicule passe a **RENTED**
- Booking passe a **COMPLETED** ou **CANCELLED** → vehicule revient a **AVAILABLE**

### Sources de Creation

- **Back-office** : Saisie manuelle par manager/gerant
- **Telephone / WhatsApp** : Saisie manuelle apres contact client
- **Future app client** : Reservation en ligne (a venir)

### Numero de Booking

Voir section dediee [Numero de Booking (bookingNumberMode)](#numero-de-booking-bookingnumbermode).

---

## Contrat

### Generation

- **1 location = 1 contrat**
- Contrat genere **automatiquement** a la creation de la location
- Pas de creation manuelle de contrat
- L'auto-generation est implementee dans `BookingService.create()` qui appelle `ContractService.createContract()`

### Signature

**Deux modes de signature** :

1. **Immediate en agence**
   - Client present en agence
   - Signature immediate lors de la creation location
   - Contrat signe avant check-in

2. **Differee lors de la livraison terrain**
   - Client absent en agence
   - Signature lors du check-in terrain
   - Contrat signe par l'agent mobile

### Tracabilite

- Signature **horodatee**
- Signature **tracable** (qui, quand, ou)
- Stockage signature (base64 ou fichier)

---

## Vehicule

### Etats Possibles (VehicleStatus)

```
enum VehicleStatus {
  AVAILABLE        // Disponible
  RENTED           // En location active
  IN_MAINTENANCE   // En maintenance
  OUT_OF_SERVICE   // Hors service
  RESERVED         // Reserve (booking confirme)
  IN_DELIVERY      // En livraison (check-in en cours)
  IN_RECOVERY      // En recuperation (check-out en cours)
}
```

### Alertes Age Vehicule

**Alertes informatives uniquement** (non bloquantes) :

| Alerte | Condition | Description |
|--------|-----------|-------------|
| **AGE_WARNING_6_MONTHS** | Vehicule entre 4.5 et 5 ans | Alerte preventive : le vehicule approche de 5 ans |
| **AGE_LIMIT_REACHED** | Vehicule de 5 ans ou plus | Alerte : age limite atteint |

**Comportement** :
- Les alertes sont calculees cote backend dans `VehicleService`
- Retournees dans un champ `alerts[]` sur chaque vehicule (findAll et findOne)
- Affichage dans le back-office (informatives)
- **Aucun blocage** de processus (le vehicule reste utilisable)

### Bouton Creation Vehicule

- Visible pour : SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER
- **Masque pour AGENT** (l'agent ne peut pas creer de vehicules)

---

## Charges

### Module Central

Le module **CHARGES** est rattache **AU VEHICULE** (champ `vehicleId` **obligatoire**).

### Categories de Charges (ChargeCategory)

```
enum ChargeCategory {
  INSURANCE                // Assurance (annuelle)
  VIGNETTE                 // Vignette / Dariba (annuelle)
  BANK_INSTALLMENT         // Mensualite bancaire (mensuelle)
  PREVENTIVE_MAINTENANCE   // Maintenance preventive
  CORRECTIVE_MAINTENANCE   // Maintenance corrective
  FUEL                     // Carburant
  EXCEPTIONAL              // Charges exceptionnelles (hors amendes)
  OTHER                    // Autre
}
```

### Caracteristiques

- **Aucune donnee client** : Les charges sont liees au vehicule uniquement
- **vehicleId est OBLIGATOIRE** : Toute charge doit etre associee a un vehicule
- **Acces** : Manager / Gerant uniquement (AGENT bloque au niveau API)
- **Alertes informatives uniquement** : Pas de blocage

### Exemples d'Alertes

- Assurance a renouveler dans 30 jours → Alerte
- Vignette expiree → Alerte
- Mensualite bancaire due → Alerte

---

## Amendes

### Module Distinct

Le module est nomme strictement : **AMENDES**.

**Important** : Les amendes **ne sont PAS des charges agence**.

### Role de l'Agence

L'agence est **intermediaire administratif** pour les amendes :
- L'agence recoit l'amende (vehicule immatricule a son nom)
- L'agence identifie le client responsable
- L'agence transmet l'amende au client
- Le client paie directement l'administration

### Saisie Minimale

A partir de ces **3 donnees minimales** :

1. **Date d'infraction** (`infractionDate`)
2. **Numero d'immatriculation** (`registrationNumber`)
3. **Reference amende** (`description`)

> **Note** : `bookingId` est **optionnel**. Si non fourni, le systeme tente l'auto-identification.

### Traitement Automatique (Auto-Identification)

Le systeme **automatiquement** a la creation d'une amende :

1. **Identifie le vehicule** via le numero d'immatriculation (recherche insensible a la casse)
2. **Retrouve la location** a la date d'infraction
3. **Remonte automatiquement** :
   - Le **client principal** (titulaire de la location)
   - Le **conducteur secondaire** (si existant)
4. **Met a jour le statut** a `CLIENT_IDENTIFIE` si un client est trouve

### Detection du Booking (Regles Exactes)

**Requete de match** :
```
booking.startDate <= infractionDate AND booking.endDate >= infractionDate
```
(bornes **inclusives** des deux cotes)

**Filtres obligatoires** :
- Meme `agencyId` que l'amende
- Meme `vehicleId` que le vehicule identifie
- `deletedAt: null` (pas de bookings supprimes)
- `status IN ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']` (exclut CANCELLED et PENDING)

**Cas de multiples matchs** :
- Le systeme prend le **booking le plus recent** (`orderBy startDate DESC`, `findFirst`)
- Pas de warning ni d'intervention manuelle requise

**Cas sans match** :
- Le statut reste `RECUE`
- `bookingId = null`, `clientId = null`
- L'amende est creee mais non liee — identification manuelle requise

**Cas vehicule non trouve** :
- Si le `registrationNumber` ne correspond a aucun vehicule de l'agence
- L'amende est creee avec statut `RECUE`, sans vehicule ni booking

### Statuts d'Amende (FineStatus)

```
enum FineStatus {
  RECUE              // Amende recue par l'agence
  CLIENT_IDENTIFIE   // Client responsable identifie automatiquement
  TRANSMISE          // Amende transmise au client
  CONTESTEE          // Client conteste l'amende
  CLOTUREE           // Amende traitee (payee ou annulee)
}
```

### Champs du Modele Fine

| Champ | Type | Obligatoire | Description |
|-------|------|:-----------:|-------------|
| id | String | Oui | Identifiant unique |
| agencyId | String | Oui | Agence concernee |
| bookingId | String | **Non** | Location associee (auto-identifiee si possible) |
| clientId | String | Non | Client identifie (auto ou manuel) |
| secondaryDriverId | String | Non | Conducteur secondaire |
| vehicleId | String | Non | Vehicule identifie (auto via plaque) |
| amount | Float | Oui | Montant de l'amende |
| description | String | Oui | Reference / description |
| status | FineStatus | Oui | Statut (defaut: RECUE) |
| infractionDate | DateTime | Non | Date de l'infraction |
| registrationNumber | String | Non | Numero d'immatriculation |

### Acces

- **Manager / Gerant** uniquement
- **AGENT n'a PAS acces** aux amendes (bloque au niveau frontend ET backend API)

---

## Application Mobile Agent

### Positionnement

L'application Agent est un **outil d'EXECUTION TERRAIN**.

**Important** : Elle n'est **PAS** un outil de pilotage.

### Planning Agent

#### Vue Planning

Le planning des taches agents vit **UNIQUEMENT** dans l'app Agent.

#### Derivation

- Le planning est **derive** des reservations existantes
- **Aucune entite Task persistee en base**
- Le planning est calcule a la volee depuis les bookings

#### Logique des Taches (Derivee)

| Statut Booking | Tache Generee | Description |
|----------------|---------------|-------------|
| `CONFIRMED` | **Livraison / Check-in** | Tache de livraison vehicule au client |
| `IN_PROGRESS` | **Recuperation / Check-out** | Tache de recuperation vehicule du client |
| `COMPLETED` | Aucune tache | Location terminee |
| `CANCELLED` | Aucune tache | Location annulee |

### Vue Agent

#### Ce que l'Agent VOIT

- Ses taches (derivees des bookings)
- Ordonnees par date / heure
- Informations necessaires a l'execution : vehicule, lieu, client

#### Ce que l'Agent PEUT FAIRE

- Executer une tache (check-in / check-out)
- Confirmer une action
- Prendre photos (vehicule, documents)
- Faire signer (contrat, restitution)

#### Ce que l'Agent NE VOIT PAS

- Charges (module vehicule)
- Amendes (module separe)
- Flotte globale (gestion)
- Autres agents
- Planning global des vehicules
- Donnees financieres
- KPI / Analytics
- Factures / Contrats
- Journal / Maintenance

### Offline

#### Fonctionnement Offline

Le fonctionnement offline existant est **CONSERVE**.

#### Aucune Regression Toleree

- Check-in complet offline
- Check-out complet offline
- Signatures (stockage local)
- Photos (stockage local)
- Formulaires (saisie complete offline)

#### Synchronisation

- Actions mises en queue SQLite locale
- Synchronisation automatique quand connexion disponible
- Upload fichiers differe
- Indicateur visuel "En attente de synchronisation"

---

## Securite et RBAC

### Protection a 3 Niveaux

La securite est implementee en **3 couches** :

#### 1. Middleware Next.js (serveur)

Intercepte les requetes avant le rendu de page :
- Verifie le role dans le token JWT
- Redirige vers `/login` si non autorise
- Routes specifiques bloquees pour AGENT :
  - `/agency/invoices`
  - `/agency/contracts`
  - `/agency/journal`
  - `/agency/fines`
  - `/agency/maintenance`
  - `/agency/kpi`
  - `/agency/gps-kpi`

#### 2. RouteGuard (client)

Composant React qui protege chaque page :
- Verifie le role cote client
- Affiche un message d'erreur ou redirige si non autorise
- Chaque page declare ses `allowedRoles`

#### 3. Backend Guards (API)

- **JwtAuthGuard** : Verifie l'authentification
- **RolesGuard** : Verifie le role de l'utilisateur
- **PermissionGuard** : Verifie les permissions granulaires

#### Permissions AGENT au Niveau API

```
Modules INTERDITS : fines, maintenance, charges, analytics, journal, invoices, contracts, gps
Lecture autorisee : clients, bookings, vehicles, planning
Creation/modification : clients, bookings
Suppression : RIEN (aucune suppression autorisee)
Vehicules : lecture seule (pas de creation/modification)
```

---

## Evolutions Futures

### Contraintes

Toutes les futures taches devront rester dans ce cadre :

- Notifications push (Agent / Client)
- App Client (consultation contrats, amendes)
- Exploitation avancee des charges (rentabilite vehicule)
- Optimisations UX / performance
- Securite, RGPD, audit, logs

### Interdictions

Aucune evolution ne doit :

- Remettre en cause la structure actuelle
- Creer de redondance
- Deplacer la logique metier hors du backend
- Dupliquer des donnees
- Creer des automatismes bloquants
- Casser la backward compatibility
- Utiliser des librairies externes payantes

---

## Matrice des Responsabilites

### Back-office Agence

| Fonctionnalite | Responsabilite | MANAGER | AGENT |
|----------------|---------------|:-------:|:-----:|
| Planning global vehicules | Gestion | Oui | Lecture |
| Creation location | Gestion | Oui | Oui |
| Consultation locations | Lecture | Oui | Oui |
| Gestion vehicules (CRUD) | Gestion | Oui | Lecture seule |
| Gestion clients | Gestion | Oui | Oui |
| Module Charges | Gestion | Oui | **Non** |
| Module Amendes | Gestion | Oui | **Non** |
| Maintenance | Gestion | Oui | **Non** |
| Factures | Gestion | Oui | **Non** |
| Contrats | Gestion | Oui | **Non** |
| Journal | Lecture | Oui | **Non** |
| KPI / GPS Eco | Lecture | Oui | **Non** |
| Taches agents | - | Non | Non |

### Application Mobile Agent

| Fonctionnalite | Responsabilite | Acces |
|----------------|---------------|-------|
| Planning taches agents | Consultation | Agent |
| Execution check-in | Gestion | Agent |
| Execution check-out | Gestion | Agent |
| Prise photos | Gestion | Agent |
| Signatures | Gestion | Agent |
| Consultation bookings | Lecture | Agent |
| Charges | Pas d'acces | - |
| Amendes | Pas d'acces | - |
| Flotte globale | Pas d'acces | - |

### Backend (API)

| Fonctionnalite | Responsabilite |
|----------------|---------------|
| Source de verite | Unique source |
| Logique metier | Toute la logique |
| Generation automatique | Contrats, occupations |
| Traitement amendes | Identification automatique |
| Calcul taches | Derivation depuis bookings |
| Validation | Toutes les validations |
| Securite | Authentification, autorisation |
| Alertes vehicule | Calcul age et alertes |

---

## Glossaire et Definitions

### Location (Booking)

**Definition** : Entite centrale representant la reservation d'un vehicule par un client pour une periode donnee.

**Caracteristiques** :
- Genere automatiquement un contrat
- Genere automatiquement une occupation vehicule
- Genere automatiquement des actions terrain (check-in/check-out)

**Statuts** : PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED

### Contrat

**Definition** : Document contractuel genere automatiquement a la creation d'une location.

**Caracteristiques** :
- 1 location = 1 contrat
- Signature horodatee et tracable
- Signature immediate (agence) ou differee (terrain)

### Tache Agent

**Definition** : Tache derivee d'une location, visible uniquement dans l'app Agent.

**Caracteristiques** :
- **Non persistee** en base de donnees
- Calculee a la volee depuis les bookings
- Types : "Livraison / Check-in" ou "Recuperation / Check-out"

### Charges

**Definition** : Module de gestion des charges liees aux vehicules.

**Caracteristiques** :
- Rattache au vehicule (vehicleId obligatoire, pas au client)
- Categories : assurance, vignette, mensualite bancaire, maintenance preventive/corrective, carburant, exceptionnelle, autre
- Acces : Manager / Gerant uniquement

### Amendes

**Definition** : Module de gestion des amendes recues par l'agence.

**Caracteristiques** :
- Module distinct des charges
- Agence = intermediaire administratif
- Identification automatique du client responsable
- Statuts : RECUE → CLIENT_IDENTIFIE → TRANSMISE → CONTESTEE → CLOTUREE
- Acces : Manager / Gerant uniquement

### Heritage Dynamique (Gerant Solo)

**Definition** : Mecanisme permettant au COMPANY_ADMIN de combler automatiquement les roles manquants dans sa company.

**Caracteristiques** :
- Basé sur la detection des utilisateurs existants
- Seul → fait tout (Manager + Agent)
- A des agents → reste Manager
- A des managers → devient Agent
- A les deux → mode entreprise normal
- Transition automatique et instantanee

### Planning Global Vehicules

**Definition** : Vue d'ensemble de l'etat de tous les vehicules de l'agence.

**Caracteristiques** :
- Composant timeline custom (pas FullCalendar)
- Etats : AVAILABLE, RESERVED, RENTED, IN_DELIVERY, IN_RECOVERY, IN_MAINTENANCE, OUT_OF_SERVICE
- Filtres : agence, vehicule, marque, statut, type, recherche
- Vues : jour, semaine, mois
- Ne contient pas les taches detaillees des agents

---

## Checklist de Conformite

Avant toute implementation, verifier :

- [ ] La regle respecte-t-elle "MALOC = source de verite" ?
- [ ] La location reste-t-elle le pivot central ?
- [ ] Y a-t-il duplication de donnees ?
- [ ] La logique metier est-elle dans le backend ?
- [ ] Y a-t-il des automatismes bloquants ?
- [ ] L'evolution est-elle backward compatible ?
- [ ] Les responsabilites sont-elles bien separees ?
- [ ] Charges et Amendes restent-ils distincts ?
- [ ] L'evolution est-elle compatible avec la future app client ?
- [ ] Aucune librairie externe payante n'est utilisee ?
- [ ] Les restrictions AGENT sont respectees (3 niveaux) ?
- [ ] L'heritage dynamique COMPANY_ADMIN est-il pris en compte ?
- [ ] Le bookingNumberMode (AUTO/MANUAL) est-il respecte ?
- [ ] Le vehicule reste-t-il scope a 1 seule agence (pas de partage) ?
- [ ] Le soft delete est-il utilise pour les entites sensibles ?
- [ ] L'action est-elle tracee dans AuditLog et/ou BusinessEventLog ?
- [ ] Les regles de depot (deposit) sont-elles respectees ?

---

**Document approuve par** :
- CTO
- DSI
- MOA
- Tech Lead

**Date d'approbation initiale** : 2024
**Derniere mise a jour** : 28 Janvier 2026
**Version** : 2.1.0
