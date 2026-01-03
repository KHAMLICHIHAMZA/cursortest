# 🧪 Guide des Tests Automatiques - MALOC SaaS

## 📋 Vue d'Ensemble

Ce guide explique comment utiliser les tests automatiques et d'intégration configurés pour le projet MALOC.

---

## 🚀 Tests Automatiques (CI/CD)

### GitHub Actions

Les tests sont automatiquement lancés via GitHub Actions lors de :

- **Push** sur les branches `main` ou `develop`
- **Pull Request** vers `main` ou `develop`
- **Workflow Dispatch** (déclenchement manuel)

### Workflows Disponibles

#### 1. Backend CI (`ci-backend.yml`)

**Déclenchement** : Modifications dans `backend/`

**Jobs** :
- ✅ **Tests unitaires** : Jest
- ✅ **Tests avec couverture** : Coverage report
- ✅ **Tests d'intégration E2E** : Tests end-to-end
- ✅ **Lint** : Vérification du code

**Services** :
- PostgreSQL 15 (base de test)

#### 2. Mobile Agent CI (`ci-mobile.yml`)

**Déclenchement** : Modifications dans `mobile-agent/`

**Jobs** :
- ✅ **Vérification TypeScript** : `tsc --noEmit`
- ✅ **Tests unitaires** : Jest
- ✅ **Tests avec couverture** : Coverage report
- ✅ **Tests d'intégration** : Tests avec backend
- ✅ **Lint** : Vérification TypeScript

**Services** :
- PostgreSQL 15 (pour tests d'intégration)

#### 3. CI Complet (`ci-full.yml`)

**Déclenchement** : Toutes modifications ou manuel

**Jobs** :
- ✅ Lance tous les tests backend
- ✅ Lance tous les tests mobile
- ✅ Tests d'intégration complets

---

## 🧪 Tests Locaux

### Backend

#### Tests Unitaires

```bash
cd backend
npm run test
```

#### Tests avec Couverture

```bash
cd backend
npm run test:cov
```

#### Tests E2E

```bash
cd backend
npm run test:e2e
```

**Prérequis** :
- Base de données PostgreSQL accessible
- Variables d'environnement configurées (`.env`)

### Mobile Agent

#### Tests Unitaires

```bash
cd mobile-agent
npm run test
```

#### Tests avec Couverture

```bash
cd mobile-agent
npm run test:coverage
```

#### Tests d'Intégration

```bash
cd mobile-agent
API_URL=http://localhost:3000/api/v1 npm run test:integration
```

**Prérequis** :
- Backend en cours d'exécution sur `http://localhost:3000`

---

## 🔄 Tests d'Intégration Complets

### Script Automatique

#### Linux/Mac

```bash
chmod +x scripts/run-all-integration-tests.sh
./scripts/run-all-integration-tests.sh
```

#### Windows (PowerShell)

```powershell
.\scripts\run-all-integration-tests.ps1
```

### Ce que fait le script

1. **Tests Backend** :
   - Tests unitaires
   - Tests E2E

2. **Démarrage Backend** :
   - Génération Prisma Client
   - Migrations base de données
   - Démarrage serveur

3. **Tests Mobile** :
   - Vérification TypeScript
   - Tests unitaires
   - Tests d'intégration (avec backend)

4. **Nettoyage** :
   - Arrêt du backend

---

## 📊 Couverture de Code

### Backend

Les rapports de couverture sont générés dans :
```
backend/coverage/
```

### Mobile Agent

Les rapports de couverture sont générés dans :
```
mobile-agent/coverage/
```

### Visualisation

Ouvrir `coverage/lcov-report/index.html` dans un navigateur.

---

## 🔍 Types de Tests

### 1. Tests Unitaires

**Backend** :
- Tests des services individuels
- Tests des guards
- Tests des DTOs
- Fichiers : `*.spec.ts`

**Mobile** :
- Tests des services
- Tests des composants
- Tests des utilitaires
- Fichiers : `*.test.ts` ou `*.test.tsx`

### 2. Tests d'Intégration

**Backend** :
- Tests E2E complets
- Tests avec base de données réelle
- Fichiers : `test/*.e2e-spec.ts`

**Mobile** :
- Tests avec backend réel
- Tests des flux complets
- Fichier : `src/services/__tests__/integration.test.ts`

### 3. Tests E2E (Maestro)

**Mobile** :
- Tests UI automatisés
- Fichiers : `.maestro/*.yaml`

**Lancement** :
```bash
cd mobile-agent
npm run test:e2e
```

---

## ⚙️ Configuration

### Variables d'Environnement

#### Backend

Créer un fichier `.env` dans `backend/` :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/malocauto_test
JWT_SECRET=test-secret-key
NODE_ENV=test
PORT=3000
```

#### Mobile Agent

Pour les tests d'intégration :

```bash
export API_URL=http://localhost:3000/api/v1
```

Ou dans PowerShell :

```powershell
$env:API_URL="http://localhost:3000/api/v1"
```

---

## 🐛 Dépannage

### Backend ne démarre pas

1. Vérifier que PostgreSQL est démarré
2. Vérifier les variables d'environnement
3. Vérifier les migrations : `npm run prisma:migrate`

### Tests d'intégration échouent

1. Vérifier que le backend est démarré
2. Vérifier l'URL de l'API : `http://localhost:3000/api/v1`
3. Vérifier que la base de données est seedée : `npm run prisma:seed`

### Tests Maestro échouent

1. Installer Maestro : Voir `mobile-agent/INSTALLATION_MAESTRO.md`
2. Vérifier que l'app est lancée
3. Vérifier la configuration dans `.maestro/config.yaml`

---

## 📈 Amélioration Continue

### Ajouter de Nouveaux Tests

#### Backend

1. Créer un fichier `*.spec.ts` dans le module concerné
2. Importer les dépendances nécessaires
3. Écrire les tests avec Jest

Exemple :
```typescript
describe('MyService', () => {
  it('should do something', () => {
    // Test
  });
});
```

#### Mobile

1. Créer un fichier `*.test.ts` ou `*.test.tsx`
2. Utiliser `@testing-library/react-native` pour les composants
3. Utiliser Jest pour les services

Exemple :
```typescript
describe('MyComponent', () => {
  it('should render correctly', () => {
    // Test
  });
});
```

### Tests d'Intégration

Ajouter des tests dans :
- `backend/test/integration/` pour le backend
- `mobile-agent/src/services/__tests__/integration.test.ts` pour le mobile

---

## ✅ Checklist Avant Commit

- [ ] Tests unitaires passent : `npm run test`
- [ ] Tests avec couverture : `npm run test:cov`
- [ ] Vérification TypeScript : `tsc --noEmit`
- [ ] Lint : `npm run lint` (si disponible)
- [ ] Tests d'intégration locaux (optionnel)

---

## 📚 Ressources

- **Jest Documentation** : https://jestjs.io/
- **Testing Library** : https://testing-library.com/
- **Maestro** : https://maestro.mobile.dev/
- **GitHub Actions** : https://docs.github.com/en/actions

---

**Dernière mise à jour** : 2024  
**Version** : 1.0.0




