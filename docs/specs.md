# Spécification Technique — MalocAuto

> **Version** : 3.0.0  
> **Date** : 15 février 2026  
> **Public** : Développeurs, Cursor AI, CI/CD  

---

## 1. Architecture technique

### 1.1 Stack

| Couche | Tech | Version |
|--------|------|---------|
| Backend | NestJS + TypeScript | 10.x |
| ORM | Prisma | 5.x |
| DB | PostgreSQL | 15+ |
| Frontend Web | Next.js (App Router) | 14.x |
| Mobile | React Native (Expo) | SDK 50 |
| Auth | JWT (jsonwebtoken) + bcryptjs | — |
| PDF | PDFKit | — |
| Map | Leaflet + react-leaflet@4 | — |
| HTTP Client | Axios (frontend) | — |
| State | TanStack Query v5 | — |
| CSS | TailwindCSS | 3.x |

### 1.2 Ports

| App | Port |
|-----|------|
| Backend API | 3000 |
| Frontend Web | 3100 |

### 1.3 Structure des répertoires

```
MALOC/
├── backend/
│   ├── prisma/           # Schema + migrations + seed
│   ├── src/
│   │   ├── common/       # Guards, decorators, services, filters, interceptors
│   │   ├── modules/      # 1 dossier par domaine (controller + service + dto + spec)
│   │   ├── utils/        # bcrypt, jwt, prisma, constants
│   │   └── main.ts
│   └── test/             # E2E tests
├── frontend-web/
│   ├── app/              # Next.js App Router pages
│   │   ├── admin/        # Pages SUPER_ADMIN
│   │   ├── agency/       # Pages agence (manager + agent)
│   │   ├── company/      # Pages COMPANY_ADMIN
│   │   └── login/
│   ├── components/       # Composants réutilisables
│   └── lib/              # API clients, utils, hooks
├── mobile-agent/         # React Native (Expo)
└── docs/                 # Ce fichier
```

### 1.4 Préfixe API

Toutes les routes backend sont préfixées par `/api/v1`. Exemple : `GET /api/v1/bookings`.

---

## 2. Modèle de données

### 2.1 Enums

```
Role:              SUPER_ADMIN | COMPANY_ADMIN | AGENCY_MANAGER | AGENT
VehicleStatus:     AVAILABLE | RESERVED | RENTED | IN_DELIVERY | IN_RECOVERY | MAINTENANCE | UNAVAILABLE | TEMP_UNAVAILABLE
BookingStatus:     DRAFT | PENDING | CONFIRMED | IN_PROGRESS | EXTENDED | LATE | RETURNED | CANCELLED | NO_SHOW
MaintenanceStatus: PLANNED | IN_PROGRESS | COMPLETED | CANCELLED
PlanningEventType: BOOKING | MAINTENANCE | BLOCKAGE | PREPARATION_TIME
FineStatus:        RECUE | CLIENT_IDENTIFIE | TRANSMISE | CONTESTEE | CLOTUREE
ChargeCategory:    INSURANCE | VIGNETTE | BANK_INSTALLMENT | PREVENTIVE_MAINTENANCE | CORRECTIVE_MAINTENANCE | FUEL | EXCEPTIONAL | OTHER
ContractStatus:    DRAFT | PENDING_SIGNATURE | SIGNED | EXPIRED | CANCELLED
InvoiceStatus:     ISSUED | PAID | CANCELLED
InvoiceType:       INVOICE | CREDIT_NOTE
CompanyStatus:     ACTIVE | SUSPENDED | DELETED
AgencyStatus:      ACTIVE | SUSPENDED | DELETED
SubscriptionStatus: ACTIVE | SUSPENDED | EXPIRED | CANCELLED
PaymentStatus:     PENDING | PAID | FAILED | REFUNDED | PARTIAL
PaymentMethod:     ONLINE_CMI | CASH | BANK_TRANSFER | OTHER
BookingNumberMode: AUTO | MANUAL
UserAgencyPermission: READ | WRITE | FULL
ModuleCode:        VEHICLES | BOOKINGS | INVOICES | MAINTENANCE | FINES | ANALYTICS
IncidentType:      DAMAGE | FINE | ACCIDENT | THEFT | OTHER
IncidentStatus:    REPORTED | UNDER_REVIEW | RESOLVED | DISPUTED
GpsSnapshotReason: CHECK_IN | CHECK_OUT | INCIDENT | MANUAL
OutboxEventStatus: PENDING | PROCESSED | FAILED
AuditAction:       CREATE | UPDATE | DELETE | LOGIN | LOGOUT | EXPORT | IMPORT | PAYMENT | BOOKING_STATUS_CHANGE | OTHER
```

### 2.2 Modèles principaux

| Modèle | Clé | Relations principales | Soft Delete |
|--------|-----|----------------------|-------------|
| Company | cuid | agencies, users, subscriptions, bookings, invoices, charges | Oui |
| Agency | cuid | company, vehicles, bookings, clients, fines, charges | Oui |
| User | cuid | company?, userAgencies[] | Oui |
| UserAgency | cuid | user, agency + permission (READ/WRITE/FULL) | Non |
| Vehicle | cuid | agency, bookings, gpsSnapshots, charges | Oui |
| Client | cuid | agency, bookings, documents | Oui |
| Booking | cuid | agency, company, vehicle, client, invoices, contracts, gpsSnapshots | Oui |
| PlanningEvent | cuid | agency, vehicle?, booking?, maintenance? | Non |
| Maintenance | cuid | agency, vehicle, planningEvents | Oui |
| Fine | cuid | agency, booking? | Non (hard delete) |
| Charge | cuid | company, agency, vehicle | Non (hard delete) |
| Contract | cuid | booking | Non |
| Invoice | cuid | company, agency, booking, originalInvoice? | Non |
| GpsSnapshot | cuid | booking?, vehicle? | Non |
| JournalEntry | cuid | — (agencyId, companyId, bookingId, etc. en champs) | Non |
| Incident | cuid | agency, booking?, vehicle?, client? | Non |
| Payment | cuid | agency, booking | Non |
| AuditLog | cuid | user?, company? | Non |
| BusinessEventLog | cuid | agency?, company? | Non |
| OutboxEvent | cuid | — | Non |
| InAppNotification | cuid | user | Non |
| Subscription | cuid (unique companyId) | company, plan, subscriptionModules | Non |
| Plan | cuid | planModules, planQuotas | Non |

### 2.3 Contraintes d'unicité notables

```
Company.slug                          UNIQUE
Company.identifiantLegal              UNIQUE (nullable)
User.email                            UNIQUE
UserAgency(userId, agencyId)          UNIQUE
Booking(companyId, bookingNumber)     UNIQUE
Invoice(companyId, year, sequence)    UNIQUE
BookingNumberSequence(companyId, year) UNIQUE
InvoiceNumberSequence(companyId, year) UNIQUE
OutboxEvent.deduplicationKey          UNIQUE (nullable)
Subscription.companyId                UNIQUE (1 sub par company)
```

---

## 3. API Endpoints (inventaire complet)

> Préfixe global : `/api/v1`

### 3.1 Auth (`/auth`)

| Méthode | Route | Guards | Description |
|---------|-------|--------|-------------|
| POST | /auth/login | Throttle(5/min) | Login (email + password) |
| POST | /auth/refresh | — | Refresh token |
| GET | /auth/me | JwtAuth | Profil utilisateur courant |
| POST | /auth/forgot-password | Throttle(3/min) | Demande reset password |
| POST | /auth/reset-password | — | Reset avec token |
| POST | /auth/impersonate/:userId | JwtAuth | Impersonation (SUPER_ADMIN only) |

### 3.2 Companies (`/companies`)

| Méthode | Route | Rôles | Description |
|---------|-------|-------|-------------|
| GET | /companies | SUPER_ADMIN | Liste toutes les companies |
| GET | /companies/me | COMPANY_ADMIN, SUPER_ADMIN | Ma company |
| PATCH | /companies/me/settings | COMPANY_ADMIN, SUPER_ADMIN | Modifier settings |
| GET | /companies/:id | SUPER_ADMIN | Détail company |
| POST | /companies | SUPER_ADMIN | Créer company |
| PATCH | /companies/:id | SUPER_ADMIN | Modifier company |
| DELETE | /companies/:id | SUPER_ADMIN | Supprimer company |

### 3.3 Agencies (`/agencies`)

| Méthode | Route | Guards | Description |
|---------|-------|--------|-------------|
| GET | /agencies | JwtAuth, ReadOnly | Liste |
| GET | /agencies/:id | JwtAuth, ReadOnly | Détail |
| POST | /agencies | JwtAuth, ReadOnly | Créer |
| PATCH | /agencies/:id | JwtAuth, ReadOnly | Modifier |
| DELETE | /agencies/:id | JwtAuth, ReadOnly | Supprimer |

### 3.4 Users (`/users`)

| Méthode | Route | Rôles | Description |
|---------|-------|-------|-------------|
| GET | /users | SUPER_ADMIN, COMPANY_ADMIN | Liste |
| GET | /users/:id | Tous (filtré) | Détail |
| POST | /users | SUPER_ADMIN, COMPANY_ADMIN | Créer |
| PATCH | /users/:id | SUPER_ADMIN, COMPANY_ADMIN | Modifier |
| POST | /users/:id/reset-password | SUPER_ADMIN, COMPANY_ADMIN | Reset password |
| DELETE | /users/:id | SUPER_ADMIN | Supprimer |

### 3.5 Vehicles (`/vehicles`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /vehicles | — | Liste (filtré par agence) |
| GET | /vehicles/:id | — | Détail |
| POST | /vehicles | vehicles:create | Créer |
| PATCH | /vehicles/:id | vehicles:update + WRITE | Modifier |
| DELETE | /vehicles/:id | vehicles:delete + FULL | Supprimer |
| GET | /vehicles/search/brands | — | Autocomplétion marques |
| GET | /vehicles/search/models | — | Autocomplétion modèles |
| GET | /vehicles/search | — | Recherche globale |
| POST | /vehicles/upload-image | — | Upload image |

Module requis : `VEHICLES`

### 3.6 Clients (`/clients`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /clients | clients:read | Liste |
| GET | /clients/:id | clients:read | Détail |
| POST | /clients | clients:create | Créer |
| PATCH | /clients/:id | clients:update | Modifier |
| DELETE | /clients/:id | clients:delete | Supprimer |
| POST | /clients/upload-license | — | Upload permis |
| POST | /clients/analyze-license | — | Analyse IA permis |

### 3.7 Bookings (`/bookings`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| POST | /bookings | bookings:create + WRITE | Créer |
| GET | /bookings | bookings:read | Liste |
| GET | /bookings/:id | bookings:read | Détail |
| PATCH | /bookings/:id | bookings:update + WRITE | Modifier |
| DELETE | /bookings/:id | bookings:delete | Supprimer |
| POST | /bookings/:id/checkin | bookings:update + WRITE | Check-in |
| POST | /bookings/:id/checkout | bookings:update + WRITE | Check-out |
| POST | /bookings/:id/financial-closure | bookings:update + WRITE | Clôture financière |
| PATCH | /bookings/:id/late-fee | bookings:update + WRITE | Modifier frais retard |

Module requis : `BOOKINGS`

### 3.8 Planning (`/planning`)

| Méthode | Route | Guards | Description |
|---------|-------|--------|-------------|
| GET | /planning | JwtAuth | Liste événements |
| POST | /planning/check-availability | JwtAuth | Vérifier disponibilité |
| GET | /planning/next-availability/:vehicleId | JwtAuth | Prochaine dispo |
| POST | /planning/preparation-time | JwtAuth | Créer temps préparation |

### 3.9 Contracts (`/contracts`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /contracts | contracts:read | Liste |
| GET | /contracts/:id | contracts:read | Détail |
| GET | /contracts/:id/payload | contracts:read | Payload gelé |
| GET | /contracts/booking/:bookingId | contracts:read | Contrat par booking |
| POST | /contracts | contracts:create + WRITE | Créer |
| POST | /contracts/:id/sign | contracts:update | Signer |
| POST | /contracts/:id/new-version | contracts:create + FULL | Nouvelle version |
| PATCH | /contracts/:id/effective | contracts:update + WRITE | Rendre effectif |
| GET | /contracts/:id/pdf | contracts:read | Télécharger PDF |

Module requis : `BOOKINGS`

### 3.10 Invoices (`/invoices`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /invoices | invoices:read | Liste |
| GET | /invoices/:id | invoices:read | Détail |
| GET | /invoices/:id/payload | invoices:read | Payload gelé |
| POST | /invoices/booking/:bookingId/generate | invoices:create + WRITE | Générer facture |
| POST | /invoices/:id/credit-note | invoices:create + FULL | Créer avoir |
| PATCH | /invoices/:id/status | invoices:update + WRITE | Modifier statut |
| GET | /invoices/:id/pdf | invoices:read | Télécharger PDF |

Module requis : `BOOKINGS`

### 3.11 Fines (`/fines`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /fines | fines:read | Liste |
| GET | /fines/:id | fines:read | Détail |
| POST | /fines | fines:create + WRITE | Créer |
| PATCH | /fines/:id | fines:update + WRITE | Modifier |
| DELETE | /fines/:id | fines:delete | Supprimer |
| POST | /fines/upload-attachment | fines:create/update | Upload pièce jointe |

Module requis : `FINES`

### 3.12 Charges (`/charges`)

| Méthode | Route | Rôles | Description |
|---------|-------|-------|-------------|
| POST | /charges | SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER | Créer |
| GET | /charges | idem | Liste |
| GET | /charges/kpi | idem | KPI charges |
| GET | /charges/kpi/vehicles | idem | KPI par véhicule |
| GET | /charges/:id | idem | Détail |
| PATCH | /charges/:id | idem | Modifier |
| DELETE | /charges/:id | idem | Supprimer |

### 3.13 GPS (`/gps`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /gps | gps:read | Liste snapshots |
| GET | /gps/:id | gps:read | Détail |
| GET | /gps/booking/:bookingId | gps:read | Par booking |
| GET | /gps/vehicle/:vehicleId | gps:read | Par véhicule |
| POST | /gps | gps:create | Capture auto |
| POST | /gps/manual | gps:create + WRITE (managers) | Capture manuelle |
| POST | /gps/missing | gps:create | Signaler GPS manquant |
| GET | /gps/kpi/eco | gps:read | KPI éco-conduite |

Module requis : `VEHICLES`

### 3.14 Maintenance (`/maintenance`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /maintenance | maintenance:read | Liste |
| GET | /maintenance/:id | maintenance:read | Détail |
| POST | /maintenance | maintenance:create + WRITE | Créer |
| PATCH | /maintenance/:id | maintenance:update + WRITE | Modifier |
| DELETE | /maintenance/:id | maintenance:delete | Supprimer |
| POST | /maintenance/upload-document | maintenance:update | Upload document |

Module requis : `MAINTENANCE`

### 3.15 Incidents (`/incidents`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| POST | /incidents | incidents:create + WRITE | Créer |
| GET | /incidents | incidents:read | Liste |
| GET | /incidents/:id | incidents:read | Détail |
| PATCH | /incidents/:id/status | incidents:update + WRITE | Modifier statut |

Module requis : `BOOKINGS`

### 3.16 Journal (`/journal`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /journal | journal:read | Liste entrées |
| GET | /journal/:id | journal:read | Détail |
| POST | /journal/notes | journal:create + WRITE (managers) | Créer note manuelle |
| PATCH | /journal/notes/:id | journal:update + WRITE (managers) | Modifier note |
| DELETE | /journal/notes/:id | journal:delete + FULL (managers) | Supprimer note |

Module requis : `BOOKINGS`

### 3.17 Payments (`/payment`)

| Méthode | Route | Guards | Description |
|---------|-------|--------|-------------|
| POST | /payment/online | JwtAuth | Paiement CMI |
| POST | /payment/cash | JwtAuth | Paiement espèces |
| POST | /payment/cmi/callback | — (webhook) | Callback CMI |
| POST | /payment/deposit | JwtAuth | Paiement caution |
| GET | /payment/booking/:bookingId | JwtAuth | Paiements par booking |
| GET | /payment/:id | JwtAuth | Détail paiement |

### 3.18 Analytics (`/analytics`)

| Méthode | Route | Permissions | Description |
|---------|-------|-------------|-------------|
| GET | /analytics/global/kpis | analytics:read | KPI global (SUPER_ADMIN) |
| GET | /analytics/agency/:agencyId/kpis | analytics:read | KPI agence |

Module requis : `ANALYTICS`

### 3.19 Notifications

#### `/notifications` (Push/Email)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /notifications | Envoyer notification |
| GET | /notifications/history | Historique |
| POST | /notifications/device-token | Enregistrer token device |
| DELETE | /notifications/device-token | Supprimer token |
| GET | /notifications/config | Config |

#### `/notifications/in-app` (In-App)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /notifications/in-app | Liste |
| GET | /notifications/in-app/unread-count | Compteur non-lu |
| GET | /notifications/in-app/:id | Détail |
| PATCH | /notifications/in-app/:id/read | Marquer lu |
| POST | /notifications/in-app/read-all | Tout marquer lu |
| POST | /notifications/in-app/broadcast | Broadcast admin |

### 3.20 SaaS Admin

#### Subscriptions (`/subscriptions`)

| Méthode | Route | Rôles | Description |
|---------|-------|-------|-------------|
| POST | /subscriptions | SUPER_ADMIN | Créer |
| GET | /subscriptions | — | Liste |
| GET | /subscriptions/:id | — | Détail |
| PATCH | /subscriptions/:id | SUPER_ADMIN | Modifier |
| POST | /subscriptions/:id/suspend | SUPER_ADMIN | Suspendre |
| POST | /subscriptions/:id/restore | SUPER_ADMIN | Restaurer |
| POST | /subscriptions/:id/renew | SUPER_ADMIN | Renouveler |
| DELETE | /subscriptions/:id | SUPER_ADMIN | Supprimer |

#### Plans (`/plans`)

| Méthode | Route | Rôles | Description |
|---------|-------|-------|-------------|
| POST | /plans | SUPER_ADMIN | Créer plan |
| GET | /plans | — | Liste |
| GET | /plans/:id | — | Détail |
| PATCH | /plans/:id | SUPER_ADMIN | Modifier |
| DELETE | /plans/:id | SUPER_ADMIN | Supprimer |

#### Modules (`/modules`)

| Méthode | Route | Rôles | Description |
|---------|-------|-------|-------------|
| GET | /modules/company/:companyId | — | Modules company |
| GET | /modules/agency/:agencyId | — | Modules agence |
| GET | /modules/dependencies | SUPER_ADMIN | Dépendances |
| POST | /modules/company/:companyId/:code/activate | SUPER_ADMIN | Activer module company |
| DELETE | /modules/company/:companyId/:code | SUPER_ADMIN | Désactiver module company |
| POST | /modules/agency/:agencyId/:code/activate | COMPANY_ADMIN, SUPER_ADMIN | Activer module agence |
| DELETE | /modules/agency/:agencyId/:code | COMPANY_ADMIN, SUPER_ADMIN | Désactiver module agence |

#### Billing (`/billing`)

| Méthode | Route | Rôles | Description |
|---------|-------|-------|-------------|
| POST | /billing/subscription/:id/invoice | SUPER_ADMIN | Générer facture SaaS |
| PATCH | /billing/payment/:id/record | SUPER_ADMIN | Enregistrer paiement |
| GET | /billing/company/:companyId/invoices | — | Factures SaaS |
| GET | /billing/invoices/pending | SUPER_ADMIN | Factures en attente |

### 3.21 Autres

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /upload | Upload fichier générique |
| POST | /ai/damage/detect | Détection dommages IA |
| POST | /ai/damage/detect-batch | Détection batch IA |
| POST | /ai/chatbot/question | Question chatbot |
| GET | /ai/chatbot/faq | FAQ chatbot |

---

## 4. Guards et sécurité

### 4.1 Liste des 8 guards

| Guard | Décorateur associé | Rôle |
|-------|--------------------|------|
| `JwtAuthGuard` | `@UseGuards(JwtAuthGuard)` | Vérifie le token JWT |
| `RolesGuard` | `@Roles('SUPER_ADMIN', ...)` | Vérifie le rôle |
| `PermissionGuard` | `@Permissions('bookings:read', ...)` | Vérifie la permission module |
| `RequirePermissionGuard` | `@RequirePermission(UserAgencyPermission.WRITE)` | Vérifie le niveau d'accès agence |
| `RequireModuleGuard` | `@RequireModule(ModuleCode.BOOKINGS)` | Vérifie que le module est activé |
| `RequireActiveCompanyGuard` | implicite | Company non suspendue |
| `RequireActiveAgencyGuard` | implicite | Agency non suspendue |
| `ReadOnlyGuard` | `@ReadOnlySafe()` | Bloque les écritures en mode readonly |

### 4.2 Ordre d'application sur un controller typique

```typescript
@UseGuards(
  JwtAuthGuard,           // 1. Authentifié ?
  ReadOnlyGuard,          // 2. Mode lecture seule ?
  RequireActiveCompanyGuard, // 3. Company active ?
  RequireModuleGuard,     // 4. Module activé ?
  RequireActiveAgencyGuard,  // 5. Agency active ?
  PermissionGuard,        // 6. Permission module ?
)
```

### 4.3 JWT

- **Access token** : 1h, signé HS256, payload = `{ userId, email, role, companyId, agencyIds }`
- **Refresh token** : 7j, stocké en DB (`RefreshToken`)
- **Impersonation** : token avec `impersonatedBy` — le refresh d'un token d'impersonation lève `UnauthorizedException`
- **Rate limiting** : ThrottlerGuard sur login (5/min) et forgot-password (3/min)

### 4.4 Protections business

| Protection | Implémentation |
|------------|---------------|
| Self-modification bloquée | `user.service.ts` : empêche de modifier son propre rôle, isActive, agences |
| Sanitize user | `sanitizeUser()` retire password, resetToken, resetTokenExpiry des réponses |
| Cross-agency access | `assertBookingAccess()`, `enforceAgencyAccess()`, `assertEntryAccess()` |
| Planning ownership | `assertVehicleAccess()`, `assertAgencyAccess()` dans planning.controller |
| Outbox idempotent | Catch P2002 sur `deduplicationKey` → retourne l'ID existant |
| Blob interceptor | Axios interceptor skip le parsing JSON si `responseType === 'blob'` |
| Email PII | `recipient.replace(/(^.).*(@.*$)/, '$1***$2')` dans les logs |

---

## 5. Conventions de code

### 5.1 DTO (Data Transfer Objects)

- Chaque module a un dossier `dto/` avec `create-*.dto.ts` et `update-*.dto.ts`
- Validation via `class-validator` : `@IsString()`, `@IsEmail()`, `@IsOptional()`, `@IsIn([...])`, etc.
- Les UpdateDTO étendent `PartialType(CreateDTO)` ou sont définis indépendamment

### 5.2 Messages d'erreur

**Tous les messages d'erreur sont en français.** Exemples :

```
"Email introuvable"
"Mot de passe incorrect"
"Réservation introuvable"
"Vous ne pouvez pas modifier votre propre rôle"
"La société est suspendue. Veuillez contacter le support."
"L'identifiant légal existe déjà"
"Module BOOKINGS pas inclus dans l'abonnement"
"Nombre maximum d'agences atteint"
```

### 5.3 Soft delete

Entités avec soft delete : Company, Agency, User, Vehicle, Client, Booking, Maintenance.

```typescript
// Filtrage automatique
addSoftDeleteFilter() → ajoute { deletedAt: null } au where
```

Champs d'audit associés : `deletedByUserId`, `deletedReason`.

### 5.4 Champs d'audit

Chaque entité sensible porte :

```
createdByUserId  String?
updatedByUserId  String?
deletedByUserId  String?
deletedReason    String?
```

Ces champs sont retirés des réponses API par `removeAuditFields()`.

### 5.5 Timezone

Le fuseau horaire par défaut est `Africa/Casablanca`. L'année des factures est calculée via `getMoroccoYear()` pour éviter les décalages de frontière.

### 5.6 Devise

La devise est configurable par Company (`Company.currency`, défaut `MAD`). Elle doit être utilisée dynamiquement dans les PDF — jamais de "MAD" hardcodé.

---

## 6. Navigation sidebar (frontend)

### 6.1 Menus SUPER_ADMIN (`/admin/*`)

| Menu | Route |
|------|-------|
| Tableau de bord | /admin |
| Entreprises | /admin/companies |
| Abonnements | /admin/subscriptions |
| Planning | /admin/planning |
| Utilisateurs | /admin/users |
| Santé | /admin/company-health |
| Notifications | /admin/notifications |

### 6.2 Menus COMPANY_ADMIN (`/company/*`)

| Menu | Route |
|------|-------|
| Tableau de bord | /company |
| Agences | /company/agencies |
| Utilisateurs | /company/users |
| Analytics | /company/analytics |
| Planning | /company/planning |

En mode **solo operator** (seul utilisateur), les menus agence sont également affichés.

### 6.3 Menus Agence (`/agency/*`)

| Menu | Route | Rôles | Module |
|------|-------|-------|--------|
| Tableau de bord | /agency | Manager, Agent | — |
| Véhicules | /agency/vehicles | Manager, Agent | VEHICLES |
| Clients | /agency/clients | Manager, Agent | BOOKINGS |
| Réservations | /agency/bookings | Manager, Agent | BOOKINGS |
| Planning | /agency/planning | Manager, Agent | BOOKINGS |
| Factures | /agency/invoices | Manager | INVOICES |
| Contrats | /agency/contracts | Manager | BOOKINGS |
| Journal | /agency/journal | Manager | BOOKINGS |
| Amendes | /agency/fines | Manager | FINES |
| Charges & Dépenses | /agency/charges | Manager | VEHICLES |
| KPI | /agency/kpi | Manager | ANALYTICS |
| GPS | /agency/gps | Manager, Agent | VEHICLES |
| Notifications | /agency/notifications | Manager, Agent | — |

---

## 7. Règles non-négociables

1. **Isolation tenant** : les données ne traversent jamais les frontières d'une Company (sauf SUPER_ADMIN)
2. **Validation agence** : tout CRUD vérifie que l'utilisateur a accès à l'agence via UserAgency
3. **Self-modification** : un utilisateur ne peut pas modifier son propre rôle, se désactiver, ou retirer ses propres agences
4. **Password hash** : jamais retourné dans les réponses API (sanitizeUser)
5. **Messages FR** : tous les messages d'erreur backend sont en français
6. **Payload gelé** : les factures et contrats contiennent un snapshot JSON des données au moment de la création
7. **Timezone Maroc** : l'année des factures est calculée en timezone Africa/Casablanca
8. **Devise dynamique** : jamais de "MAD" hardcodé — utiliser `company.currency`
9. **Outbox idempotent** : les événements de domaine utilisent un deduplication key
10. **GPS zero-safe** : les coordonnées 0,0 sont valides — utiliser `!= null` pas de check falsy
11. **BookingNumber unicité** : unique par Company (@@unique([companyId, bookingNumber]))
12. **InvoiceNumber unicité** : unique par Company + année (@@unique([companyId, year, sequence]))
13. **Transaction atomique** : createNewVersion (contrat, booking) utilise `$transaction`
14. **Double filtrage menus** : rôle + module actif
15. **Impersonation limitée** : réservée SUPER_ADMIN, le refresh token ne peut pas être étendu

---

## 8. Tests

### 8.1 Backend

| Type | Framework | Commande | Fichiers |
|------|-----------|----------|----------|
| Unitaire | Jest | `npm test` | `*.spec.ts` dans chaque module |
| E2E | Jest | `npm run test:e2e` | `test/*.e2e-spec.ts` |

Tests E2E principaux :
- `saas.e2e-spec.ts` : cycle SaaS complet (company, subscription, modules, suspension)
- `business-rules.e2e-spec.ts` : règles métier (booking, planning, frais)
- `mobile-agent.e2e-spec.ts` : parcours agent mobile

### 8.2 Frontend

| Type | Framework | Commande |
|------|-----------|----------|
| Unitaire | Vitest | `npm test` (frontend-web) |
| Build | Next.js | `npx next build` |
| Type check | TypeScript | `npx tsc --noEmit` |

### 8.3 Seed

```bash
npx prisma db seed
```

Crée un SUPER_ADMIN (`admin@malocauto.com` / `admin123`) et des données de test.
