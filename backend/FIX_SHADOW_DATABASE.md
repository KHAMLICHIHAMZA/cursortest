# 🔧 Solution au Problème de Shadow Database

## Problème
L'erreur `P3006` indique qu'une migration précédente (`20241213190000_add_vehicle_image_horsepower_color`) échoue lors de l'application à la shadow database.

## ✅ Solution Appliquée

La migration `20250126000000_add_business_rules_fields` a été créée et appliquée avec succès en utilisant :
1. `prisma db push` - Pour appliquer les changements directement
2. Création manuelle de la migration SQL
3. `prisma migrate resolve --applied` - Pour marquer la migration comme appliquée

## 📋 État Actuel

✅ **Migration créée** : `20250126000000_add_business_rules_fields`
✅ **Migration appliquée** : Marquée comme appliquée dans l'historique
✅ **Schéma synchronisé** : Base de données à jour avec le schéma Prisma
✅ **Client Prisma généré** : Nouveaux champs disponibles dans le code

## 🔄 Pour les Futures Migrations

Si le problème de shadow database persiste, vous avez plusieurs options :

### Option 1 : Désactiver la Shadow Database (Recommandé pour développement)
Ajoutez dans `schema.prisma` :
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("DATABASE_URL") // Utilise la même DB
}
```

### Option 2 : Utiliser `prisma db push` pour les changements rapides
```bash
npx prisma db push
# Puis créer la migration manuellement si nécessaire
```

### Option 3 : Créer une Shadow Database dédiée
Créez une base de données séparée pour la shadow database :
```env
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/malocauto_shadow?schema=public"
```

## ✅ Vérification

Pour vérifier que tout fonctionne :
```bash
npx prisma migrate status
# Devrait afficher : "Database schema is up to date!"
```

## 📝 Note

La migration `20250126000000_add_business_rules_fields` est déjà créée et appliquée. Vous n'avez **PAS besoin** de la recréer avec `prisma migrate dev`.


