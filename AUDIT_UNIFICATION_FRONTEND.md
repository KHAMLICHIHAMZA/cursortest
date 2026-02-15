# 🔍 AUDIT UNIFICATION FRONTEND - MALOC SaaS

**Date**: 28 Janvier 2026  
**Objectif**: Fusionner les 3 frontends web en une seule application unifiée

---

## 📋 CONTEXTE

### Situation actuelle
Actuellement, MALOC dispose de **4 applications frontend** distinctes :

| Application | Technologies | Port | Rôle |
|-------------|-------------|------|------|
| `frontend-web` | Next.js 14 | 3001 | App web unifiée (admin/company/agency) |
| `frontend-admin` | Vite + React | 5173 | Interface SUPER_ADMIN |
| `frontend-agency` | Vite + React | 3080 | Interface AGENCY_MANAGER/AGENT |
| `mobile-agent` | React Native + Expo | N/A | App mobile terrain |

### Problème identifié
- **Duplication de code** : `frontend-admin` et `frontend-agency` dupliquent des fonctionnalités déjà présentes dans `frontend-web`
- **Maintenance complexe** : 3 codebases web à maintenir
- **UX fragmentée** : Les utilisateurs doivent accéder à différentes URLs selon leur rôle

### Solution recommandée
**Unifier tout dans `frontend-web`** et supprimer les applications redondantes.

---

## 📊 INVENTAIRE DES PAGES

### FRONTEND-WEB (Next.js) — 41 pages

#### Section Auth
| Route | Description | Statut |
|-------|-------------|--------|
| `/login` | Page de connexion | ✅ |
| `/forgot-password` | Mot de passe oublié | ✅ |
| `/reset-password` | Réinitialisation mot de passe | ✅ |

#### Section Admin (`/admin/*`)
| Route | Description | Statut |
|-------|-------------|--------|
| `/admin` | Dashboard admin | ✅ |
| `/admin/companies` | Liste des entreprises | ✅ |
| `/admin/companies/new` | Créer une entreprise | ✅ |
| `/admin/companies/[id]` | Détails entreprise | ✅ |
| `/admin/agencies` | Liste des agences | ✅ |
| `/admin/agencies/new` | Créer une agence | ✅ |
| `/admin/agencies/[id]` | Détails agence | ✅ |
| `/admin/users` | Liste des utilisateurs | ✅ |
| `/admin/users/new` | Créer un utilisateur | ✅ |
| `/admin/users/[id]` | Détails utilisateur | ✅ |
| `/admin/subscriptions` | Gestion abonnements | ❌ **MANQUANT** |
| `/admin/company-health` | Santé des comptes | ❌ **MANQUANT** |

#### Section Company (`/company/*`)
| Route | Description | Statut |
|-------|-------------|--------|
| `/company` | Dashboard company | ✅ |
| `/company/agencies` | Liste des agences | ✅ |
| `/company/agencies/new` | Créer une agence | ✅ |
| `/company/agencies/[id]` | Détails agence | ✅ |
| `/company/users` | Liste des utilisateurs | ✅ |
| `/company/users/new` | Créer un utilisateur | ✅ |
| `/company/users/[id]` | Détails utilisateur | ✅ |
| `/company/analytics` | Analytics | ✅ |
| `/company/planning` | Planning | ✅ |

#### Section Agency (`/agency/*`)
| Route | Description | Statut |
|-------|-------------|--------|
| `/agency` | Dashboard agency | ✅ |
| `/agency/vehicles` | Liste des véhicules | ✅ |
| `/agency/vehicles/new` | Créer un véhicule | ✅ |
| `/agency/vehicles/[id]` | Détails véhicule | ✅ |
| `/agency/clients` | Liste des clients | ✅ |
| `/agency/clients/new` | Créer un client | ✅ |
| `/agency/clients/[id]` | Détails client | ✅ |
| `/agency/bookings` | Liste des locations | ✅ |
| `/agency/bookings/new` | Créer une location | ✅ |
| `/agency/bookings/[id]` | Détails location | ✅ |
| `/agency/maintenance` | Liste maintenance | ✅ |
| `/agency/maintenance/new` | Créer maintenance | ✅ |
| `/agency/maintenance/[id]` | Détails maintenance | ✅ |
| `/agency/fines` | Liste des amendes | ✅ |
| `/agency/fines/new` | Créer une amende | ✅ |
| `/agency/fines/[id]` | Détails amende | ✅ |
| `/agency/planning` | Planning | ✅ |
| `/agency/invoices` | Factures V2 | ❌ **MANQUANT** |
| `/agency/contracts` | Contrats V2 | ❌ **MANQUANT** |
| `/agency/journal` | Journal d'activité | ❌ **MANQUANT** |
| `/agency/notifications` | Notifications in-app | ❌ **MANQUANT** |

---

### FRONTEND-ADMIN (Vite) — 11 pages

| Page | Existe dans frontend-web ? | Action |
|------|---------------------------|--------|
| `Dashboard.tsx` | ✅ Oui (`/admin`) | Supprimer |
| `Companies.tsx` | ✅ Oui (`/admin/companies`) | Supprimer |
| `Agencies.tsx` | ✅ Oui (`/admin/agencies`) | Supprimer |
| `Users.tsx` | ✅ Oui (`/admin/users`) | Supprimer |
| `Planning.tsx` | ✅ Oui (`/company/planning`) | Supprimer |
| `Analytics.tsx` | ✅ Oui (`/company/analytics`) | Supprimer |
| `Login.tsx` | ✅ Oui (`/login`) | Supprimer |
| `ForgotPassword.tsx` | ✅ Oui (`/forgot-password`) | Supprimer |
| `ResetPassword.tsx` | ✅ Oui (`/reset-password`) | Supprimer |
| **`Subscriptions.tsx`** | ❌ Non | **À MIGRER** |
| **`CompanyHealth.tsx`** | ❌ Non | **À MIGRER** |

---

### FRONTEND-AGENCY (Vite) — 14 pages

| Page | Existe dans frontend-web ? | Action |
|------|---------------------------|--------|
| `Dashboard.tsx` | ✅ Oui (`/agency`) | Supprimer |
| `Vehicles.tsx` | ✅ Oui (`/agency/vehicles`) | Supprimer |
| `Clients.tsx` | ✅ Oui (`/agency/clients`) | Supprimer |
| `Bookings.tsx` | ✅ Oui (`/agency/bookings`) | Supprimer |
| `Planning.tsx` | ✅ Oui (`/agency/planning`) | Supprimer |
| `Fines.tsx` | ✅ Oui (`/agency/fines`) | Supprimer |
| `Maintenance.tsx` | ✅ Oui (`/agency/maintenance`) | Supprimer |
| `Login.tsx` | ✅ Oui (`/login`) | Supprimer |
| `ForgotPassword.tsx` | ✅ Oui (`/forgot-password`) | Supprimer |
| `ResetPassword.tsx` | ✅ Oui (`/reset-password`) | Supprimer |
| **`Invoices.tsx`** | ❌ Non | **À MIGRER** |
| **`Contracts.tsx`** | ❌ Non | **À MIGRER** |
| **`Journal.tsx`** | ❌ Non | **À MIGRER** |
| **`Notifications.tsx`** | ❌ Non | **À MIGRER** |

---

## 🔴 PAGES À MIGRER

### 1. Subscriptions (Admin)

**Source**: `frontend-admin/src/pages/Subscriptions.tsx`  
**Destination**: `frontend-web/app/admin/subscriptions/page.tsx`  
**Lignes de code**: ~460

**Fonctionnalités**:
- Liste des abonnements SaaS
- Création d'abonnement (entreprise, plan, périodicité, dates)
- Suspension d'abonnement (avec raison)
- Restauration d'abonnement
- Renouvellement d'abonnement
- Annulation d'abonnement
- Affichage des statuts (ACTIVE, SUSPENDED, EXPIRED, CANCELLED)

**API utilisée**:
- `GET /subscriptions` - Liste des abonnements
- `GET /plans` - Liste des plans
- `GET /companies` - Liste des entreprises
- `POST /subscriptions` - Créer un abonnement
- `POST /subscriptions/:id/suspend` - Suspendre
- `POST /subscriptions/:id/restore` - Restaurer
- `POST /subscriptions/:id/renew` - Renouveler
- `DELETE /subscriptions/:id` - Annuler

---

### 2. CompanyHealth (Admin)

**Source**: `frontend-admin/src/pages/CompanyHealth.tsx`  
**Destination**: `frontend-web/app/admin/company-health/page.tsx`  
**Lignes de code**: ~350

**Fonctionnalités**:
- Sélection d'entreprise
- Alertes visuelles (compte suspendu, abonnement expire bientôt, factures en retard)
- Statut du compte (actif/suspendu/supprimé)
- Détails abonnement (plan, périodicité, montant, date expiration)
- Liste des factures récentes
- Calcul automatique des jours avant expiration/suppression

**API utilisée**:
- `GET /companies` - Liste des entreprises
- `GET /companies/:id` - Détails entreprise
- `GET /subscriptions` - Abonnements
- `GET /billing/company/:id/invoices` - Factures

---

### 3. Invoices (Agency)

**Source**: `frontend-agency/src/pages/Invoices.tsx`  
**Destination**: `frontend-web/app/agency/invoices/page.tsx`  
**Lignes de code**: ~180

**Fonctionnalités**:
- Liste des factures V2
- Recherche par numéro, client, véhicule
- Affichage type (Facture / Avoir)
- Affichage statut (Émise / Payée / Annulée)
- Téléchargement PDF
- Lien vers réservation associée

**API utilisée**:
- `GET /invoices` - Liste des factures
- `GET /invoices/:id/payload` - Payload pour PDF

---

### 4. Contracts (Agency)

**Source**: `frontend-agency/src/pages/Contracts.tsx`  
**Destination**: `frontend-web/app/agency/contracts/page.tsx`  
**Lignes de code**: ~175

**Fonctionnalités**:
- Liste des contrats V2
- Recherche par réservation, client, véhicule
- Affichage version du contrat
- Statut signatures (Client ✓/○ | Agent ✓/○)
- Statut contrat (Brouillon / En attente / Signé / Expiré / Annulé)
- Date d'effet
- Téléchargement PDF

**API utilisée**:
- `GET /contracts` - Liste des contrats
- `GET /contracts/:id/payload` - Payload pour PDF

---

### 5. Journal (Agency)

**Source**: `frontend-agency/src/pages/Journal.tsx`  
**Destination**: `frontend-web/app/agency/journal/page.tsx`  
**Lignes de code**: ~235

**Fonctionnalités**:
- Liste des entrées du journal d'activité
- Filtres (type, date début, date fin)
- Recherche textuelle
- Création de notes manuelles (titre + contenu)
- Types d'événements colorés (BOOKING_CREATED, CHECK_IN, CHECK_OUT, INVOICE_ISSUED, etc.)
- Lien vers réservation associée

**API utilisée**:
- `GET /journal` - Liste des entrées
- `POST /journal/notes` - Créer une note manuelle

---

### 6. Notifications (Agency)

**Source**: `frontend-agency/src/pages/Notifications.tsx`  
**Destination**: `frontend-web/app/agency/notifications/page.tsx`  
**Lignes de code**: ~170

**Fonctionnalités**:
- Liste des notifications in-app
- Compteur de notifications non lues
- Marquer comme lu (individuel)
- Marquer tout comme lu
- Types de notifications (Contrat, Facture, Retard, Check-out, Incident, Système)
- Lien d'action vers la ressource concernée

**API utilisée**:
- `GET /notifications/in-app` - Liste des notifications
- `GET /notifications/in-app/unread-count` - Compteur non lus
- `PATCH /notifications/in-app/:id/read` - Marquer comme lu
- `POST /notifications/in-app/read-all` - Tout marquer comme lu

---

## ⚠️ POINTS D'ATTENTION (Revue GPT)

### 1. Effort réel sous-estimé

> ❌ Estimation initiale : ~4h  
> ✅ Estimation révisée : **2-3 jours**

**Pourquoi ?** Migrer des pages Vite → Next.js App Router implique :

| Aspect | Travail requis |
|--------|----------------|
| Routing | Adapter les routes React Router → Next.js App Router |
| Auth Guards | Convertir les guards Vite vers middleware Next.js |
| Data Fetching | Remplacer `useQuery` + axios par pattern Next.js (ou garder côté client avec `"use client"`) |
| Layout | Intégrer dans le layout existant de frontend-web |
| State | Adapter l'état global (localStorage, context) |
| Forms | Vérifier compatibilité des composants UI |
| i18n | Unifier les traductions |
| Styling | Harmoniser Tailwind config |
| Tests | Adapter/réécrire les tests |
| Env vars | Convertir `import.meta.env` → `process.env` |

### 2. Différences Next.js vs Vite

| Vite (SPA) | Next.js App Router |
|------------|-------------------|
| `useEffect` pour auth check | Middleware + Server Components |
| `axios` interceptors | `fetch` avec cache/revalidation ou `"use client"` |
| `react-router-dom` | File-based routing + `useRouter` |
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| Client-side only | Server/Client separation (`"use client"`) |

**Stratégie recommandée** : Garder les pages migrées en `"use client"` pour minimiser les changements, puis optimiser progressivement.

### 3. Sécurité / Cloisonnement

**Risque** : Embarquer du code SuperAdmin dans un artefact déployé publiquement.

**Mitigations obligatoires** :

| Protection | Implémentation |
|------------|----------------|
| Routes guards | Middleware Next.js vérifiant le rôle avant accès `/admin/*` |
| Menus cachés | Sidebar filtrée par rôle (déjà fait) |
| API guards | Backend bloque les appels non autorisés (déjà fait) |
| Code splitting | Les pages `/admin/*` ne sont pas dans le bundle initial |
| Build-time flag | Option future pour déployer une version "agency-only" |

```typescript
// middleware.ts - Protection des routes admin
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken');
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith('/admin')) {
    // Vérifier que l'utilisateur est SUPER_ADMIN
    // Sinon rediriger vers /unauthorized
  }
}
```

### 4. Performance & Bundle Size

**Risque** : Une seule webapp = bundle plus gros, temps de chargement initial plus long.

**Solutions** :

| Technique | Implémentation |
|-----------|----------------|
| Route-based code splitting | Next.js le fait automatiquement par page |
| Lazy loading composants | `dynamic(() => import(...), { ssr: false })` |
| Shared components | Extraire dans `/components/ui/` bien découpé |
| Tree shaking | Vérifier les imports (pas de `import *`) |
| Bundle analyzer | `@next/bundle-analyzer` pour monitorer |

```typescript
// Lazy loading d'un composant lourd
const PlanningBoard = dynamic(
  () => import('@/components/planning/planning-board'),
  { ssr: false, loading: () => <Skeleton /> }
);
```

---

## 📋 PLAN D'ACTION RÉVISÉ

### Phase 1: Préparation (Effort: ~4h)

| # | Tâche | Description |
|---|-------|-------------|
| 1 | Audit des dépendances | Comparer les `package.json` des 3 apps |
| 2 | Harmoniser axios/api client | S'assurer que `frontend-web` a le même wrapper |
| 3 | Vérifier composants UI | Comparer les composants partagés |
| 4 | Configurer middleware auth | Ajouter protection `/admin/*` et `/company/*` |

### Phase 2: Migration des pages (Effort: ~2 jours)

| # | Tâche | Fichier à créer | Complexité |
|---|-------|-----------------|------------|
| 5 | Migrer Subscriptions | `app/admin/subscriptions/page.tsx` | 🔴 Haute |
| 6 | Migrer CompanyHealth | `app/admin/company-health/page.tsx` | 🔴 Haute |
| 7 | Migrer Invoices | `app/agency/invoices/page.tsx` | 🟡 Moyenne |
| 8 | Migrer Contracts | `app/agency/contracts/page.tsx` | 🟡 Moyenne |
| 9 | Migrer Journal | `app/agency/journal/page.tsx` | 🟡 Moyenne |
| 10 | Migrer Notifications | `app/agency/notifications/page.tsx` | 🟡 Moyenne |

### Phase 3: Navigation & Guards (Effort: ~4h)

| # | Tâche | Fichier à modifier |
|---|-------|-------------------|
| 11 | Ajouter liens admin dans Sidebar | `components/layout/sidebar.tsx` |
| 12 | Ajouter liens agency dans Sidebar | `components/layout/sidebar.tsx` |
| 13 | Implémenter middleware de protection | `middleware.ts` |
| 14 | Mettre à jour le filtrage par modules | `lib/modules.ts` |

### Phase 4: Tests & Validation (Effort: ~4h)

| # | Tâche | Description |
|---|-------|-------------|
| 15 | Tester toutes les routes par rôle | SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER, AGENT |
| 16 | Vérifier le cloisonnement | Un AGENT ne doit jamais voir /admin |
| 17 | Tester les permissions API | Backend rejette les appels non autorisés |
| 18 | Vérifier le bundle size | Utiliser bundle analyzer |

### Phase 5: Nettoyage (Effort: ~1h)

| # | Tâche | Action |
|---|-------|--------|
| 19 | Supprimer frontend-admin | `rm -rf frontend-admin/` |
| 20 | Supprimer frontend-agency | `rm -rf frontend-agency/` |
| 21 | Simplifier proxy | Modifier `proxy/server.cjs` |
| 22 | Mettre à jour `package.json` root | Retirer les scripts des apps supprimées |
| 23 | Mettre à jour la documentation | README, PORTS, etc.

**Effort total révisé : 3-4 jours**

---

## 🏗️ ARCHITECTURE CIBLE

```
┌─────────────────────────────────────────────────────────────────┐
│                    MALOC SaaS Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐         ┌─────────────────┐              │
│   │   FRONTEND-WEB  │         │    BACKEND      │              │
│   │   (Next.js 14)  │────────▶│   (NestJS)      │              │
│   │                 │         │                 │              │
│   │  /admin/*       │         │  REST API       │              │
│   │  /company/*     │         │  PostgreSQL     │              │
│   │  /agency/*      │         │  Prisma ORM     │              │
│   │                 │         │                 │              │
│   └─────────────────┘         └─────────────────┘              │
│          │                            ▲                        │
│          │                            │                        │
│          ▼                            │                        │
│   ┌─────────────────┐                 │                        │
│   │  MOBILE-AGENT   │─────────────────┘                        │
│   │ (React Native)  │                                          │
│   │                 │                                          │
│   │  App terrain    │                                          │
│   │  Offline-first  │                                          │
│   └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ BÉNÉFICES ATTENDUS

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Nombre de frontends web | 3 | 1 | -66% |
| Lignes de code total | ~15000 | ~10000 | -33% |
| Builds à maintenir | 3 | 1 | -66% |
| Tests à maintenir | 3 suites | 1 suite | -66% |
| Points d'entrée utilisateur | 3 URLs | 1 URL | -66% |
| Temps de déploiement | ~15min | ~5min | -66% |

---

## ⚖️ MATRICE RISQUES / MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Migration plus longue que prévue | 🟡 Moyenne | 🟡 Moyen | Buffer de 50% dans le planning |
| Régression fonctionnelle | 🟡 Moyenne | 🔴 Élevé | Tests manuels par rôle + tests E2E |
| Code admin accessible côté client | 🟢 Faible | 🔴 Élevé | Middleware + code splitting + menus filtrés |
| Bundle trop gros | 🟡 Moyenne | 🟡 Moyen | Lazy loading + bundle analyzer |
| Problèmes de cache Next.js | 🟡 Moyenne | 🟢 Faible | Garder `"use client"` pour les pages migrées |
| Conflit de styles | 🟢 Faible | 🟢 Faible | Même config Tailwind partout |

---

## 🎯 CRITÈRES DE SUCCÈS (GO/NO-GO)

Avant de supprimer les anciennes apps, vérifier :

- [ ] Toutes les pages migrées fonctionnent identiquement
- [ ] Les guards de route bloquent les accès non autorisés
- [ ] Le backend rejette les appels API non autorisés
- [ ] Le bundle initial < 500KB (gzipped)
- [ ] Temps de chargement < 3s sur 3G
- [ ] Tests E2E passent pour tous les rôles
- [ ] Aucune fuite de données entre tenants

---

## 🔗 RÉFÉRENCES

- **Best Practices consultées**: AWS Multi-tenant SaaS Architecture, Microsoft Azure Architecture Guide
- **Pattern utilisé**: Single Frontend with Role-Based Access Control (RBAC)
- **Standard industrie**: Configuration-driven UI variation, Feature flags

---

## 📝 NOTES

- `mobile-agent` reste une application séparée (cas d'usage terrain spécifique)
- Le proxy peut être simplifié pour ne servir que `frontend-web` + `backend`
- Toutes les APIs backend restent inchangées

---

## 🤔 DÉCISION FINALE

### Option A: Unification complète (Recommandée)
**Effort**: 3-4 jours  
**Risque**: Moyen  
**ROI**: Élevé sur le long terme

✅ Faire si :
- L'équipe a le temps de faire la migration proprement
- La maintenance long terme est prioritaire
- Vous voulez une UX unifiée

### Option B: Garder les apps séparées
**Effort**: 0  
**Risque**: Faible  
**ROI**: Négatif (dette technique croissante)

✅ Faire si :
- Besoin de livrer rapidement d'autres features
- L'équipe n'est pas à l'aise avec Next.js
- Budget temps très limité

### Option C: Migration progressive (Compromis)
**Effort**: 1-2 jours pour commencer  
**Risque**: Moyen  
**ROI**: Moyen

✅ Faire si :
- Vous voulez valider l'approche avant de tout migrer
- Commencer par les 2 pages Admin (Subscriptions + CompanyHealth)
- Puis migrer les pages Agency dans un 2ème temps

---

## 📅 PLANNING SUGGÉRÉ (Option A)

| Jour | Matin | Après-midi |
|------|-------|------------|
| J1 | Préparation (audit dépendances, middleware) | Migrer Subscriptions |
| J2 | Migrer CompanyHealth | Migrer Invoices + Contracts |
| J3 | Migrer Journal + Notifications | Tests par rôle |
| J4 | Fix bugs + optimisation bundle | Nettoyage + documentation |

---

## 🔗 PROCHAINE ÉTAPE

**Action requise** : Valider le plan avec l'équipe et choisir une option (A, B ou C).

Une fois validé, je peux commencer la migration immédiatement.
