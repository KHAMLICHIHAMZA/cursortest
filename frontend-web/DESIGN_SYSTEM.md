# Design System MalocAuto

## Vue d'ensemble

Ce document décrit le design system centralisé utilisé dans toute l'application MalocAuto. **AUCUNE EXCEPTION** - tous les composants et pages doivent utiliser ce design system.

## Structure

```
lib/design-system/
├── colors.ts        # Palette de couleurs unique
├── typography.ts    # Typographie standardisée
├── spacing.ts      # Espacements standardisés
└── index.ts        # Point d'entrée

components/ui/
├── badge.tsx        # Badges de statut
├── button.tsx       # Boutons
├── card.tsx         # Cartes
├── dialog.tsx       # Modales
├── input.tsx        # Champs de saisie
├── table.tsx        # Tableaux
├── stat-card.tsx    # Cartes de statistiques
├── empty-state.tsx  # États vides
├── loading-state.tsx # États de chargement
└── error-state.tsx  # États d'erreur
```

## Couleurs de statut (OBLIGATOIRES)

### Bleu - Confirmé / Actif / Loué
- `confirmed`, `active`, `rented`, `in_progress`
- Utilisé pour : Réservations confirmées, véhicules en location, statuts actifs

### Orange - En attente / Option
- `pending`, `option`, `planned`
- Utilisé pour : Réservations en attente, maintenances planifiées

### Vert - Disponible / Succès
- `available`, `success`
- Utilisé pour : Véhicules disponibles, opérations réussies

### Rouge - Retard / Incident / Alerte
- `late`, `incident`, `alert`, `error`
- Utilisé pour : Retards, erreurs, incidents

### Gris - Terminé / Inactif / Bloqué
- `completed`, `inactive`, `blocked`, `cancelled`, `returned`, `draft`
- Utilisé pour : Réservations terminées, véhicules en maintenance, statuts inactifs

## Composants

### Badge
```tsx
import { Badge } from '@/components/ui/badge';

<Badge status="active">Actif</Badge>
<Badge status="pending" variant="outline">En attente</Badge>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>
```

### StatCard
```tsx
import { StatCard } from '@/components/ui/stat-card';

<StatCard
  title="Véhicules"
  value={42}
  icon={Car}
  isLoading={false}
/>
```

### États
```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

<EmptyState
  icon={Car}
  title="Aucun véhicule"
  description="Commencez par ajouter votre premier véhicule"
/>

<LoadingState message="Chargement..." />

<ErrorState
  title="Erreur"
  message="Une erreur est survenue"
  onRetry={() => refetch()}
/>
```

## Règles strictes

1. **AUCUN style inline** - Utiliser uniquement les composants du design system
2. **Couleurs de statut** - Toujours utiliser les couleurs définies dans `colors.ts`
3. **Typographie** - Utiliser les tailles et poids définis dans `typography.ts`
4. **Espacements** - Utiliser les espacements standardisés de `spacing.ts`
5. **Composants réutilisables** - Ne pas dupliquer les composants, utiliser ceux existants

## Migration

Pour migrer une page existante :

1. Remplacer les `div` avec classes par des composants `Card`
2. Remplacer les badges manuels par le composant `Badge`
3. Utiliser `StatCard` pour les cartes de statistiques
4. Utiliser les composants d'état (`EmptyState`, `LoadingState`, `ErrorState`)
5. Utiliser `Table` pour tous les tableaux
6. Vérifier que toutes les couleurs de statut utilisent le mapping correct



