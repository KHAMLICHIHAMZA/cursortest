# Réponses aux questions V1 – MalocAuto

**Source :** code actuel (schema, services, controllers, frontends, mobile).  
**Preuves :** chemins de fichiers + extraits pertinents.

---

## A) Référentiel Booking

### A.1 Statuts EXACTS dans `schema.prisma` (enum `BookingStatus`)

```prisma
enum BookingStatus {
  DRAFT
  PENDING
  CONFIRMED
  IN_PROGRESS
  EXTENDED
  LATE
  RETURNED
  CANCELLED
  NO_SHOW
}
```

**Fichier :** `backend/prisma/schema.prisma` (l.28–37).

### A.2 Statuts utilisés dans les flows

| Flow | Statuts utilisés | Où |
|------|------------------|-----|
| **Création** | `status \|\| 'DRAFT'` (create), puis éventuellement `CONFIRMED` / `IN_PROGRESS` si event planning créé | `booking.service.ts:224`, `237–238` |
| **Check-in** | Entrée : `CONFIRMED`. Sortie : `IN_PROGRESS` | `booking.service.ts:286`, `436` |
| **Check-out** | Entrée : `IN_PROGRESS` ou `LATE`. Sortie : `RETURNED` | `booking.service.ts:499–502`, `641` |
| **Financial-closure** | Pas de changement de statut. Bloqué si `incidents DISPUTED` ou `depositStatusFinal === 'DISPUTED'` | `booking.service.ts:1019–1067` |
| **Override late fee** | Uniquement si `status === 'RETURNED'` | `booking.service.ts:1133` |

### A.3 Mapping UI par app (labels affichés vs DB)

| App | Valeurs DB utilisées | Labels / mapping |
|-----|----------------------|------------------|
| **Admin** | Pas de liste Bookings dédiée (planning seulement). | - |
| **Agency** | `CONFIRMED`, `CANCELLED`, `PENDING`, etc. + UI « ACTIVE » / « COMPLETED » | `Bookings.tsx:295–304` : `ACTIVE` → badge, `CONFIRMED` → autre, `COMPLETED` → autre. Options form : Confirmée, Annulée. |
| **Web** | Idem backend (pas de mapping spécifique dans les snippets vus). | - |
| **Mobile** | Backend : `IN_PROGRESS`, `RETURNED`, … → mapping local | `booking.service.ts:19–25` : `IN_PROGRESS` → `ACTIVE`, `RETURNED` → `COMPLETED`. Labels i18n `booking.status.*` (fr/en/darija). |

**Résumé :** En DB on a uniquement les valeurs enum. En UI, Agency utilise parfois ACTIVE/COMPLETED en affichage ; Mobile mappe explicitement IN_PROGRESS→ACTIVE, RETURNED→COMPLETED.

### A.4 Transitions autorisées (state machine) et où c’est enforce

Définies dans `booking.service.ts:709–722` :

```ts
DRAFT      → PENDING, CANCELLED
PENDING    → CONFIRMED, CANCELLED
CONFIRMED  → IN_PROGRESS, CANCELLED, NO_SHOW
IN_PROGRESS→ RETURNED, LATE
LATE       → RETURNED
RETURNED   → (aucune)
CANCELLED  → (aucune)
NO_SHOW    → (aucune)
```

**Enforcement :** dans `update()` uniquement (`booking.service.ts:737–743`). Les transitions check-in / check-out sont implicites (pas via `update` avec status).

### A.5 Tests manuels (CONFIRMED → IN_PROGRESS → RETURNED)

**Oui, ils sont corrects** pour le flow principal :

- Check-in : booking en `CONFIRMED` → passage en `IN_PROGRESS`.
- Check-out : booking en `IN_PROGRESS` (ou `LATE`) → passage en `RETURNED`.

À garder tel quel. Préciser éventuellement que le check-out accepte aussi `LATE`.

---

## B) Caution (R3)

### B.1 R3 est-il enforce côté backend ?

**Non.** Le blocage « check-in interdit si caution requise et status PENDING » **n’est pas implémenté** dans `booking.service` `checkIn()`.

**Preuve :** recherche de `depositRequired` / `depositStatusCheckIn` dans `booking.service.ts` : ils ne figurent que dans la construction des données stockées (check-in data JSON, `depositStatusCheckIn` mis à jour si fourni), pas dans une condition de blocage.

La spec `VALIDATIONS_BACKEND_RULES_METIER.md` décrit bien la règle ; le code ne l’applique pas.

### B.2 Où serait la validation (actuellement absente) ?

Elle devrait être dans `checkIn()`, **avant** de passer le booking en `IN_PROGRESS`, par exemple :

- Si `booking.depositRequired === true` et `depositStatusCheckIn !== 'COLLECTED'` → `BadRequestException` et refus du check-in.

Aujourd’hui : aucun garde-fou de ce type.

### B.3 Champs utilisés

| Champ | Présent | Usage |
|-------|---------|--------|
| `depositRequired` | Oui | `schema.prisma`, `create-booking.dto`, `check-in.dto` (optionnel). |
| `depositAmount` | Oui | `schema.prisma`, DTOs. |
| `depositType` | Non en DB | Existe dans `check-in.dto` (enum `DepositType`), pas dans le schéma Booking. |
| `depositStatusCheckIn` | Oui | `DepositStatusCheckIn` (PENDING, COLLECTED). Enregistré au check-in si fourni. |
| `depositStatusOut` | N/A | Pas de tel champ. On a `depositStatusFinal` (REFUNDED, PARTIAL, FORFEITED, DISPUTED). |

`depositDecisionSource` (COMPANY / AGENCY) existe en DB et dans le create-booking DTO.

### B.4 Comportement attendu au check-out (remboursée / perdue / partielle) et implémentation

- **Attendu :** selon litiges / dommages, caution remboursée, partielle ou perdue ; cas litige → `depositStatusFinal = DISPUTED`, blocage clôture financière.
- **Implémenté :**
  - `depositStatusFinal` est utilisé pour bloquer la **financial-closure** et la **génération de facture** si `DISPUTED` (`booking.service.ts`, `invoice.service.ts`).
  - Les incidents peuvent mettre `depositStatusFinal` à `DISPUTED` (`incident.service.ts`).
- **Manquant :** pas de logique explicite au check-out qui « décide » REFUNDED / PARTIAL / FORFEITED et l’enregistre systématiquement ; c’est surtout stocké / utilisé pour les garde-fous DISPUTED.

---

## C) Facturation / Invoice (R6)

### C.1 Ce qui est généré aujourd’hui après check-out

- **Un record `Invoice` en DB** : oui (`invoice.service.ts:115–135`).
- **Des lignes facture (invoice lines) :** non. Pas de modèle ni de table dédiée ; uniquement `Invoice` avec `totalAmount`, `invoiceNumber`, etc.
- **Numéro incrémental :** oui, **par agence**. Format `{AGENCY_PREFIX}-000001` etc. (`getNextInvoiceNumber`).

La génération est déclenchée depuis `booking.service` `checkOut()` (et `financialClosure()`), en catch pour ne pas bloquer le check-out.

### C.2 PDF

**Le PDF n’existe pas.** Aucun controller, aucun service, aucune lib (ex. PDFKit) ne génère ou ne sert de PDF. C’est bien **MANQUE**.

### C.3 Où l’ajouter et format attendu

- **Service :** par ex. `InvoicePdfService` (ou méthode dédiée dans `InvoiceService`) qui produit un buffer PDF.
- **Endpoint :** ex. `GET /invoices/:id/pdf` ou `GET /invoices/:id/download` qui renvoie `application/pdf`.
- **Stockage :** soit génération à la volée, soit stockage type `Document` / S3 avec URL, selon stratégie retenue.

Format à définir (A4, logo, TVA, mentions légales, etc.) : non implémenté aujourd’hui.

### C.4 Envoi email de facture

**Non.** Seule la création en DB (+ audit / business event) est faite. Aucun envoi d’email de facture.

---

## D) AI Vision (contradiction report)

### D.1 STUB ou implémenté ?

**Implémenté** pour la **détection de dommages** (images véhicule). **Pas d’OCR permis** dans le backend.

### D.2 Features exactes

| Feature | Existe | Fichiers |
|--------|--------|----------|
| **OCR permis** | Non | Aucun endpoint `extract-license` ou équivalent. |
| **Détection dommages** | Oui | `ai.controller.ts` (`POST /ai/damage/detect`, `POST /ai/damage/detect-batch`), `damage-detection.service.ts`. |

### D.3 Variables d’environnement

| Variable | Rôle |
|----------|------|
| `VISION_API_KEY` | Clé utilisée pour OpenAI Vision (provider `openai`). |
| `VISION_PROVIDER` | `openai` \| `google` \| `none`. |
| `GOOGLE_VISION_API_KEY` | Clé Google Vision si provider `google`. |
| `GOOGLE_VISION_API_URL` | Optionnel, défaut `https://vision.googleapis.com/v1/images:annotate`. |
| `OPENAI_API_URL` | Optionnel pour OpenAI. |

**Fallback :** si provider `google` et clé Google absente, le service utilise OpenAI (`detectDamageWithOpenAI`) avec `VISION_API_KEY`.  
**Chatbot :** utilise `OPENAI_API_KEY` (distinct de Vision).

### D.4 Endpoints et retours JSON

- `POST /api/v1/ai/damage/detect`  
  Body : `{ imageUrl, vehicleId, bookingId }`.  
  Réponse : `{ hasDamage, confidence, suspiciousZones, message }`.

- `POST /api/v1/ai/damage/detect-batch`  
  Body : `{ imageUrls, vehicleId, bookingId }`.  
  Réponse : `{ overallHasDamage, maxConfidence, allSuspiciousZones, summary }`.

Si Vision non configurée : `hasDamage: false`, `message` du type « IA non configurée - Vérification manuelle requise ».

---

## E) Planning (Sprint 1)

### E.1 Drag & drop implémenté ?

**Oui**, mais **uniquement pour modifier dates** (déplacer dans le temps / resizer), **sur le même véhicule**.

- **Admin / Agency / Web :** `PlanningBoard` utilise `check-availability` puis `PATCH /bookings/:id` avec `startDate`, `endDate`, `vehicleId`.
- **Backend :** `UpdateBookingDto` n’inclut **pas** `vehicleId` ; seuls `startDate`, `endDate`, `status`, `totalPrice` sont pris en compte. Donc le **changement de véhicule via drag n’est pas persisté**.

### E.2 Endpoint appelé et règles de conflit

- **Endpoint :** `POST /planning/check-availability` puis `PATCH /bookings/:id`.
- **Règles :** `detectConflicts(vehicleId, start, end, excludeBookingId)` pour la période (et le véhicule) considérée. Pour un update de dates sur le **même** véhicule, `excludeBookingId` = booking en cours.

### E.3 À indiquer dans le report

- **Disponible V1 :** drag & drop pour **réordonner dans le temps** (même véhicule).
- **Non disponible V1 :** déplacer une réservation **d’un véhicule à un autre** via le planning (vehicleId non géré dans l’update).

---

## F) 403 Modules / UX

### F.1 Apps avec gestion UI des 403 « module not included »

| App | Gestion 403 module |
|-----|--------------------|
| **Frontend-web** | Oui. `lib/api/client.ts` enrichit les 403 (`status`, `isModuleError`). Plusieurs pages (bookings, maintenance, fines) affichent un message ou un état dédié si `403` et `isModuleError`. |
| **Frontend-admin** | Non. Pas de logique 403 / module. |
| **Frontend-agency** | Non. Idem. |
| **Mobile-agent** | Partielle. Check-in / check-out gèrent le `403` (message utilisateur), mais pas de page ou composant dédié « module non inclus ». |

### F.2 Comportement actuel quand pas de gestion

- **Admin / Agency :** pas de gestion spécifique → erreur axios / fetch classique (toast générique si configuré, sinon probablement page ou liste qui ne se remplit pas, ou erreur non traitée).
- **Web :** selon les pages, retour 403 + `isModuleError` → message ciblé « module non activé » etc.

### F.3 Structure standard proposée

- **Composant :** ex. `Module403Guard` ou `ModuleBlockedMessage` qui :
  - intercepte les 403 dont le message indique « module » / « not included » ;
  - affiche un bloc explicite (titre + court texte + lien retour ou CTA).
- **Page optionnelle :** ex. `/module-blocked` ou équivalent, utilisée après redirection lorsqu’un 403 module est détecté sur une route protégée.
- **Uniformiser** sur les 4 apps : même composant (ou équivalent React Native pour mobile) + même principe de détection (status 403 + contenu message).

---

## G) Company Governance (champs légaux + maxAgencies)

### G.1 Champs Company et enum forme juridique

Champs principaux : `name`, `slug`, `raisonSociale`, `identifiantLegal`, `formeJuridique`, `phone`, `address`, `status`, `maxAgencies`, etc.

**`CompanyLegalForm`** (`schema.prisma` l.181–189) :

```prisma
enum CompanyLegalForm {
  SARL
  SAS
  SA
  EI
  AUTO_ENTREPRENEUR
  ASSOCIATION
  AUTRE
}
```

### G.2 maxAgencies : null = illimité

- **Backend :** oui. `agency.service.ts` : si `company.maxAgencies !== null && !== undefined`, on compare le nombre d’agences actives à `maxAgencies`. Sinon, pas de blocage.
- **UI :** à confirmer au cas par cas ; la logique métier backend considère bien `null` = illimité.

### G.3 Event `AGENCY_CREATE_BLOCKED_MAX_LIMIT`

Loggé dans `agency.service.ts` lors du refus de création d’agence (limite atteinte).  
Payload exemple : `{ companyId, requestedAgencyName, currentCount, maxAgencies }` (l.147–152, 159–164).

---

## H) Permissions / rôles (Company Admin)

### H.1 Company Admin peut-il créer agencies, users, vehicles ?

- **Agencies :** oui, pour sa company (`agency.service.ts`, rôle `COMPANY_ADMIN`).
- **Users :** oui, pour sa company (`user.service.ts`, `findAll` / create filtered by `companyId`).
- **Vehicles :** pas directement. Les vehicles sont rattachés aux **agencies**. Un Company Admin peut gérer les agences de sa company ; la création de vehicles se fait via les interfaces Agence (agency ou web agency).

### H.2 Restrictions création / assignation de rôles

- Company Admin **ne peut pas** créer ni assigner `COMPANY_ADMIN` ou `SUPER_ADMIN` (`user.service.ts:137–138`, `284–286`).
- Il **peut** créer / assigner **AGENCY_MANAGER** et **AGENT** uniquement.

### H.3 Menus cachés vs seulement bloqués en backend

- **Admin (Layout) :** menu affiché **uniquement** si `user.role === 'SUPER_ADMIN'` (`Layout.tsx`). Donc menus cachés pour non–Super Admin.
- **Agency / Web / Mobile :** pas de vérification systématique « menu caché si pas la permission » dans les fichiers vus ; le contrôle existe surtout côté backend (guards, 403). Donc **partiel** : admin oui, reste à uniformiser selon les permissions (modules, rôles).

---

## I) Reset Password / SMTP

### I.1 Forgot / Reset sur les 4 apps

**Oui.** Liens / écrans dédiés :

- **Admin :** `ForgotPassword.tsx`, `ResetPassword.tsx`.
- **Agency :** idem.
- **Web :** `forgot-password/page.tsx`, `reset-password/`, `reset-password-form.tsx`.
- **Mobile :** `ForgotPasswordScreen.tsx`, reset via URL avec token.

### I.2 SMTP absent : message côté front

Le backend **ne renvoie pas d’erreur** si l’envoi SMTP échoue (en dev, `email.service` catch et log). Il répond toujours 200 avec un message du type « Si un compte existe, un email a été envoyé » ou « Email de réinitialisation envoyé ».

**Conséquence :** le front affiche **toujours** un succès (ex. « Email envoyé si le compte existe »). Aucun message spécifique « SMTP indisponible » ou « Erreur d’envoi ». Pour le test, il faut donc **simuler SMTP absent** et vérifier que l’utilisateur voit ce message générique de succès, pas une erreur.

### I.3 Expiration du token reset

**1 heure.** `auth.service.ts` : `expiresAt.setHours(expiresAt.getHours() + 1)` (l.276).

---

## J) Offline Mobile Agent

### J.1 Déduplication

- **Critères :** `bookingId` + `actionType` pour les actions `BOOKING_CHECKIN` et `BOOKING_CHECKOUT` (`offline.service.ts:186–190`).
- Si une action en attente existe déjà pour le même `(bookingId, actionType)`, on compare payload + files (via `stableStringify` / `normalizeFiles`). Si identiques, on ne modifie rien (pas d’ajout ni d’update). Sinon, on met à jour l’action existante.

### J.2 Persisté (payload + fichiers)

- **Payload :** JSON sérialisé en base / `localStorage` (actions offline).
- **Fichiers :** URIs locales (photos, signatures, etc.) dans un tableau `files` associé à l’action. En web, fallback `localStorage` ; en natif, SQLite.

### J.3 Sync 30s et retry / backoff

- **Intervalle :** 30 secondes (`startAutoSync(30000)`).
- **Retry :** en cas d’échec sur une action, `updateActionError` (incrément `retryCount`, stockage `lastError`). L’action reste en file et sera retentée au prochain cycle. **Pas de backoff** exponentiel ni de stratégie de retry plus avancée.

### J.4 Cas d’erreur gérés (401, 403, 409, 500)

- **Sync :** catch générique sur `processAction` ; toute erreur → `updateActionError` + passage à l’action suivante. Pas de traitement spécifique par status (401, 403, 409, 500).
- **API (mobile) :** intercepteur axios gère le **401** (refresh token, puis logout si échec) sur les routes **non** auth (login, forgot-password, reset-password, refresh). Sur check-in / check-out, un 401 déclenche donc refresh puis retry ou logout.
- **403, 409, 500 :** pas de traitement particulier dans le sync ; l’erreur est stockée, l’action reste en file.

### J.5 Risque connu (sync offline)

Le `sync.service` uploade les fichiers puis appelle check-in/check-out avec le **payload d’origine** (URIs locales). Le bloc « Merge uploaded files into payload » est vide : les URLs uploadées ne sont pas injectées dans le payload avant l’appel API. Les check-in/check-out **offline** peuvent donc échouer à la sync (backend attend des URLs, reçoit des `file://...`). À corriger côté sync (merge payload + `uploadedFiles` selon le type d’action).

---

## Sprint 2 – Décision produit

### Export facture PDF

- **Effort :** moyen (service PDF + endpoint + stockage éventuel).
- **Étapes :** 1) Choix lib (PDFKit, etc.) et format (A4, logo, TVA). 2) `InvoicePdfService` (ou équivalent). 3) `GET /invoices/:id/pdf`. 4) Optionnel : stockage `Document` / S3 et lien dans `Invoice`.
- **Risques :** gestion multidevises, règles TVA, mise en page selon pays.

### AI Vision – Documentation V1

- **Backend :** Détection dommages disponible (`/ai/damage/detect`, `detect-batch`). OCR permis : non. Si IA non configurée, le backend renvoie un message explicite.
- **Frontend :** Aucune intégration UI en V1 (aucun appel vers `/ai/*`). Lors de l’intégration future, afficher un message explicite côté UI si l’API indique que l’IA n’est pas configurée.

---

### E-contrat Maroc à signer

- **Données à faire figurer :** à définir (identités, véhicule, période, prix, conditions, etc.).
- **Signatures :** client + agent à préciser (modalité technique : champs signature dans le formulaire, puis intégration au PDF).
- **Stockage :** PDF signé stocké (ex. `Document` ou S3) + accès back-office (lecture, téléchargement) à prévoir.

### Module GPS eco-friendly

- **Tracking :** temps réel vs snapshot à décider (impacts coût et complexité).
- **Besoin :** boitier GPS, app mobile, ou API tierce selon choix.
- **KPIs (conso, conduite, distance) :** à prioriser selon données réellement disponibles (capteurs véhicule, tierce partie, etc.).

---

## Corrections Release Report V1

À mettre à jour pour cohérence avec le code :

1. **AI Vision :** préciser « Détection dommages implémentée (OpenAI + Google). OCR permis : non. »
2. **Invoice :** « Record DB + numéro par agence. PDF : MANQUE. Email facture : non. »
3. **Statuts booking :** utiliser la liste exacte de l’enum + flows (create, check-in, check-out, financial-closure).
4. **Drag & drop :** « Implémenté pour modification dates (même véhicule). Changement de véhicule via planning : non disponible V1. »
5. **403 UI :** « Web : oui (isModuleError + messages). Admin / Agency : non. Mobile : partiel (check-in/out seulement). »

---

## Changelog (fichiers modifiés pour le report)

| Fichier | Résumé |
|---------|--------|
| `RELEASE_REPORT_V1.html` | Mise à jour sections AI Vision, Invoice/PDF, statuts booking, drag & drop, 403 UI ; harmonisation avec `REPONSES_QUESTIONS_V1.md`. |
| `REPONSES_QUESTIONS_V1.md` | Nouveau. Réponses détaillées A–J + Sprint 2 + corrections report. |

---

## Stabilisation V1 (post-report)

| Tâche | Fichiers modifiés | Résumé |
|-------|-------------------|--------|
| R3 Caution | `backend/.../booking.service.ts`, `backend/test/business-rules.e2e-spec.ts` | Blocage check-in si `depositRequired` et `depositStatusCheckIn !== 'COLLECTED'` (400 + message). Tests R3 renforcés. |
| Statuts UI | `frontend-agency` (Bookings, Dashboard, Planning), `frontend-web` (bookings list, [id]) | IN_PROGRESS → "ACTIVE", RETURNED → "TERMINÉE". Form agency : enum backend (IN_PROGRESS, RETURNED). |
| Planning drag | `PlanningBoard` admin, agency, web | Drag vers autre véhicule bloqué ; message "Vous pouvez uniquement modifier la date. Le changement de véhicule n'est pas disponible dans cette version." |
| 403 Module | `frontend-admin/lib/axios.ts`, `frontend-agency/lib/axios.ts`, `mobile-agent/.../api.ts` | Message "Ce module n'est pas activé pour votre compte." (alert). Mobile : hors check-in/check-out. |
| AI Vision | Doc uniquement | Aucun appel frontend ; note dans REPONSES + report. |

---

*Document généré à partir du code du dépôt MalocAuto.*
