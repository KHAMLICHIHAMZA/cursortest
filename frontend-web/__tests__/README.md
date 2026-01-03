# 🧪 Tests Automatisés - Frontend Company

Ce dossier contient tous les tests automatisés pour l'application frontend-web.

## 📋 Structure

```
__tests__/
├── components/          # Tests des composants UI
│   └── stat-card.test.tsx
├── hooks/              # Tests des hooks personnalisés
│   └── use-debounce.test.tsx
├── utils/              # Tests des utilitaires
│   └── cn.test.ts
└── validations/        # Tests des schémas Zod
    ├── company.test.ts
    ├── agency.test.ts
    └── user.test.ts
```

## 🚀 Utilisation

### Installation des dépendances

```bash
cd frontend-web
npm install
```

### Exécuter les tests

```bash
# Mode watch (développement)
npm test

# Exécuter une fois
npm run test:run

# Interface graphique
npm run test:ui

# Avec couverture de code
npm run test:coverage
```

### Exécuter un test spécifique

```bash
# Par fichier
npm test -- stat-card.test.tsx

# Par pattern
npm test -- stat-card

# Par dossier
npm test -- components
```

## 📊 Couverture de Code

La couverture de code est générée dans le dossier `coverage/` après avoir exécuté `npm run test:coverage`.

## 🛠️ Configuration

La configuration Vitest se trouve dans `vitest.config.ts` à la racine du projet.

### Configuration actuelle

- **Environment:** jsdom (pour tester les composants React)
- **Framework:** Vitest
- **Testing Library:** @testing-library/react
- **Coverage:** v8 provider

## ✍️ Écrire de nouveaux tests

### Exemple: Test de composant

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Exemple: Test de hook

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMyHook } from '@/lib/hooks/use-my-hook';

describe('useMyHook', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useMyHook('initial'));
    expect(result.current).toBe('initial');
  });
});
```

### Exemple: Test de validation

```typescript
import { describe, it, expect } from 'vitest';
import { mySchema } from '@/lib/validations/my-validation';

describe('mySchema', () => {
  it('should validate correct data', () => {
    const result = mySchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(true);
  });
});
```

## 🎯 Bonnes Pratiques

1. **Nommage:** Utiliser `.test.ts` ou `.test.tsx` pour les fichiers de test
2. **Organisation:** Un fichier de test par fichier source
3. **Descriptions:** Utiliser `describe` et `it` pour organiser les tests
4. **Assertions:** Utiliser des assertions claires et spécifiques
5. **Isolation:** Chaque test doit être indépendant
6. **Mocking:** Utiliser les mocks pour les dépendances externes

## 📝 Tests Actuels

### ✅ Composants
- [x] StatCard - Tests complets (rendu, onClick, loading, etc.)

### ✅ Hooks
- [x] useDebounce - Tests complets (délai, annulation, etc.)

### ✅ Utilitaires
- [x] cn - Tests complets (merge, conditionnels, etc.)

### ✅ Validations
- [x] Company - Tests complets (création, mise à jour)
- [x] Agency - Tests complets (création, mise à jour)
- [x] User - Tests complets (création, mise à jour, rôles)

## 🚧 Tests à Ajouter

### Composants
- [ ] FormCard
- [ ] Button
- [ ] Input
- [ ] Select
- [ ] Table
- [ ] Badge
- [ ] Dialog
- [ ] LoadingSpinner

### Hooks
- [ ] useOptimizedQuery

### Utilitaires
- [ ] imageUrl

### Pages (Tests d'intégration)
- [ ] Company Dashboard
- [ ] Agencies List
- [ ] Users List
- [ ] Analytics
- [ ] Planning

## 🔍 Debugging

### Mode watch avec logs

```bash
npm test -- --reporter=verbose
```

### Tests en mode debug

```bash
npm test -- --inspect-brk
```

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)


