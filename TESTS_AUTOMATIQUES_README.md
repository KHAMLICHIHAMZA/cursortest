# 🧪 Tests Automatiques - MalocAuto

**Date :** 2025-01-26  
**Statut :** ⚠️ En cours de correction

---

## 📋 État Actuel

### Tests Existants
- ✅ **Tests unitaires backend** : 84 tests (75 PASS, 9 FAIL)
- ✅ **Tests E2E mobile agent** : 17 tests (16 PASS, 1 FAIL)
- ✅ **Tests E2E SaaS** : 12 tests (1 PASS, 11 FAIL)
- ⚠️ **Tests E2E business rules** : En cours de création

### Problèmes Identifiés

#### 1. Tests Unitaires (9 FAIL)
- `BookingService` : Dépendances manquantes (AuditService, CommonAuditService)
- `SubscriptionService` : Problème avec `companyId` undefined
- `AuthService` : `logLogin` n'existe pas, `$transaction` mock manquant

#### 2. Tests E2E Business Rules
- Schéma Prisma : Champs incorrects (`make` → `brand`, `firstName` → `name`, etc.)
- `BookingStatus` : `CHECKED_IN` → `IN_PROGRESS`, `COMPLETED` → `RETURNED`
- `PlanningEventType` : `PREPARATION` → `PREPARATION_TIME`
- Relations : `User.agencyIds` → `UserAgency` relation
- `Booking.companyId` : N'existe pas directement (via `agency.companyId`)

#### 3. Tests E2E SaaS (11 FAIL)
- Problèmes d'authentification (401 au lieu de 403/200)
- Tokens expirés ou invalides

---

## 🚀 Lancement des Tests

### Script Principal
```powershell
.\scripts\lancer-tous-tests-automatiques.ps1
```

### Tests Individuels

#### Backend - Tests Unitaires
```bash
cd backend
npm test
```

#### Backend - Tests E2E Mobile Agent
```bash
cd backend
npm run test:e2e -- --testPathPattern=mobile-agent
```

#### Backend - Tests E2E SaaS
```bash
cd backend
npm run test:e2e:saas
```

---

## 🔧 Corrections Nécessaires

### 1. Corriger Tests Unitaires
- [ ] Ajouter mocks pour `AuditService` et `CommonAuditService` dans `BookingService.spec.ts`
- [ ] Corriger `SubscriptionService.spec.ts` pour passer `companyId` correctement
- [ ] Ajouter mock `logLogin` dans `AuthService.spec.ts`
- [ ] Ajouter mock `$transaction` dans `AuthService.spec.ts`

### 2. Corriger Tests E2E Business Rules
- [ ] Utiliser `brand` au lieu de `make` pour Vehicle
- [ ] Utiliser `name` au lieu de `firstName`/`lastName` pour Client
- [ ] Utiliser `IN_PROGRESS` au lieu de `CHECKED_IN`
- [ ] Utiliser `RETURNED` au lieu de `COMPLETED`
- [ ] Utiliser `PREPARATION_TIME` au lieu de `PREPARATION`
- [ ] Créer `UserAgency` relations au lieu de `agencyIds`
- [ ] Supprimer `companyId` direct de Booking (utiliser via agency)

### 3. Corriger Tests E2E SaaS
- [ ] Vérifier génération et expiration des tokens
- [ ] Corriger authentification dans les tests

---

## 📊 Résultats Actuels

```
Tests Unitaires : 75 PASS / 9 FAIL
Tests E2E Mobile : 16 PASS / 1 FAIL
Tests E2E SaaS : 1 PASS / 11 FAIL
Tests E2E Rules : 0 PASS / 0 FAIL (en cours)
```

---

## ✅ Prochaines Étapes

1. **Corriger les tests unitaires** (priorité haute)
2. **Corriger les tests E2E business rules** (priorité haute)
3. **Corriger les tests E2E SaaS** (priorité moyenne)
4. **Ajouter tests frontend web** (Playwright/Cypress)
5. **Ajouter tests mobile agent E2E** (Detox/Maestro)

---

**⚠️ Les tests automatiques sont en cours de correction. Utilisez les tests manuels (pilotes) en attendant.**


