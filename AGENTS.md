# Agents (Cursor, GitHub Copilot, etc.)

## Contexte projet

Lisez **`CONTEXT_CHATGPT.md`** à la racine : architecture, rôles RBAC, modules backend, routes frontend, comptes seed, commandes utiles.

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
