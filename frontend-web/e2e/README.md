# Tests E2E (Playwright)

## Commandes

```bash
cd frontend-web
npx playwright install chromium   # une fois
npm run test:e2e                  # préprod par défaut (voir playwright.config.ts)
```

Autre URL :

```bash
set PLAYWRIGHT_BASE_URL=http://localhost:3001
npm run test:e2e
```

## Warm-up (global-setup)

Avant la suite, le front préprod est appelé 2× pour limiter le cold start. Optionnel :

- `PLAYWRIGHT_API_WARMUP_URL=https://…/api/v1` — ping `/health` et `/ready` sur l’API Render.

## Préprod (`https://v0-cursortest.vercel.app`)

- Le compte **Super Admin** (`admin@malocauto.com` / seed) fonctionne en général.
- Les comptes **company / manager / agent** doivent être **actifs** sur la base préprod ; sinon les tests **échouent** avec « Compte inactif » (pas de skip).

Pour forcer des identifiants :

- `PW_SUPER_ADMIN_EMAIL`, `PW_SUPER_ADMIN_PASSWORD`
- `PW_COMPANY_ADMIN_EMAIL`, `PW_COMPANY_ADMIN_PASSWORD`
- `PW_AGENCY_MANAGER_EMAIL`, `PW_AGENCY_MANAGER_PASSWORD`
- `PW_AGENT_EMAIL`, `PW_AGENT_PASSWORD`

### Erreurs login en préprod (« Compte inactif », « Société supprimée », etc.)

Le seed local est OK, mais la base hébergée peut diverger. Exécuter **tout** le script (users + companies + agencies) :  
[`backend/scripts/sql/activate-e2e-demo-users.sql`](../../backend/scripts/sql/activate-e2e-demo-users.sql)  
Puis relancer `npm run test:e2e`.

## Rapports

Après exécution : `npx playwright show-report` (dossier `playwright-report/`).
