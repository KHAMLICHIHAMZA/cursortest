# 🔹 VALIDATIONS BACKEND - RÈGLES MÉTIER VALIDÉES

## CONTEXTE
Backend du SAAS MalocAuto (multi-tenant, RBAC, audit trail).
Produit FINAL (pas MVP). Règles métier VALIDÉES et NON NÉGOCIABLES.

---

## 1️⃣ PERMIS (R1.3) - VALIDATION BLOQUANTE

### Règle
- **Une réservation est IMPOSSIBLE** si le permis expire AVANT la fin de la location.
- **Un check-in est BLOQUÉ** si le permis est expiré ou expire le jour même.
- **Aucun bypass possible** (agent ou manager).

### Endpoints Impactés
- `POST /bookings` (création)
- `POST /bookings/:id/checkin` (check-in)

### Validations Backend

#### 1.1 Création de Réservation (`create`)
```typescript
// Dans booking.service.ts - create()
// AVANT la vérification de disponibilité

const client = await this.prisma.client.findUnique({ where: { id: clientId } });

if (!client.licenseExpiryDate) {
  throw new BadRequestException('Le client doit avoir une date d\'expiration de permis valide');
}

const licenseExpiry = new Date(client.licenseExpiryDate);
const bookingEnd = new Date(endDate);

// Règle: Permis doit être valide APRÈS la fin de la location
if (licenseExpiry <= bookingEnd) {
  throw new BadRequestException(
    `Le permis de conduite expire le ${licenseExpiry.toLocaleDateString('fr-FR')}, ` +
    `avant la fin de la location prévue (${bookingEnd.toLocaleDateString('fr-FR')}). ` +
    `La réservation est impossible.`
  );
}
```

#### 1.2 Check-in (`checkIn`)
```typescript
// Dans booking.service.ts - checkIn()
// AVANT toute autre validation

const booking = await this.prisma.booking.findUnique({
  where: { id },
  include: { client: true }
});

const licenseExpiry = new Date(booking.client.licenseExpiryDate);
const today = new Date();
today.setHours(0, 0, 0, 0);

// Règle: Permis ne doit pas être expiré ni expirer aujourd'hui
if (licenseExpiry <= today) {
  throw new BadRequestException(
    `Le permis de conduite est expiré ou expire aujourd'hui (${licenseExpiry.toLocaleDateString('fr-FR')}). ` +
    `Le check-in est impossible.`
  );
}

// Vérifier aussi que le permis est valide jusqu'à la fin de la location
const bookingEnd = new Date(booking.endDate);
if (licenseExpiry <= bookingEnd) {
  throw new BadRequestException(
    `Le permis de conduite expire le ${licenseExpiry.toLocaleDateString('fr-FR')}, ` +
    `avant la fin de la location (${bookingEnd.toLocaleDateString('fr-FR')}). ` +
    `Le check-in est impossible.`
  );
}
```

### Audit Trail
```typescript
await this.auditService.log({
  action: AuditAction.BOOKING_STATUS_CHANGE,
  entityType: 'Booking',
  entityId: id,
  description: `Check-in bloqué: permis expiré ou expirant (expire: ${licenseExpiry.toLocaleDateString('fr-FR')})`,
  userId,
});
```

### Champs DB Nécessaires
- `Client.licenseExpiryDate` (DATE, NOT NULL) ✅ Existe déjà

---

## 2️⃣ TEMPS DE PRÉPARATION (R2.2) - VALIDATION BLOQUANTE

### Règle
- Chaque agence a un `preparationTimeMinutes`.
- Après chaque retour, le véhicule est indisponible pendant ce temps.
- Toute réservation chevauchant cette période est BLOQUÉE.
- Aucune exception manuelle.

### Endpoints Impactés
- `POST /bookings` (création)
- `PATCH /bookings/:id` (modification)
- `POST /bookings/:id/checkout` (création automatique du temps de préparation)

### Validations Backend

#### 2.1 Création/Modification de Réservation
```typescript
// Dans booking.service.ts - create() et update()
// Après vérification de disponibilité standard

const agency = await this.prisma.agency.findUnique({
  where: { id: agencyId },
  include: { bookings: { where: { status: 'IN_PROGRESS' } } }
});

const preparationTimeMinutes = agency.preparationTimeMinutes || 60; // Default 1h

// Pour chaque booking actif, calculer la fin réelle avec préparation
const activeBookings = await this.prisma.booking.findMany({
  where: {
    vehicleId,
    status: { in: ['IN_PROGRESS', 'LATE'] },
    deletedAt: null,
  },
});

for (const activeBooking of activeBookings) {
  const actualEndDate = new Date(activeBooking.endDate);
  const preparationEnd = new Date(actualEndDate);
  preparationEnd.setMinutes(preparationEnd.getMinutes() + preparationTimeMinutes);

  // Vérifier si la nouvelle réservation chevauche la période de préparation
  if (startDate < preparationEnd && endDate > actualEndDate) {
    throw new ConflictException({
      message: `Le véhicule est indisponible jusqu'au ${preparationEnd.toLocaleString('fr-FR')} ` +
               `(temps de préparation après retour). La réservation chevauche cette période.`,
      conflicts: [{
        type: 'PREPARATION_TIME',
        id: activeBooking.id,
        startDate: actualEndDate,
        endDate: preparationEnd,
      }],
    });
  }
}
```

#### 2.2 Check-out (Création Automatique)
```typescript
// Dans booking.service.ts - checkOut()
// Après mise à jour du statut à RETURNED

const agency = await this.prisma.agency.findUnique({
  where: { id: booking.agencyId }
});

const preparationTimeMinutes = agency.preparationTimeMinutes || 60;
const preparationStart = new Date(); // Maintenant
const preparationEnd = new Date(preparationStart);
preparationEnd.setMinutes(preparationEnd.getMinutes() + preparationTimeMinutes);

// Créer l'événement de planning pour le temps de préparation
await this.planningService.createPreparationTime({
  agencyId: booking.agencyId,
  vehicleId: booking.vehicleId,
  startDate: preparationStart,
  endDate: preparationEnd,
  isLate: false, // TODO: détecter si retard
});
```

### Champs DB Nécessaires
- `Agency.preparationTimeMinutes` (INT, > 0, default: 60) ⚠️ À ajouter

---

## 3️⃣ CAUTION - VALIDATION BLOQUANTE

### Règle
- La règle de caution est définie **À LA RÉSERVATION**.
- Champs obligatoires dans Booking :
  - `depositRequired` (BOOLEAN)
  - `depositAmount` (DECIMAL)
  - `depositDecisionSource` (ENUM: COMPANY, AGENCY)
  - `depositStatusCheckIn` (ENUM: PENDING, COLLECTED)
  - `depositStatusFinal` (ENUM: REFUNDED, PARTIAL, FORFEITED, DISPUTED)
- Si `depositRequired = true` et `depositStatusCheckIn ≠ COLLECTED` → **CHECK-IN BLOQUÉ**.

### Endpoints Impactés
- `POST /bookings` (création - définition de la caution)
- `POST /bookings/:id/checkin` (validation de la caution collectée)

### Validations Backend

#### 3.1 Création de Réservation
```typescript
// Dans booking.service.ts - create()
// Validation des champs caution

if (createBookingDto.depositRequired === true) {
  if (!createBookingDto.depositAmount || createBookingDto.depositAmount <= 0) {
    throw new BadRequestException(
      'Si une caution est requise, le montant doit être supérieur à 0'
    );
  }
  if (!createBookingDto.depositDecisionSource) {
    throw new BadRequestException(
      'La source de décision de la caution est obligatoire (COMPANY ou AGENCY)'
    );
  }
}

// Enregistrer dans le booking
const booking = await this.prisma.booking.create({
  data: {
    // ... autres champs
    depositRequired: createBookingDto.depositRequired || false,
    depositAmount: createBookingDto.depositAmount || null,
    depositDecisionSource: createBookingDto.depositDecisionSource || null,
    depositStatusCheckIn: 'PENDING', // Par défaut
    depositStatusFinal: null, // Sera défini au check-out
  },
});
```

#### 3.2 Check-in
```typescript
// Dans booking.service.ts - checkIn()
// AVANT validation du permis

const booking = await this.prisma.booking.findUnique({
  where: { id }
});

if (booking.depositRequired === true) {
  // Vérifier que la caution a été collectée
  if (booking.depositStatusCheckIn !== 'COLLECTED') {
    throw new BadRequestException(
      `Une caution de ${booking.depositAmount} MAD est requise pour cette réservation. ` +
      `La caution doit être collectée avant le check-in. ` +
      `Statut actuel: ${booking.depositStatusCheckIn}`
    );
  }
}

// Mettre à jour le statut si nécessaire (depuis le DTO)
if (checkInDto.depositStatus) {
  if (checkInDto.depositStatus !== 'COLLECTED' && booking.depositRequired) {
    throw new BadRequestException(
      'Le statut de la caution au check-in doit être COLLECTED si une caution est requise'
    );
  }
  await this.prisma.booking.update({
    where: { id },
    data: { depositStatusCheckIn: checkInDto.depositStatus },
  });
}
```

### Champs DB Nécessaires
- `Booking.depositRequired` (BOOLEAN, default: false) ⚠️ À ajouter
- `Booking.depositAmount` (DECIMAL(10,2), nullable) ⚠️ À ajouter
- `Booking.depositDecisionSource` (ENUM: COMPANY, AGENCY, nullable) ⚠️ À ajouter
- `Booking.depositStatusCheckIn` (ENUM: PENDING, COLLECTED, default: PENDING) ⚠️ À ajouter
- `Booking.depositStatusFinal` (ENUM: REFUNDED, PARTIAL, FORFEITED, DISPUTED, nullable) ⚠️ À ajouter

### ENUMs Nécessaires
```prisma
enum DepositDecisionSource {
  COMPANY
  AGENCY
}

enum DepositStatusCheckIn {
  PENDING
  COLLECTED
}

enum DepositStatusFinal {
  REFUNDED
  PARTIAL
  FORFEITED
  DISPUTED
}
```

---

## 4️⃣ RETARD - CALCUL AUTOMATIQUE

### Règle
- Calcul automatique basé sur le prix journalier :
  - ≤ 1h → 25 %
  - ≤ 2h → 50 %
  - > 4h → 100 %
- Override possible UNIQUEMENT par Agency Manager avec justification loggée.

### Endpoints Impactés
- `POST /bookings/:id/checkout` (calcul automatique)
- `PATCH /bookings/:id/late-fee` (override par manager)

### Validations Backend

#### 4.1 Calcul Automatique au Check-out
```typescript
// Dans booking.service.ts - checkOut()
// Calculer les frais de retard automatiquement

const calculateLateFee = (booking: Booking, actualReturnDate: Date): number => {
  const expectedEndDate = new Date(booking.endDate);
  const delayMs = actualReturnDate.getTime() - expectedEndDate.getTime();
  const delayHours = delayMs / (1000 * 60 * 60);

  if (delayHours <= 0) {
    return 0; // Pas de retard
  }

  const dailyRate = booking.vehicle.dailyRate;
  let lateFeeRate = 0;

  if (delayHours <= 1) {
    lateFeeRate = 0.25; // 25%
  } else if (delayHours <= 2) {
    lateFeeRate = 0.50; // 50%
  } else if (delayHours <= 4) {
    lateFeeRate = 0.75; // 75% (interpolation)
  } else {
    lateFeeRate = 1.0; // 100%
  }

  return dailyRate * lateFeeRate;
};

// Dans checkOut()
const actualReturnDate = new Date(); // Date actuelle
const lateFee = calculateLateFee(booking, actualReturnDate);

// Enregistrer dans le booking ou dans un champ séparé
await this.prisma.booking.update({
  where: { id },
  data: {
    // ... autres champs
    lateFeeAmount: lateFee,
    lateFeeCalculatedAt: actualReturnDate,
    lateFeeOverride: false,
  },
});
```

#### 4.2 Override par Manager
```typescript
// Nouveau endpoint: PATCH /bookings/:id/late-fee
// Dans booking.controller.ts

@Patch(':id/late-fee')
@RequirePermission(UserAgencyPermission.WRITE)
@Permissions('bookings:update')
@ApiOperation({ summary: 'Override frais de retard (Agency Manager uniquement)' })
async overrideLateFee(
  @Param('id') id: string,
  @Body() overrideDto: OverrideLateFeeDto,
  @CurrentUser() user: any,
) {
  // Vérifier que l'utilisateur est Agency Manager
  if (user.role !== 'AGENCY_MANAGER') {
    throw new ForbiddenException('Seuls les Agency Managers peuvent modifier les frais de retard');
  }

  return this.bookingService.overrideLateFee(id, overrideDto, user.userId);
}

// Dans booking.service.ts
async overrideLateFee(id: string, overrideDto: OverrideLateFeeDto, userId: string) {
  const booking = await this.prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    throw new BadRequestException('Booking not found');
  }

  // Justification obligatoire
  if (!overrideDto.justification || overrideDto.justification.trim().length < 10) {
    throw new BadRequestException(
      'Une justification d\'au moins 10 caractères est obligatoire pour modifier les frais de retard'
    );
  }

  // Logger l'override
  await this.auditService.log({
    action: AuditAction.BOOKING_STATUS_CHANGE,
    entityType: 'Booking',
    entityId: id,
    description: `Override frais de retard: ${booking.lateFeeAmount} → ${overrideDto.newAmount}. ` +
                 `Justification: ${overrideDto.justification}`,
    userId,
  });

  await this.prisma.booking.update({
    where: { id },
    data: {
      lateFeeAmount: overrideDto.newAmount,
      lateFeeOverride: true,
      lateFeeOverrideJustification: overrideDto.justification,
      lateFeeOverrideBy: userId,
      lateFeeOverrideAt: new Date(),
    },
  });
}
```

### Champs DB Nécessaires
- `Booking.lateFeeAmount` (DECIMAL(10,2), nullable) ⚠️ À ajouter
- `Booking.lateFeeCalculatedAt` (DATETIME, nullable) ⚠️ À ajouter
- `Booking.lateFeeOverride` (BOOLEAN, default: false) ⚠️ À ajouter
- `Booking.lateFeeOverrideJustification` (TEXT, nullable) ⚠️ À ajouter
- `Booking.lateFeeOverrideBy` (STRING, nullable) ⚠️ À ajouter
- `Booking.lateFeeOverrideAt` (DATETIME, nullable) ⚠️ À ajouter

---

## 5️⃣ DOMMAGES & LITIGES - STATUT DISPUTED

### Règle
- Statut `DISPUTED` obligatoire pour les litiges.
- En cas de `DISPUTED` :
  - Clôture financière bloquée
  - Caution retenue jusqu'à expertise externe (~3 jours)
- Jamais récupérer plus que la caution / acompte.

### Endpoints Impactés
- `POST /incidents` (création avec type DAMAGE)
- `PATCH /incidents/:id` (mise à jour du statut)
- `POST /bookings/:id/financial-closure` (blocage si DISPUTED)

### Validations Backend

#### 5.1 Création d'Incident (Dommage)
```typescript
// Dans incident.service.ts - create()
// Si type = DAMAGE et montant > seuil → statut DISPUTED automatique

const createIncident = async (dto: CreateIncidentDto, userId: string) => {
  const booking = await this.prisma.booking.findUnique({
    where: { id: dto.bookingId },
    include: { vehicle: true }
  });

  let status = IncidentStatus.REPORTED;

  // Si dommage avec montant élevé → DISPUTED automatique
  if (dto.type === IncidentType.DAMAGE && dto.amount) {
    const damageThreshold = booking.vehicle.depositAmount * 0.5; // 50% de la caution
    if (dto.amount > damageThreshold) {
      status = IncidentStatus.DISPUTED;
      
      // Bloquer la clôture financière
      await this.prisma.booking.update({
        where: { id: dto.bookingId },
        data: {
          depositStatusFinal: 'DISPUTED',
          financialClosureBlocked: true,
          financialClosureBlockedReason: 'Dommage en litige nécessitant expertise externe',
        },
      });
    }
  }

  return this.prisma.incident.create({
    data: {
      ...dto,
      status,
      // ...
    },
  });
};
```

#### 5.2 Clôture Financière (Blocage si DISPUTED)
```typescript
// Nouveau endpoint: POST /bookings/:id/financial-closure
// Dans booking.service.ts

async financialClosure(id: string, userId: string) {
  const booking = await this.prisma.booking.findUnique({
    where: { id },
    include: {
      incidents: { where: { status: 'DISPUTED' } },
      payments: true,
    },
  });

  // Vérifier qu'il n'y a pas de litige en cours
  if (booking.incidents.some(inc => inc.status === 'DISPUTED')) {
    throw new BadRequestException(
      'La clôture financière est bloquée: un ou plusieurs incidents sont en litige (DISPUTED). ' +
      'Veuillez résoudre les litiges avant de procéder à la clôture.'
    );
  }

  // Vérifier que la caution n'est pas en DISPUTED
  if (booking.depositStatusFinal === 'DISPUTED') {
    throw new BadRequestException(
      'La clôture financière est bloquée: la caution est en litige (DISPUTED). ' +
      'Veuillez résoudre le litige avant de procéder à la clôture.'
    );
  }

  // Calculer le montant total récupéré (ne jamais dépasser la caution)
  const totalCollected = booking.payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const maxAllowed = booking.depositAmount || 0;
  if (totalCollected > maxAllowed) {
    throw new BadRequestException(
      `Le montant total récupéré (${totalCollected}) ne peut pas dépasser la caution (${maxAllowed})`
    );
  }

  // Procéder à la clôture
  // ...
}
```

### Champs DB Nécessaires
- `Booking.financialClosureBlocked` (BOOLEAN, default: false) ⚠️ À ajouter
- `Booking.financialClosureBlockedReason` (TEXT, nullable) ⚠️ À ajouter
- `Incident.status` (ENUM avec DISPUTED) ✅ Existe déjà

---

## 6️⃣ FACTURATION - GÉNÉRATION AUTOMATIQUE

### Règle
- Toute location génère une facture.
- Facture au check-out si pas de litige.
- Facture après clôture financière si litige.
- Numérotation par agence, incrémentale, non modifiable.

### Endpoints Impactés
- `POST /bookings/:id/checkout` (génération si pas de litige)
- `POST /bookings/:id/financial-closure` (génération si litige résolu)

### Validations Backend

#### 6.1 Génération Automatique
```typescript
// Dans booking.service.ts - checkOut()
// Après validation du check-out

const generateInvoice = async (booking: Booking): Promise<Invoice> => {
  // Vérifier qu'il n'y a pas de litige
  const hasDisputedIncidents = await this.prisma.incident.count({
    where: {
      bookingId: booking.id,
      status: 'DISPUTED',
    },
  });

  if (hasDisputedIncidents || booking.depositStatusFinal === 'DISPUTED') {
    // Ne pas générer la facture maintenant, attendre la clôture financière
    return null;
  }

  // Générer le numéro de facture (incrémental par agence)
  const lastInvoice = await this.prisma.invoice.findFirst({
    where: { agencyId: booking.agencyId },
    orderBy: { invoiceNumber: 'desc' },
  });

  const nextNumber = lastInvoice 
    ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1 
    : 1;
  const invoiceNumber = `${booking.agencyId.slice(0, 4).toUpperCase()}-${nextNumber.toString().padStart(6, '0')}`;

  // Calculer le montant total
  const totalAmount = booking.totalPrice + (booking.lateFeeAmount || 0);

  return this.prisma.invoice.create({
    data: {
      agencyId: booking.agencyId,
      bookingId: booking.id,
      invoiceNumber,
      totalAmount,
      status: 'ISSUED',
      issuedAt: new Date(),
    },
  });
};
```

### Champs DB Nécessaires
- `Invoice.invoiceNumber` (STRING, unique par agence) ⚠️ À créer
- `Invoice.issuedAt` (DATETIME) ⚠️ À créer
- `Invoice.totalAmount` (DECIMAL(10,2)) ⚠️ À créer
- `Invoice.status` (ENUM: ISSUED, PAID, CANCELLED) ⚠️ À créer

### ENUM Nécessaire
```prisma
enum InvoiceStatus {
  ISSUED
  PAID
  CANCELLED
}
```

---

## 📋 RÉSUMÉ DES CHAMPS DB À AJOUTER

### Booking
- `depositRequired` (BOOLEAN, default: false)
- `depositAmount` (DECIMAL(10,2), nullable)
- `depositDecisionSource` (ENUM: COMPANY, AGENCY, nullable)
- `depositStatusCheckIn` (ENUM: PENDING, COLLECTED, default: PENDING)
- `depositStatusFinal` (ENUM: REFUNDED, PARTIAL, FORFEITED, DISPUTED, nullable)
- `lateFeeAmount` (DECIMAL(10,2), nullable)
- `lateFeeCalculatedAt` (DATETIME, nullable)
- `lateFeeOverride` (BOOLEAN, default: false)
- `lateFeeOverrideJustification` (TEXT, nullable)
- `lateFeeOverrideBy` (STRING, nullable)
- `lateFeeOverrideAt` (DATETIME, nullable)
- `financialClosureBlocked` (BOOLEAN, default: false)
- `financialClosureBlockedReason` (TEXT, nullable)
- `computedEndWithPreparation` (DATETIME, nullable) - Calculé, non stocké

### Agency
- `preparationTimeMinutes` (INT, > 0, default: 60)

### Client
- `drivingLicenseExpiryDate` (DATE, NOT NULL) ✅ Existe déjà comme `licenseExpiryDate`

### Invoice (Nouveau modèle)
- `id` (STRING)
- `agencyId` (STRING)
- `bookingId` (STRING)
- `invoiceNumber` (STRING, unique)
- `issuedAt` (DATETIME)
- `totalAmount` (DECIMAL(10,2))
- `status` (ENUM: ISSUED, PAID, CANCELLED)

---

## 🔍 AUDIT TRAIL OBLIGATOIRE

Chaque validation bloquante doit être loggée dans `AuditLog` avec :
- `action`: `AuditAction.BOOKING_STATUS_CHANGE` ou `AuditAction.OTHER`
- `entityType`: `'Booking'`, `'Incident'`, etc.
- `entityId`: ID de l'entité
- `description`: Message métier clair expliquant le blocage
- `userId`: ID de l'utilisateur qui a tenté l'action

---

## ✅ PROCHAINES ÉTAPES

1. Mettre à jour le schéma Prisma
2. Créer les migrations
3. Implémenter les validations dans `booking.service.ts`
4. Créer le service `invoice.service.ts`
5. Ajouter les endpoints manquants
6. Tests unitaires pour chaque validation


