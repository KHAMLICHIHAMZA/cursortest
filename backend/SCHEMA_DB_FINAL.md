# 🔹 SCHÉMA BASE DE DONNÉES FINAL - RÈGLES MÉTIER VALIDÉES

## CONTEXTE
Schéma de base de données aligné avec les règles métier VALIDÉES du SAAS MalocAuto.

---

## 1️⃣ BOOKING - CHAMPS AJOUTÉS/VÉRIFIÉS

### Caution (définie à la réservation)
```prisma
depositRequired        Boolean              @default(false)
depositAmount          Decimal?             @db.Decimal(10, 2)
depositDecisionSource  DepositDecisionSource?
depositStatusCheckIn   DepositStatusCheckIn @default(PENDING)
depositStatusFinal     DepositStatusFinal?
```

**Règles métier :**
- `depositRequired = true` → `depositAmount` et `depositDecisionSource` obligatoires
- `depositStatusCheckIn` : PENDING par défaut, doit être COLLECTED pour check-in si `depositRequired = true`
- `depositStatusFinal` : défini au check-out ou lors de la clôture financière

### Frais de retard
```prisma
lateFeeAmount              Decimal?  @db.Decimal(10, 2)
lateFeeCalculatedAt        DateTime?
lateFeeOverride            Boolean   @default(false)
lateFeeOverrideJustification String? @db.Text
lateFeeOverrideBy           String?
lateFeeOverrideAt          DateTime?
```

**Règles métier :**
- Calcul automatique au check-out basé sur le retard (≤1h: 25%, ≤2h: 50%, >4h: 100% du prix journalier)
- Override possible UNIQUEMENT par Agency Manager avec justification obligatoire

### Clôture financière
```prisma
financialClosureBlocked        Boolean @default(false)
financialClosureBlockedReason  String? @db.Text
```

**Règles métier :**
- Bloqué si incident DISPUTED ou `depositStatusFinal = DISPUTED`
- Raison obligatoire si bloqué

### Champ calculé (non stocké)
```prisma
// computedEndWithPreparation (DATETIME)
// Calculé: endDate + preparationTimeMinutes
// Utilisé uniquement pour validation, jamais stocké en DB
```

---

## 2️⃣ AGENCY - CHAMPS AJOUTÉS

### Temps de préparation
```prisma
preparationTimeMinutes Int @default(60) // Temps de préparation après retour (en minutes, > 0)
```

**Règles métier :**
- Obligatoire, > 0
- Default: 60 minutes (1h)
- Utilisé pour bloquer les réservations chevauchant la période de préparation après retour

---

## 3️⃣ CLIENT - CHAMPS VÉRIFIÉS

### Permis de conduite
```prisma
licenseExpiryDate DateTime // Date de validité du permis (NOT NULL - obligatoire)
```

**Règles métier :**
- **NOT NULL** (modifié depuis nullable)
- Validation bloquante : permis doit être valide APRÈS la fin de la location
- Check-in bloqué si permis expiré ou expire le jour même

---

## 4️⃣ INCIDENT - CHAMPS EXISTANTS (VÉRIFIÉS)

### Statut
```prisma
status IncidentStatus @default(REPORTED)
```

**ENUM existant :**
```prisma
enum IncidentStatus {
  REPORTED
  UNDER_REVIEW
  RESOLVED
  DISPUTED  // ✅ Existe déjà
}
```

**Règles métier :**
- `DISPUTED` : bloque la clôture financière
- Caution retenue jusqu'à expertise externe (~3 jours)

### Type
```prisma
type IncidentType
```

**ENUM existant :**
```prisma
enum IncidentType {
  DAMAGE   // ✅ Existe déjà
  FINE     // ✅ Existe déjà
  ACCIDENT
  THEFT
  OTHER
}
```

**Règles métier :**
- `DAMAGE` avec montant > 50% de la caution → statut `DISPUTED` automatique
- `FINE` : déprécié au profit de `Incident(type=FINE)`

---

## 5️⃣ INVOICE - NOUVEAU MODÈLE

### Modèle complet
```prisma
model Invoice {
  id           String        @id @default(cuid())
  agencyId     String
  bookingId    String
  invoiceNumber String       @unique // Numéro incrémental par agence
  issuedAt     DateTime
  totalAmount  Decimal       @db.Decimal(10, 2)
  status       InvoiceStatus @default(ISSUED)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  agency  Agency  @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([agencyId])
  @@index([bookingId])
  @@index([invoiceNumber])
  @@index([status])
  @@index([issuedAt])
}
```

### ENUM
```prisma
enum InvoiceStatus {
  ISSUED
  PAID
  CANCELLED
}
```

**Règles métier :**
- Génération automatique au check-out (si pas de litige) ou après clôture financière (si litige résolu)
- Numérotation incrémentale par agence : `{AGENCY_PREFIX}-{NUMBER}` (ex: `AG01-000001`)
- Non modifiable après création

---

## 6️⃣ ENUMS AJOUTÉS

### DepositDecisionSource
```prisma
enum DepositDecisionSource {
  COMPANY
  AGENCY
}
```

### DepositStatusCheckIn
```prisma
enum DepositStatusCheckIn {
  PENDING
  COLLECTED
}
```

### DepositStatusFinal
```prisma
enum DepositStatusFinal {
  REFUNDED
  PARTIAL
  FORFEITED
  DISPUTED
}
```

### InvoiceStatus
```prisma
enum InvoiceStatus {
  ISSUED
  PAID
  CANCELLED
}
```

---

## 7️⃣ CONTRAINTES D'INTÉGRITÉ

### Booking
- `depositRequired = true` → `depositAmount` et `depositDecisionSource` obligatoires
- `depositStatusCheckIn = COLLECTED` obligatoire si `depositRequired = true` au check-in
- `lateFeeOverride = true` → `lateFeeOverrideJustification` obligatoire (min 10 caractères)
- `financialClosureBlocked = true` → `financialClosureBlockedReason` obligatoire

### Agency
- `preparationTimeMinutes > 0` (validation backend)

### Client
- `licenseExpiryDate NOT NULL` (contrainte DB)

### Invoice
- `invoiceNumber` unique par agence (contrainte DB + validation backend)
- `totalAmount > 0` (validation backend)

---

## 8️⃣ CHAMPS SUPPRIMÉS/DÉPRÉCIÉS

### Company
- ⚠️ `isActive` conservé pour rétrocompatibilité (commenté dans le schéma)
- Utiliser `status` (CompanyStatus) à la place

### Fine
- ⚠️ Modèle `Fine` déprécié au profit de `Incident(type=FINE)`
- Conserver pour migration progressive

### Booking
- `depositReference` supprimé (non utilisé selon spécifications)

---

## 9️⃣ INDEXES AJOUTÉS

### Booking
- `@@index([depositStatusCheckIn])` - Pour recherche rapide des cautions en attente
- `@@index([depositStatusFinal])` - Pour recherche rapide des cautions en litige
- `@@index([financialClosureBlocked])` - Pour recherche rapide des clôtures bloquées

### Invoice
- `@@index([invoiceNumber])` - Recherche par numéro
- `@@index([status])` - Filtrage par statut
- `@@index([issuedAt])` - Tri chronologique

---

## ✅ RÉSUMÉ DES MODIFICATIONS

### Ajouts
- ✅ 5 nouveaux champs dans `Booking` (caution, frais de retard, clôture financière)
- ✅ 1 nouveau champ dans `Agency` (preparationTimeMinutes)
- ✅ 1 modification dans `Client` (licenseExpiryDate NOT NULL)
- ✅ 1 nouveau modèle `Invoice`
- ✅ 4 nouveaux ENUMs

### Modifications
- ✅ `Client.licenseExpiryDate` : nullable → NOT NULL

### Dépréciations
- ⚠️ `Company.isActive` : utiliser `status` à la place
- ⚠️ Modèle `Fine` : utiliser `Incident(type=FINE)` à la place

---

## 🔄 MIGRATION REQUISE

1. Créer migration Prisma : `npx prisma migrate dev --name add_business_rules_fields`
2. Vérifier les données existantes :
   - Mettre à jour `Client.licenseExpiryDate` NULL → date par défaut si nécessaire
   - Initialiser `Agency.preparationTimeMinutes` = 60 pour les agences existantes
3. Tests de régression sur les endpoints existants

---

## 📋 VALIDATION FINALE

- ✅ Tous les champs requis par les règles métier sont présents
- ✅ Tous les ENUMs nécessaires sont définis
- ✅ Contraintes d'intégrité respectées
- ✅ Indexes optimisés pour les requêtes fréquentes
- ✅ Relations Prisma correctes


