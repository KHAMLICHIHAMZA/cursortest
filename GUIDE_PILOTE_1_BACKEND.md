# 🧪 Guide Pilote 1 - Backend API

**Pilote :** Développeur Backend / QA Backend  
**Application :** API REST NestJS  
**Durée estimée :** 4-6 heures

---

## 🎯 Objectif

Tester exhaustivement tous les endpoints API, validations backend, et règles métier implémentées.

---

## 🚀 Préparation

### 1. Démarrer le Backend

```bash
cd backend
npm install
npm run dev
```

Vérifier que le serveur démarre sur `http://localhost:3000`

### 2. Outils Nécessaires

- **Postman** (recommandé) ou **Insomnia**
- **Swagger UI** : `http://localhost:3000/api/docs`
- **cURL** (optionnel, pour scripts)

### 3. Comptes de Test

```
SUPER_ADMIN: admin@malocauto.com / admin123
COMPANY_ADMIN: admin@autolocation.fr / admin123
AGENCY_MANAGER: manager1@autolocation.fr / manager123
AGENT: agent1@autolocation.fr / agent123
```

---

## 📋 Checklist de Tests

### Phase 1 : Authentification (30 min)

#### Test 1.1 : Connexion
- [ ] `POST /api/v1/auth/login` avec SUPER_ADMIN → ✅ Token reçu
- [ ] `POST /api/v1/auth/login` avec COMPANY_ADMIN → ✅ Token reçu
- [ ] `POST /api/v1/auth/login` avec AGENCY_MANAGER → ✅ Token reçu
- [ ] `POST /api/v1/auth/login` avec AGENT → ✅ Token reçu
- [ ] `POST /api/v1/auth/login` avec mauvais mot de passe → ❌ 401

#### Test 1.2 : Refresh Token
- [ ] `POST /api/v1/auth/refresh` avec refresh token valide → ✅ Nouveau token
- [ ] `POST /api/v1/auth/refresh` avec token expiré → ❌ 401

#### Test 1.3 : Utilisateur Actuel
- [ ] `GET /api/v1/auth/me` avec token valide → ✅ Données utilisateur
- [ ] `GET /api/v1/auth/me` sans token → ❌ 401

---

### Phase 2 : Règle R1.3 - Validation Permis (45 min)

#### Prérequis
Créer un client avec permis expiré :
```json
POST /api/v1/clients
{
  "name": "Client Test Permis Expiré",
  "licenseNumber": "TEST123",
  "licenseExpiryDate": "2024-01-01",  // Date passée
  ...
}
```

#### Test 2.1 : Création Réservation
- [ ] Créer réservation avec client permis valide → ✅ Succès
- [ ] Créer réservation avec client permis expiré → ❌ 400 "Permis expiré"
- [ ] Créer réservation avec permis expirant avant fin → ❌ 400 "Permis expire avant fin"
- [ ] Vérifier audit log créé pour chaque blocage

#### Test 2.2 : Check-In
- [ ] Check-in avec permis valide → ✅ Succès
- [ ] Check-in avec permis expiré → ❌ 400 "Permis expiré"
- [ ] Check-in avec permis expirant aujourd'hui → ❌ 400 "Permis expire aujourd'hui"
- [ ] Vérifier audit log créé

---

### Phase 3 : Règle R2.2 - Temps de Préparation (45 min)

#### Test 3.1 : Validation Chevauchement
- [ ] Créer réservation chevauchant période préparation → ❌ 400 "Conflit avec préparation"
- [ ] Modifier réservation chevauchant période préparation → ❌ 400 "Conflit avec préparation"

#### Test 3.2 : Création Période Préparation
- [ ] Check-out à l'heure → Vérifier période préparation créée (durée normale)
- [ ] Check-out en retard → Vérifier période préparation créée (durée doublée)
- [ ] Vérifier `computedEndWithPreparation` calculé

---

### Phase 4 : Règle R3 - Caution (45 min)

#### Test 4.1 : Création Réservation
- [ ] Créer réservation avec `depositRequired=true`, `depositAmount=500`, `depositDecisionSource=AGENCY` → ✅ Succès
- [ ] Créer réservation avec `depositRequired=true` mais sans `depositAmount` → ❌ 400
- [ ] Créer réservation avec `depositRequired=true` mais sans `depositDecisionSource` → ❌ 400
- [ ] Créer réservation avec `depositRequired=false` → ✅ Succès (champs optionnels)

#### Test 4.2 : Check-In
- [ ] Check-in avec `depositRequired=true` et `depositStatusCheckIn=COLLECTED` → ✅ Succès
- [ ] Check-in avec `depositRequired=true` et `depositStatusCheckIn=PENDING` → ❌ 400 "Caution non collectée"
- [ ] Vérifier audit log créé pour blocage

---

### Phase 5 : Règle R4 - Frais de Retard (60 min)

#### Test 5.1 : Calcul Automatique
- [ ] Check-out à l'heure → `lateFeeAmount = 0`
- [ ] Check-out avec retard 30min → `lateFeeAmount = 25%` du tarif journalier
- [ ] Check-out avec retard 1h30 → `lateFeeAmount = 50%` du tarif journalier
- [ ] Check-out avec retard 5h → `lateFeeAmount = 100%` du tarif journalier
- [ ] Vérifier `lateFeeCalculatedAt` renseigné

#### Test 5.2 : Override Frais
- [ ] `PATCH /api/v1/bookings/:id/late-fee` avec justification valide (≥ 10 caractères) → ✅ Succès
- [ ] `PATCH /api/v1/bookings/:id/late-fee` sans justification → ❌ 400
- [ ] `PATCH /api/v1/bookings/:id/late-fee` avec justification < 10 caractères → ❌ 400
- [ ] Vérifier `lateFeeOverride=true`, `lateFeeOverrideJustification`, `lateFeeOverrideBy`, `lateFeeOverrideAt`
- [ ] Vérifier audit log créé

---

### Phase 6 : Règle R5 - Dommages & Litiges (45 min)

#### Test 6.1 : Création Incident
- [ ] Créer incident avec montant < 50% caution → Statut `REPORTED`
- [ ] Créer incident avec montant > 50% caution → Statut `DISPUTED` automatique
- [ ] Vérifier `financialClosureBlocked = true` si DISPUTED

#### Test 6.2 : Clôture Financière
- [ ] `POST /api/v1/bookings/:id/financial-closure` avec incident DISPUTED → ❌ 400 "Clôture bloquée"
- [ ] `POST /api/v1/bookings/:id/financial-closure` avec `depositStatusFinal=DISPUTED` → ❌ 400
- [ ] `POST /api/v1/bookings/:id/financial-closure` avec montant collecté > caution → ❌ 400
- [ ] Résoudre incident DISPUTED → Vérifier déblocage

---

### Phase 7 : Règle R6 - Facturation (30 min)

#### Test 7.1 : Génération Automatique
- [ ] Check-out sans litige → Vérifier facture générée automatiquement
- [ ] Vérifier numérotation incrémentale (format: `AGENCY-000001`)
- [ ] Vérifier `totalAmount = totalPrice + lateFeeAmount`

#### Test 7.2 : Endpoints Factures
- [ ] `GET /api/v1/invoices` → Liste factures
- [ ] `GET /api/v1/invoices/:id` → Détails facture
- [ ] `PATCH /api/v1/invoices/:id/status` → Mettre à jour statut

---

### Phase 8 : Permissions & RBAC (30 min)

#### Test 8.1 : Accès par Rôle
- [ ] SUPER_ADMIN peut accéder à toutes les companies
- [ ] COMPANY_ADMIN accès limité à sa company
- [ ] AGENCY_MANAGER accès limité à ses agences
- [ ] AGENT accès limité à ses agences

#### Test 8.2 : Actions Spécifiques
- [ ] Override frais : Seul AGENCY_MANAGER peut
- [ ] Clôture financière : Permissions appropriées

---

### Phase 9 : Audit & Logging (30 min)

#### Test 9.1 : Audit Logs
- [ ] Vérifier logs pour chaque validation bloquante
- [ ] Vérifier logs pour override frais
- [ ] Vérifier logs pour clôture financière
- [ ] `GET /api/v1/audit/logs` → Consulter logs

#### Test 9.2 : Business Event Logs
- [ ] Vérifier `BusinessEventLog` pour événements métier
- [ ] Vérifier `previousState` et `newState` en JSON

---

## 📝 Rapport de Test

### Format

```markdown
# Rapport de Test - Backend API
**Date :** [DATE]
**Pilote :** [NOM]

## Résumé
- Tests réussis : X/Y
- Tests échoués : X/Y
- Bugs trouvés : X

## Détails
### Phase 1 : Authentification
- ✅ Test 1.1 : Connexion
- ❌ Test 1.2 : Refresh Token (détails...)

## Bugs
1. [Description bug] - [Sévérité] - [Endpoint]
2. ...

## Suggestions
1. [Suggestion]
2. ...
```

---

## 🐛 Bugs à Reporter

Pour chaque bug, inclure :
- **Endpoint** : URL complète
- **Méthode** : GET, POST, etc.
- **Payload** : JSON envoyé
- **Réponse attendue** : Ce qui devrait se passer
- **Réponse obtenue** : Ce qui s'est passé
- **Sévérité** : Critique, Majeur, Mineur
- **Screenshots/Logs** : Si disponibles

---

## ✅ Critères de Succès

- ✅ Tous les endpoints fonctionnent
- ✅ Toutes les validations backend fonctionnent
- ✅ Toutes les règles métier sont respectées
- ✅ Audit logs complets
- ✅ Permissions RBAC respectées
- ✅ Performance acceptable (< 2s par requête)

---

**Bon test ! 🚀**


