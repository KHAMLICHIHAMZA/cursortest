# Protection de la branche `main` (GitHub)

Objectif : **interdire** de pousser sur `main` sans pipeline CI vert, et idéalement **exiger une PR revue** avant merge.

> À configurer **une fois** dans l’interface GitHub (compte avec droits administrateur sur le dépôt). Ce fichier n’applique rien automatiquement.

## Étapes (résumé)

1. Ouvrir le dépôt sur GitHub → **Settings** → **Branches** → **Add branch protection rule** (ou modifier la règle existante pour `main`).
2. **Branch name pattern** : `main`
3. Cocher au minimum :
   - **Require a pull request before merging** (recommandé).
   - **Require status checks to pass before merging** : ajouter les jobs qui correspondent à votre CI, par exemple :
     - `test` / `Tests Backend` (workflow `ci-backend.yml`),
     - jobs `frontend` / `mobile` si vous voulez bloquer sur tout le monorepo.
4. Optionnel mais utile : **Require branches to be up to date before merging**.
5. Optionnel : **Include administrators** pour que les admins respectent aussi la règle.

## Vérifier les noms exacts des checks

GitHub → **Actions** → ouvrir un workflow récent **réussi** → les noms affichés en bas de la PR (checks) sont ceux à sélectionner dans « Status checks ».

## Si vous ne pouvez pas tout bloquer

Même sans protection stricte : **convention d’équipe** = ne jamais merger dans `main` avec CI rouge ; `verify:push` en local avant push backend.
