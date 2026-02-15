MalocAuto — Documentation Fonctionnelle & Technique (Master Spec)

Version : 2.1 — Stable
Derniere mise a jour : 28 Janvier 2026
Auteur : Hamza KHAMLICHI
Destinee a : Developpeurs Cursor

---

## 1. Vision du Produit

MalocAuto est un SaaS B2B destine aux entreprises de location de voitures afin de gerer :

- Leur flotte automobile
- Leurs agences
- Leurs utilisateurs
- Leurs clients
- Leurs contrats de location (auto-generes)
- Leurs amendes (avec auto-identification)
- Leur maintenance
- Leurs charges vehicules
- Un planning professionnel des vehicules (composant custom timeline)
- Des roles et permissions complexes (multi-tenant + multi-agences)
- Un heritage dynamique de roles pour le gerant solo

Le systeme est concu pour permettre a une entreprise cliente d'avoir une ou plusieurs agences, chacune pouvant fonctionner independamment tout en partageant certaines ressources (utilisateurs, vehicules...).

---

## 2. Architecture generale

### Architecture SaaS Multi-Tenant (Entreprise / Agences)

**SUPER_ADMIN (SaaS)**
- Gere les entreprises clientes (Companies)
- Gere la facturation et les modules
- Gere l'etat des comptes (active/desactive)

**COMPANY_ADMIN**
- Admin d'une entreprise cliente
- Peut creer/agencer ses agences
- Peut creer des utilisateurs et leur attribuer des agences
- **Heritage dynamique** : comble les roles manquants (voir section 4bis)

**AGENCY_MANAGER**
- Gere une seule ou plusieurs agences
- Gere les vehicules, locations, amendes, maintenance, contrats, factures, journal, KPI
- Gere les agents de son agence

**AGENT**
- Profil operationnel (terrain)
- Peut creer des locations et gerer des clients
- Consultation vehicules (lecture seule)
- **Acces restreint** : pas d'amendes, charges, maintenance, factures, contrats, journal, KPI

> Un utilisateur peut etre rattache a plusieurs agences.

---

## 3. Modele de donnees (Prisma Schema)

### Company

Une entreprise cliente du SaaS.

```
Company {
  id, name, slug, raisonSociale, identifiantLegal, formeJuridique
  phone?, address?, isActive, status, currency, maxAgencies
  bookingNumberMode, logoUrl, secondaryColor, faviconUrl
  suspendedAt?, suspendedReason?
  deletedAt?, createdByUserId?, updatedByUserId?, deletedByUserId?, deletedReason?
  createdAt, updatedAt
  agencies[], users[]
}
```

### Agency

Une entreprise peut avoir plusieurs agences.

```
Agency {
  id, name, companyId (FK Company)
  phone?, address?, status, timezone?, capacity?
  suspendedAt?, suspendedReason?
  createdAt, updatedAt
  vehicles[], bookings[], fines[], maintenance[], userAgencies[]
}
```

### User

Un utilisateur du systeme.

```
User {
  id, email, password, name
  role (SUPER_ADMIN | COMPANY_ADMIN | AGENCY_MANAGER | AGENT)
  companyId? (FK Company), isActive
  twoFactorSecret?, twoFactorEnabled
  createdAt, updatedAt
  userAgencies[]
}
```

### UserAgency (N-N)

Un utilisateur peut appartenir a 1 ou plusieurs agences.

```
UserAgency {
  id, userId (FK User), agencyId (FK Agency)
  permissions[] (UserAgencyPermission)
  @@unique([userId, agencyId])
}
```

### Vehicle

```
Vehicle {
  id, agencyId, registrationNumber, brand, model, year, color?
  mileage, fuel?, gearbox?, dailyRate, depositAmount
  status (VehicleStatus), imageUrl?
  createdAt, updatedAt
  bookings[], maintenance[], charges[]
}

enum VehicleStatus {
  AVAILABLE, RENTED, IN_MAINTENANCE, OUT_OF_SERVICE,
  RESERVED, IN_DELIVERY, IN_RECOVERY
}
```

### Client

```
Client {
  id, agencyId, firstName, lastName, email?, phone?, address?
  licenseNumber?, licenseExpiry?, idNumber?, idType?
  dateOfBirth?, nationality?, note?, isActive
  createdAt, updatedAt
  bookings[]
}
```

### Booking

```
Booking {
  id, bookingNumber, agencyId, vehicleId, clientId
  startDate, endDate, totalPrice, dailyRate
  status (BookingStatus), pickupLocation?, returnLocation?
  depositRequired, depositAmount, depositDecisionSource?
  notes?, createdByUserId?, updatedByUserId?
  createdAt, updatedAt
  fines[], contract?
}

enum BookingStatus {
  PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
}
```

### Contract

```
Contract {
  id, bookingId (FK Booking), contractNumber
  signedAt?, signedByName?, signatureData?
  terms?, createdAt, updatedAt
}
```

> **Auto-generation** : Un contrat est cree automatiquement a la creation d'un booking.

### Fine (Amendes)

```
Fine {
  id, agencyId, bookingId? (optionnel), vehicleId?
  clientId?, secondaryDriverId?
  amount, description
  status (FineStatus), infractionDate?, registrationNumber?
  createdAt
}

enum FineStatus {
  RECUE, CLIENT_IDENTIFIE, TRANSMISE, CONTESTEE, CLOTUREE
}
```

> **Auto-identification** : A la creation, le systeme identifie automatiquement le vehicule, la location active, et le client responsable via le numero d'immatriculation et la date d'infraction.

### Charge

```
Charge {
  id, agencyId, vehicleId (OBLIGATOIRE)
  amount, description, category (ChargeCategory)
  date, createdAt
}

enum ChargeCategory {
  INSURANCE, VIGNETTE, BANK_INSTALLMENT,
  PREVENTIVE_MAINTENANCE, CORRECTIVE_MAINTENANCE,
  FUEL, EXCEPTIONAL, OTHER
}
```

### Maintenance

```
Maintenance {
  id, agencyId, vehicleId
  description, plannedAt?, completedAt?, cost?
  status (MaintenanceStatus)
  createdAt
}
```

---

## 4. Gestion des roles & permissions

| Action | SUPER_ADMIN | COMPANY_ADMIN | AGENCY_MANAGER | AGENT |
|--------|:-----------:|:-------------:|:--------------:|:-----:|
| Creer entreprise | Oui | - | - | - |
| Creer agence | - | Oui | - | - |
| Creer utilisateurs | - | Oui | Partiel | - |
| Gerer flotte (CRUD) | - | Partiel | Oui | Lecture seule |
| Gerer locations | - | Partiel | Oui | Oui |
| Gerer clients | - | Partiel | Oui | Oui |
| Gerer amendes | - | Partiel | Oui | **Non** |
| Gerer charges | - | Partiel | Oui | **Non** |
| Gerer maintenance | - | Partiel | Oui | **Non** |
| Factures / Contrats | - | Partiel | Oui | **Non** |
| Journal / KPI | - | Partiel | Oui | **Non** |
| Acceder planning | - | Partiel | Oui | Oui |

> **Partiel** pour COMPANY_ADMIN = heritage dynamique (voir ci-dessous)

---

## 4bis. Heritage Dynamique COMPANY_ADMIN (Gerant Solo)

Le COMPANY_ADMIN comble dynamiquement les roles manquants dans sa company :

| Situation | Role herite | Menus agence |
|-----------|-------------|--------------|
| Aucun autre utilisateur (solo) | Manager + Agent | Tous les menus agence |
| A des agents, pas de manager | Manager | Menus manager uniquement |
| A des managers, pas d'agent | Agent | Menus agent uniquement |
| A manager + agent | Aucun | Pas de menus agence |

Le passage est automatique et instantane au chargement de page.

---

## 4ter. Regles Metier Transversales (Figees)

### Numero de Booking (bookingNumberMode)

- Company a un mode : `AUTO` (defaut) ou `MANUAL`
- AUTO : format `AAAA` + 6 chiffres, sequence atomique, reset annuel
- MANUAL : obligatoire, alphanum, max 32 chars, normalise uppercase
- Unicite : `@@unique([companyId, bookingNumber])` (niveau Company)
- Verrouillage apres emission facture
- Recherche/filtre disponible dans planning + listings

### Modele Vehicule-Agence

- **Decision figee : 1 vehicule = 1 agence** (Option A simple)
- `Vehicle.agencyId` est obligatoire
- Pas de table VehicleAgency ni de partage cross-agence
- Transfert possible via update de agencyId (tracabilite BusinessEventLog)
- Visibilite multi-agence = permissions utilisateur (pas propriete vehicule)

### Perimetres Planning

- `/company/planning` : COMPANY_ADMIN voit TOUTES ses agences (filtre optionnel)
- `/agency/planning` : MANAGER/AGENT voient UNIQUEMENT leurs agences (UserAgency)
- Backend calcule `accessibleAgencyIds` selon le role

### Depot (Deposit)

- `depositRequired` (bool), `depositAmount` (decimal), `depositDecisionSource` (COMPANY | AGENCY)
- Si depositRequired=true → amount + source obligatoires
- Check-in bloque si depot requis et pas collecte
- AGENT ne peut pas modifier le depot

### Soft Delete

- AVEC deletedAt : Company, Agency, User, Vehicle, Client, Booking, Maintenance
- Hard delete : Fine*, Charge* (*migration soft delete prevue), JournalEntry, tokens
- Filtre standard : `deletedAt: null` dans toutes les requetes

### Audit (Double Systeme)

- `AuditLog` : actions techniques (LOGIN, CREATE, UPDATE, DELETE, BOOKING_STATUS_CHANGE) + IP/UserAgent
- `BusinessEventLog` : evenements metier (30+ types) avec previousState/newState en JSON
- Couverture : connexion, CRUD, changements statut, signatures, modules

### Detection Booking pour Amendes

- Match : `startDate <= infractionDate <= endDate` (bornes inclusives)
- Filtre statut : CONFIRMED, IN_PROGRESS, COMPLETED (exclut CANCELLED/PENDING)
- Multiples matchs : prend le plus recent (orderBy startDate DESC)
- Pas de match : statut reste RECUE, bookingId=null

### Permissions "Partiel" COMPANY_ADMIN

- Champ calcule : `effectiveAgencyRole = BOTH | AGENCY_MANAGER | AGENT | null`
- Mapping menus sidebar + mapping API backend
- Voir section 4bis Heritage Dynamique

---

## 5. Fonctionnalites principales

### Backoffice SaaS (SUPER_ADMIN)

- Liste des entreprises clientes
- Activation/desactivation d'un client
- Envoi automatique d'email lors de la creation d'une entreprise
- Gestion des modules (options premium)
- Dashboard SaaS, Sante comptes

### Espace Entreprise (COMPANY_ADMIN)

- Creation & gestion des agences
- Creation des utilisateurs (manager / agent)
- Attribution multi-agences
- Planning entreprise
- Analytics (si module actif)
- Heritage dynamique des menus agence (si gerant solo)

### Espace Agence (Manager & Agents)

- Voir la flotte (CRUD pour manager, lecture pour agent)
- Creer et gerer les contrats (manager)
- Creer et gerer les clients (manager + agent)
- Creer et gerer les locations (manager + agent)
- Enregistrer les amendes avec auto-identification (manager)
- Gerer les charges vehicules (manager)
- Voir et creer des interventions maintenance (manager)
- Visualiser le planning des vehicules (tous)
- KPI, GPS Eco, Journal, Factures (manager)

---

## 6. Planning des vehicules

### Composant

**Composant custom timeline** (`PlanningBoard.tsx`) — PAS FullCalendar (payant).

### Affichage

- Chaque ligne = un vehicule
- Chaque evenement = une location, maintenance, preparation, ou autre

### Couleurs

| Type | Couleur |
|------|---------|
| Location | Bleu |
| Maintenance | Rouge |
| Preparation | Vert |
| Autre | Gris |

### Vues

- Jour (creneaux 30 min, 6h-22h)
- Semaine (7 jours)
- Mois (jours du mois)

### Filtres

- Par agence (dropdown)
- Par vehicule (dropdown)
- Par marque (dropdown dynamique)
- Par statut vehicule (dropdown dynamique)
- Par type evenement (boutons toggle : Booking, Maintenance, Prepa, Autres)
- Recherche textuelle (numero booking, client, plaque, modele)
- Bouton Reinitialiser (visible si filtres actifs)

---

## 7. Ligne directrice Design

**Style general** : Moderne, sombre chic, minimaliste (comme Stripe Dashboard)

**Couleurs** :
- #1D1F23 (fond principal)
- #2C2F36 (cartes)
- #3E7BFA (primaire bleu electrique)
- #E5E7EB (texte secondaire)

**Navigation** :
- Barre laterale fixe (256px)
- Header avec informations utilisateur
- Boutons arrondis, icones Lucide

---

## 8. Stack Technique

### Backend
- NestJS (Node.js)
- Prisma ORM
- PostgreSQL
- JWT Auth + Bcrypt hashing
- Nodemailer (emails)
- Guards : JwtAuthGuard, RolesGuard, PermissionGuard

### Frontend Web (principal)
- Next.js 14 (App Router)
- TailwindCSS
- React Query (TanStack)
- Axios
- Composant PlanningBoard custom (pas FullCalendar)

### Frontend Admin / Agency (secondaires)
- React + Vite
- TailwindCSS
- React Query, Axios

### Mobile Agent
- Expo / React Native
- SQLite (offline)
- Mode offline complet

---

## 9. Securite (RBAC 3 niveaux)

1. **Middleware Next.js** : Protection serveur des routes
2. **RouteGuard** : Protection client par page
3. **Backend Guards** : JwtAuthGuard + RolesGuard + PermissionGuard

**AGENT restrictions API** :
- Modules interdits : fines, maintenance, charges, analytics, journal, invoices, contracts, gps
- Lecture : clients, bookings, vehicles, planning
- CRUD : clients, bookings
- Aucune suppression

---

## 10. Tests

Types prevus :
- Tests API (e2e)
- Tests de permission (RBAC)
- Tests d'integration Prisma
- Tests regles metier

---

## FIN DU DOCUMENT

Ce document represente l'integralite de la vision fonctionnelle et technique du projet MalocAuto.
Il doit etre considere comme la source officielle pour la generation du code dans Cursor.

Version 2.1 — Mise a jour le 28 Janvier 2026
