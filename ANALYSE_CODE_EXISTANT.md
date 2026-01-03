# 📊 Analyse du Code Existant - MalocAuto SaaS

**Date:** Décembre 2024  
**Objectif:** Identifier ce qui existe, ce qui est partiel, et ce qui manque pour la mise à jour SaaS complète

---

## ✅ CE QUI EXISTE DÉJÀ

### 1. Base de Données (Prisma Schema)

#### ✅ Modèles Core
- **Company** : Existe avec `isActive` (Boolean), soft delete, audit fields
- **Agency** : Existe avec soft delete, audit fields
- **User** : Existe avec rôles (SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER, AGENT)
- **UserAgency** : Existe pour lier User ↔ Agency (mais **PAS de permissions READ/WRITE/FULL**)

#### ✅ Enums Existants
- `Role` : SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER, AGENT ✅
- `VehicleStatus` : AVAILABLE, RENTED, MAINTENANCE, UNAVAILABLE ✅
- `BookingStatus` : DRAFT, PENDING, CONFIRMED, IN_PROGRESS, LATE, RETURNED, CANCELLED, NO_SHOW ✅
- `PaymentStatus` : PENDING, PAID, FAILED, REFUNDED, PARTIAL ✅
- `PaymentMethod` : ONLINE_CMI, CASH, BANK_TRANSFER, OTHER ✅

#### ✅ Modèles Métier
- Vehicle, Client, Booking, Maintenance, Fine ✅
- Payment (pour paiements de location) ✅
- PlanningEvent, Document, Incident ✅
- AuditLog, BusinessEventLog ✅
- Notification, BusinessRule ✅

### 2. Backend (NestJS)

#### ✅ Guards Existants
- `JwtAuthGuard` : Authentification JWT ✅
- `RolesGuard` : Vérification des rôles ✅
- `ReadOnlyGuard` : Protection mode lecture seule ✅
- `PermissionService` : Service pour vérifier accès agence ✅

#### ✅ Services Existants
- CompanyService, AgencyService, UserService ✅
- VehicleService, ClientService, BookingService ✅
- MaintenanceService, FineService ✅
- PaymentService (pour paiements location) ✅
- AnalyticsService ✅
- AuditService, BusinessEventLogService ✅

#### ✅ Modules NestJS
- Tous les modules métier existent ✅
- PrismaModule global ✅
- AuthModule avec JWT ✅

### 3. Frontend

#### ✅ Applications
- **Admin** (Super Admin) : Existe ✅
- **Company** : Existe ✅
- **Agency** : Existe ✅

#### ✅ Composants UI
- FormCard, StatCard, Button, Badge, etc. ✅
- RouteGuard pour protection des routes ✅

---

## ⚠️ CE QUI EST PARTIEL

### 1. Statuts Company/Agency

#### ⚠️ Company
- **Existe** : `isActive` (Boolean)
- **Manque** : Enum `CompanyStatus` (ACTIVE, SUSPENDED, DELETED)
- **Manque** : Champs `status`, `suspendedAt`, `suspendedReason`, `deletedAt` (existe mais pas utilisé pour cycle de vie)
- **Manque** : Logique de suspension automatique (J+90, J+100)

#### ⚠️ Agency
- **Existe** : `deletedAt` (soft delete)
- **Manque** : Enum `AgencyStatus` (ACTIVE, SUSPENDED, DELETED)
- **Manque** : Champs `status`, `suspendedAt`, `suspendedReason`
- **Manque** : Champs métier (devise, fuseau horaire, capacité)

### 2. Permissions UserAgency

#### ⚠️ UserAgency
- **Existe** : Lien User ↔ Agency
- **Manque** : Champ `permission` (READ, WRITE, FULL)
- **Manque** : Historique des changements de permissions

### 3. États Métier

#### ⚠️ BookingStatus
- **Existe** : DRAFT, PENDING, CONFIRMED, IN_PROGRESS, LATE, RETURNED, CANCELLED, NO_SHOW
- **Manque** : `EXTENDED` (prolongation)

#### ⚠️ VehicleStatus
- **Existe** : AVAILABLE, RENTED, MAINTENANCE, UNAVAILABLE
- **Manque** : `TEMP_UNAVAILABLE` (temporairement indisponible)

---

## ❌ CE QUI MANQUE COMPLÈTEMENT

### 1. Facturation SaaS

#### ❌ Modèles Prisma
- **Subscription** : Abonnements Company
- **SubscriptionModule** : Modules inclus dans l'abonnement
- **Payment** (SaaS) : Paiements d'abonnement (différent de Payment location)
- **CompanyModule** : Modules activés par Company
- **AgencyModule** : Modules activés par Agency
- **ModuleDependency** : Dépendances entre modules

#### ❌ Enums
- `CompanyStatus` : ACTIVE, SUSPENDED, DELETED
- `AgencyStatus` : ACTIVE, SUSPENDED, DELETED
- `SubscriptionStatus` : ACTIVE, SUSPENDED, EXPIRED, CANCELLED
- `ModuleCode` : VEHICLES, BOOKINGS, INVOICES, MAINTENANCE, FINES, ANALYTICS
- `BillingPeriod` : MONTHLY, QUARTERLY, YEARLY
- `UserAgencyPermission` : READ, WRITE, FULL

### 2. Guards Backend

#### ❌ Guards Manquants
- `RequireActiveCompanyGuard` : Vérifie Company.status = ACTIVE
- `RequireActiveAgencyGuard` : Vérifie Agency.status = ACTIVE
- `RequireModuleGuard` : Vérifie que le module est activé
- `RequirePermissionGuard` : Vérifie READ/WRITE/FULL par agence

### 3. Services Backend

#### ❌ Services Manquants
- `SubscriptionService` : CRUD abonnements
- `ModuleService` : Gestion activation/désactivation modules
- `BillingService` : Génération factures, gestion paiements
- `NotificationService` (SaaS) : Notifications facturation (existe pour notifications générales)

### 4. Cron Jobs

#### ❌ Cron Jobs Manquants
- Suspension automatique (paiement non reçu)
- Suppression définitive (J+100)
- Génération factures récurrentes
- Notifications avant expiration

### 5. Frontend

#### ❌ Super Admin
- Vue facturation SaaS
- Écran santé du compte
- Actions suspendre/restaurer/prolonger

#### ❌ Company Admin
- Formulaire Agency enrichi (statut, devise, fuseau, capacité, modules)
- Formulaire User enrichi (permissions par agence READ/WRITE/FULL)
- Dashboard avec alertes paiement, jours restants

---

## 📋 RÉCAPITULATIF PAR CATÉGORIE

### Base de Données
| Élément | Statut | Détails |
|---------|--------|---------|
| Company | ⚠️ Partiel | `isActive` existe, mais pas de statut enum ni cycle de vie |
| Agency | ⚠️ Partiel | Soft delete existe, mais pas de statut enum ni champs métier |
| UserAgency | ⚠️ Partiel | Lien existe, mais pas de permissions READ/WRITE/FULL |
| Subscription | ❌ Manque | Modèle complet à créer |
| SubscriptionModule | ❌ Manque | Modèle complet à créer |
| Payment (SaaS) | ❌ Manque | Différent de Payment location |
| CompanyModule | ❌ Manque | Modules activés par Company |
| AgencyModule | ❌ Manque | Modules activés par Agency |
| ModuleDependency | ❌ Manque | Dépendances entre modules |

### Backend
| Élément | Statut | Détails |
|---------|--------|---------|
| Guards RBAC | ✅ Existe | RolesGuard, JwtAuthGuard |
| Guards Modules | ❌ Manque | RequireModuleGuard, RequireActiveCompanyGuard, etc. |
| Services Métier | ✅ Existe | Tous les services CRUD existent |
| Services Facturation | ❌ Manque | SubscriptionService, BillingService, ModuleService |
| Cron Jobs | ❌ Manque | Suspension, suppression, facturation récurrente |
| Notifications | ⚠️ Partiel | NotificationService existe, mais pas pour facturation SaaS |

### Frontend
| Élément | Statut | Détails |
|---------|--------|---------|
| Applications | ✅ Existe | Admin, Company, Agency |
| Composants UI | ✅ Existe | FormCard, StatCard, Button, etc. |
| Vue Facturation | ❌ Manque | Super Admin |
| Formulaires enrichis | ❌ Manque | Agency (statut, devise, etc.), User (permissions) |
| Dashboard alertes | ❌ Manque | Company Admin |

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1 : Base de Données (Priorité: CRITIQUE)
1. Ajouter enums manquants
2. Ajouter modèles Subscription, Payment (SaaS), Modules
3. Enrichir Company/Agency avec statuts
4. Enrichir UserAgency avec permissions
5. Créer migrations progressives

### Phase 2 : Backend Guards (Priorité: HAUTE)
1. Créer RequireActiveCompanyGuard
2. Créer RequireActiveAgencyGuard
3. Créer RequireModuleGuard
4. Créer RequirePermissionGuard
5. Appliquer aux endpoints existants (rétrocompatible)

### Phase 3 : Services Facturation (Priorité: HAUTE)
1. Créer SubscriptionService
2. Créer ModuleService
3. Créer BillingService
4. Intégrer avec PaymentService existant

### Phase 4 : Cron Jobs (Priorité: MOYENNE)
1. Suspension automatique
2. Suppression définitive
3. Génération factures
4. Notifications

### Phase 5 : Frontend (Priorité: MOYENNE)
1. Super Admin - Vue facturation
2. Company Admin - Formulaires enrichis
3. Dashboard alertes

### Phase 6 : Tests (Priorité: HAUTE)
1. Tests unitaires guards
2. Tests intégration facturation
3. Tests E2E cycle de vie

---

## ⚠️ POINTS D'ATTENTION

### Rétrocompatibilité
- ✅ `isActive` (Boolean) doit rester fonctionnel
- ✅ Les endpoints existants doivent continuer à fonctionner
- ✅ Migration progressive des données

### Données Existantes
- Les Companies existantes doivent avoir `status = ACTIVE` par défaut
- Les Agencies existantes doivent avoir `status = ACTIVE` par défaut
- Les UserAgency existants doivent avoir `permission = FULL` par défaut

### Performance
- Les guards doivent être optimisés (cache si nécessaire)
- Les vérifications de modules ne doivent pas ralentir les requêtes

---

## 📝 QUESTIONS À POSER AVANT DE CODER

1. **Facturation** : Y a-t-il un système de paiement en ligne existant à intégrer ?
2. **Modules** : Les modules sont-ils activés au niveau Company ou Agency ?
3. **Prix** : Y a-t-il des tarifs différents par module ou forfait global ?
4. **Notifications** : Quels canaux utiliser (email, in-app, les deux) ?
5. **Devise** : Toutes les agences d'une Company ont-elles la même devise ?
6. **Fuseau horaire** : Par Company ou par Agency ?

---

**Prochaine étape** : Attendre validation avant de commencer l'ÉTAPE 2 (Base de Données)


