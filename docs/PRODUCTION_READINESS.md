# Preuve « prêt » — dernière ligne droite

Ce document fixe la **différence** entre :

| Formulation | Signification |
|-------------|----------------|
| **Prêt technique** | Code mergé, CI verte sur `main`, migrations Prisma présentes dans le dépôt, `backend/.env.example` à jour. |
| **Prêt prouvé environnement** | Déploiement réel (ou staging identique prod) + vérifications ci-dessous **cochées** pour ce déploiement. |

Ne pas écrire « prêt pour la prod » dans une issue ou un README sans préciser laquelle des deux colonnes vous visez.

---

## 1. Avant merge sur `main` (développeur)

- [ ] `cd backend && npm run verify:push` sur une base **dédiée** (ou équivalent : tests + e2e + lint + build comme la CI).
- [ ] `cd frontend-web && npm run lint && npm run build`.
- [ ] Si le schéma Prisma change : migration testée (`migrate deploy`) sur une base **vide** ou du même état que la prod.

## 2. CI GitHub (référence)

Les workflows sous `.github/workflows/` sont la **référence** pour ce qui est exécuté sur chaque push (chemins `backend/**`, `frontend-web/**`, etc.).  
Objectif : **aucun merge sur `main`** sans pipeline vert (voir [protection de branche](./GITHUB_BRANCH_PROTECTION.md)).

## 3. Après déploiement (staging ou production)

À renouveler **à chaque release** ou changement d’infra :

- [ ] **Backend** : `GET /api/v1/health` (ou équivalent) OK sur l’URL déployée.
- [ ] **Base** : `prisma migrate deploy` appliqué (souvent au démarrage Render si `start` inclut migrate — vérifier les logs du dernier déploiement).
- [ ] **Auth** : connexion avec un compte **non seed** de test si la prod n’utilise pas les comptes seed.
- [ ] **E-mail** (si fonctionnalité concernée) : **un** e-mail réel reçu (reset, bienvenue, mot de passe admin) — pas seulement « SMTP configuré ».
- [ ] **Frontend** : page login + un parcours critique (ex. liste réservations ou admin users) sans erreur console bloquante.
- [ ] **Secrets** : repasser la [checklist secrets](../CHECKLIST_SECRETS.md) pour les variables **effectivement** définies chez l’hébergeur (Render, Vercel, Neon, etc.).

## 4. Variables d’environnement critiques (rappel)

Voir `backend/.env.example`. En prod (souvent Neon + Render) :

- `DATABASE_URL` et **`DIRECT_URL`** (direct non pooler pour migrations / locks).
- `JWT_SECRET`, `JWT_REFRESH_SECRET`.
- URLs front (`FRONTEND_WEB_URL`, etc.) pour CORS et liens dans les e-mails.

---

**Résumé** : la documentation (`CONTEXT_CHATGPT.md`, README) décrit l’**intention** ; ce fichier et la **CI verte** décrivent la **preuve** pour un environnement donné.
