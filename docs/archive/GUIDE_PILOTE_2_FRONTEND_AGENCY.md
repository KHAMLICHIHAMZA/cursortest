# 🧪 Guide Pilote 2 - Frontend Web (Agency)

> **Archive / contexte** — L’application agence vit aujourd’hui dans **`frontend-web/`** (routes `/agency/*`), pas dans un dépôt séparé. Ce guide reste utile comme **liste de tests manuels** ; ne pas l’interpréter comme une architecture à trois frontends.

**Pilote :** Développeur Frontend / QA Frontend  
**Application :** Next.js Agency Application  
**Durée estimée :** 4-6 heures

---

## 🎯 Objectif

Tester exhaustivement l'interface agence, formulaires, validations frontend, et intégration avec les règles métier.

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
- Frontend : `http://localhost:3001`

### 2. Comptes de Test

```
AGENCY_MANAGER: manager1@autolocation.fr / manager123
AGENT: agent1@autolocation.fr / agent123
```

### 3. Navigateur

- **Chrome** ou **Firefox** (recommandé)
- Ouvrir DevTools (F12) pour voir les erreurs console

---

## 📋 Checklist de Tests

### Phase 1 : Authentification (15 min)

#### Test 1.1 : Connexion
- [ ] Accéder `http://localhost:3001/login`
- [ ] Se connecter avec AGENCY_MANAGER → ✅ Redirection dashboard
- [ ] Se connecter avec AGENT → ✅ Redirection dashboard
- [ ] Mauvais mot de passe → ❌ Message d'erreur
- [ ] Déconnexion → ✅ Retour login

---

### Phase 2 : Dashboard (15 min)

#### Test 2.1 : Affichage
- [ ] Statistiques affichées (Véhicules, Clients, Locations, Disponibles)
- [ ] Liste véhicules en location
- [ ] Liste locations récentes
- [ ] Navigation vers modules fonctionnelle

---

### Phase 3 : Gestion Véhicules (30 min)

#### Test 3.1 : Liste
- [ ] Accéder `/agency/vehicles`
- [ ] Liste véhicules affichée
- [ ] Pagination fonctionnelle

#### Test 3.2 : Création
- [ ] Cliquer "Nouveau véhicule"
- [ ] Remplir formulaire complet
- [ ] Upload photo
- [ ] Soumettre → ✅ Succès

#### Test 3.3 : Modification
- [ ] Cliquer "Éditer" sur un véhicule
- [ ] Modifier champs
- [ ] Soumettre → ✅ Succès

#### Test 3.4 : Suppression
- [ ] Cliquer "Supprimer"
- [ ] Confirmer → ✅ Succès

---

### Phase 4 : Gestion Clients (30 min)

#### Test 4.1 : Liste
- [ ] Accéder `/agency/clients`
- [ ] Liste clients affichée

#### Test 4.2 : Création
- [ ] Cliquer "Nouveau client"
- [ ] Remplir formulaire
- [ ] **Analyse permis IA :**
  - [ ] Upload photo permis
  - [ ] Vérifier extraction données
  - [ ] Vérifier pré-remplissage formulaire
- [ ] Soumettre → ✅ Succès

#### Test 4.3 : Validation Permis
- [ ] Créer client avec permis expiré
- [ ] Vérifier avertissement affiché (non bloquant)

---

### Phase 5 : Gestion Réservations - CRÉATION (60 min)

#### Test 5.1 : Accès Formulaire
- [ ] Accéder `/agency/bookings/new`
- [ ] Formulaire affiché

#### Test 5.2 : Sélection Données
- [ ] Sélectionner agence
- [ ] Sélectionner client (avec permis valide)
- [ ] Sélectionner véhicule disponible
- [ ] Définir dates (début < fin)

#### Test 5.3 : Caution - SCÉNARIO COMPLET
- [ ] **Cocher "Caution requise"**
  - [ ] Vérifier champs montant et source apparaissent
  - [ ] Vérifier champs marqués obligatoires (*)
- [ ] **Saisir montant** (ex: 500)
  - [ ] Vérifier validation nombre positif
- [ ] **Sélectionner source** (COMPANY ou AGENCY)
- [ ] **Décocher "Caution requise"**
  - [ ] Vérifier champs masqués
- [ ] **Re-cocher "Caution requise"**
  - [ ] Vérifier champs réapparaissent

#### Test 5.4 : Validation Frontend
- [ ] Soumettre avec caution requise mais sans montant → ❌ Erreur "Montant obligatoire"
- [ ] Soumettre avec caution requise mais sans source → ❌ Erreur "Source obligatoire"
- [ ] Soumettre avec dates invalides (fin < début) → ❌ Erreur
- [ ] Soumettre avec permis expiré → ❌ Erreur backend

#### Test 5.5 : Soumission
- [ ] Remplir formulaire complet valide
- [ ] Soumettre → ✅ Succès
- [ ] Vérifier redirection liste réservations
- [ ] Vérifier réservation créée

---

### Phase 6 : Gestion Réservations - DÉTAIL (60 min)

#### Test 6.1 : Accès Page
- [ ] Accéder `/agency/bookings/[id]` (remplacer [id] par un ID réel)
- [ ] Page détail affichée

#### Test 6.2 : Informations Financières
- [ ] **Section "Informations financières" affichée**
- [ ] **Caution :**
  - [ ] Montant affiché
  - [ ] Statut affiché (PENDING/COLLECTED)
  - [ ] Source affichée (COMPANY/AGENCY)
  - [ ] Statut final affiché (si applicable)
- [ ] **Frais de retard :**
  - [ ] Montant affiché (si calculés)
  - [ ] Date de calcul affichée
  - [ ] Indication "Override" si modifié manuellement
  - [ ] Justification override affichée (si applicable)
- [ ] **Temps de préparation :**
  - [ ] Durée affichée (minutes)
  - [ ] Date disponibilité affichée
- [ ] **Montant total :**
  - [ ] Prix de base + frais de retard

#### Test 6.3 : Override Frais de Retard (AGENCY_MANAGER uniquement)
- [ ] **Vérifier visibilité bouton :**
  - [ ] Connecté en AGENCY_MANAGER → Bouton visible
  - [ ] Connecté en AGENT → Bouton masqué
- [ ] **Ouvrir dialog :**
  - [ ] Cliquer "Modifier les frais de retard"
  - [ ] Dialog s'ouvre
  - [ ] Montant actuel affiché
- [ ] **Saisir données :**
  - [ ] Saisir nouveau montant (ex: 100)
  - [ ] Saisir justification (ex: "Client a eu un problème de santé")
- [ ] **Validation :**
  - [ ] Soumettre avec justification < 10 caractères → ❌ Erreur
  - [ ] Soumettre avec justification ≥ 10 caractères → ✅ Succès
- [ ] **Vérifier mise à jour :**
  - [ ] Montant mis à jour
  - [ ] Indication "Override" affichée
  - [ ] Justification affichée

#### Test 6.4 : Modification Réservation
- [ ] Cliquer "Modifier"
- [ ] Modifier champs
- [ ] Soumettre → ✅ Succès

---

### Phase 7 : Planning (30 min)

#### Test 7.1 : Affichage
- [ ] Accéder `/agency/planning`
- [ ] Calendrier affiché
- [ ] Locations affichées
- [ ] Maintenances affichées
- [ ] Périodes préparation affichées

#### Test 7.2 : Interaction
- [ ] Clic sur événement → Modal détails
- [ ] Navigation vers détails complets

---

### Phase 8 : Maintenance (30 min)

#### Test 8.1 : Liste
- [ ] Accéder `/agency/maintenance`
- [ ] Liste maintenances affichée

#### Test 8.2 : CRUD
- [ ] Créer maintenance
- [ ] Modifier maintenance
- [ ] Supprimer maintenance

---

### Phase 9 : Amendes (30 min)

#### Test 9.1 : Liste
- [ ] Accéder `/agency/fines`
- [ ] Liste amendes affichée

#### Test 9.2 : CRUD
- [ ] Créer amende avec pièce jointe
- [ ] Modifier amende
- [ ] Supprimer amende

---

### Phase 10 : Analytics (15 min)

#### Test 10.1 : Accès
- [ ] Accéder `/agency/analytics`
- [ ] **Vérifier permissions :**
  - [ ] AGENCY_MANAGER → ✅ Accès autorisé
  - [ ] AGENT → ❌ Accès refusé (ou masqué)

#### Test 10.2 : KPIs
- [ ] KPIs affichés
- [ ] Graphiques affichés
- [ ] Filtrage par période fonctionnel

---

## 📝 Rapport de Test

### Format

```markdown
# Rapport de Test - Frontend Agency
**Date :** [DATE]
**Pilote :** [NOM]
**Navigateur :** [Chrome/Firefox/etc.]

## Résumé
- Tests réussis : X/Y
- Tests échoués : X/Y
- Bugs trouvés : X

## Détails
### Phase 5 : Création Réservation
- ✅ Test 5.1 : Accès formulaire
- ❌ Test 5.3 : Caution (détails...)

## Bugs
1. [Description bug] - [Sévérité] - [Page/Composant]
2. ...

## Suggestions UX
1. [Suggestion]
2. ...
```

---

## 🐛 Bugs à Reporter

Pour chaque bug, inclure :
- **Page/URL** : Où le bug se produit
- **Actions** : Étapes pour reproduire
- **Comportement attendu** : Ce qui devrait se passer
- **Comportement obtenu** : Ce qui s'est passé
- **Screenshots** : Captures d'écran
- **Console errors** : Erreurs dans DevTools
- **Sévérité** : Critique, Majeur, Mineur

---

## ✅ Critères de Succès

- ✅ Toutes les pages accessibles
- ✅ Tous les formulaires fonctionnent
- ✅ Validations frontend correctes
- ✅ Intégration backend fonctionnelle
- ✅ UX fluide et intuitive
- ✅ Messages d'erreur clairs
- ✅ Performance acceptable (< 3s chargement)

---

**Bon test ! 🚀**


