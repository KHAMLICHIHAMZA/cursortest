# 🧪 PLAN DE TESTS — V2 + Unification Frontend

**Date** : 8 Février 2026  
**Contexte** : Ce document recense tous les tests à effectuer après l'implémentation V2 et l'unification des 3 frontends en une seule application Next.js.

---

## 📌 CHANGEMENTS À TESTER

### A. V2 Backend — Nouveaux modules
- Invoice (factures + avoirs)
- Contract (contrats + signatures + versioning)
- Journal (log d'activité + notes manuelles)
- GPS (snapshots géolocalisation)
- In-App Notifications
- Outbox (événements domaine)
- BookingNumber (auto/manual + lock)

### B. Unification Frontend
- Suppression de `frontend-admin` et `frontend-agency`
- 6 pages migrées dans `frontend-web`
- Middleware auth par rôle
- Filtrage des menus par modules actifs
- Proxy simplifié (un seul port 8080)

---

## 🔐 1. MIDDLEWARE AUTH — Protection des routes

### 1.1 Routes publiques (pas de token requis)

| # | Test | Route | Résultat attendu |
|---|------|-------|-----------------|
| 1.1.1 | Accès login sans token | `GET /login` | ✅ 200 OK |
| 1.1.2 | Accès forgot-password sans token | `GET /forgot-password` | ✅ 200 OK |
| 1.1.3 | Accès reset-password sans token | `GET /reset-password` | ✅ 200 OK |

### 1.2 Protection par rôle

| # | Test | Rôle | Route | Résultat attendu |
|---|------|------|-------|-----------------|
| 1.2.1 | SUPER_ADMIN accède à /admin | SUPER_ADMIN | `/admin` | ✅ 200 OK |
| 1.2.2 | SUPER_ADMIN accède à /company | SUPER_ADMIN | `/company` | ✅ 200 OK |
| 1.2.3 | SUPER_ADMIN accède à /agency | SUPER_ADMIN | `/agency` | ✅ 200 OK |
| 1.2.4 | COMPANY_ADMIN accède à /company | COMPANY_ADMIN | `/company` | ✅ 200 OK |
| 1.2.5 | COMPANY_ADMIN accède à /agency | COMPANY_ADMIN | `/agency` | ✅ 200 OK |
| 1.2.6 | COMPANY_ADMIN bloqué sur /admin | COMPANY_ADMIN | `/admin` | 🔴 Redirect → `/company` |
| 1.2.7 | AGENCY_MANAGER accède à /agency | AGENCY_MANAGER | `/agency` | ✅ 200 OK |
| 1.2.8 | AGENCY_MANAGER bloqué sur /admin | AGENCY_MANAGER | `/admin` | 🔴 Redirect → `/agency` |
| 1.2.9 | AGENCY_MANAGER bloqué sur /company | AGENCY_MANAGER | `/company` | 🔴 Redirect → `/agency` |
| 1.2.10 | AGENT accède à /agency | AGENT | `/agency` | ✅ 200 OK |
| 1.2.11 | AGENT bloqué sur /admin | AGENT | `/admin` | 🔴 Redirect → `/agency` |
| 1.2.12 | Token expiré redirige vers login | tout rôle | toute route | 🔴 Redirect → `/login?expired=true` |
| 1.2.13 | Pas de token redirige vers login | aucun | `/agency` | 🔴 Redirect → `/login` |

---

## 📋 2. SIDEBAR — Filtrage par modules

### 2.1 Admin (SUPER_ADMIN voit tout)

| # | Test | Lien attendu dans le menu |
|---|------|--------------------------|
| 2.1.1 | Dashboard visible | ✅ `/admin` |
| 2.1.2 | Entreprises visible | ✅ `/admin/companies` |
| 2.1.3 | Agences visible | ✅ `/admin/agencies` |
| 2.1.4 | Utilisateurs visible | ✅ `/admin/users` |
| 2.1.5 | Abonnements visible | ✅ `/admin/subscriptions` |
| 2.1.6 | Santé comptes visible | ✅ `/admin/company-health` |

### 2.2 Agency (filtré par modules actifs)

| # | Test | Module requis | Si module ACTIF | Si module INACTIF |
|---|------|--------------|-----------------|-------------------|
| 2.2.1 | Dashboard | aucun | ✅ Visible | ✅ Visible |
| 2.2.2 | Véhicules | VEHICLES | ✅ Visible | 🔴 Masqué |
| 2.2.3 | Clients | aucun | ✅ Visible | ✅ Visible |
| 2.2.4 | Locations | BOOKINGS | ✅ Visible | 🔴 Masqué |
| 2.2.5 | Planning | BOOKINGS | ✅ Visible | 🔴 Masqué |
| 2.2.6 | Factures | INVOICES | ✅ Visible | 🔴 Masqué |
| 2.2.7 | Contrats | BOOKINGS | ✅ Visible | 🔴 Masqué |
| 2.2.8 | Journal | aucun | ✅ Visible | ✅ Visible |
| 2.2.9 | Amendes | FINES | ✅ Visible | 🔴 Masqué |
| 2.2.10 | Maintenance | MAINTENANCE | ✅ Visible | 🔴 Masqué |
| 2.2.11 | Notifications | aucun | ✅ Visible | ✅ Visible |

### 2.3 Company Admin (filtré par modules)

| # | Test | Module requis | Si module ACTIF | Si module INACTIF |
|---|------|--------------|-----------------|-------------------|
| 2.3.1 | Dashboard | aucun | ✅ Visible | ✅ Visible |
| 2.3.2 | Agences | aucun | ✅ Visible | ✅ Visible |
| 2.3.3 | Utilisateurs | aucun | ✅ Visible | ✅ Visible |
| 2.3.4 | Analytics | ANALYTICS | ✅ Visible | 🔴 Masqué |
| 2.3.5 | Planning | BOOKINGS | ✅ Visible | 🔴 Masqué |

---

## 🧾 3. PAGES MIGRÉES — Tests fonctionnels

### 3.1 Abonnements (`/admin/subscriptions`)

| # | Test | Action | Résultat attendu |
|---|------|--------|-----------------|
| 3.1.1 | Affichage liste | Ouvrir la page | Liste des abonnements avec entreprise, plan, montant, statut |
| 3.1.2 | Créer abonnement | Cliquer "Nouvel abonnement", remplir formulaire | Abonnement créé, apparaît dans la liste |
| 3.1.3 | Suspendre abonnement | Cliquer icône suspension sur un abonnement ACTIVE | Saisir raison → Statut passe à SUSPENDED |
| 3.1.4 | Restaurer abonnement | Cliquer icône restauration sur un SUSPENDED | Statut repasse à ACTIVE |
| 3.1.5 | Renouveler abonnement | Cliquer icône renouvellement | Date de fin prolongée |
| 3.1.6 | Annuler abonnement | Cliquer icône annulation + confirmer | Statut passe à CANCELLED |
| 3.1.7 | Badge couleur statut | Vérifier les badges | ACTIVE=vert, SUSPENDED=orange, EXPIRED=rouge, CANCELLED=gris |

### 3.2 Santé comptes (`/admin/company-health`)

| # | Test | Action | Résultat attendu |
|---|------|--------|-----------------|
| 3.2.1 | Sélection entreprise | Sélectionner dans dropdown | Détails du compte affichés |
| 3.2.2 | Alerte compte suspendu | Sélectionner une entreprise suspendue | Bannière jaune avec raison et jours depuis suspension |
| 3.2.3 | Alerte expiration proche | Sélectionner une entreprise avec < 30 jours | Bannière orange avec jours restants |
| 3.2.4 | Alerte factures en retard | Sélectionner une entreprise avec factures overdue | Bannière rouge avec nombre de factures |
| 3.2.5 | Restauration J+90 | Suspension < 90 jours | Mention "Restauration possible" affichée |
| 3.2.6 | Suppression J+100 | Suspension ≥ 100 jours | Mention "Suppression imminente" affichée |
| 3.2.7 | Factures récentes | Vérifier le tableau | 10 dernières factures avec statut coloré |

### 3.3 Factures (`/agency/invoices`)

| # | Test | Action | Résultat attendu |
|---|------|--------|-----------------|
| 3.3.1 | Affichage liste | Ouvrir la page | Liste des factures avec numéro, type, client, montant |
| 3.3.2 | Recherche | Taper un numéro de facture | Filtrage en temps réel |
| 3.3.3 | Type Facture/Avoir | Vérifier les badges | INVOICE=bleu, CREDIT_NOTE=orange |
| 3.3.4 | Statut | Vérifier les badges | ISSUED=bleu, PAID=vert, CANCELLED=rouge |
| 3.3.5 | Montant négatif | Avoir (credit note) | Montant affiché en rouge |
| 3.3.6 | Bouton PDF | Cliquer PDF | Appel `/invoices/:id/payload` |

### 3.4 Contrats (`/agency/contracts`)

| # | Test | Action | Résultat attendu |
|---|------|--------|-----------------|
| 3.4.1 | Affichage liste | Ouvrir la page | Liste des contrats avec réservation, client, version |
| 3.4.2 | Recherche | Taper un nom de client | Filtrage en temps réel |
| 3.4.3 | Signatures | Vérifier colonne signatures | ✓ Client / ○ Agent (ou inverse) |
| 3.4.4 | Statut contrat | Vérifier les badges | DRAFT=gris, PENDING=orange, SIGNED=vert |
| 3.4.5 | Versioning | Vérifier colonne version | v1, v2, etc. |
| 3.4.6 | Bouton PDF | Cliquer PDF | Appel `/contracts/:id/payload` |

### 3.5 Journal (`/agency/journal`)

| # | Test | Action | Résultat attendu |
|---|------|--------|-----------------|
| 3.5.1 | Affichage liste | Ouvrir la page | Liste des événements avec date, type, titre |
| 3.5.2 | Filtre par type | Sélectionner "Check-in" | Seuls les CHECK_IN affichés |
| 3.5.3 | Filtre par date | Sélectionner date début et fin | Entrées filtrées par période |
| 3.5.4 | Recherche | Taper un mot-clé | Filtrage en temps réel |
| 3.5.5 | Créer note manuelle | Cliquer "Ajouter une note" + remplir | Note créée, apparaît dans la liste |
| 3.5.6 | Badge type coloré | Vérifier les couleurs | CHECK_IN=vert, INVOICE_ISSUED=violet, MANUAL_NOTE=jaune |
| 3.5.7 | Indication modification | Vérifier si "(modifié)" affiché | Notes éditées marquées |

### 3.6 Notifications (`/agency/notifications`)

| # | Test | Action | Résultat attendu |
|---|------|--------|-----------------|
| 3.6.1 | Affichage liste | Ouvrir la page | Liste des notifications avec type, message |
| 3.6.2 | Compteur non lues | Vérifier le sous-titre | "X non lue(s)" |
| 3.6.3 | Marquer comme lu | Cliquer ✓ sur une notification | Point bleu disparaît, fond change |
| 3.6.4 | Tout marquer comme lu | Cliquer le bouton | Toutes les notifications marquées |
| 3.6.5 | Notification avec action | Cliquer "Voir" | Redirection vers l'URL de l'action |
| 3.6.6 | Badge type | Vérifier les types | Contrat=indigo, Facture=violet, Retard=rouge |

---

## 🔧 4. V2 BACKEND — Tests API

### 4.1 BookingNumber

| # | Test | Endpoint | Résultat attendu |
|---|------|----------|-----------------|
| 4.1.1 | Auto-génération | `POST /bookings` (sans bookingNumber) | Format `YYYY000001` |
| 4.1.2 | Auto-incrémentation | Créer 2 bookings | `YYYY000001` puis `YYYY000002` |
| 4.1.3 | Mode manuel | `POST /bookings` avec `bookingNumber: "ABC123"` | Numéro accepté |
| 4.1.4 | Unicité par company | Créer 2 bookings avec même numéro | 🔴 Erreur 409 Conflict |
| 4.1.5 | Verrouillage après facture | Modifier bookingNumber après invoice | 🔴 Erreur 400 "locked" |
| 4.1.6 | Validation format | `bookingNumber: "abc!@#"` | 🔴 Erreur 400 validation |

### 4.2 Invoice (Factures)

| # | Test | Endpoint | Résultat attendu |
|---|------|----------|-----------------|
| 4.2.1 | Générer facture | `POST /invoices/booking/:id/generate` | Invoice créée avec numéro séquentiel |
| 4.2.2 | Payload figé | `GET /invoices/:id/payload` | Snapshot JSON immutable |
| 4.2.3 | Créer avoir | `POST /invoices/:id/credit-note` | Credit note avec montant négatif |
| 4.2.4 | Séquence annuelle | Créer factures même année | `INV-YYYY-000001`, `INV-YYYY-000002` |
| 4.2.5 | Double génération | Générer 2x pour même booking | 🔴 Erreur ou facture unique |
| 4.2.6 | Statut PAID | `PATCH /invoices/:id/status` body: `{status: "PAID"}` | Statut mis à jour |

### 4.3 Contract (Contrats)

| # | Test | Endpoint | Résultat attendu |
|---|------|----------|-----------------|
| 4.3.1 | Créer contrat | `POST /contracts` | Contrat en statut DRAFT, version 1 |
| 4.3.2 | Signature client | `POST /contracts/:id/sign` body: `{signer: "CLIENT"}` | clientSignedAt rempli, statut → PENDING_SIGNATURE |
| 4.3.3 | Signature agent | `POST /contracts/:id/sign` body: `{signer: "AGENT"}` | agentSignedAt rempli |
| 4.3.4 | Double signature | Signer client + agent | Statut → SIGNED |
| 4.3.5 | Rendre effectif | `PATCH /contracts/:id/effective` | effectiveAt rempli |
| 4.3.6 | Nouvelle version | `POST /contracts/:id/new-version` | Version incrémentée, ancien annulé |
| 4.3.7 | Payload figé | `GET /contracts/:id/payload` | Snapshot JSON immutable |

### 4.4 Journal

| # | Test | Endpoint | Résultat attendu |
|---|------|----------|-----------------|
| 4.4.1 | Lister entrées | `GET /journal` | Liste paginée |
| 4.4.2 | Filtre par type | `GET /journal?type=CHECK_IN` | Seuls les CHECK_IN |
| 4.4.3 | Filtre par date | `GET /journal?dateFrom=2026-01-01&dateTo=2026-12-31` | Entrées dans la période |
| 4.4.4 | Créer note manuelle | `POST /journal/notes` | Entrée type MANUAL_NOTE créée |
| 4.4.5 | Note par manager seulement | `POST /journal/notes` en tant qu'AGENT | 🔴 Erreur 403 |
| 4.4.6 | Modifier note | `PATCH /journal/notes/:id` | editedAt mis à jour |
| 4.4.7 | Supprimer note | `DELETE /journal/notes/:id` | Note supprimée |
| 4.4.8 | Événement auto | Créer un booking | Entrée BOOKING_CREATED dans le journal |

### 4.5 GPS Snapshots

| # | Test | Endpoint | Résultat attendu |
|---|------|----------|-----------------|
| 4.5.1 | Capturer GPS | `POST /gps` | Snapshot créé avec lat/lng |
| 4.5.2 | GPS au check-in | Effectuer un check-in | Snapshot automatique reason=CHECK_IN |
| 4.5.3 | GPS manuelle | `POST /gps/manual` (manager) | Snapshot reason=MANUAL |
| 4.5.4 | GPS manuelle AGENT | `POST /gps/manual` (agent) | 🔴 Erreur 403 |
| 4.5.5 | GPS missing | `POST /gps/missing` | Snapshot avec `gpsMissing=true` + reason |
| 4.5.6 | GPS par booking | `GET /gps/booking/:id` | Snapshots du booking |
| 4.5.7 | GPS par véhicule | `GET /gps/vehicle/:id` | Snapshots du véhicule |

### 4.6 In-App Notifications

| # | Test | Endpoint | Résultat attendu |
|---|------|----------|-----------------|
| 4.6.1 | Lister notifs | `GET /notifications/in-app` | Notifications de l'utilisateur |
| 4.6.2 | Compteur non lues | `GET /notifications/in-app/unread-count` | `{ count: N }` |
| 4.6.3 | Marquer lue | `PATCH /notifications/in-app/:id/read` | readAt rempli, status → READ |
| 4.6.4 | Tout marquer lu | `POST /notifications/in-app/read-all` | Toutes les notifs marquées READ |
| 4.6.5 | Notification auto | Émettre un invoice | Notification INVOICE_AVAILABLE créée |

### 4.7 Outbox (Événements domaine)

| # | Test | Vérification | Résultat attendu |
|---|------|-------------|-----------------|
| 4.7.1 | Événement créé | Créer un booking | OutboxEvent PENDING en base |
| 4.7.2 | Événement traité | Attendre 2-5s | OutboxEvent → PROCESSED |
| 4.7.3 | Projection journal | Après traitement | JournalEntry créé automatiquement |
| 4.7.4 | Idempotence | Rejouer un événement | Pas de doublon |
| 4.7.5 | Retry sur erreur | Simuler erreur dispatcher | retryCount incrémenté |

---

## 🌐 5. PROXY UNIFIÉ

| # | Test | URL | Résultat attendu |
|---|------|-----|-----------------|
| 5.1 | Login via proxy | `http://localhost:8080/login` | Page de connexion Next.js |
| 5.2 | API via proxy | `http://localhost:8080/api/v1/auth/me` | 401 (sans token) |
| 5.3 | Admin via proxy | `http://localhost:8080/admin` | Redirect login ou dashboard admin |
| 5.4 | Agency via proxy | `http://localhost:8080/agency` | Redirect login ou dashboard agency |
| 5.5 | Company via proxy | `http://localhost:8080/company` | Redirect login ou dashboard company |
| 5.6 | Ancien port admin | `http://localhost:5173` | 🔴 Ne répond plus (app supprimée) |
| 5.7 | Ancien port agency | `http://localhost:3080` | 🔴 Ne répond plus (app supprimée) |

---

## 🔒 6. SÉCURITÉ — Cloisonnement

| # | Test | Scénario | Résultat attendu |
|---|------|----------|-----------------|
| 6.1 | Code admin non exposé | Inspecter le bundle JS en tant qu'AGENT | Pas de code admin dans le bundle chargé |
| 6.2 | API bloque l'accès | AGENT appelle `GET /companies` | 🔴 403 Forbidden |
| 6.3 | API bloque module | Appel `/invoices` sans module INVOICES activé | 🔴 403 Module non activé |
| 6.4 | Menu caché | AGENT sans module FINES | Menu "Amendes" absent du sidebar |
| 6.5 | Route directe bloquée | AGENT tape `/admin` dans l'URL | Redirect vers `/agency` |
| 6.6 | Token volé expiré | Utiliser un token expiré | Redirect vers `/login?expired=true` |

---

## 📦 7. TESTS UNITAIRES EXISTANTS (à exécuter)

```bash
# Backend — tous les tests unitaires
cd backend && npm run test

# Backend — tests V2 spécifiques
npx jest --testPathPattern="booking.service.spec|invoice.service.spec|contract.service.spec|journal.service.spec|gps.service.spec|in-app-notification.service.spec|outbox"

# Backend — test E2E V2 flow
npx jest --testPathPattern="v2-booking-flow"

# Frontend — tests unitaires
cd frontend-web && npm run test:run
```

---

## 📝 8. CHECKLIST FINALE

### Avant de valider :
- [ ] Middleware auth protège toutes les routes
- [ ] Sidebar filtre les menus par modules
- [ ] 6 pages migrées fonctionnent identiquement aux anciennes
- [ ] `frontend-admin` et `frontend-agency` supprimés
- [ ] Proxy ne sert que 2 cibles (backend + frontend-web)
- [ ] `npm run dev` depuis la racine lance tout
- [ ] Build production passe sans erreur
- [ ] Aucune fuite de données entre rôles

### Tests automatisés passent :
- [ ] `backend/test/v2-booking-flow.e2e-spec.ts`
- [ ] `backend/src/modules/invoice/invoice.service.spec.ts`
- [ ] `backend/src/modules/contract/contract.service.spec.ts`
- [ ] `backend/src/modules/journal/journal.service.spec.ts`
- [ ] `backend/src/modules/gps/gps.service.spec.ts`
- [ ] `backend/src/modules/in-app-notification/in-app-notification.service.spec.ts`
- [ ] `backend/src/common/services/outbox.service.spec.ts`
- [ ] `backend/src/modules/booking/booking.service.spec.ts`
- [ ] `frontend-web` build Next.js OK (40 pages)

---

## 📊 RÉSUMÉ

| Catégorie | Nombre de tests |
|-----------|----------------|
| Middleware auth | 13 |
| Sidebar / Modules | 22 |
| Pages migrées | 41 |
| API V2 Backend | 37 |
| Proxy unifié | 7 |
| Sécurité | 6 |
| **TOTAL** | **126 tests** |
