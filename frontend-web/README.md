# MalocAuto Frontend

Application web Next.js pour la gestion de location automobile.

## 🚀 Démarrage rapide

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   # Configurer NEXT_PUBLIC_API_URL
   ```

3. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   ```

L'application démarre sur `http://localhost:3001`

## 📁 Structure

```
app/
├── admin/           # Pages admin (Super Admin)
│   ├── companies/  # Gestion des entreprises
│   ├── agencies/    # Gestion des agences
│   └── users/       # Gestion des utilisateurs
├── agency/         # Pages agence
│   ├── vehicles/    # Gestion des véhicules
│   ├── clients/     # Gestion des clients
│   ├── bookings/    # Gestion des réservations
│   ├── maintenance/ # Gestion de la maintenance
│   ├── fines/       # Gestion des amendes
│   └── planning/    # Planning FullCalendar
├── login/          # Page de connexion
└── reset-password/ # Réinitialisation mot de passe

components/
├── layout/         # Sidebar, Header, MainLayout
├── planning/       # Composant FullCalendar
└── ui/             # Composants UI réutilisables

lib/
├── api/            # Clients API (Axios)
├── validations/    # Schémas Zod
└── utils/          # Utilitaires
```

## 🎨 Design System

Couleurs principales :
- Background: `#1D1F23`
- Cards: `#2C2F36`
- Primary: `#3E7BFA`
- Text: `#E5E7EB`

## 🔐 Authentification

L'authentification utilise JWT stocké dans des cookies HTTP-only.

- Access token: 15 minutes
- Refresh token: 7 jours
- Rotation automatique des tokens

## 📦 Dépendances principales

- **Next.js 14** - Framework React
- **React Query** - Gestion d'état serveur
- **Axios** - Client HTTP
- **FullCalendar** - Planning Timeline
- **Tailwind CSS** - Styling
- **Zod** - Validation
- **react-hook-form** - Gestion de formulaires
- **react-hot-toast** - Notifications

## 🛠️ Scripts

```bash
npm run dev      # Développement
npm run build    # Build production
npm run start    # Démarrer en production
npm run lint     # Linter
```

## 🎯 Pages principales

- `/login` - Connexion
- `/admin` - Dashboard admin
- `/admin/companies` - Gestion entreprises
- `/admin/agencies` - Gestion agences
- `/admin/users` - Gestion utilisateurs
- `/company` - Dashboard entreprise (Company Admin)
- `/company/agencies` - Gestion agences entreprise
- `/company/users` - Gestion utilisateurs entreprise
- `/company/analytics` - Analytics entreprise
- `/company/planning` - Planning entreprise
- `/agency` - Dashboard agence
- `/agency/vehicles` - Gestion véhicules
- `/agency/clients` - Gestion clients
- `/agency/bookings` - Gestion réservations
- `/agency/maintenance` - Gestion maintenance
- `/agency/fines` - Gestion amendes
- `/agency/planning` - Planning véhicules

## 🆕 Nouvelles Fonctionnalités (Règles Métier)

### Gestion des Réservations

#### Création de Réservation
- **Caution** : 
  - Checkbox "Caution requise"
  - Montant de la caution (obligatoire si caution requise)
  - Source de décision (COMPANY/AGENCY, obligatoire si caution requise)
  - Validation Zod complète

#### Page Détail Réservation
- **Informations financières** :
  - Caution : montant, statut, source, paiement restant
  - Frais de retard : montant, date de calcul, indication si modifié manuellement
  - Temps de préparation : durée et date de disponibilité du véhicule
  - Montant total (prix + frais de retard)

- **Override frais de retard** (Agency Manager uniquement) :
  - Bouton "Modifier" visible uniquement pour les managers
  - Dialog avec champ montant et justification (min 10 caractères)
  - Validation et messages d'erreur

### Validation Zod
- Schéma `createBookingSchema` mis à jour avec champs caution
- Validation conditionnelle : si `depositRequired`, alors `depositAmount` et `depositDecisionSource` obligatoires

## 🔒 Protection des routes

Les routes sont protégées par `RouteGuard` qui vérifie :
- Authentification (token JWT)
- Rôles autorisés
- Redirection automatique si non autorisé
