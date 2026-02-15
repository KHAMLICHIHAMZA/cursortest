# MalocAuto V2 - Release Notes

## Vue d'ensemble

MalocAuto V2 est une version structurante destinée au marché marocain, apportant des fonctionnalités métier clés pour les loueurs de véhicules.

**Date de release**: Janvier 2026

---

## Nouvelles Fonctionnalités

### 1. Numéro de Réservation (BookingNumber)

**Mode de configuration au niveau Company:**
- **AUTO**: Numéro généré automatiquement par le backend (format: `RES-YYYY-NNNNNN`)
- **MANUAL**: Saisie manuelle avec validation stricte (alphanumérique, max 32 caractères)

**Règles métier:**
- Unicité garantie par Company (index unique dans la base de données)
- Numéro consommé même si la réservation est annulée (pas de réutilisation)
- Modification autorisée tant qu'aucune facture n'a été émise (InvoiceIssued)
- Visible partout : planning, listes, détail booking, header check-in mobile

**Endpoints:**
- `GET /bookings` - inclut `bookingNumber` dans la réponse
- `POST /bookings` - génère ou valide le `bookingNumber`
- `PATCH /bookings/:id` - permet la modification si aucune facture n'existe

---

### 2. Facturation V2 (Invoice)

**Numérotation légale:**
- Séquence par Company avec reset annuel
- Format: `FAC-YYYY-NNNNNN`
- Numérotation transactionnelle (pas de doublons)

**Payload Figé:**
- Snapshot immutable des données au moment de l'émission
- Inclut : Company, Agency, Client, Vehicle, Booking, Amounts
- Timezone Maroc (Africa/Casablanca)
- Version du payload pour évolutions futures

**Avoir (Credit Note):**
- Format: `AVO-YYYY-NNNNNN`
- Montants négatifs
- Référence à la facture originale
- Traçabilité complète avec raison obligatoire

**Endpoints:**
- `POST /invoices/booking/:bookingId/generate` - Génère une facture
- `GET /invoices/:id/payload` - Récupère le payload figé pour PDF
- `POST /invoices/:id/credit-note` - Crée un avoir (managers uniquement)

---

### 3. Contrat de Location (E-Contrat)

**Cycle de vie:**
1. **DRAFT** - Créé à la création de la réservation
2. **PENDING_SIGNATURE** - Après la première signature
3. **SIGNED** - Après les deux signatures (client + agent)
4. **EXPIRED** - Remplacé par une nouvelle version
5. **CANCELLED** - Annulé

**Signatures:**
- Signature client (base64 image)
- Signature agent (any member of agency)
- Horodatage et device info pour audit
- Immutabilité après signature complète

**Versioning:**
- Nouvelle version obligatoire si modification après signature
- Raison de modification obligatoire
- Chaînage avec version précédente

**Endpoints:**
- `POST /contracts` - Crée un contrat
- `POST /contracts/:id/sign` - Signe le contrat
- `POST /contracts/:id/new-version` - Crée une nouvelle version
- `PATCH /contracts/:id/effective` - Rend le contrat effectif
- `GET /contracts/:id/payload` - Récupère le payload figé

---

### 4. Journal d'Agence

**Projection des événements:**
- Entrées automatiques depuis les Domain Events (Outbox)
- Types : BOOKING_CREATED, CHECK_IN, CHECK_OUT, INVOICE_ISSUED, CONTRACT_SIGNED, INCIDENT_REPORTED, GPS_SNAPSHOT, etc.
- Entrées immuables (non modifiables)

**Notes Manuelles:**
- CRUD pour SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER
- Interdit pour AGENT
- Horodatage des modifications
- Audit trail

**Filtres:**
- Date (from/to)
- Type d'événement
- Numéro de réservation
- Véhicule
- Utilisateur

**Endpoints:**
- `GET /journal` - Liste avec filtres
- `POST /journal/notes` - Crée une note manuelle
- `PATCH /journal/notes/:id` - Modifie une note
- `DELETE /journal/notes/:id` - Supprime une note

---

### 5. GPS Snapshots (Eco-Friendly)

**Captures uniquement aux moments clés:**
- CHECK_IN
- CHECK_OUT
- INCIDENT
- MANUAL (managers uniquement)

**Données stockées:**
- Latitude / Longitude
- Accuracy (mètres)
- Altitude
- Timestamp
- Kilométrage (optionnel)
- Device info

**Gestion GPS indisponible:**
- Action métier non bloquée
- Tag "GPS manquant" avec raison (permissionDenied, offline, deviceUnsupported)

**RBAC:**
- Snapshots automatiques : tous les rôles
- Snapshots manuels : SUPER_ADMIN, COMPANY_ADMIN, AGENCY_MANAGER uniquement

**Endpoints:**
- `POST /gps` - Capture un snapshot
- `POST /gps/manual` - Capture manuelle (managers)
- `POST /gps/missing` - Enregistre GPS manquant
- `GET /gps/booking/:bookingId` - Snapshots d'une réservation
- `GET /gps/vehicle/:vehicleId` - Snapshots d'un véhicule

---

### 6. Notifications In-App

**États du cycle de vie:**
- DRAFT - Notification créée
- SCHEDULED - Planifiée pour envoi futur
- SENT - Envoyée à l'utilisateur
- READ - Lue par l'utilisateur

**Types de notifications prioritaires V2:**
- CONTRACT_TO_SIGN - Contrat à signer
- INVOICE_AVAILABLE - Facture disponible
- BOOKING_LATE - Retard détecté
- CHECK_OUT_REMINDER - Rappel de retour
- INCIDENT_REPORTED - Incident signalé
- SYSTEM_ALERT - Alerte système

**Endpoints:**
- `GET /notifications/in-app` - Liste des notifications
- `GET /notifications/in-app/unread-count` - Compteur non lues
- `PATCH /notifications/in-app/:id/read` - Marquer comme lue
- `POST /notifications/in-app/read-all` - Tout marquer comme lu

---

## Architecture V2

### Modular Monolith DDD

**Bounded Contexts:**
1. Identity & Access
2. Company & Agency
3. Fleet
4. Booking (cœur métier)
5. Documents (moteur unique pour factures/contrats)
6. Journal d'agence (projection)
7. Notifications
8. Telemetry (GPS snapshots)
9. Finance (Charges & KPI)

### Outbox Pattern

**Événements Domain supportés:**
- BookingCreated
- BookingNumberAssigned
- CheckInCompleted
- CheckOutCompleted
- InvoiceIssued
- CreditNoteIssued
- ContractCreated
- ContractSigned
- IncidentReported
- IncidentResolved
- GpsSnapshotCaptured

**Caractéristiques:**
- Idempotence avec clé de déduplication
- Retry avec backoff exponentiel
- Dead-letter après N tentatives
- Projection vers le Journal automatique

---

## Nouveaux Modèles Prisma

```prisma
// Contract
model Contract {
  id, bookingId, agencyId, companyId
  templateId, templateVersion
  status, payload
  clientSignedAt, clientSignature, clientSignedDevice
  agentSignedAt, agentSignature, agentSignedDevice, agentUserId
  version, previousVersion, versionReason
  effectiveAt, expiresAt
}

// JournalEntry
model JournalEntry {
  id, agencyId, companyId
  type, title, content
  bookingId, bookingNumber, vehicleId, userId
  contractId, invoiceId, incidentId
  metadata, isManualNote, editedAt, editedBy
}

// GpsSnapshot
model GpsSnapshot {
  id, agencyId, bookingId, vehicleId
  latitude, longitude, accuracy, altitude
  reason, capturedByUserId, capturedByRole
  isGpsMissing, gpsMissingReason
  deviceInfo, mileage
}

// InAppNotification
model InAppNotification {
  id, userId, companyId, agencyId
  type, status, title, message, actionUrl
  bookingId, contractId, invoiceId
  scheduledAt, sentAt, readAt
  metadata
}
```

---

## Frontend Updates

### frontend-agency

**Nouvelles pages:**
- `/invoices` - Liste et téléchargement des factures
- `/contracts` - Liste et statut des contrats
- `/journal` - Journal d'agence avec filtres et notes manuelles
- `/notifications` - Centre de notifications in-app

**Mises à jour Layout:**
- Nouveaux items de navigation : Factures, Contrats, Journal, Notifications

### mobile-agent

**Nouveaux services:**
- `contract.service.ts` - Gestion des contrats
- `gps.service.ts` - Capture GPS avec gestion des permissions
- `notification.service.ts` - Notifications in-app

**Check-in/Check-out:**
- Affichage du bookingNumber dans le header
- Capture GPS automatique
- Signature client et agent

---

## Tests

### Tests Unitaires

- `invoice.service.spec.ts` - Payload, numérotation, credit notes
- `contract.service.spec.ts` - Lifecycle, signatures, versioning
- `journal.service.spec.ts` - Events, notes, filters
- `gps.service.spec.ts` - Snapshots, RBAC
- `in-app-notification.service.spec.ts` - États, envoi, lecture

### Tests E2E

- `v2-booking-flow.e2e-spec.ts` - Flow complet booking -> invoice -> lock
- Outbox pipeline PENDING -> PROCESSED
- BookingNumber AUTO/MANUAL + unicité + lock
- Contract lifecycle DRAFT -> SIGNED -> immutable
- Journal entries from domain events

---

## Migration

### Étapes de déploiement

1. Exécuter les migrations Prisma : `npx prisma migrate deploy`
2. Générer le client Prisma : `npx prisma generate`
3. Rebuilder le backend : `npm run build`
4. Rebuilder les frontends : `npm run build` (pour chaque app)

### Données existantes

- Les réservations existantes sans `bookingNumber` doivent être migrées
- Script de migration disponible : `scripts/migrate-booking-numbers.ts`

---

## Contraintes & Règles

1. **Pas de modification de facture après émission** - Seuls les avoirs sont permis
2. **BookingNumber verrouillé après InvoiceIssued** - Aucune modification possible
3. **Contrat immutable après signature** - Nouvelle version obligatoire
4. **GPS non bloquant** - L'action métier continue même sans GPS
5. **Notes manuelles managers uniquement** - AGENT ne peut pas créer/modifier/supprimer

---

## Prochaines Étapes (V3)

- Export PDF natif des factures et contrats
- Notifications push (FCM/APNs)
- KPI eco-friendly basés sur GPS
- Paiement en ligne (CMI intégration)
- Dashboard analytics avancé
