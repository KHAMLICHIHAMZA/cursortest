# 🧪 Configuration des Tests Automatisés - Frontend Company

**Date:** Décembre 2024  
**Version:** 2.0.0 Enterprise

---

## ✅ Ce qui a été configuré

### 1. Framework de Test
- ✅ **Vitest** configuré avec support React
- ✅ **@testing-library/react** pour tester les composants
- ✅ **jsdom** pour l'environnement de test DOM
- ✅ **@vitest/ui** pour l'interface graphique

### 2. Configuration
- ✅ `vitest.config.ts` - Configuration principale
- ✅ `test-setup.ts` - Setup global avec mocks
- ✅ Scripts npm ajoutés dans `package.json`

### 3. Tests Créés

#### Composants UI
- ✅ `StatCard` - Tests complets (rendu, onClick, loading, className)

#### Hooks
- ✅ `useDebounce` - Tests complets (délai, annulation, rapid changes)

#### Utilitaires
- ✅ `cn` - Tests complets (merge, conditionnels, Tailwind)

#### Validations Zod
- ✅ `Company` - Tests complets (création, mise à jour)
- ✅ `Agency` - Tests complets (création, mise à jour)
- ✅ `User` - Tests complets (création, mise à jour, rôles)

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd frontend-web
npm install
```

Cela installera automatiquement :
- `vitest` - Framework de test
- `@testing-library/react` - Utilitaires pour tester React
- `@testing-library/jest-dom` - Matchers DOM supplémentaires
- `@testing-library/user-event` - Simulation d'événements utilisateur
- `@vitejs/plugin-react` - Plugin React pour Vite
- `jsdom` - Environnement DOM pour les tests
- `@vitest/ui` - Interface graphique

### 2. Vérifier l'installation

```bash
npm test -- --version
```

---

## 📝 Utilisation

### Exécuter tous les tests

```bash
# Mode watch (recommandé pour le développement)
npm test

# Exécuter une fois
npm run test:run

# Interface graphique (recommandé)
npm run test:ui
```

### Exécuter des tests spécifiques

```bash
# Par fichier
npm test -- stat-card.test.tsx

# Par pattern
npm test -- stat-card

# Par dossier
npm test -- components
npm test -- validations
```

### Couverture de code

```bash
npm run test:coverage
```

Le rapport de couverture sera généré dans `coverage/` et accessible via `coverage/index.html`.

---

## 📊 Structure des Tests

```
frontend-web/
├── __tests__/
│   ├── components/
│   │   └── stat-card.test.tsx
│   ├── hooks/
│   │   └── use-debounce.test.tsx
│   ├── utils/
│   │   └── cn.test.ts
│   ├── validations/
│   │   ├── company.test.ts
│   │   ├── agency.test.ts
│   │   └── user.test.ts
│   └── README.md
├── vitest.config.ts
└── test-setup.ts
```

---

## 🎯 Exemples de Tests

### Test de Composant

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/ui/stat-card';
import { Building2 } from 'lucide-react';

describe('StatCard', () => {
  it('should render title and value', () => {
    render(
      <StatCard
        title="Total Agences"
        value={10}
        icon={Building2}
      />
    );

    expect(screen.getByText('Total Agences')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
```

### Test de Hook

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '@/lib/hooks/use-debounce';

describe('useDebounce', () => {
  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });
});
```

### Test de Validation

```typescript
import { describe, it, expect } from 'vitest';
import { createCompanySchema } from '@/lib/validations/company';

describe('createCompanySchema', () => {
  it('should validate a valid company', () => {
    const result = createCompanySchema.safeParse({
      name: 'Test Company',
    });
    expect(result.success).toBe(true);
  });

  it('should require name', () => {
    const result = createCompanySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
```

---

## 🔧 Configuration

### vitest.config.ts

La configuration inclut :
- Support React via `@vitejs/plugin-react`
- Environnement jsdom pour les tests DOM
- Alias `@` pour les imports
- Setup automatique via `test-setup.ts`
- Couverture de code avec v8

### test-setup.ts

Le setup inclut :
- Configuration de `@testing-library/jest-dom`
- Mocks pour Next.js (router, Link)
- Mocks pour `js-cookie`
- Mocks pour `react-hot-toast`
- Mocks pour `@tanstack/react-query`
- Cleanup automatique après chaque test

---

## 📈 Métriques Actuelles

### Tests Disponibles
- **Composants:** 1 test (StatCard)
- **Hooks:** 1 test (useDebounce)
- **Utilitaires:** 1 test (cn)
- **Validations:** 3 tests (Company, Agency, User)

### Couverture
- À mesurer avec `npm run test:coverage`

---

## 🚧 Prochaines Étapes

### Tests à Ajouter

1. **Composants UI supplémentaires:**
   - FormCard
   - Button
   - Input
   - Select
   - Table
   - Badge
   - Dialog

2. **Hooks supplémentaires:**
   - useOptimizedQuery

3. **Utilitaires supplémentaires:**
   - imageUrl

4. **Tests d'intégration:**
   - Pages Company (Dashboard, Agencies, Users, Analytics, Planning)
   - Flux complets (création agence → création utilisateur)

5. **Tests E2E (optionnel):**
   - Configurer Playwright ou Cypress
   - Scénarios utilisateur complets

---

## 🐛 Dépannage

### Erreur: "Cannot find module"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "jsdom not found"

```bash
npm install --save-dev jsdom
```

### Tests lents

- Utiliser `npm run test:run` au lieu de `npm test` (mode watch)
- Vérifier que les mocks sont correctement configurés

### Problèmes avec Next.js

Les mocks pour Next.js sont configurés dans `test-setup.ts`. Si vous avez des problèmes, vérifiez que les mocks correspondent à votre version de Next.js.

---

## 📚 Ressources

- [Documentation Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Validation

Pour vérifier que tout fonctionne :

```bash
# 1. Installer les dépendances
npm install

# 2. Exécuter les tests
npm run test:run

# 3. Vérifier la couverture
npm run test:coverage
```

Tous les tests devraient passer ! ✅

---

**Dernière mise à jour:** Décembre 2024


