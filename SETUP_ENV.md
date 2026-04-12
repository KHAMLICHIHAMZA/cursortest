# ⚙️ Configuration de l'Environnement - MalocAuto SaaS

## 🔧 Créer le fichier .env

### Windows (PowerShell)

```powershell
cd backend
Copy-Item -Path ".env.example" -Destination ".env"
```

Si le fichier `.env.example` n'existe pas, copiez depuis `env.example` :

```powershell
cd backend
Copy-Item -Path "env.example" -Destination ".env.example"
Copy-Item -Path ".env.example" -Destination ".env"
```

### Linux/Mac

```bash
cd backend
cp .env.example .env
```

## 📝 Éditer le fichier .env

Ouvrez le fichier `.env` et modifiez au minimum :

### 1. Base de Données (OBLIGATOIRE)

```env
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/malocauto?schema=public"
```

**Remplacez** :
- `postgres` par votre nom d'utilisateur PostgreSQL
- `VOTRE_MOT_DE_PASSE` par votre mot de passe PostgreSQL

### 2. Secrets JWT (OBLIGATOIRE)

Générez des secrets sécurisés :

**Windows PowerShell** :
```powershell
# Générer un secret aléatoire
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac** :
```bash
openssl rand -base64 32
```

Puis mettez à jour :
```env
JWT_SECRET=votre-secret-genere-ici
JWT_REFRESH_SECRET=votre-autre-secret-genere-ici
```

### 3. Frontend URL (OBLIGATOIRE)

```env
FRONTEND_URL=http://localhost:3001
```

### 4. Email (Optionnel pour le développement)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password
SMTP_FROM=noreply@malocauto.com
```

**Note** : Pour Gmail, utilisez un "App Password" (pas votre mot de passe normal).

### 5. Variables Optionnelles

Les variables suivantes peuvent être laissées vides pour le développement :
- `S3_*` (Storage)
- `CMI_*` (Paiement)
- `WHATSAPP_*` (WhatsApp)
- `OPENAI_API_KEY` (IA)
- `FCM_*` (Push Notifications)

## ✅ Vérification

Après avoir créé et édité le fichier `.env`, vérifiez qu'il existe :

```powershell
# Windows
Test-Path .env

# Linux/Mac
test -f .env && echo "OK" || echo "Manquant"
```

## 🔒 Sécurité

⚠️ **IMPORTANT** :
- Ne commitez **JAMAIS** le fichier `.env` dans Git
- Le fichier `.env` est déjà dans `.gitignore`
- Utilisez `.env.example` comme template
- Changez tous les secrets en production

## 📚 Suite

Une fois le fichier `.env` configuré, continuez avec :
- [TUTORIEL_LANCEMENT_SAAS.md](./docs/archive/TUTORIEL_LANCEMENT_SAAS.md) — Section « Base de données » (archive)



