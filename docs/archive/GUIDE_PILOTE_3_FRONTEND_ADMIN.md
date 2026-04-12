# 🧪 Guide Pilote 3 - Frontend Admin (Super Admin)

> **Archive / contexte** — L’admin vit aujourd’hui dans **`frontend-web/`** (routes `/admin/*`), pas dans un dépôt séparé. Ce guide reste utile comme **liste de tests manuels**.

**Pilote :** Administrateur Système / QA Admin  
**Application :** Next.js Admin Application  
**Durée estimée :** 3-4 heures

---

## 🎯 Objectif

Tester l'interface Super Admin, gestion entreprises, agences, utilisateurs, et gouvernance multi-tenant.

---

## 🚀 Préparation

### 1. Démarrer les Applications

```bash
# Terminal 1 : Backend
cd backend
npm run dev

# Terminal 2 : Frontend
cd frontend-web
npm run dev
```

Vérifier :
- Backend : `http://localhost:3000`
- Frontend : `http://localhost:3001/admin`

### 2. Compte de Test

```
SUPER_ADMIN: admin@malocauto.com / admin123
```

---

## 📋 Checklist de Tests

### Phase 1 : Authentification (10 min)

#### Test 1.1 : Connexion
- [ ] Accéder `http://localhost:3001/admin` (ou `/login`)
- [ ] Se connecter avec SUPER_ADMIN → ✅ Redirection dashboard admin
- [ ] Déconnexion → ✅ Retour login

---

### Phase 2 : Dashboard (15 min)

#### Test 2.1 : Affichage
- [ ] Statistiques globales affichées
- [ ] Navigation vers modules fonctionnelle
- [ ] KPIs en temps réel

---

### Phase 3 : Gestion Entreprises (45 min)

#### Test 3.1 : Liste
- [ ] Accéder `/admin/companies`
- [ ] Liste entreprises affichée
- [ ] Pagination fonctionnelle

#### Test 3.2 : Création
- [ ] Cliquer "Nouvelle entreprise"
- [ ] Remplir formulaire :
  - [ ] Nom
  - [ ] Téléphone
  - [ ] Adresse
  - [ ] Email admin
  - [ ] Nom admin
- [ ] Soumettre → ✅ Succès
- [ ] Vérifier entreprise créée

#### Test 3.3 : Modification
- [ ] Cliquer "Éditer" sur une entreprise
- [ ] Modifier champs
- [ ] Soumettre → ✅ Succès

#### Test 3.4 : Suppression
- [ ] Cliquer "Supprimer"
- [ ] Confirmer → ✅ Succès (soft delete)

#### Test 3.5 : Activation/Désactivation
- [ ] Activer entreprise
- [ ] Désactiver entreprise
- [ ] Vérifier statut mis à jour

---

### Phase 4 : Gestion Agences (45 min)

#### Test 4.1 : Liste
- [ ] Accéder `/admin/agencies`
- [ ] Liste agences affichée
- [ ] Filtrage par entreprise fonctionnel

#### Test 4.2 : Création
- [ ] Cliquer "Nouvelle agence"
- [ ] Remplir formulaire :
  - [ ] Nom
  - [ ] Entreprise
  - [ ] Téléphone
  - [ ] Adresse
  - [ ] **Temps de préparation (minutes)** - Default: 60
- [ ] Soumettre → ✅ Succès

#### Test 4.3 : Modification
- [ ] Cliquer "Éditer" sur une agence
- [ ] **Modifier `preparationTimeMinutes`** (ex: 90)
- [ ] Soumettre → ✅ Succès
- [ ] Vérifier valeur mise à jour

#### Test 4.4 : Suppression
- [ ] Cliquer "Supprimer"
- [ ] Confirmer → ✅ Succès

---

### Phase 5 : Gestion Utilisateurs (45 min)

#### Test 5.1 : Liste
- [ ] Accéder `/admin/users`
- [ ] Liste utilisateurs affichée

#### Test 5.2 : Création
- [ ] Cliquer "Nouvel utilisateur"
- [ ] Remplir formulaire :
  - [ ] Nom
  - [ ] Email
  - [ ] Mot de passe
  - [ ] Rôle
  - [ ] Entreprise
  - [ ] Agences assignées
- [ ] Soumettre → ✅ Succès

#### Test 5.3 : Modification
- [ ] Cliquer "Éditer" sur un utilisateur
- [ ] Modifier champs
- [ ] Soumettre → ✅ Succès

#### Test 5.4 : Suppression
- [ ] Cliquer "Supprimer"
- [ ] Confirmer → ✅ Succès

---

### Phase 6 : Santé Companies (30 min)

#### Test 6.1 : Accès
- [ ] Accéder `/admin/company-health` (ou équivalent)
- [ ] Sélectionner une entreprise

#### Test 6.2 : Affichage
- [ ] **Statut company** affiché (ACTIVE/SUSPENDED/DELETED)
- [ ] **Abonnement actif** affiché :
  - [ ] Plan
  - [ ] Dates
  - [ ] Statut
- [ ] **Jours restants** calculés et affichés
- [ ] **Alertes** affichées :
  - [ ] Paiement en attente
  - [ ] Abonnement expirant bientôt (< 7 jours)
  - [ ] Company suspendue depuis X jours
- [ ] **Modules activés** affichés
- [ ] **Historique paiements** affiché

#### Test 6.3 : Actions
- [ ] **Suspendre** company → ✅ Succès
- [ ] **Restaurer** company (si < 90 jours) → ✅ Succès
- [ ] **Étendre** abonnement → ✅ Succès

---

### Phase 7 : Abonnements (30 min)

#### Test 7.1 : Liste
- [ ] Accéder `/admin/subscriptions` (ou équivalent)
- [ ] Liste abonnements affichée

#### Test 7.2 : CRUD
- [ ] Créer abonnement
- [ ] Modifier abonnement
- [ ] Annuler abonnement

---

### Phase 8 : Analytics Global (30 min)

#### Test 8.1 : Accès
- [ ] Accéder `/admin/analytics`
- [ ] **Vérifier permissions :** Seul SUPER_ADMIN peut accéder

#### Test 8.2 : KPIs
- [ ] Entreprises (total + actives)
- [ ] Agences (total)
- [ ] Véhicules (total)
- [ ] Utilisateurs (total)
- [ ] Locations (total)
- [ ] Revenus totaux
- [ ] Taux d'occupation global
- [ ] Durée moyenne location
- [ ] Top 10 entreprises
- [ ] Top 10 agences

#### Test 8.3 : Filtrage
- [ ] Filtrage par période (date début/fin)
- [ ] Vérifier KPIs mis à jour

---

### Phase 9 : Audit Logs (30 min)

#### Test 9.1 : Accès
- [ ] Accéder page audit logs (si disponible)
- [ ] Liste logs affichée

#### Test 9.2 : Filtrage
- [ ] Filtrer par action
- [ ] Filtrer par utilisateur
- [ ] Filtrer par date
- [ ] Vérifier résultats filtrés

#### Test 9.3 : Détails
- [ ] Clic sur log → Détails affichés
- [ ] Vérifier métadonnées complètes

---

## 📝 Rapport de Test

### Format

```markdown
# Rapport de Test - Frontend Admin
**Date :** [DATE]
**Pilote :** [NOM]

## Résumé
- Tests réussis : X/Y
- Tests échoués : X/Y
- Bugs trouvés : X

## Détails
### Phase 4 : Gestion Agences
- ✅ Test 4.1 : Liste
- ❌ Test 4.2 : Création (détails...)

## Bugs
1. [Description bug] - [Sévérité]
2. ...

## Suggestions
1. [Suggestion]
2. ...
```

---

## ✅ Critères de Succès

- ✅ Toutes les pages accessibles
- ✅ Gestion entreprises/agences/utilisateurs fonctionnelle
- ✅ Santé companies affichée correctement
- ✅ Analytics globaux fonctionnels
- ✅ Permissions SUPER_ADMIN respectées
- ✅ Performance acceptable

---

**Bon test ! 🚀**


