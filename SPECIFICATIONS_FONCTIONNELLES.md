# 📋 Spécifications Fonctionnelles et Architecturales - MALOC SaaS

## 🎯 Document de Référence

**Ce document fait foi fonctionnellement et architecturalement pour toutes les évolutions du SaaS MALOC.**

**Date de création** : 2024  
**Version** : 1.0.0  
**Statut** : Phase de développement FINAL (pas MVP)

---

## 📖 Table des Matières

1. [Contexte Général](#contexte-général)
2. [Règles Fondamentales (Non Négociables)](#règles-fondamentales-non-négociables)
3. [Back-office Agence](#back-office-agence)
4. [Application Mobile Agent](#application-mobile-agent)
5. [Évolutions Futures](#évolutions-futures)
6. [Matrice des Responsabilités](#matrice-des-responsabilités)
7. [Glossaire et Définitions](#glossaire-et-définitions)

---

## 🌍 Contexte Général

### Vue d'Ensemble

**MALOC** est un SaaS de location de véhicules multi-agences pour le marché marocain.

### Phase de Développement

- **Statut actuel** : Phase de développement **FINAL** (pas MVP)
- **Validation** : Le noyau métier a été validé par :
  - ✅ CTO
  - ✅ DSI
  - ✅ MOA
  - ✅ Tech Lead

### Applications Existantes

1. **Back-office Agence** (Web)
   - Gestion des locations, véhicules, clients
   - Module Charges
   - Module Amendes
   - Planning global des véhicules

2. **Application Mobile Agent** (Expo / React Native)
   - Exécution terrain (check-in / check-out)
   - Planning des tâches agents
   - Mode offline complet

### Applications Prévues

3. **Application Client** (Web + Mobile) - **Moyen terme**
   - Consultation contrats
   - Consultation amendes
   - Réservations

---

## ⚖️ Règles Fondamentales (Non Négociables)

### 1. MALOC est la SOURCE DE VÉRITÉ

- Toutes les données métier sont centralisées dans MALOC
- Aucune duplication de données entre applications
- Le backend est l'unique source de vérité

### 2. La LOCATION est le PIVOT Central du Système

- Toute action métier est liée à une location
- Les contrats, occupations véhicules, actions terrain sont dérivés de la location
- La location génère automatiquement les entités associées

### 3. Aucune Duplication de Données

- **Client** : Stocké une seule fois, référencé partout
- **Contrat** : 1 location = 1 contrat, généré automatiquement
- **Véhicule** : Données centralisées, pas de duplication

### 4. Aucune Logique Métier Lourde Côté Mobile

- Le mobile est un **outil d'exécution terrain**
- Toute logique métier complexe est dans le backend
- Le mobile fait des appels API et affiche les résultats

### 5. Aucun Automatisme Bloquant

- **Alertes uniquement** (informatives)
- Aucun blocage automatique de processus
- L'utilisateur garde le contrôle

### 6. Backward Compatibility

- Toute évolution doit rester compatible avec les versions précédentes
- Pas de breaking changes sans migration planifiée
- Versioning API : `/api/v1`, `/api/v2`, etc.

### 7. Séparation Stricte des Responsabilités

- Chaque application a un périmètre clair et défini
- Pas de chevauchement de fonctionnalités
- Communication via API uniquement

### 8. Modules CHARGES et AMENDES Distincts

- **Charges** : Rattachées au véhicule, gestion agence
- **Amendes** : Module séparé, intermédiaire administratif
- Aucune confusion entre les deux

### 9. Compatibilité Future App Client

- Toute évolution doit prendre en compte la future app client
- Pas de décision qui bloquerait l'intégration client
- Architecture extensible

---

## 🖥️ Back-office Agence

### Planning

#### Vue Planning

Le back-office affiche **UNIQUEMENT** le planning **GLOBAL DES VOITURES**.

#### États Possibles

Un véhicule peut être dans l'un des états suivants :

- ✅ **disponible** : Véhicule disponible pour location
- 📅 **réservé** : Véhicule réservé (location CONFIRMED)
- 🚗 **loué** : Véhicule en location active (location ACTIVE)
- 🚚 **en livraison** : Véhicule en cours de livraison (check-in en cours)
- 🔄 **en récupération** : Véhicule en cours de récupération (check-out en cours)
- 🔧 **en maintenance** : Véhicule en maintenance (hors location)

#### Limitations

- ❌ Le back-office **ne gère PAS** le planning détaillé des tâches agents
- ❌ Le back-office **ne voit PAS** les tâches individuelles des agents
- ✅ Le back-office voit uniquement l'état global de chaque véhicule

### Location

#### Création

Une location :

1. **Est créée AVANT toute action terrain**
   - La location peut être créée depuis :
     - Back-office
     - Téléphone / WhatsApp (saisie manuelle)
     - Future app client (réservation en ligne)

2. **Génère automatiquement** :
   - ✅ Un **contrat** (1 location = 1 contrat)
   - ✅ Une **occupation véhicule** (planning)
   - ✅ Des **actions terrain** (check-in / check-out)

#### Sources de Création

- **Back-office** : Saisie manuelle par manager/gérant
- **Téléphone / WhatsApp** : Saisie manuelle après contact client
- **Future app client** : Réservation en ligne (à venir)

### Contrat

#### Génération

- **1 location = 1 contrat**
- Contrat généré **automatiquement** à la création de la location
- Pas de création manuelle de contrat

#### Signature

**Deux modes de signature** :

1. **Immédiate en agence**
   - Client présent en agence
   - Signature immédiate lors de la création location
   - Contrat signé avant check-in

2. **Différée lors de la livraison terrain**
   - Client absent en agence
   - Signature lors du check-in terrain
   - Contrat signé par l'agent mobile

#### Traçabilité

- Signature **horodatée**
- Signature **traçable** (qui, quand, où)
- Stockage signature (base64 ou fichier)

### Véhicule

#### Alertes Âge Véhicule

**Alertes informatives uniquement** (non bloquantes) :

- ⚠️ **6 mois avant 5 ans** : Alerte préventive
- ⚠️ **À 5 ans exact** : Alerte d'atteinte de l'âge limite

**Comportement** :
- Affichage alerte dans le back-office
- Notification (si système de notifications)
- **Aucun blocage** de processus

### Charges

#### Module Central

Le module **CHARGES** est rattaché **AU VÉHICULE**.

#### Types de Charges

1. **Assurance** (annuelle)
2. **Vignette / Dariba** (annuelle)
3. **Mensualité bancaire** (mensuelle)
4. **Maintenance préventive / corrective**
5. **Charges exceptionnelles** (hors amendes)

#### Caractéristiques

- ✅ **Aucune donnée client** : Les charges sont liées au véhicule uniquement
- ✅ **Accès** : Manager / Gérant uniquement
- ✅ **Alertes informatives uniquement** : Pas de blocage

#### Exemples

- Assurance à renouveler dans 30 jours → Alerte
- Vignette expirée → Alerte
- Mensualité bancaire due → Alerte

### Amendes

#### Module Distinct

Le module est nommé strictement : **AMENDES**.

**Important** : Les amendes **ne sont PAS des charges agence**.

#### Rôle de l'Agence

L'agence est **intermédiaire administratif** pour les amendes :
- L'agence reçoit l'amende (véhicule immatriculé à son nom)
- L'agence identifie le client responsable
- L'agence transmet l'amende au client
- Le client paie directement l'administration

#### Saisie Minimale

À partir de ces **3 données minimales** :

1. **Date d'infraction**
2. **Numéro d'immatriculation**
3. **Référence amende**

#### Traitement Automatique

Le système doit **automatiquement** :

1. **Identifier le véhicule** (via numéro d'immatriculation)
2. **Retrouver la location active** à la date d'infraction
3. **Remonter automatiquement** :
   - ✅ Le **client principal** (titulaire de la location)
   - ✅ Le **conducteur secondaire** (si existant)

#### Aucune Duplication

- ❌ Aucune donnée client dupliquée
- ✅ Utilisation des données client existantes
- ✅ Référencement uniquement

#### Statuts

Une amende passe par les statuts suivants :

1. **reçue** : Amende reçue par l'agence
2. **client identifié** : Client responsable identifié automatiquement
3. **transmise** : Amende transmise au client
4. **contestée** : Client conteste l'amende
5. **clôturée** : Amende traitée (payée ou annulée)

#### Accès

- ✅ **Manager / Gérant** uniquement
- ❌ Agents n'ont pas accès aux amendes

---

## 📱 Application Mobile Agent

### Positionnement

L'application Agent est un **outil d'EXÉCUTION TERRAIN**.

**Important** : Elle n'est **PAS** un outil de pilotage.

### Planning Agent

#### Vue Planning

Le planning des tâches agents vit **UNIQUEMENT** dans l'app Agent.

#### Dérivation

- Le planning est **dérivé** des réservations existantes
- **Aucune entité Task persistée en base**
- Le planning est calculé à la volée depuis les bookings

#### Logique des Tâches (Dérivée)

Les tâches sont dérivées automatiquement des statuts de booking :

| Statut Booking | Tâche Générée | Description |
|----------------|---------------|-------------|
| `CONFIRMED` | **Livraison / Check-in** | Tâche de livraison véhicule au client |
| `ACTIVE` | **Récupération / Check-out** | Tâche de récupération véhicule du client |
| `COMPLETED` | ❌ Aucune tâche | Location terminée |
| `CANCELLED` | ❌ Aucune tâche | Location annulée |

#### Calcul des Tâches

```typescript
// Pseudo-code logique
function getAgentTasks(bookings: Booking[]): Task[] {
  return bookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'ACTIVE')
    .map(b => ({
      type: b.status === 'CONFIRMED' ? 'CHECK_IN' : 'CHECK_OUT',
      bookingId: b.id,
      vehicle: b.vehicle,
      client: b.client,
      date: b.status === 'CONFIRMED' ? b.startDate : b.endDate,
      location: b.pickupLocation || b.returnLocation,
    }));
}
```

### Vue Agent

#### Ce que l'Agent VOIT

L'agent voit **UNIQUEMENT** :

- ✅ **Ses tâches** (dérivées des bookings)
- ✅ **Ordonnées par date / heure**
- ✅ **Informations nécessaires à l'exécution** :
  - Véhicule (marque, modèle, immatriculation)
  - Lieu (adresse de livraison/récupération)
  - Client (nom, téléphone, infos minimales)

#### Ce que l'Agent PEUT FAIRE

L'agent peut :

- ✅ **Exécuter** une tâche (check-in / check-out)
- ✅ **Confirmer** une action
- ✅ **Prendre photos** (véhicule, documents)
- ✅ **Faire signer** (contrat, restitution)

#### Ce que l'Agent NE VOIT PAS

L'agent **NE VOIT PAS** :

- ❌ Charges (module véhicule)
- ❌ Amendes (module séparé)
- ❌ Flotte globale
- ❌ Autres agents
- ❌ Planning global des véhicules
- ❌ Données financières

### Offline

#### Fonctionnement Offline

Le fonctionnement offline existant est **CONSERVÉ**.

#### Aucune Régression Tolérée

Les fonctionnalités offline suivantes **DOIVENT** fonctionner :

- ✅ **Check-in** complet offline
- ✅ **Check-out** complet offline
- ✅ **Signatures** (stockage local)
- ✅ **Photos** (stockage local)
- ✅ **Formulaires** (saisie complète offline)

#### Synchronisation

- Actions mises en queue SQLite locale
- Synchronisation automatique quand connexion disponible
- Upload fichiers différé
- Indicateur visuel "En attente de synchronisation"

---

## 🚀 Évolutions Futures

### Contraintes

Toutes les futures tâches devront rester dans ce cadre :

- ✅ Notifications push (Agent / Client)
- ✅ App Client (consultation contrats, amendes)
- ✅ Exploitation avancée des charges (rentabilité véhicule)
- ✅ Optimisations UX / performance
- ✅ Sécurité, RGPD, audit, logs

### Interdictions

Aucune évolution ne doit :

- ❌ Remettre en cause la structure actuelle
- ❌ Créer de redondance
- ❌ Déplacer la logique métier hors du backend
- ❌ Dupliquer des données
- ❌ Créer des automatismes bloquants
- ❌ Casser la backward compatibility

### Exemples d'Évolutions Conformes

#### ✅ Notifications Push

- Backend envoie notifications
- Mobile reçoit et affiche
- Pas de logique métier dans la notification

#### ✅ App Client

- Consultation uniquement (read-only)
- Pas de création/modification côté client
- Utilise les mêmes APIs que le back-office

#### ✅ Rentabilité Véhicule

- Calcul backend uniquement
- Affichage dans back-office
- Pas de calcul côté mobile

---

## 📊 Matrice des Responsabilités

### Back-office Agence

| Fonctionnalité | Responsabilité | Accès |
|----------------|---------------|-------|
| Planning global véhicules | ✅ Gestion | Manager, Gérant |
| Création location | ✅ Gestion | Manager, Gérant |
| Consultation locations | ✅ Lecture | Manager, Gérant, Agent |
| Module Charges | ✅ Gestion | Manager, Gérant |
| Module Amendes | ✅ Gestion | Manager, Gérant |
| Gestion véhicules | ✅ Gestion | Manager, Gérant |
| Gestion clients | ✅ Gestion | Manager, Gérant |
| Tâches agents | ❌ Pas d'accès | - |

### Application Mobile Agent

| Fonctionnalité | Responsabilité | Accès |
|----------------|---------------|-------|
| Planning tâches agents | ✅ Consultation | Agent |
| Exécution check-in | ✅ Gestion | Agent |
| Exécution check-out | ✅ Gestion | Agent |
| Prise photos | ✅ Gestion | Agent |
| Signatures | ✅ Gestion | Agent |
| Consultation bookings | ✅ Lecture | Agent |
| Création booking | ⚠️ Conditionnel | Agent (si MANAGER) |
| Charges | ❌ Pas d'accès | - |
| Amendes | ❌ Pas d'accès | - |
| Flotte globale | ❌ Pas d'accès | - |

### Backend (API)

| Fonctionnalité | Responsabilité |
|----------------|---------------|
| Source de vérité | ✅ Unique source |
| Logique métier | ✅ Toute la logique |
| Génération automatique | ✅ Contrats, occupations |
| Traitement amendes | ✅ Identification automatique |
| Calcul tâches | ✅ Dérivation depuis bookings |
| Validation | ✅ Toutes les validations |
| Sécurité | ✅ Authentification, autorisation |

---

## 📚 Glossaire et Définitions

### Location (Booking)

**Définition** : Une location est l'entité centrale qui représente la réservation d'un véhicule par un client pour une période donnée.

**Caractéristiques** :
- Génère automatiquement un contrat
- Génère automatiquement une occupation véhicule
- Génère automatiquement des actions terrain (check-in/check-out)

**Statuts** :
- `PENDING` : En attente de confirmation
- `CONFIRMED` : Confirmée, prête pour check-in
- `ACTIVE` : En cours (véhicule loué)
- `COMPLETED` : Terminée (véhicule rendu)
- `CANCELLED` : Annulée

### Contrat

**Définition** : Document contractuel généré automatiquement à la création d'une location.

**Caractéristiques** :
- 1 location = 1 contrat
- Signature horodatée et traçable
- Signature immédiate (agence) ou différée (terrain)

### Tâche Agent

**Définition** : Tâche dérivée d'une location, visible uniquement dans l'app Agent.

**Caractéristiques** :
- **Non persistée** en base de données
- Calculée à la volée depuis les bookings
- Types : "Livraison / Check-in" ou "Récupération / Check-out"

### Charges

**Définition** : Module de gestion des charges liées aux véhicules.

**Caractéristiques** :
- Rattaché au véhicule (pas au client)
- Types : assurance, vignette, mensualité bancaire, maintenance, charges exceptionnelles
- Accès : Manager / Gérant uniquement

### Amendes

**Définition** : Module de gestion des amendes reçues par l'agence.

**Caractéristiques** :
- Module distinct des charges
- Agence = intermédiaire administratif
- Identification automatique du client responsable
- Accès : Manager / Gérant uniquement

### Planning Global Véhicules

**Définition** : Vue d'ensemble de l'état de tous les véhicules de l'agence.

**Caractéristiques** :
- Affiché uniquement dans le back-office
- États : disponible, réservé, loué, en livraison, en récupération, en maintenance
- Ne contient pas les tâches détaillées des agents

### Planning Tâches Agents

**Définition** : Vue des tâches d'un agent, dérivée des locations.

**Caractéristiques** :
- Affiché uniquement dans l'app Agent
- Calculé à la volée
- Ordonné par date/heure
- Contient uniquement les informations nécessaires à l'exécution

---

## ✅ Checklist de Conformité

Avant toute implémentation, vérifier :

- [ ] La règle respecte-t-elle "MALOC = source de vérité" ?
- [ ] La location reste-t-elle le pivot central ?
- [ ] Y a-t-il duplication de données ?
- [ ] La logique métier est-elle dans le backend ?
- [ ] Y a-t-il des automatismes bloquants ?
- [ ] L'évolution est-elle backward compatible ?
- [ ] Les responsabilités sont-elles bien séparées ?
- [ ] Charges et Amendes restent-ils distincts ?
- [ ] L'évolution est-elle compatible avec la future app client ?

---

## 📝 Notes Importantes

### Résolution d'Ambiguïtés

**Toute ambiguïté doit être levée AVANT implémentation.**

En cas de doute :
1. Consulter ce document
2. Vérifier la matrice des responsabilités
3. Valider avec CTO / DSI / MOA / Tech Lead
4. Documenter la décision

### Évolutions du Document

Ce document peut évoluer, mais :
- Toute modification doit être validée par les mêmes personnes
- Les règles fondamentales ne peuvent être modifiées qu'avec accord unanime
- Les modifications doivent être documentées avec date et raison

---

**Document approuvé par** :
- ✅ CTO
- ✅ DSI
- ✅ MOA
- ✅ Tech Lead

**Date d'approbation** : 2024  
**Version** : 1.0.0




