# Gestion du montant à régler pour les prolongations

## Fonctionnalité

L'application détecte automatiquement si une réservation a été prolongée et calcule le montant supplémentaire à régler lors du check-out.

## Comment ça fonctionne

### 1. **Détection de la prolongation**

L'application vérifie deux indicateurs :
- **`extensionDays`** : Nombre de jours de prolongation enregistré dans la réservation
- **`originalEndDate`** : Date de fin originale de la réservation (si différente de `endDate`)

### 2. **Calcul du montant**

Le montant à régler est calculé ainsi :
```
Montant = Nombre de jours supplémentaires × Prix journalier du véhicule
```

**Exemple** :
- Prolongation de 2 jours
- Prix journalier : 500 MAD/jour
- Montant à régler : 2 × 500 = **1000 MAD**

### 3. **Affichage dans l'écran de check-out**

Quand une prolongation est détectée, une **carte jaune** s'affiche dans la section "Frais et encaissement" avec :
- Le montant total à régler (en **orange** et en gras)
- Les détails : nombre de jours × prix journalier
- Un bouton **"Ajouter ce montant aux frais"** pour l'ajouter automatiquement

### 4. **Ajout automatique aux frais**

En cliquant sur le bouton "Ajouter ce montant aux frais", le montant de prolongation est automatiquement ajouté au champ "Frais supplémentaires".

**Exemple** :
- Montant de prolongation : 1000 MAD
- Frais supplémentaires existants : 200 MAD
- Après clic : Frais supplémentaires = **1200 MAD**

## Interface utilisateur

### Carte d'information (si prolongation détectée)

```
┌─────────────────────────────────────┐
│ Montant à régler (prolongation)     │
│                   1000.00 MAD        │
│                                     │
│ 2 jour(s) supplémentaire(s) ×       │
│ 500.00 MAD/jour                     │
│                                     │
│ [Ajouter ce montant aux frais]      │
└─────────────────────────────────────┘
```

**Style visuel** :
- Fond jaune clair (#FFF3CD)
- Bordure orange (#FFC107)
- Montant en orange (#FF6B00) et en gras
- Bouton orange pour l'action

## Cas d'usage

### Cas 1 : Prolongation simple
1. Réservation initiale : 3 jours (du 1er au 4 janvier)
2. Client demande une prolongation : +2 jours
3. Nouvelle date de fin : 6 janvier
4. Au check-out : L'application détecte 2 jours supplémentaires
5. Montant calculé : 2 × prix journalier
6. Agent clique sur "Ajouter ce montant aux frais"
7. Le montant est ajouté aux frais supplémentaires

### Cas 2 : Prolongation + autres frais
1. Prolongation : 1000 MAD
2. Frais de retard : 200 MAD
3. Frais de dommages : 500 MAD
4. **Total frais supplémentaires** : 1700 MAD

### Cas 3 : Pas de prolongation
- Si la réservation n'a pas été prolongée, la carte n'apparaît pas
- L'agent peut toujours ajouter des frais manuellement

## Données techniques

### Champs de la réservation utilisés

```typescript
interface Booking {
  originalEndDate?: string;  // Date de fin originale
  extensionDays?: number;    // Nombre de jours de prolongation
  endDate: string;           // Date de fin actuelle
  vehicle?: {
    dailyRate: number;       // Prix journalier du véhicule
  };
}
```

### Calcul automatique

Le calcul se fait dans `CheckOutScreen.tsx` :

```typescript
const calculateExtensionAmount = (): number => {
  // Méthode 1 : Utiliser extensionDays si disponible
  if (booking.extensionDays && booking.vehicle?.dailyRate) {
    return booking.extensionDays * booking.vehicle.dailyRate;
  }
  
  // Méthode 2 : Calculer depuis originalEndDate
  if (booking.originalEndDate) {
    const daysDiff = (endDate - originalEndDate) / (24 * 60 * 60 * 1000);
    return daysDiff * booking.vehicle.dailyRate;
  }
  
  return 0;
};
```

## Traductions

Les clés de traduction ajoutées dans `fr.json` :

- `checkOut.extensionAmount` : "Montant à régler (prolongation)"
- `checkOut.extensionDetails` : "{{days}} jour(s) supplémentaire(s) × {{dailyRate}} MAD/jour"
- `checkOut.addExtensionAmount` : "Ajouter ce montant aux frais"

## Avantages

✅ **Automatisation** : Plus besoin de calculer manuellement le montant  
✅ **Précision** : Calcul basé sur les données réelles de la réservation  
✅ **Visibilité** : Montant clairement affiché avant validation  
✅ **Flexibilité** : L'agent peut choisir d'ajouter ou non le montant  
✅ **Traçabilité** : Le montant est enregistré dans les frais supplémentaires

## Notes importantes

⚠️ **Le montant n'est pas ajouté automatiquement** : L'agent doit cliquer sur le bouton pour l'ajouter aux frais. Cela permet de :
- Vérifier le montant avant de l'ajouter
- Ajouter d'autres frais en même temps
- Gérer des cas particuliers (réductions, négociations, etc.)

⚠️ **Le prix journalier doit être disponible** : Si `vehicle.dailyRate` n'est pas disponible, le montant ne peut pas être calculé et la carte n'apparaît pas.




