# 🧪 Tests Automatiques - MalocAuto

**Date :** 2025-01-26  
**Version :** 2.0.0 Enterprise

---

## 🎯 Objectif

Suite complète de tests automatisés pour valider toutes les fonctionnalités et règles métier **sans intervention manuelle**.

---

## 📋 Structure des Tests

### Backend

#### 1. Tests Unitaires (`npm test`)
- **Location :** `backend/src/**/*.spec.ts`
- **Framework :** Jest
- **Couverture :** Services, Guards, Utils

#### 2. Tests E2E Business Rules (`npm run test:e2e -- --testPathPattern=business-rules`)
- **Location :** `backend/test/business-rules.e2e-spec.ts`
- **Framework :** Jest + Supertest
- **Couverture :** 6 règles métier (R1.3, R2.2, R3, R4, R5, R6)

#### 3. Tests E2E Mobile Agent (`npm run test:e2e -- --testPathPattern=mobile-agent`)
- **Location :** `backend/test/mobile-agent.e2e-spec.ts`
- **Framework :** Jest + Supertest
- **Couverture :** Endpoints mobile agent

#### 4. Tests E2E SaaS (`npm run test:e2e:saas`)
- **Location :** `backend/test/saas.e2e-spec.ts`
- **Framework :** Jest + Supertest
- **Couverture :** Multi-tenant, subscriptions

---

## 🚀 Lancement des Tests

### Option 1 : Tous les Tests (Recommandé)

```powershell
.\scripts\lancer-tous-tests-automatiques.ps1
```

Ce script lance automatiquement :
1. ✅ Tests unitaires backend
2. ✅ Tests E2E règles métier
3. ✅ Tests E2E mobile agent
4. ✅ Tests E2E SaaS

### Option 2 : Tests Individuels

#### Backend - Tests Unitaires
```bash
cd backend
npm test
```

#### Backend - Tests E2E Business Rules
```bash
cd backend
npm run test:e2e -- --testPathPattern=business-rules
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

#### Backend - Tous les Tests E2E
```bash
cd backend
npm run test:e2e
```

#### Backend - Tests avec Couverture
```bash
cd backend
npm run test:cov
```

---

## 📊 Tests Business Rules (R1.3, R2.2, R3, R4, R5, R6)

### R1.3 - Validation Permis
- ✅ Blocage création réservation si permis expire avant fin
- ✅ Blocage check-in si permis expiré
- ✅ Blocage check-in si permis expirant aujourd'hui

### R2.2 - Temps de Préparation
- ✅ Création automatique période préparation après check-out
- ✅ Durée doublée si retour en retard
- ✅ Validation chevauchement avec période préparation

### R3 - Caution
- ✅ Blocage check-in si caution requise mais non collectée
- ✅ Autorisation check-in si caution collectée
- ✅ Validation champs obligatoires si `depositRequired = true`

### R4 - Frais de Retard
- ✅ Calcul automatique (≤ 1h → 25%, ≤ 2h → 50%, > 4h → 100%)
- ✅ Override possible par Agency Manager avec justification
- ✅ Audit log pour override

### R5 - Dommages & Litiges
- ✅ Blocage clôture financière si incident DISPUTED
- ✅ Statut DISPUTED automatique si montant > 50% caution
- ✅ Validation montant collecté ≤ caution

### R6 - Facturation
- ✅ Génération automatique après check-out
- ✅ Génération lors clôture financière
- ✅ Numérotation incrémentale

---

## 📈 Résultats Attendus

### Tests Unitaires
- **Total :** ~15-20 tests
- **Temps :** ~30 secondes
- **Couverture :** > 70%

### Tests E2E Business Rules
- **Total :** 6 suites (une par règle)
- **Temps :** ~2-3 minutes
- **Couverture :** 100% des règles métier

### Tests E2E Mobile Agent
- **Total :** ~20-30 tests
- **Temps :** ~3-5 minutes
- **Couverture :** Tous les endpoints mobile

### Tests E2E SaaS
- **Total :** ~15-20 tests
- **Temps :** ~2-3 minutes
- **Couverture :** Multi-tenant, subscriptions

---

## 🔧 Configuration

### Backend - Jest
- **Fichier :** `backend/jest.config.js`
- **Fichier E2E :** `backend/test/jest-e2e.json`
- **Timeout :** 30000ms par test

### Variables d'Environnement
Les tests utilisent une base de données de test séparée :
- **DATABASE_URL :** Base de données de test
- **JWT_SECRET :** Secret pour tokens de test

---

## 📝 Format des Rapports

### Console
Les résultats s'affichent directement dans la console avec :
- ✅ Tests réussis (vert)
- ❌ Tests échoués (rouge)
- ⚠️ Erreurs (rouge)

### Résumé Final
```
========================================
RESUME DES TESTS
========================================

Total tests: 4
Reussis: 3
Echoues: 1
Erreurs: 0

  backend-unit : PASS
  backend-e2e-rules : PASS
  backend-e2e-mobile : PASS
  backend-e2e-saas : FAIL
```

---

## 🐛 Debugging

### Lancer un Test Spécifique
```bash
cd backend
npm test -- booking.service.spec
```

### Mode Watch
```bash
cd backend
npm run test:watch
```

### Mode Debug
```bash
cd backend
npm run test:debug
```

---

## ✅ Checklist Tests Automatiques

- [x] Tests unitaires backend créés
- [x] Tests E2E business rules créés
- [x] Tests E2E mobile agent existants
- [x] Tests E2E SaaS existants
- [x] Script de lancement automatique créé
- [ ] Tests frontend web (à créer)
- [ ] Tests mobile agent E2E (à créer)

---

## 🚀 Prochaines Étapes

1. **Tests Frontend Web** (Playwright/Cypress)
   - Tests E2E pour l'application agency
   - Tests E2E pour l'application admin

2. **Tests Mobile Agent E2E** (Detox/Maestro)
   - Tests check-in/check-out
   - Tests mode offline
   - Tests persistance

3. **CI/CD Integration**
   - GitHub Actions / GitLab CI
   - Lancement automatique à chaque commit
   - Rapports de couverture

---

**🎉 Les tests automatiques sont prêts ! Lancez-les avec :**
```powershell
.\scripts\lancer-tous-tests-automatiques.ps1
```


