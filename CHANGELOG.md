# Changelog

Historique des changements **utiles pour l’équipe et le déploiement**.  
Tout changement visible côté produit, toute évolution de déploiement ou toute **rupture** (breaking) doit être noté ici — même en une ligne.

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).  
**Version produit affichée dans le README** : `2.0.0` (identité marketing) ; les packages `backend` / `frontend-web` / `mobile-agent` peuvent avoir des versions npm **indépendantes** — ne pas les confondre avec la version « produit ».

## [Unreleased]

### À compléter avant la prochaine release ou tag

- …

## [2.0.x] - 2026-03-28

### Ajouté

- **Admin** : mot de passe utilisateur en immédiat (`POST /api/v1/users/:id/set-password`), option envoi e-mail ; UI (dialogue) sur liste et fiche utilisateurs.
- **Documentation** : `AGENTS.md`, `docs/README.md`, `CHANGELOG.md` ; nettoyage de markdown obsolètes à la racine (audit d’unification, rapports ponctuels).

### Documentation

- Mise à jour de `CONTEXT_CHATGPT.md` et `README.md` (ports, API Users, statuts réservation).

---

## Comment tenir ce fichier à jour

1. À chaque PR ou commit significatif : ajouter une puce sous `[Unreleased]` ou créer une section datée lors d’un tag / release.
2. Lors d’un déploiement prod : copier les items pertinents de `[Unreleased]` vers une section datée et taguer le dépôt si besoin.
3. Ne pas promettre « prêt prod » dans les autres docs sans cocher au minimum la **[checklist preuve environnement](./docs/PRODUCTION_READINESS.md)**.
