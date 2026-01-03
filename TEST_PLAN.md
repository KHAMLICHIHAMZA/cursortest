# 🧪 Plan de Test Complet - MalocAuto SaaS

## 📋 Objectif
Tester toutes les fonctionnalités du système pour s'assurer qu'elles fonctionnent correctement.

## ✅ Tests de Build

### Backend
- [ ] Build NestJS réussi
- [ ] 0 erreur de compilation
- [ ] 0 warning critique

### Frontend
- [ ] Build Next.js réussi
- [ ] 0 erreur TypeScript
- [ ] 0 erreur de prerendering
- [ ] 0 erreur ESLint

## 🔐 Tests d'Authentification

### Backend API
- [ ] POST `/api/auth/login` - Connexion
- [ ] POST `/api/auth/refresh` - Refresh token
- [ ] GET `/api/auth/me` - Profil utilisateur
- [ ] POST `/api/auth/reset-password` - Réinitialisation mot de passe

### Frontend
- [ ] Page de login fonctionnelle
- [ ] Redirection selon le rôle
- [ ] Gestion des tokens (access + refresh)
- [ ] Route guards fonctionnels

## 🏢 Tests Admin (SUPER_ADMIN)

### Companies
- [ ] Liste des entreprises
- [ ] Création d'entreprise
- [ ] Modification d'entreprise
- [ ] Désactivation d'entreprise
- [ ] Suppression d'entreprise

### Agencies
- [ ] Liste des agences
- [ ] Création d'agence
- [ ] Modification d'agence
- [ ] Suppression d'agence

### Users
- [ ] Liste des utilisateurs
- [ ] Création d'utilisateur
- [ ] Modification d'utilisateur
- [ ] Réinitialisation mot de passe
- [ ] Suppression d'utilisateur

## 🚗 Tests Agency

### Vehicles
- [ ] Liste des véhicules
- [ ] Création de véhicule
- [ ] Modification de véhicule
- [ ] Suppression de véhicule
- [ ] Filtres par statut

### Clients
- [ ] Liste des clients
- [ ] Création de client
- [ ] Modification de client
- [ ] Suppression de client
- [ ] Recherche de client

### Bookings
- [ ] Liste des réservations
- [ ] Création de réservation
- [ ] Modification de réservation
- [ ] Transitions de statut
- [ ] Suppression de réservation

### Maintenance
- [ ] Liste des maintenances
- [ ] Création de maintenance
- [ ] Modification de maintenance
- [ ] Suppression de maintenance

### Fines
- [ ] Liste des amendes
- [ ] Création d'amende
- [ ] Modification d'amende
- [ ] Suppression d'amende

### Planning
- [ ] Affichage du planning
- [ ] Drag & drop des réservations
- [ ] Création depuis le calendrier
- [ ] Modification depuis le calendrier

## 🔧 Tests Backend API

### Endpoints Principaux
- [ ] GET `/api/companies` - Liste entreprises
- [ ] POST `/api/companies` - Création entreprise
- [ ] GET `/api/agencies` - Liste agences
- [ ] POST `/api/agencies` - Création agence
- [ ] GET `/api/users` - Liste utilisateurs
- [ ] POST `/api/users` - Création utilisateur
- [ ] GET `/api/vehicles` - Liste véhicules
- [ ] POST `/api/vehicles` - Création véhicule
- [ ] GET `/api/clients` - Liste clients
- [ ] POST `/api/clients` - Création client
- [ ] GET `/api/bookings` - Liste réservations
- [ ] POST `/api/bookings` - Création réservation
- [ ] GET `/api/planning` - Planning

### Permissions
- [ ] SUPER_ADMIN peut tout faire
- [ ] COMPANY_ADMIN limité à sa société
- [ ] AGENCY_MANAGER limité à ses agences
- [ ] AGENT limité à ses agences

### Soft Delete
- [ ] Suppression soft fonctionne
- [ ] Restauration possible
- [ ] Filtrage des éléments supprimés

## 🎨 Tests Frontend

### Navigation
- [ ] Sidebar fonctionnelle
- [ ] Navigation selon le rôle
- [ ] Header avec menu utilisateur
- [ ] Logout fonctionnel

### Formulaires
- [ ] Validation avec react-hook-form + Zod
- [ ] Messages d'erreur affichés
- [ ] Soumission fonctionnelle
- [ ] États de chargement

### Pages
- [ ] Toutes les pages se chargent
- [ ] Pas d'erreur 404
- [ ] Routes protégées fonctionnent

## 📊 Tests de Performance

- [ ] Temps de build acceptable
- [ ] Temps de chargement des pages
- [ ] Requêtes API optimisées

## 🐛 Tests de Bugs Connus

- [ ] Aucune erreur de compilation
- [ ] Aucune erreur de prerendering
- [ ] Aucune erreur de linting



