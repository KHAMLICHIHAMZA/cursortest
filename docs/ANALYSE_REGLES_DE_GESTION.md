# Analyse des règles de gestion – MalocAuto

Document de référence pour discuter des règles métier implémentées dans le code.  
**Source :** analyse du backend (NestJS + Prisma) et des specs fonctionnelles.

---

## 1. Réservation (Booking)

### 1.1 Création

| Règle | Implémentation | Fichier |
|-------|----------------|---------|
| Prix total > 0 | `BadRequestException` si `totalPrice <= 0` | `booking.service.ts` |
| Véhicule existe et appartient à l’agence | Vérif `vehicle.agencyId` + `deletedAt: null` | idem |
| Client existe et appartient à l’agence | Vérif `client.agencyId` + `deletedAt: null` | idem |
| **R1.3 – Permis** : Réservation impossible si le permis expire avant la fin de la location | Comparaison `licenseExpiry <= bookingEnd` → blocage + audit | idem |
| Client doit avoir un numéro de permis | Blocage si `!client.licenseNumber` | idem |
| Client doit avoir une date d’expiration de permis | Blocage si `!client.licenseExpiryDate` | idem |
| Disponibilité véhicule | `PlanningService.getVehicleAvailability` (source de vérité) | idem |
| **R2.2 – Temps de préparation** : Pas de réservation qui chevauche la période de préparation après un retour | Boucle sur les bookings actifs, calcul `preparationEnd`, conflit si chevauchement | idem |
| Type de permis (B/C/D) selon type de véhicule | Détection camion/bus, vérif `clientLicenseType` vs `requiredLicenseTypes` | idem |

### 1.2 Statuts et transitions

Transitions autorisées (méthode `isValidStatusTransition`) :

- `DRAFT` → `PENDING`, `CANCELLED`
- `PENDING` → `CONFIRMED`, `CANCELLED`
- `CONFIRMED` → `IN_PROGRESS`, `CANCELLED`, `NO_SHOW`
- `IN_PROGRESS` → `RETURNED`, `LATE`
- `LATE` → `RETURNED`
- `RETURNED`, `CANCELLED`, `NO_SHOW` → aucune

### 1.3 Check-in

| Règle | Implémentation |
|-------|----------------|
| Statut = `CONFIRMED` | Sinon `BadRequestException` |
| **R3 – Caution** : Si caution requise, elle doit être collectée avant check-in | `depositRequired === true` ⇒ `depositStatusCheckIn === 'COLLECTED'` sinon blocage |
| **R1.3 – Permis** : Check-in bloqué si permis expiré ou expire le jour même | Comparaison `licenseExpiry <= today` → blocage |
| Permis valide jusqu’à la fin de la location | Vérif `licenseExpiry <= bookingEnd` → blocage |

### 1.4 Check-out

| Règle | Implémentation |
|-------|----------------|
| Statut = `IN_PROGRESS` ou `LATE` | Sinon blocage |
| Encaissement espèces : si `cashCollected` alors `cashAmount > 0` | Validation DTO / service |
| `odometerEnd >= odometerStart` | Blocage sinon |
| **R4 – Frais de retard** : Calcul auto (≤1h → 25%, ≤2h → 50%, ≤4h → 75%, >4h → 100% du prix journalier) | `calculateLateFee()` basé sur `vehicle.dailyRate` |
| **R2.2** : Après retour → suppression événement booking + création temps de préparation | `deleteBookingEvents` + `createPreparationTime` (1h standard, 2h si retard) |
| **R6** : Génération facture au check-out si pas de litige | Appel `invoiceService.generateInvoice` (non bloquant si litige) |

### 1.5 Clôture financière

| Règle | Implémentation |
|-------|----------------|
| **R5 – Litiges** : Blocage si incident(s) en `DISPUTED` | Vérif `booking.incidents` |
| Blocage si caution en `DISPUTED` | Vérif `depositStatusFinal === 'DISPUTED'` |
| Montant récupéré ≤ caution | Comparaison `totalCollected` vs `depositAmount` → blocage si dépassement |
| **R6** : Génération facture après résolution litige | Appel `invoiceService.generateInvoice` |

### 1.6 Override frais de retard

| Règle | Implémentation |
|-------|----------------|
| Uniquement **AGENCY_MANAGER** ou **SUPER_ADMIN** | `ForbiddenException` sinon |
| Uniquement pour booking en `RETURNED` | Blocage sinon |
| Justification enregistrée en audit | `auditService.logUpdate` avec justification |

---

## 2. Caution (Deposit)

- Décision : **COMPANY** ou **AGENCY** (`DepositDecisionSource` dans le DTO).
- Création : `depositRequired`, `depositAmount`, `depositDecisionSource` (obligatoires si caution requise).
- Check-in : si `depositRequired` alors `depositStatusCheckIn === 'COLLECTED'`.
- Litige : incident dommage > 50 % de la caution → `depositStatusFinal: 'DISPUTED'`, `financialClosureBlocked: true` (voir Incidents).

---

## 3. Planning (source de vérité)

- **Aucune réservation sans vérification de disponibilité** : `PlanningService.getVehicleAvailability` / `detectConflicts` utilisés avant création.
- **Temps de préparation** : 1h après retour à l’heure, 2h si retard (`createPreparationTime`).
- Conflits pris en compte : bookings, maintenances, événements de planning (dont préparation).
- **Maintenance** : pas de planification si le véhicule est en location sur la période ; pas de démarrage maintenance si location active (vérif dans `maintenance.service.ts`).

---

## 4. Facturation (Invoice) – R6

| Règle | Implémentation |
|-------|----------------|
| Pas de facture si incident en `DISPUTED` | Vérif dans `invoice.service.generateInvoice` |
| Pas de facture si caution en `DISPUTED` | Vérif `depositStatusFinal` |
| Une seule facture par booking | Vérif `existingInvoice` avant création |
| Génération : au check-out si pas de litige, ou après clôture financière si litige résolu | Appelée depuis `checkOut` et `financialClosure` |

---

## 5. Incidents et litiges – R5

- **Création incident** : si type = dommage et montant > 50 % de la caution du véhicule (ou de la réservation) → statut `DISPUTED`, mise à jour booking : `depositStatusFinal: 'DISPUTED'`, `financialClosureBlocked: true`, raison stockée.
- **Clôture financière** et **génération facture** bloquées tant qu’un incident est en `DISPUTED` ou que la caution est en `DISPUTED`.

---

## 6. Modules (SaaS)

| Règle | Implémentation |
|-------|----------------|
| Activation module **Company** | **SUPER_ADMIN** uniquement ; vérif dépendances |
| Activation module **Agency** | **COMPANY_ADMIN** (ou SUPER_ADMIN) ; **module doit être payé au niveau Company** (`CompanyModule` actif) |
| Désactivation Company | Vérif des dépendances inverses (`checkReverseDependencies`) |

---

## 7. Abonnements (Subscription)

| Règle | Implémentation |
|-------|----------------|
| Une seule subscription active par Company | Vérif `existingSubscription.status === ACTIVE` avant création |
| Plan existant et actif | Vérif `plan.isActive` |
| Création abonnement → création `SubscriptionModule` + `CompanyModule` (modules payés) | Après `subscription.create` |

---

## 8. Permissions et rôles

- **PermissionService** : `checkAgencyAccess(agencyId, user)`  
  - **SUPER_ADMIN** : accès à toutes les agences.  
  - **COMPANY_ADMIN** : agences de sa `companyId`.  
  - Autres : agences dans `user.agencyIds`.
- **buildAgencyFilter** : construction du filtre Prisma selon le rôle (liste d’agences accessibles).
- **Override frais de retard** : **AGENCY_MANAGER** ou **SUPER_ADMIN** uniquement.
- **Module Company** : **SUPER_ADMIN** uniquement.
- **Module Agency** : **COMPANY_ADMIN** (ou SUPER_ADMIN) + module payé au niveau Company.

---

## 9. Amendes (Fines)

- Lien **booking** obligatoire ; vérif que le booking appartient à l’agence.
- Accès selon `PermissionService.checkAgencyAccess`.
- Pas de règle métier spécifique supplémentaire repérée dans le service (CRUD + filtres par rôle).

---

## 10. Spécifications fonctionnelles (rappels)

- **Location = pivot** : toute action métier liée à une location.
- **Aucune logique métier lourde côté mobile** : le backend est la source de vérité.
- **Aucun automatisme bloquant** côté UX : alertes uniquement (ex. âge véhicule 5 ans).
- **Charges** : rattachées au véhicule ; **Amendes** : module distinct, agence en intermédiaire.
- **Planning back-office** : vue globale des véhicules (disponible, réservé, loué, livraison, récupération, maintenance) ; pas de planning détaillé des tâches agents.

---

## 11. Points à trancher / discuter

1. **R1.3** : Permis expiré le “jour même” au check-in — on bloque. Souhaitez-vous une tolérance (ex. fin de journée) ?
2. **R4** : Barème frais de retard (25 % / 50 % / 75 % / 100 %) — à confirmer ou ajuster (seuils, plafonds).
3. **R5** : Seuil 50 % de la caution pour passage en DISPUTED — à confirmer ou rendre configurable (Company / Agency).
4. **Type de permis** : Détection camion/bus via mots-clés dans `model`/`brand` — à valider ou remplacer par un champ explicite (ex. catégorie véhicule).
5. **Statuts booking** : Présence de `DRAFT`, `IN_PROGRESS`, `LATE`, `RETURNED` dans le code ; à aligner avec le schéma Prisma et les specs (ex. ACTIVE vs IN_PROGRESS).
6. **Facture** : Génération automatique au check-out (non bloquante en cas d’erreur) — souhait de la rendre bloquante ou de notifier l’utilisateur ?
7. **Modules** : Règle “module payé au niveau Company” pour activer en agence — à confirmer (lien avec facturation / plans).
8. **Amendes** : Statuts (reçue, client identifié, transmise, contestée, clôturée) — à vérifier dans le schéma et l’API (alignement avec les specs).

---

*Document généré pour faciliter la discussion sur les règles de gestion. À mettre à jour au fil des décisions.*
