# Render — service Web API (Docker)

À configurer dans le dashboard Render quand **Root Directory** = `backend` :

| Champ | Valeur |
|--------|--------|
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context Directory | `.` |
| Docker Command | *(vide)* |
| Pre-Deploy Command | *(vide)* |

Ne pas utiliser `backend/ ./Dockerfile` ni `backend/ $` : la racine du build est déjà `backend/`.

Au démarrage, le `Dockerfile` exécute `npm start` → `prisma migrate deploy` puis l’API.

Repo : autodeploy sur `main` ; seuls les commits sous `backend/` redéploient ce service.
