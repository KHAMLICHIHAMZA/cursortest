# MALOC - Contexte Projet pour ChatGPT

> Derniere mise a jour : 15 fevrier 2026
> Branche : `v2-preprod` | Commit : `436e0cd`

---

## 1. Architecture du Projet

```
MALOC/
├── backend/          # NestJS + Prisma + PostgreSQL (port 3333)
├── frontend-web/     # Next.js 14 App Router (port 3003) — frontend unifie (admin + agency + company)
├── mobile-agent/     # React Native (Expo) — app mobile agent terrain
├── docs/             # Specifications fonctionnelles
└── scripts/          # Scripts PowerShell utilitaires
```

> Les anciens `frontend-admin` et `frontend-agency` (Vite) ont ete supprimes lors de l'unification vers `frontend-web`.

### Stack technique
- **Backend** : NestJS, Prisma ORM, PostgreSQL, JWT (access + refresh tokens), PDFKit
- **Frontend** : Next.js 14 (App Router), React 18, TanStack Query, Tailwind CSS, styled-jsx, Leaflet (react-leaflet@4)
- **Mobile** : React Native / Expo
- **Auth** : JWT avec refresh token, Axios interceptor auto-refresh, RBAC (roles + permissions + modules)

---

## 2. Roles et RBAC

| Role | Perimetre |
|------|-----------|
| SUPER_ADMIN | Plateforme SaaS entiere, peut impersonate n'importe quel user |
| COMPANY_ADMIN | Gestion de sa company + toutes ses agences. Mode "solo" si un seul user dans la company (acces a tout) |
| AGENCY_MANAGER | Gestion de son agence (vehicules, clients, bookings, charges, GPS, etc.) |
| AGENT | Terrain : bookings assignes, check-in/out, GPS |

### Mode Solo (Company Admin)
Si le COMPANY_ADMIN est le seul utilisateur de sa company, il a automatiquement acces a tous les menus agence (vehicules, clients, bookings, planning, GPS, charges, etc.) sans avoir besoin de creer d'autres utilisateurs.

---

## 3. Modules Backend (NestJS)

Chaque module a son controller, service, DTOs, et souvent des specs :

| Module | Endpoint prefix | Description |
|--------|----------------|-------------|
| Auth | `/api/v1/auth` | Login, refresh, forgot/reset password, impersonate |
| Company | `/api/v1/companies` | CRUD companies, settings |
| Agency | `/api/v1/agencies` | CRUD agences |
| User | `/api/v1/users` | CRUD users, reset password |
| Vehicle | `/api/v1/vehicles` | CRUD vehicules, recherche marques/modeles, upload image, champs tracker GPS |
| Client | `/api/v1/clients` | CRUD clients, upload/analyse permis (AI) |
| Booking | `/api/v1/bookings` | CRUD reservations, calcul auto prix total, penalites retard |
| Contract | `/api/v1/contracts` | CRUD contrats, generation PDF |
| Invoice | `/api/v1/invoices` | CRUD factures, generation PDF |
| Fine | `/api/v1/fines` | Amendes, detection booking actif par date infraction |
| Payment | `/api/v1/payment` | Paiements cash/online, depot, CMI callback |
| Charge | `/api/v1/charges` | Charges & depenses vehicules (CRUD + KPI) |
| GPS | `/api/v1/gps` | Snapshots GPS, capture manuelle, missing, KPI eco |
| Planning | `/api/v1/planning` | Planning vehicules/agence |
| Maintenance | `/api/v1/maintenance` | Maintenance operationnelle |
| Module | `/api/v1/modules` | Activation/desactivation modules par company/agence |
| Subscription | `/api/v1/subscriptions` | Abonnements SaaS |
| Billing | `/api/v1/billing` | Facturation SaaS |
| Plan | `/api/v1/plans` | Plans tarifaires |
| Notification | `/api/v1/notifications` | Email, push, WhatsApp, in-app |
| Analytics | `/api/v1/analytics` | KPIs globaux et par agence |
| AI | `/api/v1/ai` | Detection dommages (vision), chatbot FAQ |
| Incident | `/api/v1/incidents` | Incidents vehicules |
| Journal | `/api/v1/journal` | Notes metier |
| Upload | `/api/v1/upload` | Upload fichiers/images |
| Audit | interne | Logs d'audit techniques |

---

## 4. Schema Prisma (modeles cles)

Les modeles principaux dans `backend/prisma/schema.prisma` :

- **Company** : nom, ICE, legalIdentifier, bookingNumberMode (AUTO/MANUAL), settings JSON, deletedAt
- **Agency** : appartient a Company, nom, ville, telephone, statut
- **User** : email, role enum, companyId, agencyIds, mot de passe hash bcrypt
- **Vehicle** : brand, model, registrationNumber, year, color, mileage, dailyRate, depositAmount, status enum, fuel, gearbox, horsepower, imageUrl, **gpsTrackerId**, **gpsTrackerLabel**, agencyId
- **Client** : nom, email, telephone, CIN, permis, adresse, agencyId
- **Booking** : bookingNumber, dates, statut enum (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED), totalPrice (auto-calcule), depositAmount, lateFeeAmount, vehicleId, clientId
- **Contract** : lie au booking, statut, signature
- **Invoice** : lie au booking, montant, statut
- **Fine** : vehicleId, date infraction, montant, statut, detection auto booking actif
- **Charge** : vehicleId, agencyId, category enum (BANK_INSTALLMENT, INSURANCE, VIGNETTE, FUEL, PREVENTIVE_MAINTENANCE, CORRECTIVE_MAINTENANCE, EXCEPTIONAL, OTHER), amount, date, recurring, recurrencePeriod
- **GpsSnapshot** : vehicleId, bookingId, latitude, longitude, accuracy, mileage, reason enum (CHECK_IN, CHECK_OUT, INCIDENT, MANUAL), isGpsMissing
- **Maintenance** : vehicleId, type, description, cout, date
- **Payment** : bookingId, montant, methode, statut
- **Subscription** : companyId, planId, statut, dates
- **CompanyModule** : company + module active
- **AuditLog** : action, entity, userId, details JSON

---

## 5. Pages Frontend (Next.js App Router)

### Admin (SUPER_ADMIN)
- `/admin/companies` : liste/CRUD companies
- `/admin/users` : gestion utilisateurs plateforme
- `/admin/subscriptions` : abonnements SaaS
- `/admin/company-health` : sante des companies
- `/admin/notifications` : broadcast notifications

### Company (COMPANY_ADMIN)
- `/company` : dashboard company
- `/company/agencies` : gestion agences
- `/company/users` : gestion users company

### Agency (AGENCY_MANAGER / AGENT)
- `/agency/vehicles` : liste + CRUD vehicules
- `/agency/clients` : liste + CRUD clients
- `/agency/bookings` : liste + creation reservations (calcul auto prix total)
- `/agency/planning` : planning interactif (jour/semaine/mois), events cliquables
- `/agency/contracts` : contrats + telechargement PDF
- `/agency/invoices` : factures + telechargement PDF
- `/agency/fines` : amendes
- `/agency/gps` : **carte Leaflet interactive** + filtres (vehicule, raison, dates) + capture position + historique + panneau tracker GPS physique
- `/agency/charges` : **Charges & Depenses** CRUD complet avec categories, filtres, recurrence, cartes recapitulatives
- `/agency/maintenance` : maintenance operationnelle (pas dans sidebar, accessible par URL)
- `/agency/kpi` : KPIs agence avec charges par categorie
- `/agency/notifications` : notifications in-app
- `/agency/journal` : notes metier

### Sidebar
```
Agency links (operational):
- Vehicules
- Clients
- Reservations
- Planning
- Contrats
- Factures
- Amendes
- GPS                    (anciennement "GPS / Localisation", GPS Eco supprime)
- Charges & Depenses     (remplace "Maintenance" dans la sidebar)
- KPIs
- Notifications
- Journal
```

---

## 6. Fonctionnalites Recemment Implementees

### Module GPS (nouveau)
- Carte Leaflet avec tuiles CartoDB Dark Matter
- Marqueurs colores par raison (CHECK_IN vert, CHECK_OUT bleu, INCIDENT rouge, MANUAL gris)
- Popups avec infos vehicule/booking/client
- Polyline historique par vehicule
- Marqueur pulsant pour position utilisateur
- Bouton capture position (navigator.geolocation)
- Panneau tracker GPS : associer/dissocier un mini tracker physique (type AirTag AliExpress) a un vehicule via champs `gpsTrackerId` et `gpsTrackerLabel`
- Filtres : vehicule, raison, dates
- Tableau dernieres positions par vehicule
- Auto-refresh 30s

### Module Charges & Depenses (nouveau)
- Page CRUD complete `/agency/charges`
- Categories : Mensualite bancaire, Assurance, Vignette/Dariba, Carburant, Maintenance preventive, Reparation/Maintenance corrective, Charge exceptionnelle, Autre
- Cartes recapitulatives (total + top 3 categories)
- Filtres (vehicule, categorie, dates)
- Support charges recurrentes (mensuel, trimestriel, annuel)
- Modal creation/edition
- Labels KPI alignes sur les categories charges
- API client : `frontend-web/lib/api/charge.ts`

### PDF Contrats & Factures (corrige)
- Telechargement fonctionnel via `responseType: 'blob'`
- Gestion erreurs blob dans intercepteur Axios
- Toast feedback (succes/erreur)
- Bouton loading state

### Planning Board (corrige)
- Events cliquables dans toutes les vues (jour, semaine, mois)
- Suppression overlay bloquant les clics
- CSS global (styled-jsx global) pour styles cross-composants
- Hover/active effects, gradients par type event

### Calcul Auto Prix Booking
- Prix total = (nombre de jours) x (tarif journalier vehicule)
- Auto-calcul a la selection du vehicule et changement de dates

### Messages Erreur en Francais
- Tous les messages backend traduits en francais
- Messages parlants pour les cas metier (identifiant legal duplique, email existant, etc.)

---

## 7. Fichiers Cles a Connaitre

| Fichier | Role |
|---------|------|
| `backend/prisma/schema.prisma` | Schema base de donnees complet |
| `backend/src/app.module.ts` | Module racine NestJS (imports tous les modules) |
| `backend/src/modules/auth/auth.service.ts` | Logique auth (login, refresh, impersonate, mode solo) |
| `frontend-web/components/layout/sidebar.tsx` | Navigation sidebar + RBAC menus |
| `frontend-web/lib/modules.ts` | Mapping routes -> modules pour controle acces |
| `frontend-web/middleware.ts` | Middleware Next.js (auth redirect, route protection) |
| `frontend-web/components/auth/route-guard.tsx` | Guard composant pour roles autorises |
| `frontend-web/lib/api/client.ts` | Client Axios avec intercepteurs JWT auto-refresh |
| `frontend-web/lib/api/charge.ts` | API client charges |
| `frontend-web/lib/api/gps.ts` | API client GPS |
| `SPECIFICATIONS_FONCTIONNELLES.md` | Spec fonctionnelle detaillee |
| `docs/specs.md` | Spec technique |

---

## 8. Comptes de Test (Seed)

| Email | Mot de passe | Role |
|-------|-------------|------|
| admin@maloc.ma | Admin123! | SUPER_ADMIN |
| mizokhamlichi@gmail.com | (a verifier dans seed) | COMPANY_ADMIN |

---

## 9. Commandes de Lancement

```bash
# Backend (port 3333)
cd backend && npm run dev

# Frontend (port 3003)
cd frontend-web && npm run dev

# Prisma
cd backend && npx prisma db push && npx prisma generate && npx prisma db seed
```

---

## 10. Ce Qui Reste a Faire / Ameliorations Possibles

- Tests E2E complets pour les nouveaux modules (GPS, Charges)
- Integration tracker GPS reel (API externe selon le modele de tracker)
- Dashboard KPI enrichi avec graphiques (charts)
- Notifications push reelles (Firebase a configurer)
- Export CSV/Excel des charges
- Rapports financiers par vehicule/periode
- Mode sombre (dark mode) complet
- Optimisation performances (pagination server-side sur les listes longues)
- CI/CD pipeline (GitHub Actions en place mais a completer)
