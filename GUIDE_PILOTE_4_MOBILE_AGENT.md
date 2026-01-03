# 🧪 Guide Pilote 4 - Mobile Agent

**Pilote :** Agent Terrain / QA Mobile  
**Application :** React Native (Expo)  
**Durée estimée :** 4-6 heures

---

## 🎯 Objectif

Tester exhaustivement l'application mobile, check-in/check-out, mode offline, et persistance des données.

---

## 🚀 Préparation

### 1. Démarrer le Backend

```bash
cd backend
npm run dev
```

Vérifier que le serveur démarre sur `http://localhost:3000`

### 2. Démarrer l'Application Mobile

```bash
cd mobile-agent
npm install
npm start
```

### 3. Plateforme

- **iOS** : Scanner QR code avec Camera app
- **Android** : Scanner QR code avec Expo Go app
- **Émulateur** : `npm run ios` ou `npm run android`

### 4. Compte de Test

```
AGENT: agent1@autolocation.fr / agent123
AGENCY_MANAGER: manager1@autolocation.fr / manager123
```

---

## 📋 Checklist de Tests

### Phase 1 : Authentification (15 min)

#### Test 1.1 : Connexion
- [ ] Ouvrir application
- [ ] Se connecter avec AGENT → ✅ Accès missions
- [ ] Se connecter avec AGENCY_MANAGER → ✅ Accès missions + création
- [ ] Mauvais mot de passe → ❌ Message d'erreur
- [ ] Déconnexion → ✅ Retour login

---

### Phase 2 : Multi-langue (15 min)

#### Test 2.1 : Sélection Langue
- [ ] Accéder paramètres
- [ ] Changer langue (FR → EN → Darija)
- [ ] Vérifier traductions complètes
- [ ] Vérifier interface mise à jour

---

### Phase 3 : Liste Missions (30 min)

#### Test 3.1 : Affichage
- [ ] Liste missions affichée
- [ ] **Sections :**
  - [ ] "À venir" affichée
  - [ ] "En cours" affichée
  - [ ] "Terminées" affichée
- [ ] Badge "Terminée" sur missions complétées
- [ ] Filtrage par section fonctionnel

#### Test 3.2 : Navigation
- [ ] Clic sur mission → Détails affichés
- [ ] Bouton "DÉMARRER LA MISSION" pour missions actives
- [ ] Bouton "Voir les détails" pour missions terminées

---

### Phase 4 : Check-In - SCÉNARIO COMPLET (90 min)

#### Test 4.1 : Accès
- [ ] Sélectionner mission PENDING/CONFIRMED
- [ ] Cliquer "DÉMARRER LA MISSION"
- [ ] Écran check-in affiché

#### Test 4.2 : Pré-remplissage
- [ ] **Vérifier données pré-remplies :**
  - [ ] Permis client (si disponible dans réservation)
  - [ ] Pièce identité (si disponible dans réservation)
- [ ] **Vérifier affichage caution :**
  - [ ] Montant affiché en lecture seule
  - [ ] Type affiché en lecture seule
  - [ ] Statut collection sélectionnable (PENDING/COLLECTED)

#### Test 4.3 : Données Véhicule AVANT
- [ ] Saisir kilométrage départ (ex: 50000)
- [ ] Sélectionner niveau carburant (FULL)
- [ ] **Prendre photos avant :**
  - [ ] Photo 1 (avant)
  - [ ] Photo 2 (arrière)
  - [ ] Photo 3 (côté gauche)
  - [ ] Photo 4 (côté droit)
  - [ ] Vérifier minimum 4 photos requis
- [ ] Notes optionnelles (ex: "Véhicule propre")

#### Test 4.4 : Dommages Existants
- [ ] Ajouter dommage :
  - [ ] Zone (ex: "Pare-chocs avant")
  - [ ] Type (ex: "Rayure")
  - [ ] Sévérité (ex: "Mineur")
  - [ ] Description
  - [ ] Photo(s)
- [ ] Vérifier dommage ajouté

#### Test 4.5 : Documents Client
- [ ] **Photo permis :**
  - [ ] Prendre photo (obligatoire)
  - [ ] Vérifier affichage
- [ ] **Date expiration permis :**
  - [ ] Sélectionner date (obligatoire)
  - [ ] Vérifier validation > aujourd'hui
- [ ] **Pièce identité :**
  - [ ] Prendre photo (optionnelle)
  - [ ] Vérifier affichage

#### Test 4.6 : Caution
- [ ] **Si caution requise :**
  - [ ] Vérifier montant affiché (lecture seule)
  - [ ] Vérifier type affiché (lecture seule)
  - [ ] Sélectionner statut collection :
    - [ ] PENDING → Vérifier avertissement affiché
    - [ ] COLLECTED → Aucun avertissement
- [ ] **Si caution non requise :**
  - [ ] Vérifier section masquée ou désactivée

#### Test 4.7 : Signature Client
- [ ] Capturer signature (obligatoire)
- [ ] Vérifier affichage signature
- [ ] Vérifier date/heure automatique

#### Test 4.8 : Persistance
- [ ] **Quitter écran** (bouton retour)
- [ ] **Revenir sur écran check-in**
- [ ] **Vérifier données sauvegardées :**
  - [ ] Kilométrage
  - [ ] Niveau carburant
  - [ ] Photos
  - [ ] Notes
  - [ ] Dommages
  - [ ] Documents
  - [ ] Signature

#### Test 4.9 : Soumission
- [ ] Remplir formulaire complet valide
- [ ] Soumettre → ✅ Succès
- [ ] Vérifier message de confirmation
- [ ] Vérifier redirection liste missions
- [ ] Vérifier statut mission → ACTIVE

---

### Phase 5 : Check-In - VALIDATIONS (30 min)

#### Test 5.1 : Permis
- [ ] Permis expiré → ❌ Blocage + message clair
- [ ] Permis expirant aujourd'hui → ❌ Blocage + message clair
- [ ] Pas de photo permis → ❌ Erreur

#### Test 5.2 : Caution
- [ ] Caution requise mais PENDING → ❌ Blocage + message clair
- [ ] Caution requise et COLLECTED → ✅ Autorisation

#### Test 5.3 : Photos
- [ ] Moins de 4 photos avant → ❌ Erreur "Minimum 4 photos requis"

#### Test 5.4 : Signature
- [ ] Pas de signature → ❌ Erreur "Signature obligatoire"

---

### Phase 6 : Check-Out - SCÉNARIO COMPLET (90 min)

#### Test 6.1 : Accès
- [ ] Sélectionner mission ACTIVE
- [ ] Cliquer "TERMINER LA MISSION"
- [ ] Écran check-out affiché

#### Test 6.2 : Données Véhicule APRÈS
- [ ] Saisir kilométrage retour (≥ départ, ex: 50100)
- [ ] Sélectionner niveau carburant
- [ ] **Prendre photos après :**
  - [ ] Photo 1 (avant)
  - [ ] Photo 2 (arrière)
  - [ ] Photo 3 (côté gauche)
  - [ ] Photo 4 (côté droit)
  - [ ] Vérifier minimum 4 photos requis
- [ ] Notes optionnelles

#### Test 6.3 : Nouveaux Dommages
- [ ] Ajouter dommage si nécessaire
- [ ] Vérifier dommage ajouté

#### Test 6.4 : Frais
- [ ] **Vérifier frais de retard :**
  - [ ] Calculés automatiquement
  - [ ] Affichés clairement
  - [ ] Montant correct selon retard
- [ ] Frais supplémentaires optionnels

#### Test 6.5 : Signature Restitution
- [ ] Capturer signature (obligatoire)
- [ ] Vérifier affichage signature
- [ ] Vérifier date/heure automatique

#### Test 6.6 : Persistance
- [ ] **Quitter écran** (bouton retour)
- [ ] **Revenir sur écran check-out**
- [ ] **Vérifier données sauvegardées :**
  - [ ] Kilométrage
  - [ ] Niveau carburant
  - [ ] Photos
  - [ ] Notes
  - [ ] Dommages
  - [ ] Frais
  - [ ] Signature

#### Test 6.7 : Soumission
- [ ] Remplir formulaire complet valide
- [ ] Soumettre → ✅ Succès
- [ ] Vérifier message de confirmation
- [ ] Vérifier redirection liste missions
- [ ] Vérifier statut mission → COMPLETED
- [ ] Vérifier frais de retard affichés

---

### Phase 7 : Check-Out - VALIDATIONS (30 min)

#### Test 7.1 : Kilométrage
- [ ] Kilométrage retour < départ → ❌ Erreur "Kilométrage invalide"

#### Test 7.2 : Photos
- [ ] Moins de 4 photos après → ❌ Erreur "Minimum 4 photos requis"

#### Test 7.3 : Signature
- [ ] Pas de signature restitution → ❌ Erreur "Signature obligatoire"

---

### Phase 8 : Mode Offline (60 min)

#### Test 8.1 : Préparation
- [ ] Remplir formulaire check-in (sans soumettre)
- [ ] Désactiver WiFi/Données
- [ ] Vérifier message "Mode offline"

#### Test 8.2 : Consultation
- [ ] Consulter missions déjà chargées → ✅ Accessible
- [ ] Vérifier données affichées

#### Test 8.3 : Formulaire
- [ ] Remplir formulaire check-in en offline
- [ ] Vérifier message "En attente de synchronisation"
- [ ] Vérifier compteur actions en attente (ex: "2 En attente")

#### Test 8.4 : Synchronisation
- [ ] Réactiver WiFi/Données
- [ ] Vérifier synchronisation automatique
- [ ] Vérifier message "Synchronisation réussie"
- [ ] Vérifier compteur mis à jour

---

### Phase 9 : Consultation Missions Terminées (30 min)

#### Test 9.1 : Accès
- [ ] Accéder section "Terminées"
- [ ] Liste missions terminées affichée
- [ ] Badge "Terminée" visible

#### Test 9.2 : Détails
- [ ] Clic sur mission terminée
- [ ] Détails complets affichés
- [ ] Vérifier informations :
  - [ ] Données check-in
  - [ ] Données check-out
  - [ ] Frais de retard
  - [ ] Photos
  - [ ] Signatures

#### Test 9.3 : Modification
- [ ] Vérifier pas de bouton "Modifier"
- [ ] Vérifier consultation seule

---

### Phase 10 : Création Booking (AGENCY_MANAGER uniquement) (30 min)

#### Test 10.1 : Accès
- [ ] Se connecter en AGENCY_MANAGER
- [ ] Vérifier bouton "Nouvelle réservation" visible
- [ ] Se connecter en AGENT
- [ ] Vérifier bouton masqué

#### Test 10.2 : Création
- [ ] Cliquer "Nouvelle réservation"
- [ ] Sélectionner client
- [ ] Sélectionner véhicule
- [ ] Définir dates
- [ ] Soumettre → ✅ Succès

---

## 📝 Rapport de Test

### Format

```markdown
# Rapport de Test - Mobile Agent
**Date :** [DATE]
**Pilote :** [NOM]
**Plateforme :** [iOS/Android/Émulateur]
**Version OS :** [Version]

## Résumé
- Tests réussis : X/Y
- Tests échoués : X/Y
- Bugs trouvés : X

## Détails
### Phase 4 : Check-In
- ✅ Test 4.1 : Accès
- ❌ Test 4.8 : Persistance (détails...)

## Bugs
1. [Description bug] - [Sévérité] - [Écran]
2. ...

## Suggestions UX
1. [Suggestion]
2. ...
```

---

## 🐛 Bugs à Reporter

Pour chaque bug, inclure :
- **Écran** : Où le bug se produit
- **Actions** : Étapes pour reproduire
- **Comportement attendu** : Ce qui devrait se passer
- **Comportement obtenu** : Ce qui s'est passé
- **Screenshots** : Captures d'écran
- **Logs** : Erreurs console (si disponible)
- **Plateforme** : iOS/Android/Émulateur
- **Sévérité** : Critique, Majeur, Mineur

---

## ✅ Critères de Succès

- ✅ Toutes les fonctionnalités accessibles
- ✅ Check-in/check-out complets
- ✅ Persistance données fonctionnelle
- ✅ Mode offline robuste
- ✅ Validations correctes
- ✅ UX fluide et intuitive
- ✅ Performance acceptable

---

**Bon test ! 🚀**


