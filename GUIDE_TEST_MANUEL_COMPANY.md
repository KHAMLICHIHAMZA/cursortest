# 🧪 Guide de Test Manuel - Application Company Admin

**Date:** Décembre 2024  
**Version:** 2.0.0 Enterprise  
**Application:** Frontend Company (`http://localhost:3001/company`)

---

## 📋 Prérequis

### Serveurs à lancer
1. **Backend:** `cd backend && npm run dev` (port 3000)
2. **Frontend Company:** `cd frontend-web && npm run dev` (port 3001)

### Comptes de Test
- **COMPANY_ADMIN:** `admin@autolocation.fr` / `admin123`
- **SUPER_ADMIN:** `admin@malocauto.com` / `admin123` (redirigé vers /admin)

---

## ✅ CHECKLIST DE TEST

### 🔐 1. AUTHENTIFICATION

#### 1.1 Login Company Admin
- [ ] Ouvrir `http://localhost:3001/login`
- [ ] Se connecter avec `admin@autolocation.fr` / `admin123`
- [ ] ✅ Vérifier: Redirection vers `/company` (dashboard)
- [ ] ✅ Vérifier: Token stocké dans localStorage/cookies
- [ ] ✅ Vérifier: Sidebar affiche les menus Company (Dashboard, Agences, Utilisateurs, Analytics, Planning)

#### 1.2 Rejet des Rôles Non Autorisés
- [ ] Tenter connexion avec `agent1@autolocation.fr` / `agent123` (AGENT)
- [ ] ✅ Vérifier: Message d'erreur "Accès réservé aux administrateurs d'entreprise"
- [ ] ✅ Vérifier: Pas de redirection vers `/company`

#### 1.3 Déconnexion
- [ ] Cliquer sur "Déconnexion" dans le header
- [ ] ✅ Vérifier: Redirection vers `/login`
- [ ] ✅ Vérifier: Token supprimé du localStorage/cookies

---

### 📊 2. DASHBOARD COMPANY

#### 2.1 Affichage des Statistiques
- [ ] Se connecter en tant que COMPANY_ADMIN
- [ ] ✅ Vérifier: Carte "Agences" affiche le nombre correct
- [ ] ✅ Vérifier: Carte "Utilisateurs" affiche le nombre correct
- [ ] ✅ Vérifier: Carte "Véhicules" affiche le nombre correct
- [ ] ✅ Vérifier: Carte "Locations actives" affiche le nombre correct
- [ ] ✅ Vérifier: États de chargement affichés pendant le fetch

#### 2.2 Navigation depuis les Cartes
- [ ] Cliquer sur la carte "Agences"
- [ ] ✅ Vérifier: Navigation vers `/company/agencies`
- [ ] Retour au dashboard
- [ ] Cliquer sur la carte "Utilisateurs"
- [ ] ✅ Vérifier: Navigation vers `/company/users`
- [ ] Retour au dashboard
- [ ] Cliquer sur la carte "Véhicules"
- [ ] ✅ Vérifier: Navigation vers `/company/agencies` (ou page appropriée)
- [ ] Retour au dashboard
- [ ] Cliquer sur la carte "Locations actives"
- [ ] ✅ Vérifier: Navigation vers `/company/planning` (ou page appropriée)

#### 2.3 Liste des Agences Récentes
- [ ] ✅ Vérifier: Section "Agences récentes" affichée
- [ ] ✅ Vérifier: Liste limitée à 5 agences maximum
- [ ] ✅ Vérifier: Badge "Active" ou "Inactive" affiché
- [ ] ✅ Vérifier: Lien "Voir toutes les agences" fonctionne

#### 2.4 Liste des Locations Actives
- [ ] ✅ Vérifier: Section "Locations actives" affichée
- [ ] ✅ Vérifier: Liste limitée à 5 locations maximum
- [ ] ✅ Vérifier: Informations affichées (Client, Véhicule, Dates)
- [ ] ✅ Vérifier: Badge de statut affiché (IN_PROGRESS, etc.)

---

### 🏢 3. GESTION DES AGENCES

#### 3.1 Liste des Agences
- [ ] Aller sur `/company/agencies`
- [ ] ✅ Vérifier: Tableau affiche toutes les agences de l'entreprise
- [ ] ✅ Vérifier: Colonnes affichées (Nom, Entreprise, Téléphone, Adresse, Statut, Actions)
- [ ] ✅ Vérifier: Seules les agences de l'entreprise sont affichées (filtrage automatique)
- [ ] ✅ Vérifier: Badge "Active" ou "Inactive" pour chaque agence

#### 3.2 Recherche d'Agence
- [ ] Utiliser la barre de recherche
- [ ] ✅ Vérifier: Filtrage en temps réel par nom
- [ ] ✅ Vérifier: Filtrage par téléphone
- [ ] ✅ Vérifier: Filtrage par adresse

#### 3.3 Création d'Agence
- [ ] Cliquer sur "+ Nouvelle agence"
- [ ] ✅ Vérifier: Modal s'ouvre et est scrollable
- [ ] ✅ Vérifier: Formulaire affiche les champs:
  - Nom (requis)
  - Téléphone (requis)
  - Adresse (requis)
- [ ] Remplir le formulaire:
  - Nom: `Test Agency Company`
  - Téléphone: `+33123456799`
  - Adresse: `789 Test Street, Paris`
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Message de succès affiché
- [ ] ✅ Vérifier: Modal se ferme
- [ ] ✅ Vérifier: Nouvelle agence apparaît dans la liste
- [ ] ✅ Vérifier: Agence créée avec `companyId` correct (automatique)

#### 3.4 Modification d'Agence
- [ ] Cliquer sur "Éditer" sur une agence
- [ ] ✅ Vérifier: Modal s'ouvre avec les données pré-remplies
- [ ] Modifier le nom: `Test Agency Company Updated`
- [ ] Cliquer sur "Enregistrer"
- [ ] ✅ Vérifier: Message de succès affiché
- [ ] ✅ Vérifier: Modifications sauvegardées dans la liste

#### 3.5 Suppression d'Agence
- [ ] Cliquer sur "Supprimer" sur une agence
- [ ] ✅ Vérifier: Dialog de confirmation s'affiche
- [ ] Confirmer la suppression
- [ ] ✅ Vérifier: Message de succès affiché
- [ ] ✅ Vérifier: Agence supprimée de la liste (soft delete)
- [ ] ✅ Vérifier: Agence non supprimée si elle a des véhicules/locations actives

#### 3.6 Validation des Champs
- [ ] Tenter de créer une agence sans nom
- [ ] ✅ Vérifier: Message d'erreur "Le nom est requis"
- [ ] Tenter de créer une agence sans téléphone
- [ ] ✅ Vérifier: Message d'erreur "Le téléphone est requis"
- [ ] Tenter de créer une agence sans adresse
- [ ] ✅ Vérifier: Message d'erreur "L'adresse est requise"

#### 3.7 États de Chargement
- [ ] Pendant la création/modification
- [ ] ✅ Vérifier: Bouton "Créer"/"Enregistrer" désactivé
- [ ] ✅ Vérifier: Indicateur de chargement affiché
- [ ] ✅ Vérifier: Pas de double soumission possible

---

### 👤 4. GESTION DES UTILISATEURS

#### 4.1 Liste des Utilisateurs
- [ ] Aller sur `/company/users`
- [ ] ✅ Vérifier: Tableau affiche tous les utilisateurs de l'entreprise
- [ ] ✅ Vérifier: Colonnes affichées (Nom, Email, Rôle, Agences, Statut, Actions)
- [ ] ✅ Vérifier: Seuls les utilisateurs de l'entreprise sont affichés (filtrage automatique)
- [ ] ✅ Vérifier: Badge de rôle affiché (COMPANY_ADMIN, AGENCY_MANAGER, AGENT)
- [ ] ✅ Vérifier: Liste des agences pour chaque utilisateur

#### 4.2 Recherche d'Utilisateur
- [ ] Utiliser la barre de recherche
- [ ] ✅ Vérifier: Filtrage en temps réel par nom
- [ ] ✅ Vérifier: Filtrage par email
- [ ] ✅ Vérifier: Filtrage par rôle

#### 4.3 Création d'Utilisateur
- [ ] Cliquer sur "+ Nouvel utilisateur"
- [ ] ✅ Vérifier: Modal s'ouvre et est scrollable
- [ ] ✅ Vérifier: Formulaire affiche les champs:
  - Nom (requis)
  - Email (requis, format email)
  - Rôle (requis, sélection)
  - Agences (multi-sélection, optionnel)
- [ ] Remplir le formulaire:
  - Nom: `Test User Company`
  - Email: `testuser@autolocation.fr`
  - Rôle: `AGENCY_MANAGER`
  - Agences: Cocher 2 agences
- [ ] Cliquer sur "Créer"
- [ ] ✅ Vérifier: Message de succès affiché
- [ ] ✅ Vérifier: Modal se ferme
- [ ] ✅ Vérifier: Nouvel utilisateur apparaît dans la liste
- [ ] ✅ Vérifier: Utilisateur créé avec `companyId` correct (automatique)
- [ ] ✅ Vérifier: Agences assignées correctement

#### 4.4 Modification d'Utilisateur
- [ ] Cliquer sur "Éditer" sur un utilisateur
- [ ] ✅ Vérifier: Modal s'ouvre avec les données pré-remplies
- [ ] Modifier le nom: `Test User Company Updated`
- [ ] Modifier les agences assignées
- [ ] Cliquer sur "Enregistrer"
- [ ] ✅ Vérifier: Message de succès affiché
- [ ] ✅ Vérifier: Modifications sauvegardées dans la liste

#### 4.5 Réinitialisation de Mot de Passe
- [ ] Cliquer sur l'icône "Key" sur un utilisateur
- [ ] ✅ Vérifier: Dialog de confirmation s'affiche
- [ ] Confirmer la réinitialisation
- [ ] ✅ Vérifier: Message de succès "Email de réinitialisation envoyé"
- [ ] ✅ Vérifier: Email envoyé (si configuré)

#### 4.6 Suppression d'Utilisateur
- [ ] Cliquer sur "Supprimer" sur un utilisateur
- [ ] ✅ Vérifier: Dialog de confirmation s'affiche
- [ ] Confirmer la suppression
- [ ] ✅ Vérifier: Message de succès affiché
- [ ] ✅ Vérifier: Utilisateur supprimé de la liste (soft delete)

#### 4.7 Validation des Champs
- [ ] Tenter de créer un utilisateur sans nom
- [ ] ✅ Vérifier: Message d'erreur "Le nom est requis"
- [ ] Tenter de créer un utilisateur sans email
- [ ] ✅ Vérifier: Message d'erreur "L'email est requis"
- [ ] Tenter de créer un utilisateur avec email invalide
- [ ] ✅ Vérifier: Message d'erreur "Format d'email invalide"
- [ ] Tenter de créer un utilisateur sans rôle
- [ ] ✅ Vérifier: Message d'erreur "Le rôle est requis"

#### 4.8 Attribution de Rôles
- [ ] Créer un utilisateur avec rôle `COMPANY_ADMIN`
- [ ] ✅ Vérifier: Utilisateur créé avec le bon rôle
- [ ] Créer un utilisateur avec rôle `AGENCY_MANAGER`
- [ ] ✅ Vérifier: Utilisateur créé avec le bon rôle
- [ ] Créer un utilisateur avec rôle `AGENT`
- [ ] ✅ Vérifier: Utilisateur créé avec le bon rôle

---

### 📊 5. ANALYTICS

#### 5.1 Affichage des KPIs
- [ ] Aller sur `/company/analytics`
- [ ] ✅ Vérifier: KPIs affichés:
  - Total Agences
  - Total Utilisateurs
  - Total Véhicules
  - Total Locations
  - Revenus totaux
- [ ] ✅ Vérifier: KPIs calculés uniquement pour l'entreprise (filtrage automatique)

#### 5.2 Filtrage par Période
- [ ] Sélectionner une date de début
- [ ] Sélectionner une date de fin
- [ ] Cliquer sur "Appliquer"
- [ ] ✅ Vérifier: KPIs recalculés pour la période sélectionnée
- [ ] ✅ Vérifier: Graphiques mis à jour

#### 5.3 Top 10 Agences Actives
- [ ] ✅ Vérifier: Section "Top 10 Agences Actives" affichée
- [ ] ✅ Vérifier: Liste triée par nombre de locations
- [ ] ✅ Vérifier: Seules les agences de l'entreprise sont affichées
- [ ] ✅ Vérifier: Nombre de locations affiché pour chaque agence

#### 5.4 Répartition des Locations
- [ ] ✅ Vérifier: Graphique de répartition affiché
- [ ] ✅ Vérifier: Répartition par statut (PENDING, IN_PROGRESS, RETURNED, CANCELLED)
- [ ] ✅ Vérifier: Données filtrées par entreprise

#### 5.5 Métriques Supplémentaires
- [ ] ✅ Vérifier: Taux d'occupation des véhicules affiché
- [ ] ✅ Vérifier: Revenus par période affichés
- [ ] ✅ Vérifier: Évolution des locations affichée

---

### 📆 6. PLANNING

#### 6.1 Affichage du Planning
- [ ] Aller sur `/company/planning`
- [ ] ✅ Vérifier: FullCalendar affiché
- [ ] ✅ Vérifier: Événements de toutes les agences de l'entreprise affichés
- [ ] ✅ Vérifier: Couleurs distinctes pour les locations et maintenances

#### 6.2 Filtrage par Agence
- [ ] Utiliser le filtre d'agence
- [ ] Sélectionner une agence spécifique
- [ ] ✅ Vérifier: Seuls les événements de cette agence sont affichés
- [ ] Sélectionner "Toutes les agences"
- [ ] ✅ Vérifier: Tous les événements sont affichés

#### 6.3 Détails des Événements
- [ ] Cliquer sur un événement de location
- [ ] ✅ Vérifier: Modal avec détails s'ouvre
- [ ] ✅ Vérifier: Informations affichées (Client, Véhicule, Dates, Statut)
- [ ] ✅ Vérifier: Bouton "Voir détails" fonctionne
- [ ] Cliquer sur un événement de maintenance
- [ ] ✅ Vérifier: Modal avec détails s'ouvre
- [ ] ✅ Vérifier: Informations affichées (Véhicule, Description, Date prévue)

#### 6.4 Navigation dans le Calendrier
- [ ] Utiliser les boutons de navigation (Précédent, Suivant, Aujourd'hui)
- [ ] ✅ Vérifier: Navigation fonctionne correctement
- [ ] Changer la vue (Mois, Semaine, Jour)
- [ ] ✅ Vérifier: Changement de vue fonctionne

---

### 🔒 7. TESTS RBAC (PERMISSIONS)

#### 7.1 Accès Restreint
- [ ] Se connecter en tant que COMPANY_ADMIN
- [ ] ✅ Vérifier: Accès uniquement aux agences de l'entreprise
- [ ] ✅ Vérifier: Accès uniquement aux utilisateurs de l'entreprise
- [ ] ✅ Vérifier: Pas d'accès aux autres entreprises

#### 7.2 Filtrage Automatique
- [ ] Créer une agence
- [ ] ✅ Vérifier: Agence créée avec `companyId` automatique (pas besoin de le spécifier)
- [ ] Créer un utilisateur
- [ ] ✅ Vérifier: Utilisateur créé avec `companyId` automatique
- [ ] ✅ Vérifier: Impossible de créer une agence/utilisateur pour une autre entreprise

#### 7.3 Permissions Backend
- [ ] Tenter d'accéder à une agence d'une autre entreprise via l'API
- [ ] ✅ Vérifier: Erreur 403 Forbidden
- [ ] Tenter d'accéder à un utilisateur d'une autre entreprise via l'API
- [ ] ✅ Vérifier: Erreur 403 Forbidden

---

### 🎨 8. TESTS UI/UX

#### 8.1 Responsive Design
- [ ] Tester sur mobile (largeur < 768px)
- [ ] ✅ Vérifier: Sidebar se transforme en menu hamburger
- [ ] ✅ Vérifier: Tableaux scrollables horizontalement
- [ ] ✅ Vérifier: Modals adaptées à la taille de l'écran
- [ ] ✅ Vérifier: Boutons et formulaires accessibles

#### 8.2 États de Chargement
- [ ] Pendant le chargement des données
- [ ] ✅ Vérifier: Spinners affichés
- [ ] ✅ Vérifier: Skeleton loaders pour les tableaux
- [ ] ✅ Vérifier: Boutons désactivés pendant les mutations

#### 8.3 Gestion d'Erreurs
- [ ] Simuler une erreur réseau (déconnecter le backend)
- [ ] ✅ Vérifier: Message d'erreur clair affiché
- [ ] ✅ Vérifier: Bouton "Réessayer" disponible
- [ ] Tenter une action invalide
- [ ] ✅ Vérifier: Message d'erreur spécifique affiché

#### 8.4 Messages de Succès
- [ ] Créer une agence
- [ ] ✅ Vérifier: Toast de succès affiché
- [ ] Modifier un utilisateur
- [ ] ✅ Vérifier: Toast de succès affiché
- [ ] Supprimer une agence
- [ ] ✅ Vérifier: Toast de succès affiché

---

### 🔧 9. TESTS CROSS-CUTTING

#### 9.1 Navigation
- [ ] Utiliser la sidebar pour naviguer
- [ ] ✅ Vérifier: Navigation fonctionne entre toutes les pages
- [ ] ✅ Vérifier: Page active mise en surbrillance
- [ ] ✅ Vérifier: Breadcrumbs affichés (si implémentés)

#### 9.2 Recherche Globale
- [ ] Utiliser la barre de recherche dans le header
- [ ] ✅ Vérifier: Recherche fonctionne sur toutes les pages
- [ ] ✅ Vérifier: Résultats filtrés correctement

#### 9.3 Gestion des Tokens
- [ ] Laisser la session expirer
- [ ] ✅ Vérifier: Redirection automatique vers `/login`
- [ ] ✅ Vérifier: Message "Session expirée" affiché
- [ ] Se reconnecter
- [ ] ✅ Vérifier: Refresh token fonctionne

---

### 📊 10. TESTS DE PERFORMANCE

#### 10.1 Temps de Chargement
- [ ] Mesurer le temps de chargement du dashboard
- [ ] ✅ Vérifier: < 2 secondes pour le chargement initial
- [ ] ✅ Vérifier: < 1 seconde pour la navigation entre pages
- [ ] ✅ Vérifier: Requêtes API optimisées (pas de N+1)

#### 10.2 Cache React Query
- [ ] Charger une page
- [ ] Naviguer vers une autre page
- [ ] Revenir à la première page
- [ ] ✅ Vérifier: Données récupérées depuis le cache (pas de nouvelle requête)

#### 10.3 Optimisations
- [ ] ✅ Vérifier: Pagination si > 100 éléments
- [ ] ✅ Vérifier: Filtrage côté client optimisé avec useMemo
- [ ] ✅ Vérifier: Pas de re-renders inutiles

---

## 📊 RÉSULTATS DES TESTS

### Tests Réussis: ___ / ___
### Tests Échoués: ___ / ___
### Tests Bloquants: ___

---

## 🐛 BUGS DÉCOUVERTS

### Critique (Bloquant)
- 

### Majeur
- 

### Mineur
- 

---

## ✅ VALIDATION FINALE

- [ ] ✅ Tous les use cases fonctionnent
- [ ] ✅ Toutes les fonctionnalités enterprise intégrées
- [ ] ✅ Pas de régressions
- [ ] ✅ Performance acceptable
- [ ] ✅ UX cohérente avec les autres applications
- [ ] ✅ Sécurité et permissions respectées

---

**Testeur:** _________________  
**Date:** _________________  
**Version Testée:** 2.0.0 Enterprise


