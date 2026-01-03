# 📋 Guide de Test Manuel - Fonctionnalités SaaS

**Date:** Décembre 2024  
**Version:** 2.0.0  
**Statut:** ✅ Production Ready

---

## 🎯 Objectif

Ce guide permet de tester manuellement toutes les fonctionnalités SaaS de MalocAuto, incluant :
- Gestion des modules et accès
- Cycle de vie des abonnements
- Permissions utilisateurs
- Suspension/restauration des companies
- Gestion des erreurs 403

---

## 🔧 Prérequis

1. **Base de données seedée** :
   ```bash
   cd backend
   npm run prisma:seed
   ```

2. **Backend démarré** :
   ```bash
   cd backend
   npm run dev
   ```

3. **Frontend démarré** :
   ```bash
   cd frontend-web
   npm run dev
   ```

4. **Comptes de test** :
   - SUPER_ADMIN: `admin@malocauto.com` / `admin123`
   - COMPANY_ADMIN 1: `admin@autolocation.fr` / `admin123` (Plan Pro)
   - COMPANY_ADMIN 2: `admin@carrent.fr` / `admin123` (Plan Starter)

---

## 📦 Tests des Modules

### Test 1 : Accès aux modules selon le plan

**Objectif** : Vérifier que les modules sont accessibles selon le plan d'abonnement.

**Scénario** :
1. Se connecter avec `admin@carrent.fr` (Plan Starter)
2. Naviguer vers `/agency/vehicles`
   - ✅ **Attendu** : Page accessible (VEHICLES inclus dans Starter)
3. Naviguer vers `/agency/bookings`
   - ✅ **Attendu** : Page accessible (BOOKINGS inclus dans Starter)
4. Naviguer vers `/agency/maintenance`
   - ❌ **Attendu** : Message "Module non inclus" (MAINTENANCE non inclus dans Starter)
5. Naviguer vers `/agency/fines`
   - ❌ **Attendu** : Message "Module non inclus" (FINES non inclus dans Starter)
6. Naviguer vers `/company/analytics`
   - ❌ **Attendu** : Message "Module non inclus" (ANALYTICS non inclus dans Starter)

**Scénario 2** :
1. Se connecter avec `admin@autolocation.fr` (Plan Pro)
2. Naviguer vers `/agency/maintenance`
   - ✅ **Attendu** : Page accessible (MAINTENANCE inclus dans Pro)
3. Naviguer vers `/agency/fines`
   - ❌ **Attendu** : Message "Module non inclus" (FINES non inclus dans Pro)

---

### Test 2 : Blocage API 403

**Objectif** : Vérifier que l'API retourne 403 quand un module n'est pas activé.

**Scénario** :
1. Se connecter avec `admin@carrent.fr` (Plan Starter)
2. Ouvrir la console du navigateur (F12)
3. Essayer de créer une maintenance via l'API :
   ```javascript
   fetch('/api/v1/maintenance', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       agencyId: 'AGENCY_ID',
       vehicleId: 'VEHICLE_ID',
       description: 'Test maintenance'
     })
   })
   ```
   - ❌ **Attendu** : Réponse 403 avec message d'erreur clair

---

### Test 3 : Désactivation UI quand module non activé

**Objectif** : Vérifier que les boutons/actions sont désactivés quand le module n'est pas activé.

**Scénario** :
1. Se connecter avec `admin@carrent.fr` (Plan Starter)
2. Naviguer vers `/agency/vehicles`
   - ✅ **Attendu** : Bouton "Nouveau véhicule" visible et actif
3. Naviguer vers `/agency/bookings`
   - ✅ **Attendu** : Bouton "Nouvelle réservation" visible et actif
4. Naviguer vers `/agency/maintenance`
   - ❌ **Attendu** : Bouton "Nouvelle maintenance" non visible (page ModuleNotIncluded affichée)

---

## 🔄 Tests du Cycle de Vie des Abonnements

### Test 4 : Suspension automatique (simulation)

**Objectif** : Vérifier que la company est suspendue quand l'abonnement expire.

**Scénario** :
1. Se connecter en SUPER_ADMIN (`admin@malocauto.com`)
2. Aller dans la gestion des abonnements
3. Trouver l'abonnement de `admin@carrent.fr`
4. Modifier manuellement la date de fin pour hier (simulation expiration)
5. Exécuter le cron job de vérification (ou attendre le prochain run)
6. Se connecter avec `admin@carrent.fr`
7. Essayer d'accéder à `/agency/vehicles`
   - ❌ **Attendu** : Erreur 403 "Company is suspended"

**Note** : Le cron job s'exécute automatiquement tous les jours à 2h du matin.

---

### Test 5 : Restauration d'une company

**Objectif** : Vérifier qu'une company suspendue peut être restaurée.

**Scénario** :
1. Se connecter en SUPER_ADMIN
2. Aller dans la gestion des companies
3. Trouver une company suspendue
4. Cliquer sur "Restaurer"
5. Vérifier que le statut passe à ACTIVE
6. Se connecter avec le compte de cette company
7. Essayer d'accéder à `/agency/vehicles`
   - ✅ **Attendu** : Accès autorisé

---

### Test 6 : Suppression définitive J+100

**Objectif** : Vérifier qu'une company suspendue depuis 100+ jours est supprimée définitivement.

**Scénario** :
1. Se connecter en SUPER_ADMIN
2. Modifier manuellement une company pour :
   - `status = SUSPENDED`
   - `suspendedAt = Date.now() - 101 jours`
3. Exécuter le cron job `deleteExpiredCompanies` (ou attendre le prochain run)
4. Vérifier que la company a `status = DELETED`

**Note** : Le cron job s'exécute automatiquement tous les jours à 4h du matin.

---

## 👥 Tests des Permissions

### Test 7 : Permission READ

**Objectif** : Vérifier qu'un utilisateur avec permission READ ne peut que lire.

**Scénario** :
1. Se connecter en COMPANY_ADMIN
2. Créer un nouvel utilisateur avec :
   - Rôle: AGENT
   - Permission sur l'agence: READ
3. Se connecter avec ce nouvel utilisateur
4. Naviguer vers `/agency/vehicles`
   - ✅ **Attendu** : Liste des véhicules visible
5. Cliquer sur "Nouveau véhicule"
   - ❌ **Attendu** : Bouton désactivé ou erreur 403
6. Essayer de modifier un véhicule existant
   - ❌ **Attendu** : Erreur 403

---

### Test 8 : Permission WRITE

**Objectif** : Vérifier qu'un utilisateur avec permission WRITE peut créer mais pas supprimer.

**Scénario** :
1. Se connecter en COMPANY_ADMIN
2. Créer un nouvel utilisateur avec :
   - Rôle: AGENT
   - Permission sur l'agence: WRITE
3. Se connecter avec ce nouvel utilisateur
4. Naviguer vers `/agency/vehicles`
5. Créer un nouveau véhicule
   - ✅ **Attendu** : Création réussie
6. Essayer de supprimer un véhicule
   - ❌ **Attendu** : Erreur 403 "Permission insuffisante"

---

### Test 9 : Permission FULL

**Objectif** : Vérifier qu'un utilisateur avec permission FULL a tous les droits.

**Scénario** :
1. Se connecter en COMPANY_ADMIN
2. Créer un nouvel utilisateur avec :
   - Rôle: AGENT
   - Permission sur l'agence: FULL
3. Se connecter avec ce nouvel utilisateur
4. Naviguer vers `/agency/vehicles`
5. Créer un nouveau véhicule
   - ✅ **Attendu** : Création réussie
6. Modifier un véhicule
   - ✅ **Attendu** : Modification réussie
7. Supprimer un véhicule
   - ✅ **Attendu** : Suppression réussie

---

## 🏢 Tests d'Héritage des Modules

### Test 10 : Héritage Company → Agency

**Objectif** : Vérifier qu'une agence hérite des modules de sa company.

**Scénario** :
1. Se connecter avec `admin@autolocation.fr` (Plan Pro)
2. Vérifier que les modules suivants sont activés au niveau Company :
   - VEHICLES ✅
   - BOOKINGS ✅
   - INVOICES ✅
   - MAINTENANCE ✅
3. Naviguer vers une agence
4. Vérifier que tous ces modules sont accessibles
   - ✅ **Attendu** : Tous les modules Company sont accessibles

---

### Test 11 : Désactivation au niveau Agency

**Objectif** : Vérifier qu'une agence peut désactiver un module hérité.

**Scénario** :
1. Se connecter en COMPANY_ADMIN
2. Aller dans la gestion des agences
3. Sélectionner une agence
4. Désactiver le module MAINTENANCE pour cette agence
5. Se connecter avec un utilisateur de cette agence
6. Naviguer vers `/agency/maintenance`
   - ❌ **Attendu** : Message "Module non inclus" même si le module est payé au niveau Company

---

### Test 12 : Activation impossible d'un module non payé

**Objectif** : Vérifier qu'une agence ne peut pas activer un module non payé au niveau Company.

**Scénario** :
1. Se connecter avec `admin@carrent.fr` (Plan Starter, FINES non inclus)
2. Aller dans la gestion des agences
3. Essayer d'activer le module FINES pour une agence
   - ❌ **Attendu** : Erreur "Module not included in subscription"

---

## 🧪 Tests E2E Automatisés

Pour exécuter les tests E2E automatisés :

```bash
cd backend
npm run test:e2e:saas
```

**Tests couverts** :
- ✅ Contrôle d'accès aux modules
- ✅ Cycle de vie des abonnements
- ✅ Héritage des modules Agency
- ✅ Niveaux de permissions (READ/WRITE/FULL)

---

## 📊 Checklist de Validation

### Modules
- [ ] VEHICLES accessible avec Plan Starter
- [ ] BOOKINGS accessible avec Plan Starter
- [ ] MAINTENANCE accessible avec Plan Pro
- [ ] FINES accessible uniquement avec Plan Enterprise
- [ ] ANALYTICS accessible uniquement avec Plan Enterprise
- [ ] Messages "Module non inclus" affichés correctement
- [ ] Boutons désactivés quand module non activé

### Cycle de Vie
- [ ] Suspension automatique après expiration
- [ ] Restauration manuelle fonctionne
- [ ] Suppression définitive J+100 fonctionne
- [ ] Blocage d'accès quand company suspendue

### Permissions
- [ ] READ : Lecture seule fonctionne
- [ ] WRITE : Création mais pas suppression fonctionne
- [ ] FULL : Tous les droits fonctionnent

### Héritage
- [ ] Agence hérite des modules Company
- [ ] Agence peut désactiver un module hérité
- [ ] Agence ne peut pas activer un module non payé

---

## 🐛 Problèmes Connus

Aucun problème connu à ce jour.

---

## 📝 Notes

- Les cron jobs s'exécutent automatiquement tous les jours
- Les tests manuels peuvent être effectués à tout moment
- Les tests E2E nécessitent une base de données de test dédiée

---

**✅ Guide de test manuel complété !**


