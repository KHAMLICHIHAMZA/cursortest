# MalocAuto Backend

API REST construite avec NestJS, Prisma et PostgreSQL.

## 🚀 Démarrage rapide

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env et configurer DATABASE_URL
   ```

3. **Créer la base de données**
   ```bash
   # Créer la base PostgreSQL
   createdb malocauto
   ```

4. **Exécuter les migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Seeder la base de données**
   ```bash
   npx prisma db seed
   ```

6. **Démarrer le serveur**
   ```bash
   npm run dev
   ```

Le serveur démarre sur `http://localhost:3000`
Documentation API: `http://localhost:3000/api/docs`

## 📁 Structure

```
src/
├── modules/          # Modules métier
│   ├── auth/        # Authentification JWT
│   ├── company/     # Gestion des entreprises
│   ├── agency/      # Gestion des agences (avec preparationTimeMinutes)
│   ├── user/        # Gestion des utilisateurs
│   ├── vehicle/     # Gestion des véhicules
│   ├── client/      # Gestion des clients (licenseExpiryDate NOT NULL)
│   ├── booking/     # Gestion des réservations (règles métier complètes)
│   ├── incident/    # Gestion des incidents/dommages (DISPUTED)
│   ├── invoice/     # Génération automatique des factures
│   ├── maintenance/ # Gestion de la maintenance
│   ├── fine/        # Gestion des amendes
│   ├── planning/    # Planning des véhicules (temps de préparation)
│   ├── payment/     # Gestion des paiements
│   ├── notification/# Notifications (Email, WhatsApp, Push)
│   ├── audit/       # Audit logs
│   └── ai/          # Services IA
├── common/          # Utilitaires partagés
│   ├── prisma/       # Service Prisma
│   ├── guards/      # Guards d'authentification
│   ├── services/    # Services communs (AuditService, etc.)
│   └── decorators/  # Décorateurs personnalisés
└── main.ts          # Point d'entrée
```

## 🔐 Authentification

L'API utilise JWT avec access tokens (15min) et refresh tokens (7 jours).

### Endpoints

- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/me` - Obtenir l'utilisateur actuel
- `POST /api/auth/reset-password` - Réinitialiser le mot de passe

## 🛡️ Permissions

- **SUPER_ADMIN**: Accès complet à toutes les entreprises
- **COMPANY_ADMIN**: Gestion de sa propre entreprise
- **AGENCY_MANAGER**: Gestion de ses agences assignées
- **AGENT**: Accès en lecture/écriture limité à ses agences

## 📊 Base de données

Le schéma Prisma est dans `prisma/schema.prisma`.

### Commandes utiles

```bash
# Créer une migration
npx prisma migrate dev --name nom_migration

# Visualiser la base de données
npx prisma studio

# Générer le client Prisma
npx prisma generate
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:cov

# Tests E2E
npm run test:e2e
```

## 📝 Variables d'environnement

Voir `.env.example` pour la liste complète des variables requises.

Variables principales :
- `DATABASE_URL` - URL de connexion PostgreSQL
- `JWT_SECRET` - Secret pour les access tokens
- `JWT_REFRESH_SECRET` - Secret pour les refresh tokens
- `SMTP_*` - Configuration email
- `FRONTEND_URL` - URL du frontend pour les liens

## 🔍 API Documentation

Swagger est disponible à `/api/docs` une fois le serveur démarré.

## 📋 Règles Métier Implémentées

### R1.3 - Validation Permis de Conduire
- **Blocage réservation** : Impossible si permis expire avant fin de location
- **Blocage check-in** : Impossible si permis expiré ou expire le jour même
- **Audit log** : Chaque blocage est loggé avec contexte complet

### R2.2 - Temps de Préparation
- **Validation chevauchement** : Blocage si réservation chevauche période de préparation
- **Création automatique** : Période de préparation créée après check-out
- **Durée doublée** : Si retour en retard, temps de préparation doublé
- **Configuration** : `preparationTimeMinutes` par agence (default: 60)

### R3 - Caution (Dépôt)
- **Validation création** : Champs obligatoires si `depositRequired = true`
- **Blocage check-in** : Impossible si caution requise mais non collectée
- **Statuts** : PENDING → COLLECTED → REFUNDED/PARTIAL/FORFEITED/DISPUTED
- **Source décision** : COMPANY ou AGENCY

### R4 - Frais de Retard
- **Calcul automatique** : 
  - ≤ 1h : 25% du tarif journalier
  - ≤ 2h : 50% du tarif journalier
  - > 4h : 100% du tarif journalier
- **Override manager** : Agency Manager peut modifier avec justification (min 10 caractères)
- **Audit log** : Tous les overrides sont loggés

### R5 - Dommages & Litiges
- **Statut DISPUTED automatique** : Si dommage > 50% du montant caution
- **Blocage clôture financière** : Si incident DISPUTED ou `depositStatusFinal = DISPUTED`
- **Validation montant** : Montant collecté ≤ caution

### R6 - Facturation
- **Génération automatique** : Après check-out (si pas de litige) ou clôture financière
- **Numérotation incrémentale** : Par agence (format: `AGENCY-000001`)
- **Calcul montant** : `totalPrice + lateFeeAmount`

## 🆕 Nouveaux Endpoints

### Bookings
- `PATCH /api/v1/bookings/:id/late-fee` - Override frais de retard (Agency Manager)
- `POST /api/v1/bookings/:id/financial-closure` - Clôture financière

### Incidents
- `POST /api/v1/incidents` - Créer un incident (auto DISPUTED si montant élevé)
- `PATCH /api/v1/incidents/:id/status` - Mettre à jour le statut

### Invoices
- `POST /api/v1/invoices` - Générer une facture
- `PATCH /api/v1/invoices/:id/status` - Mettre à jour le statut

## 📊 Nouveaux Champs Base de Données

### Booking
- `depositRequired`, `depositAmount`, `depositDecisionSource`
- `depositStatusCheckIn`, `depositStatusFinal`
- `lateFeeAmount`, `lateFeeCalculatedAt`, `lateFeeOverride*`
- `financialClosureBlocked`, `financialClosureBlockedReason`
- `computedEndWithPreparation`

### Agency
- `preparationTimeMinutes` (default: 60)

### Client
- `licenseExpiryDate` (NOT NULL)

### Invoice (Nouveau modèle)
- `invoiceNumber`, `issuedAt`, `totalAmount`, `status`

## 📚 Documentation Complète

- **Règles métier** : `VALIDATIONS_BACKEND_RULES_METIER.md`
- **Schéma DB** : `SCHEMA_DB_FINAL.md`
- **Tâches complétées** : `TACHES_COMPLETEES.md`



