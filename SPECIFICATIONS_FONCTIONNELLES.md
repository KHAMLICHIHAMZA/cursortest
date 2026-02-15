# Spécifications Fonctionnelles — MalocAuto

> **Version** : 3.0.0  
> **Date** : 15 février 2026  
> **Statut** : Document de référence — reflète l'état réel du code  

---

## Table des matières

1. [Vue d'ensemble et architecture SaaS](#1-vue-densemble-et-architecture-saas)
2. [Rôles, permissions et RBAC](#2-rôles-permissions-et-rbac)
3. [Système de modules](#3-système-de-modules)
4. [Entreprises et abonnements](#4-entreprises-et-abonnements)
5. [Agences](#5-agences)
6. [Utilisateurs](#6-utilisateurs)
7. [Véhicules](#7-véhicules)
8. [Clients](#8-clients)
9. [Réservations / Locations](#9-réservations--locations)
10. [Planning](#10-planning)
11. [Contrats](#11-contrats)
12. [Factures](#12-factures)
13. [Amendes](#13-amendes)
14. [Charges et Dépenses](#14-charges-et-dépenses)
15. [GPS et Localisation](#15-gps-et-localisation)
16. [Paiements](#16-paiements)
17. [Journal d'agence](#17-journal-dagence)
18. [Notifications](#18-notifications)
19. [Incidents](#19-incidents)
20. [Analytics et KPI](#20-analytics-et-kpi)
21. [Intelligence artificielle](#21-intelligence-artificielle)
22. [Sécurité](#22-sécurité)
23. [Audit et traçabilité](#23-audit-et-traçabilité)
24. [Soft delete et conventions](#24-soft-delete-et-conventions)
25. [Application mobile agent](#25-application-mobile-agent)
26. [Glossaire](#26-glossaire)

---

## 1. Vue d'ensemble et architecture SaaS

### 1.1 Contexte

MalocAuto est une plateforme SaaS multi-tenant de gestion de location de véhicules, destinée au marché marocain. La plateforme permet à plusieurs entreprises (tenants) de gérer leurs agences, véhicules, réservations et flux financiers via une interface web unique.

### 1.2 Architecture multi-tenant

```
SUPER_ADMIN (plateforme)
  └── Company (tenant / entreprise)
        ├── Subscription (abonnement SaaS)
        ├── Agency 1
        │     ├── Vehicles
        │     ├── Bookings
        │     ├── Clients
        │     └── Users (Manager, Agents)
        └── Agency 2
              └── ...
```

Chaque Company est un tenant isolé. Les données ne traversent jamais les frontières d'une Company, sauf pour le SUPER_ADMIN qui a une vue globale.

### 1.3 Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | NestJS (TypeScript), Prisma ORM, PostgreSQL |
| Frontend Web | Next.js 14 (App Router), React, TailwindCSS, TanStack Query |
| Mobile Agent | React Native (Expo) |
| Auth | JWT (access + refresh tokens), bcrypt |
| PDF | PDFKit |
| Carte | Leaflet / react-leaflet |
| Paiement | CMI (Centre Monétique Interbancaire) |
| Email | Nodemailer (SMTP) |

### 1.4 Applications

| Application | Port | Description |
|-------------|------|-------------|
| Backend API | 3000 | API REST NestJS, préfixe `/api/v1` |
| Frontend Web | 3100 | Interface unique Next.js (admin, company, agency) |
| Mobile Agent | — | Application React Native (Expo) |

---

## 2. Rôles, permissions et RBAC

### 2.1 Hiérarchie des rôles

| Rôle | Portée | Description |
|------|--------|-------------|
| `SUPER_ADMIN` | Plateforme | Gestion des entreprises, abonnements, santé plateforme |
| `COMPANY_ADMIN` | Entreprise | Gestion des agences, utilisateurs, paramètres entreprise |
| `AGENCY_MANAGER` | Agence(s) | Gestion opérationnelle complète de l'agence |
| `AGENT` | Agence(s) | Opérations terrain (réservations, check-in/out, GPS) |

### 2.2 Héritage dynamique COMPANY_ADMIN (gérant solo)

Un `COMPANY_ADMIN` qui est le seul utilisateur de sa Company hérite automatiquement des menus et permissions d'`AGENCY_MANAGER` pour pouvoir tout gérer seul. Dès qu'un deuxième utilisateur est créé dans la Company, il reprend son rôle normal de `COMPANY_ADMIN`.

**Détection** : `effectiveAgencyRole` est calculé côté frontend en comptant les utilisateurs de la Company.

### 2.3 Permissions par agence (UserAgency)

Chaque utilisateur est relié à une ou plusieurs agences via la table `UserAgency` avec un niveau de permission :

| Permission | Lecture | Écriture | Suppression |
|------------|---------|----------|-------------|
| `READ` | Oui | Non | Non |
| `WRITE` | Oui | Oui | Non |
| `FULL` | Oui | Oui | Oui |

### 2.4 Matrice d'accès par rôle

| Fonctionnalité | SUPER_ADMIN | COMPANY_ADMIN | AGENCY_MANAGER | AGENT |
|---------------|:-----------:|:-------------:|:--------------:|:-----:|
| Gestion entreprises | Oui | — | — | — |
| Abonnements | Oui | — | — | — |
| Santé comptes | Oui | — | — | — |
| Gestion agences | Oui | Oui | — | — |
| Gestion utilisateurs | Oui | Oui | — | — |
| Analytics entreprise | Oui | Oui | — | — |
| Planning entreprise | Oui | Oui | — | — |
| Véhicules | Oui | Via héritage | Oui | Lecture |
| Clients | Oui | Via héritage | Oui | Oui |
| Réservations | Oui | Via héritage | Oui | Oui |
| Planning agence | Oui | Via héritage | Oui | Oui |
| Factures | Oui | Via héritage | Oui | — |
| Contrats | Oui | Via héritage | Oui | — |
| Journal | Oui | Via héritage | Oui | — |
| Amendes | Oui | Via héritage | Oui | — |
| Charges & Dépenses | Oui | Via héritage | Oui | — |
| KPI | Oui | Via héritage | Oui | — |
| GPS | Oui | Via héritage | Oui | Oui |
| Notifications | Oui | Via héritage | Oui | Oui |

### 2.5 Protection self-modification

Un utilisateur ne peut jamais :
- Modifier son propre rôle
- Désactiver son propre compte
- Retirer ses propres agences/permissions
- Supprimer son propre compte

Ces protections sont appliquées côté backend (ForbiddenException) et côté frontend (champs désactivés avec message explicatif).

---

## 3. Système de modules

### 3.1 Principe

Chaque fonctionnalité est rattachée à un module SaaS activable par Company et par Agency. Un module non activé masque les menus correspondants et bloque les appels API.

### 3.2 Modules disponibles

| Code | Module | Dépendances |
|------|--------|-------------|
| `VEHICLES` | Véhicules, GPS, Charges | — |
| `BOOKINGS` | Réservations, Planning | `VEHICLES` |
| `INVOICES` | Factures, Contrats | `BOOKINGS` |
| `MAINTENANCE` | Maintenance | `VEHICLES` |
| `FINES` | Amendes | `VEHICLES` |
| `ANALYTICS` | Analytics, KPI | `BOOKINGS` |

### 3.3 Double filtrage des menus

1. **Rôle** : le menu n'apparaît que si le rôle de l'utilisateur est autorisé (`agencyRouteRoleMap`)
2. **Module** : le menu n'apparaît que si le module correspondant est activé pour l'agence/company (`agencyRouteModuleMap`)

### 3.4 Routes sans module requis

Certaines routes sont toujours accessibles : tableau de bord, notifications, profil utilisateur.

---

## 4. Entreprises et abonnements

### 4.1 Modèle Company

| Champ | Description |
|-------|-------------|
| `name` | Nom commercial |
| `raisonSociale` | Raison sociale légale |
| `identifiantLegal` | ICE (identifiant commun d'entreprise, unique) |
| `formeJuridique` | Forme juridique (SARL, SAS, SA, EI, AUTO_ENTREPRENEUR, ASSOCIATION, AUTRE) |
| `status` | ACTIVE, SUSPENDED, DELETED |
| `currency` | Devise (défaut : MAD) |
| `maxAgencies` | Nombre max d'agences autorisées |
| `bookingNumberMode` | AUTO ou MANUAL |

### 4.2 Numéro de booking (bookingNumberMode)

- **AUTO** : Généré automatiquement au format `YYYY` + 6 chiffres (ex: `2026000042`). Séquence par Company + année, reset annuel.
- **MANUAL** : Saisi manuellement par l'utilisateur. Obligatoire à la création. Unicité vérifiée au niveau Company.

### 4.3 Abonnements SaaS

Chaque Company possède un `Subscription` rattaché à un `Plan`. Le plan définit :
- Les modules inclus (`PlanModule`)
- Les quotas (nombre de véhicules, agences, utilisateurs) (`PlanQuota`)
- La période de facturation (mensuelle, trimestrielle, annuelle)

**Lifecycle** : ACTIVE → SUSPENDED (impayé) → EXPIRED (fin de terme) → CANCELLED.

Quand un abonnement est suspendu, la Company est bloquée : tous les endpoints API retournent 403 "La société est suspendue".

---

## 5. Agences

### 5.1 Modèle Agency

| Champ | Description |
|-------|-------------|
| `name` | Nom de l'agence |
| `address`, `phone`, `email` | Coordonnées |
| `status` | ACTIVE, SUSPENDED, DELETED |
| `companyId` | Rattachement à la Company |

### 5.2 Modules agence

Chaque agence peut activer un sous-ensemble des modules de sa Company. Un module ne peut être activé au niveau agence que s'il est inclus dans l'abonnement de la Company.

### 5.3 Règle véhicule-agence

Un véhicule appartient à **une seule** agence (`Vehicle.agencyId`). Pas de partage cross-agence. Pour transférer un véhicule, il faut changer son `agencyId`.

---

## 6. Utilisateurs

### 6.1 Modèle User

| Champ | Description |
|-------|-------------|
| `email` | Email unique, sert d'identifiant |
| `name` | Nom complet |
| `role` | SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER, AGENT |
| `isActive` | Compte actif/inactif |
| `companyId` | Rattachement Company (null pour SUPER_ADMIN) |
| `twoFactorEnabled` | Support 2FA |

### 6.2 Relations agences

Via `UserAgency` : un utilisateur peut être rattaché à plusieurs agences avec des permissions différentes (READ, WRITE, FULL).

### 6.3 Restrictions de création

- Un `COMPANY_ADMIN` ne peut créer que des `AGENCY_MANAGER` et `AGENT`.
- Seul `SUPER_ADMIN` peut créer des `COMPANY_ADMIN` et d'autres `SUPER_ADMIN`.

### 6.4 Sécurité des réponses API

Le champ `password` (hash bcrypt) n'est **jamais** retourné dans les réponses API. Une méthode `sanitizeUser()` supprime systématiquement `password`, `resetToken` et `resetTokenExpiry` avant tout retour.

---

## 7. Véhicules

### 7.1 Modèle Vehicle

| Champ | Description |
|-------|-------------|
| `brand`, `model` | Marque et modèle |
| `registrationNumber` | Immatriculation (unique par agence) |
| `year`, `mileage`, `color` | Caractéristiques |
| `dailyRate` | Tarif journalier |
| `status` | Statut opérationnel |
| `imageUrl` | Photo du véhicule |
| `gpsTrackerId` | ID du tracker GPS physique |
| `gpsTrackerLabel` | Libellé du tracker |

### 7.2 Statuts véhicule

| Statut | Description |
|--------|-------------|
| `AVAILABLE` | Disponible à la location |
| `RESERVED` | Réservé (booking confirmé, pas encore livré) |
| `RENTED` | En location active |
| `IN_DELIVERY` | En cours de livraison (check-in) |
| `IN_RECOVERY` | En récupération (check-out) |
| `MAINTENANCE` | En maintenance |
| `UNAVAILABLE` | Non disponible |
| `TEMP_UNAVAILABLE` | Temporairement indisponible |

### 7.3 Recherche

Base de données intégrée de marques et modèles de véhicules avec autocomplétion. Upload d'images véhicule vers le serveur.

---

## 8. Clients

### 8.1 Modèle Client

| Champ | Description |
|-------|-------------|
| `name` | Nom complet |
| `email`, `phone` | Contact (optionnels) |
| `idCardNumber` | Numéro CIN |
| `passportNumber` | Numéro de passeport |
| `driverLicenseNumber` | Numéro de permis |
| `licenseExpiryDate` | Date d'expiration du permis |
| `address`, `city`, `country` | Adresse |
| `dateOfBirth` | Date de naissance |
| `blacklisted`, `blacklistReason` | Gestion liste noire |

### 8.2 Documents

Les documents client (CIN, permis, photos) sont stockés via le modèle `Document` avec upload vers le serveur.

### 8.3 Analyse de permis (IA)

Endpoint `POST /clients/analyze-license` : analyse d'une photo de permis de conduire pour extraire automatiquement les informations (nom, numéro, date d'expiration).

---

## 9. Réservations / Locations

### 9.1 Workflow complet

```
DRAFT → PENDING → CONFIRMED → IN_PROGRESS → RETURNED → (Clôture financière)
                                    ↓
                               EXTENDED / LATE
                                    ↓
                               RETURNED
```

Transitions possibles : CONFIRMED → CANCELLED, PENDING → NO_SHOW, etc.

### 9.2 Statuts de réservation

| Statut | Description |
|--------|-------------|
| `DRAFT` | Brouillon, pas encore validé |
| `PENDING` | En attente de confirmation |
| `CONFIRMED` | Confirmée, véhicule réservé |
| `IN_PROGRESS` | Location en cours (après check-in) |
| `EXTENDED` | Prolongation de la durée |
| `LATE` | Retard de restitution |
| `RETURNED` | Véhicule restitué (après check-out) |
| `CANCELLED` | Annulée |
| `NO_SHOW` | Client ne s'est pas présenté |

### 9.3 Check-in (CONFIRMED → IN_PROGRESS)

- Relevé du kilométrage de départ
- Niveau de carburant
- État des lieux (dommages existants)
- Photos du véhicule
- Signature client
- Collecte de la caution
- Capture GPS

### 9.4 Check-out (IN_PROGRESS → RETURNED)

- Relevé du kilométrage de retour
- Niveau de carburant
- État des lieux de retour (nouveaux dommages)
- Photos du véhicule
- Signature client
- Calcul des frais de retard
- Capture GPS

### 9.5 Clôture financière

Après le check-out, le manager effectue la clôture financière : vérification des montants, ajustement des frais, statut final de la caution (REFUNDED, PARTIAL, FORFEITED, DISPUTED).

### 9.6 Caution (Deposit)

| Champ | Description |
|-------|-------------|
| `depositRequired` | Caution requise (oui/non) |
| `depositAmount` | Montant de la caution |
| `depositType` | Type (CASH, CARD_HOLD, TRANSFER, CHEQUE, OTHER) |
| `depositDecisionSource` | Source de la décision (COMPANY, AGENCY) |
| `depositStatusCheckIn` | Statut au check-in (PENDING, COLLECTED) |
| `depositStatusFinal` | Statut final (REFUNDED, PARTIAL, FORFEITED, DISPUTED) |

### 9.7 Frais de retard

Calculés automatiquement à partir de `originalEndDate` vs date de retour réelle. Le manager peut les modifier manuellement (`lateFeeAmount`, `lateFeeOverriddenBy`).

### 9.8 Validation d'accès agence

Toutes les opérations sur les bookings vérifient que l'utilisateur a accès à l'agence du booking :
- `SUPER_ADMIN` : accès total
- `COMPANY_ADMIN` : booking de sa company uniquement
- `AGENT/MANAGER` : booking de leurs agences assignées uniquement

---

## 10. Planning

### 10.1 Composant

Le planning est une grille ressources x temps. Les ressources sont les véhicules, les événements sont les bookings, maintenances, blocages et temps de préparation.

### 10.2 Vues disponibles

| Vue | Description |
|-----|-------------|
| Jour | Créneaux horaires par véhicule |
| Semaine | 7 jours par véhicule |
| Mois | Vue calendrier mensuelle |

### 10.3 Types d'événements et couleurs

| Type | Couleur | Description |
|------|---------|-------------|
| `BOOKING` | Bleu | Réservation |
| `MAINTENANCE` | Orange | Maintenance planifiée |
| `BLOCKAGE` | Rouge | Blocage (véhicule indisponible) |
| `PREPARATION_TIME` | Gris | Temps de préparation entre locations |

### 10.4 Disponibilité et conflits

- `POST /planning/check-availability` : vérifie la disponibilité d'un véhicule sur une période
- `GET /planning/next-availability/:vehicleId` : prochaine date disponible
- Détection de conflits : chevauchement de réservations sur le même véhicule

### 10.5 Ownership validation

Tous les endpoints planning vérifient que l'utilisateur a accès au véhicule/agence concerné avant toute opération.

---

## 11. Contrats

### 11.1 Workflow

1. **Création** : un contrat est généré à partir d'un booking avec un payload gelé (snapshot des données au moment de la création)
2. **Signature** : signature digitale client puis agent (`signerType: 'client' | 'agent'`)
3. **Effectivité** : le contrat devient effectif après les deux signatures
4. **Versioning** : possibilité de créer une nouvelle version (l'ancienne est expirée) dans une transaction atomique

### 11.2 Statuts

| Statut | Description |
|--------|-------------|
| `DRAFT` | Brouillon |
| `PENDING_SIGNATURE` | En attente de signature |
| `SIGNED` | Signé par les deux parties |
| `EXPIRED` | Version expirée (nouvelle version créée) |
| `CANCELLED` | Annulé |

### 11.3 PDF

Génération de PDF via PDFKit au format A4 marocain. Le PDF est généré à partir du payload gelé, garantissant la conformité légale.

### 11.4 Sécurité

- Contrôle IDOR : l'utilisateur qui accède au contrat doit avoir accès à l'agence du booking
- Validation `signerType` avec `@IsIn(['client', 'agent'])`

---

## 12. Factures

### 12.1 Principe

Chaque facture contient un **payload gelé** (snapshot) de toutes les données au moment de l'émission : company, agency, client, booking, vehicle, montants. Cela garantit que la facture reste fidèle même si les données source changent.

### 12.2 Numérotation

Format : séquence par Company + année. Exemple : `FAC-2026-000042`. Contrainte d'unicité `@@unique([companyId, year, sequence])`.

### 12.3 Timezone Maroc

L'année de la facture est calculée en timezone `Africa/Casablanca` via `getMoroccoYear()` pour éviter les bugs de frontière d'année (31 déc 23h UTC = 1er jan 00h Maroc).

### 12.4 Types

| Type | Description |
|------|-------------|
| `INVOICE` | Facture standard |
| `CREDIT_NOTE` | Avoir (annulation partielle ou totale) |

### 12.5 Statuts

| Statut | Description |
|--------|-------------|
| `ISSUED` | Émise |
| `PAID` | Payée |
| `CANCELLED` | Annulée |

### 12.6 PDF

Génération PDF au format A4 avec : en-tête company, informations client, détails location, tableau des prix avec devise dynamique (pas de "MAD" hardcodé), totaux, informations de caution.

---

## 13. Amendes

### 13.1 Saisie minimale

Pour créer une amende, les données minimales sont :
- Numéro de l'amende
- Montant
- Description
- Date d'infraction (optionnelle, pour auto-identification)
- Numéro d'immatriculation (optionnel, pour auto-identification)

### 13.2 Auto-identification du client

Si `registrationNumber` et `infractionDate` sont fournis, le système identifie automatiquement le booking actif à cette date pour ce véhicule et le client responsable.

**Règles exactes** :
- Match si `startDate <= infractionDate <= endDate` (inclus)
- Si plusieurs matchs : priorité au booking le plus récent
- Si aucun match : statut reste RECUE, client null

### 13.3 Workflow statut

```
RECUE → CLIENT_IDENTIFIE → TRANSMISE → CONTESTEE → CLOTUREE
```

| Statut | Description |
|--------|-------------|
| `RECUE` | Amende reçue par l'agence |
| `CLIENT_IDENTIFIE` | Client responsable identifié (auto ou manuel) |
| `TRANSMISE` | Amende transmise au client |
| `CONTESTEE` | Client conteste l'amende |
| `CLOTUREE` | Amende traitée (payée ou annulée) |

---

## 14. Charges et Dépenses

### 14.1 Principe

Module central qui regroupe toutes les charges liées aux véhicules. Remplace le lien "Maintenance" dans la sidebar par "Charges & Dépenses" qui englobe les maintenances et toutes les autres dépenses.

### 14.2 Catégories

| Code | Libellé |
|------|---------|
| `INSURANCE` | Assurance |
| `VIGNETTE` | Vignette |
| `BANK_INSTALLMENT` | Crédit bancaire |
| `PREVENTIVE_MAINTENANCE` | Maintenance préventive |
| `CORRECTIVE_MAINTENANCE` | Maintenance corrective |
| `FUEL` | Carburant |
| `EXCEPTIONAL` | Dépense exceptionnelle |
| `OTHER` | Autre |

### 14.3 KPI

- **Revenu** : somme des `totalPrice` des bookings sur la période
- **Charges** : somme des charges sur la période
- **Marge** : Revenu - Charges
- **Taux de marge** : Marge / Revenu × 100
- **Taux d'occupation** : jours loués / (nombre véhicules × jours période) × 100
- **Rentabilité par véhicule** : classement des véhicules par profit net

---

## 15. GPS et Localisation

### 15.1 Captures GPS (Snapshots)

Les positions GPS sont capturées à des moments clés :

| Raison | Déclencheur |
|--------|------------|
| `CHECK_IN` | Lors du départ du véhicule |
| `CHECK_OUT` | Lors de la restitution |
| `INCIDENT` | Lors d'un incident |
| `MANUAL` | Capture manuelle par le manager |

### 15.2 GPS manquant

Si le GPS n'est pas disponible (permission refusée, hors ligne, appareil incompatible), un enregistrement `isGpsMissing: true` est créé avec la raison.

### 15.3 Carte interactive

Page GPS avec carte Leaflet affichant :
- Dernières positions de tous les véhicules
- Historique des positions par véhicule (polyline)
- Position de l'utilisateur (marqueur pulsant)
- Marqueurs colorés par raison

### 15.4 Trackers GPS physiques

Chaque véhicule peut être associé à un tracker GPS physique via `gpsTrackerId` et `gpsTrackerLabel`. L'association/dissociation se fait depuis la page GPS.

### 15.5 Coordonnées zéro

La vérification des coordonnées utilise `!= null` (pas de check falsy) car latitude 0 et longitude 0 sont des coordonnées valides (intersection méridien de Greenwich et équateur).

---

## 16. Paiements

### 16.1 Méthodes de paiement

| Méthode | Description |
|---------|-------------|
| `ONLINE_CMI` | Paiement en ligne via CMI (Centre Monétique Interbancaire) |
| `CASH` | Espèces |
| `BANK_TRANSFER` | Virement bancaire |
| `OTHER` | Autre |

### 16.2 Statuts

| Statut | Description |
|--------|-------------|
| `PENDING` | En attente |
| `PAID` | Payé |
| `FAILED` | Échoué |
| `REFUNDED` | Remboursé |
| `PARTIAL` | Paiement partiel |

### 16.3 Caution

Gestion complète du cycle de vie de la caution : collecte au check-in, statut final au check-out/clôture financière.

---

## 17. Journal d'agence

### 17.1 Principe

Le journal est une projection chronologique de tous les événements d'une agence. Il combine des entrées automatiques (générées par le système) et des notes manuelles (créées par les managers).

### 17.2 Types d'entrées automatiques

| Type | Événement |
|------|-----------|
| `BOOKING_CREATED` | Réservation créée |
| `BOOKING_UPDATED` | Réservation modifiée |
| `BOOKING_CANCELLED` | Réservation annulée |
| `CHECK_IN` | Check-in effectué |
| `CHECK_OUT` | Check-out effectué |
| `INVOICE_ISSUED` | Facture émise |
| `CREDIT_NOTE_ISSUED` | Avoir émis |
| `CONTRACT_CREATED` | Contrat créé |
| `CONTRACT_SIGNED` | Contrat signé |
| `INCIDENT_REPORTED` | Incident signalé |
| `INCIDENT_RESOLVED` | Incident résolu |
| `GPS_SNAPSHOT` | Position GPS capturée |
| `SYSTEM_EVENT` | Événement système |

### 17.3 Notes manuelles

Les `AGENCY_MANAGER` et `COMPANY_ADMIN` peuvent créer, modifier et supprimer des notes manuelles. Les `AGENT` ne peuvent pas créer de notes.

### 17.4 Contrôle d'accès

La méthode `assertEntryAccess()` vérifie que l'utilisateur a accès à l'entrée de journal (même company, même agence). `findOne()` inclut ce contrôle.

---

## 18. Notifications

### 18.1 Canaux

| Canal | Implémentation |
|-------|---------------|
| Email | Nodemailer (SMTP), templates HTML |
| Push | FCM (Firebase Cloud Messaging) via `DeviceToken` |
| In-app | Table `InAppNotification`, badge non-lu |
| WhatsApp | Service WhatsApp (optionnel) |

### 18.2 Types de notifications in-app

| Type | Description |
|------|-------------|
| `CONTRACT_TO_SIGN` | Contrat à signer |
| `INVOICE_AVAILABLE` | Facture disponible |
| `BOOKING_LATE` | Retard de restitution |
| `CHECK_OUT_REMINDER` | Rappel de check-out |
| `INCIDENT_REPORTED` | Incident signalé |
| `SYSTEM_ALERT` | Alerte système |
| `ADMIN_ANNOUNCEMENT` | Annonce admin (broadcast) |

### 18.3 Broadcast admin

Le `SUPER_ADMIN` peut envoyer des notifications à toutes les entreprises ou à une entreprise spécifique. Le bouton d'envoi est désactivé tant qu'aucune entreprise n'est sélectionnée (si mode "entreprise spécifique").

### 18.4 Emails

Les emails contiennent les informations sensibles redactées dans les logs : `admin@example.com` → `a***@example.com`.

---

## 19. Incidents

### 19.1 Types

| Type | Description |
|------|-------------|
| `DAMAGE` | Dommage sur le véhicule |
| `FINE` | Amende |
| `ACCIDENT` | Accident |
| `THEFT` | Vol |
| `OTHER` | Autre |

### 19.2 Workflow

```
REPORTED → UNDER_REVIEW → RESOLVED / DISPUTED
```

### 19.3 Association

Un incident est lié à un booking et optionnellement à un véhicule. Photos et documents peuvent être attachés.

---

## 20. Analytics et KPI

### 20.1 Dashboard Super Admin

KPI globaux de la plateforme : nombre de companies, revenue total, bookings actifs, véhicules totaux.

### 20.2 Dashboard Company

Analytics par entreprise avec vue sur toutes les agences.

### 20.3 Dashboard Agence (KPI)

| KPI | Calcul |
|-----|--------|
| Revenu | Somme `totalPrice` des bookings |
| Charges | Somme des charges |
| Marge nette | Revenu - Charges |
| Taux de marge | Marge / Revenu × 100 |
| Taux d'occupation | Jours loués / jours disponibles |
| Panier moyen | Revenu / nombre de bookings |
| Rentabilité par véhicule | Classement profit net par véhicule |

### 20.4 Filtres

Tous les KPI sont filtrables par période (date début / fin) et par agence.

---

## 21. Intelligence artificielle

### 21.1 Détection de dommages

- `POST /ai/damage/detect` : analyse d'une photo pour détecter des dommages
- `POST /ai/damage/detect-batch` : analyse de plusieurs photos

### 21.2 Analyse de permis

- `POST /clients/analyze-license` : extraction automatique des données d'un permis de conduire à partir d'une photo

### 21.3 Chatbot

- `POST /ai/chatbot/question` : question au chatbot
- `GET /ai/chatbot/faq` : FAQ prédéfinie

---

## 22. Sécurité

### 22.1 Protection à 3 niveaux

| Niveau | Mécanisme | Description |
|--------|-----------|-------------|
| 1 - Frontend | Sidebar + RouteGuard | Masque les menus non autorisés, redirige si URL directe |
| 2 - Middleware | Next.js middleware | Vérifie le token JWT côté serveur pour les routes protégées |
| 3 - Backend | Guards NestJS | 8 guards vérifient auth, rôle, permissions, modules, statut company/agency |

### 22.2 Guards backend

| Guard | Description |
|-------|-------------|
| `JwtAuthGuard` | Authentification JWT obligatoire |
| `RolesGuard` | Vérifie le rôle de l'utilisateur |
| `PermissionGuard` | Vérifie les permissions (bookings:read, etc.) |
| `RequireModuleGuard` | Vérifie que le module est activé |
| `RequirePermissionGuard` | Vérifie la permission UserAgency (READ/WRITE/FULL) |
| `RequireActiveCompanyGuard` | Vérifie que la Company est active (pas suspendue) |
| `RequireActiveAgencyGuard` | Vérifie que l'Agency est active |
| `ReadOnlyGuard` | Mode lecture seule |

### 22.3 Authentification

- JWT access token (1h) + refresh token (7j)
- Rate limiting : 5 tentatives/min sur login, 3/min sur forgot-password
- Impersonation : réservée au `SUPER_ADMIN`, le refresh token d'impersonation ne peut pas être étendu en session normale
- Hash bcrypt pour les mots de passe
- Token de réinitialisation avec expiration

### 22.4 Protections récentes

- **Password hash exclu** des réponses API (sanitizeUser)
- **Validation cross-agence** sur les bookings (assertBookingAccess)
- **Self-modification bloquée** (rôle, statut actif, agences)
- **Ownership planning** (assertVehicleAccess, assertAgencyAccess)
- **Outbox idempotent** (gestion collision P2002)
- **Blob response interceptor** (pas de parsing JSON sur les téléchargements PDF)

---

## 23. Audit et traçabilité

### 23.1 Double système d'audit

| Système | Table | Usage |
|---------|-------|-------|
| AuditLog | `AuditLog` | Actions techniques (CREATE, UPDATE, DELETE, LOGIN, etc.) |
| BusinessEventLog | `BusinessEventLog` | Événements métier (BOOKING_CREATED, INVOICE_ISSUED, etc.) |

### 23.2 Outbox pattern

Les événements de domaine sont persistés via un **outbox pattern** pour garantir la fiabilité :
1. L'événement est créé dans la table `OutboxEvent` avec statut PENDING
2. Un processeur traite les événements en arrière-plan
3. En cas d'échec : retry avec backoff exponentiel
4. Après N échecs : statut FAILED (dead-letter)
5. Idempotence : collision `deduplicationKey` (P2002) retourne l'ID existant au lieu de lever une erreur

### 23.3 Journal d'agence

Le journal (`JournalEntry`) est la projection côté utilisateur des événements métier. C'est une vue lisible et filtrable de l'activité de l'agence.

### 23.4 Champs d'audit

Chaque entité porte des champs d'audit automatiques : `createdByUserId`, `updatedByUserId`, `deletedByUserId`, `deletedReason`. Ces champs sont supprimés des réponses API par `removeAuditFields()`.

---

## 24. Soft delete et conventions

### 24.1 Entités avec soft delete

| Entité | Champs |
|--------|--------|
| Company | `deletedAt`, `deletedByUserId`, `deletedReason` |
| Agency | `deletedAt`, `deletedByUserId`, `deletedReason` |
| User | `deletedAt`, `deletedByUserId`, `deletedReason` |
| Vehicle | `deletedAt`, `deletedByUserId`, `deletedReason` |
| Client | `deletedAt`, `deletedByUserId`, `deletedReason` |
| Booking | `deletedAt`, `deletedByUserId`, `deletedReason` |
| Maintenance | `deletedAt`, `deletedByUserId`, `deletedReason` |

### 24.2 Entités avec hard delete

Fine, Incident, Document, Payment, PlanningEvent, GpsSnapshot, Invoice, Contract, JournalEntry, Notification, Charge.

### 24.3 Filtrage

Toutes les requêtes Prisma sur les entités soft-delete incluent `addSoftDeleteFilter()` qui ajoute `{ deletedAt: null }` au where clause.

### 24.4 Messages d'erreur

Tous les messages d'erreur backend sont en **français**. Exemples :
- "Email introuvable"
- "Réservation introuvable"
- "Vous ne pouvez pas modifier votre propre rôle"
- "La société est suspendue. Veuillez contacter le support."

---

## 25. Application mobile agent

### 25.1 Positionnement

L'application mobile est destinée aux agents terrain. Elle permet :
- Consultation du planning assigné
- Check-in avec capture GPS, photos, signature
- Check-out avec capture GPS, photos, signature
- Signalement d'incidents
- Capture GPS manuelle

### 25.2 Stack

React Native (Expo), TypeScript, TanStack Query, Expo Location, Expo Camera.

### 25.3 GPS mobile

Le service GPS mobile vérifie les coordonnées avec `!= null` (pas de check falsy pour 0). En cas d'échec GPS, un rapport "GPS missing" est envoyé au backend avec try/catch.

---

## 26. Glossaire

| Terme | Définition |
|-------|-----------|
| **Tenant** | Entreprise cliente (Company) utilisant la plateforme |
| **Agency** | Agence physique d'une entreprise |
| **Booking** | Réservation / location d'un véhicule |
| **Check-in** | Remise du véhicule au client (début de location) |
| **Check-out** | Restitution du véhicule par le client (fin de location) |
| **Deposit** | Caution versée par le client |
| **ICE** | Identifiant Commun d'Entreprise (Maroc) |
| **CIN** | Carte d'Identité Nationale |
| **MAD** | Dirham marocain (devise par défaut) |
| **CMI** | Centre Monétique Interbancaire (paiement en ligne Maroc) |
| **Payload gelé** | Snapshot des données au moment de la création (facture, contrat) |
| **Outbox** | Pattern de persistance des événements de domaine |
| **Guard** | Middleware NestJS de vérification (auth, rôle, permission, module) |
| **Soft delete** | Suppression logique (marquage `deletedAt`) |
| **Hard delete** | Suppression physique de la base de données |
| **Solo operator** | COMPANY_ADMIN qui est le seul utilisateur de sa Company |
| **KPI** | Key Performance Indicator (indicateur clé de performance) |
