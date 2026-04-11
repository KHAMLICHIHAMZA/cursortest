# Agents (Cursor, GitHub Copilot, etc.)

## Contexte projet

Lisez **`CONTEXT_CHATGPT.md`** à la racine : architecture, rôles RBAC, modules backend, routes frontend, comptes seed, commandes utiles.

Pour le **cadre préprod → prod** (vérité, env, phases) : **`docs/AUDIT_PREPROD_VERS_PROD.md`**.

Après une évolution **produit, API ou déploiement** notable : ajouter une entrée dans **`CHANGELOG.md`** (même courte).

## Règles dépôt

- **`.cursor/rules/`** — notamment `delivery-quality.mdc` (tests avant livraison) et `pre-push-verification.mdc` (validation avant push, Prisma sous Windows).

## Validation avant push (backend)

Depuis `backend/`, avec une base Postgres dédiée et `DATABASE_URL` / `DIRECT_URL` :

```bash
npm run verify:push
```

Enchaîne : `prisma generate`, `migrate deploy`, seed, tests unitaires, tests e2e, lint, build.

## API

Swagger : `/api/docs` (backend démarré).

## « Prêt » vs preuve environnement

Ne pas affirmer qu’une release est « prête prod » sans se référer à **`docs/PRODUCTION_READINESS.md`** (checklist) et à une CI verte sur `main`.
