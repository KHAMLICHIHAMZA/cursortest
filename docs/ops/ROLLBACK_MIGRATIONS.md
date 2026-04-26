# Rollback migrations Prisma (procédure courte)

À utiliser **après échec** d’une migration en environnement partagé, ou pour **revenir en arrière** après un déploiement problématique.

## Avant toute migration majeure

1. **Sauvegarde PostgreSQL** (dump logique ou snapshot hébergeur : Neon, etc.).
2. Vérifier que `DIRECT_URL` pointe bien vers l’hôte **non pooler** pour `prisma migrate` (voir `backend/.env.example`).

## Cas 1 : migration appliquée par erreur, base à restaurer

1. Stopper le service API (éviter des écritures pendant la restauration).
2. Restaurer le **backup** pris **avant** la migration (restauration complète de la base ou remplacement du schéma + données selon votre outil).
3. Redémarrer l’API sur le **commit Git** correspondant au code **avant** la migration (image Docker / branche déployée).

## Cas 2 : Prisma en état incohérent (`_prisma_migrations`)

- En général : **ne pas** supprimer des lignes dans `_prisma_migrations` sans procédure documentée Prisma.
- Si besoin de marquer une migration comme résolue / annulée : utiliser la [doc officielle `migrate resolve`](https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting) (seulement avec le **contexte exact** de l’erreur).

## Cas 3 : pas de rollback automatique

Prisma Migrate **ne fournit pas** de `down` automatique pour chaque migration. La stratégie saine est **backup + redeploy version précédente du code** + base restaurée si nécessaire.

Pour le détail environnement (Render, Neon), voir aussi [`../PRODUCTION.md`](../PRODUCTION.md).
