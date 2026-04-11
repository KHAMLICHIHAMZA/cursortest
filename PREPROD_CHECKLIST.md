# Checklist préprod — MalocAuto

**Dernière révision :** 28 mars 2026  

Cette checklist est **alignée** sur le monorepo actuel : une seule app web **`frontend-web/`** (Next 14). Il n’y a plus de dossiers `frontend-admin` ni `frontend-agency`.

Pour le **statut global** et l’architecture : **[`STATUT_PREPROD.md`](./STATUT_PREPROD.md)**.  
Pour la **chaîne hébergement** : **[`docs/PRODUCTION.md`](./docs/PRODUCTION.md)**.  
Pour la **preuve environnement** : **[`docs/PRODUCTION_READINESS.md`](./docs/PRODUCTION_READINESS.md)**.

---

## Avant un déploiement préprod / prod

### Code & CI

- [ ] Branche `main` avec **CI verte** (GitHub Actions : backend, mobile, frontend-web, job d’intégration smoke dans `ci-full.yml`).
- [ ] `cd backend && npm run verify:push` OK sur une base dédiée (avant merge critique).
- [ ] `cd frontend-web && npm run lint && npm run build` OK localement si vous touchez au front.

### Secrets & fichiers

- [ ] Aucun `.env` / `.env.local` commité (vérifier `.gitignore`).
- [ ] Secrets forts pour `JWT_SECRET` et `JWT_REFRESH_SECRET` en prod — voir [`CHECKLIST_SECRETS.md`](./CHECKLIST_SECRETS.md).

### Base de données

- [ ] Migrations Prisma présentes dans le dépôt et appliquées sur l’environnement cible (`migrate deploy`).
- [ ] Backup / politique de sauvegarde définie chez le fournisseur Postgres.

### Hébergement

- [ ] **API** : variables sur Render (ou équivalent) — voir [`docs/PRODUCTION.md`](./docs/PRODUCTION.md) et [`render.yaml`](./render.yaml).
- [ ] **Front** : `NEXT_PUBLIC_API_URL` pointant vers l’API publique (`…/api/v1`).
- [ ] **CORS / URLs front** : `FRONTEND_WEB_URL`, `FRONTEND_URL` cohérents avec le domaine réel.

### Vérifications post-déploiement

- [ ] `GET /api/v1/health` et `GET /api/v1/ready` OK sur l’URL déployée.
- [ ] Smoke optionnel : `node backend/scripts/smoke-remote-api.mjs` avec `SMOKE_API_BASE`.
- [ ] Parcours manuel : login web + une action métier.

---

## Builds locaux (référence)

```bash
cd backend && npm run build
cd ../frontend-web && npm run build
```

---

**Note :** Les anciennes sections listant `frontend-admin` / `frontend-agency` et des comptes de tests figés ont été retirées — la référence de vérité est la **CI** et les commandes ci-dessus.
