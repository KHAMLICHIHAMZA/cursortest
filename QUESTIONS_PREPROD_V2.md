# 🎯 QUESTIONS PRÉ-PRODUCTION V2 — MalocAuto

**Date** : 8 Février 2026  
**Contexte** : Gel fonctionnel V2 avant préprod ouverte à des testeurs réels (agences marocaines, souvent mono-personne).

---

## Contexte rappelé

La V2 repose sur :
- Backend central DDD (modular monolith, NestJS + Prisma + PostgreSQL)
- Frontend web unifié (Next.js) + Mobile Agent (React Native)
- Documents unifiés (Facture + E-Contrat)
- Journal d'agence (auto + notes)
- BookingNumber AUTO/MANUAL
- Notifications in-app
- GPS par snapshots uniquement
- **Aucune nouvelle feature après ce freeze**

---

## 1️⃣ BookingNumber (Numéro de réservation)

### Règles implémentées

| Règle | Implémentation | Statut |
|-------|---------------|--------|
| Format AUTO | `YYYY000001` (séquence annuelle) | ✅ Implémenté |
| Format MANUAL | Alphanumérique libre (A-Z, 0-9, max 32 chars) | ✅ Implémenté |
| Unicité | Par company (`@@unique([companyId, bookingNumber])`) | ✅ Implémenté |
| Numéro consommé si annulé | Le numéro n'est pas recyclé | ✅ Implémenté |
| Modification avant invoice | Autorisée | ✅ Implémenté |
| Verrouillage après facture | `ForbiddenException: bookingNumber is locked` | ✅ Implémenté |
| Conflit MANUAL | Erreur explicite si doublon | ✅ Implémenté |

### Concurrence
- **Mécanisme** : `upsert` atomique en base (incrémente `lastValue` sur `BookingNumberSequence`)
- **Risque résiduel** : Quasi nul. L'upsert PostgreSQL est atomique au niveau ligne. Même sous forte charge concurrente, les numéros sont garantis uniques.

### Cas limites identifiés

| Cas | Risque | Couvert ? |
|-----|--------|-----------|
| 2 créations simultanées même seconde | Atomicité upsert | ✅ Oui |
| Import de données historiques | Le compteur doit être initialisé | ⚠️ À prévoir manuellement |
| Rollback transaction | Numéro consommé = gap dans la séquence | ✅ Acceptable (comme une facture annulée) |
| Changement d'année (31 déc → 1 jan) | Reset séquence via `year` dans la clé | ✅ Couvert |

### Recommandation
> ✅ **Cohérent et testable.** Seul point à documenter pour la préprod : si on importe des réservations historiques, il faut initialiser `BookingNumberSequence.lastValue` au dernier numéro existant.

---

## 2️⃣ Facturation (Invoice + Avoir)

### Règles implémentées

| Règle | Implémentation | Conformité |
|-------|---------------|------------|
| Émission au check-out | Automatique si pas de litige | ✅ |
| Payload figé | JSON snapshot immutable à l'émission | ✅ |
| Numérotation séquentielle | Format `FAC-{YEAR}-{SEQUENCE}` | ✅ |
| Séquence par | **Company** (pas par agency) | ⚠️ Voir note |
| Reset annuel | Via `@@unique([companyId, year])` | ✅ |
| Timezone Maroc | `Africa/Casablanca` | ✅ |
| Date facture = heure check-out | `issuedAt` = `getMoroccoTime()` | ✅ |
| PDF depuis payload figé | Endpoint `/invoices/:id/payload` | ✅ |
| Correction = avoir uniquement | `POST /invoices/:id/credit-note` | ✅ |
| Jamais d'édition directe | Aucun endpoint PATCH sur le contenu | ✅ |

### ⚠️ Point d'attention : Séquence par Company vs par Agency

**Implémentation actuelle** : La numérotation est **par company** (`@@unique([companyId, year, sequence])`).

**Obligation légale Maroc** : La loi marocaine exige une numérotation séquentielle continue **par entité facturante** (Article 145 du CGI). Si chaque agence facture sous son propre nom/ICE, la séquence devrait être **par agency**.

**Impact** :
- Si la company est l'entité facturante (cas mono-agence) → ✅ OK
- Si chaque agence facture indépendamment → ⚠️ Il faudra passer la séquence par agency

**Recommandation pour préprod** :
> Pour les testeurs mono-agence (cas majoritaire), **pas de problème**. Pour les multi-agences, documenter cette limitation et prévoir un ajustement post-préprod si nécessaire.

### Avoir manuel par manager

| Aspect | Analyse |
|--------|---------|
| Risque métier | Faible si l'avoir est traçable (qui, quand, pourquoi) |
| Risque technique | Aucun (c'est déjà implémenté) |
| Risque légal | L'avoir doit référencer la facture d'origine (déjà le cas) |
| Recommandation | ✅ Autoriser, mais journaliser (déjà fait via Outbox → Journal) |

### Facturation électronique Maroc 2026

> **Important** : Le Maroc introduit une obligation de facturation électronique à partir de 2026, avec validation par la DGI (modèle Clearance) et formats structurés (UBL 2.1 / UN/CEFACT CII). Ce n'est pas bloquant pour la V2 préprod, mais c'est à anticiper pour la V3.

---

## 3️⃣ Contrat (E-Contrat, signature preuve)

### Cycle implémenté

```
DRAFT → (Check-in) → PENDING_SIGNATURE → (Signatures) → SIGNED → (Effective)
                                                               → (Nouvelle version si modification)
```

| Règle | Implémentation | Statut |
|-------|---------------|--------|
| Créé à la réservation | `POST /contracts` → DRAFT | ✅ |
| Effectif au check-in | `PATCH /contracts/:id/effective` | ✅ |
| Signature client + agent | `POST /contracts/:id/sign` avec signer CLIENT/AGENT | ✅ |
| Modification après signature → nouvelle version | `POST /contracts/:id/new-version` | ✅ |
| Historique versions | Champ `version` incrémenté | ✅ |
| Payload figé | Snapshot avec company, agency, client, vehicle, booking | ✅ |
| Timezone Maroc | `Africa/Casablanca` | ✅ |

### Mentions présentes dans le payload

| Mention | Présente |
|---------|----------|
| Raison sociale / forme juridique | ✅ `company.raisonSociale`, `company.formeJuridique` |
| Identifiant légal (ICE/RC) | ✅ `company.identifiantLegal` |
| Adresse company + agency | ✅ |
| CIN / Passeport client | ✅ `client.idCardNumber`, `client.passportNumber` |
| N° permis + expiration | ✅ `client.licenseNumber`, `client.licenseExpiryDate` |
| Immatriculation véhicule | ✅ `vehicle.registrationNumber` |
| Kilométrage | ✅ `vehicle.mileage` |
| Dates location | ✅ `booking.startDate`, `booking.endDate` |
| Montant + caution | ✅ `booking.totalPrice`, `booking.depositAmount` |

### Mentions manquantes pour un contrat "réaliste Maroc"

| Mention | Recommandation |
|---------|---------------|
| Conditions générales de location | ⚠️ À ajouter dans le template PDF (pas dans le payload) |
| Franchise / assurance | ⚠️ À ajouter si applicable |
| Clause "véhicule interdit hors Maroc" | ⚠️ Standard dans la pratique marocaine |
| Clause retour hors heures | ⚠️ Supplément standard (≈300 MAD) |
| Âge minimum conducteur | ⚠️ 21 ans minimum (23 pour certaines catégories) |

> **Recommandation** : Ces mentions sont du **contenu de template PDF**, pas de la donnée structurée. On peut les ajouter dans le générateur PDF sans toucher au backend. Non bloquant pour la préprod.

---

## 4️⃣ Journal d'agence

### Règles implémentées

| Règle | Implémentation | Statut |
|-------|---------------|--------|
| Entrées auto = Domain Events | Outbox → Projection → JournalEntry | ✅ Immutables |
| Notes manuelles | `POST /journal/notes` | ✅ Créer/Modifier/Supprimer |
| Rôles autorisés (notes) | AGENCY_MANAGER, COMPANY_ADMIN, SUPER_ADMIN | ✅ |
| AGENT interdit (notes) | Guard de rôle | ✅ |
| Journal = projection lisible | Pas de logique métier déclenchée | ✅ |

### Événements auto projetés

| Événement | Type journal |
|-----------|-------------|
| Réservation créée | `BOOKING_CREATED` |
| Check-in effectué | `CHECK_IN` |
| Check-out effectué | `CHECK_OUT` |
| Facture émise | `INVOICE_ISSUED` |
| Avoir émis | `CREDIT_NOTE_ISSUED` |
| Contrat créé | `CONTRACT_CREATED` |
| Contrat signé | `CONTRACT_SIGNED` |
| Incident signalé | `INCIDENT_REPORTED` |
| Incident résolu | `INCIDENT_RESOLVED` |
| GPS capturé | `GPS_SNAPSHOT` |

### Risque de bruit/surcharge

| Risque | Analyse |
|--------|---------|
| Trop d'entrées | Faible pour une agence mono-personne (quelques locations/jour) |
| Pour une grosse agence | Les filtres (type, date, recherche) sont implémentés |
| GPS snapshots | 2-4 par booking (check-in, check-out, incidents) → négligeable |

> **Recommandation** : ✅ Pas de risque de surcharge pour le profil cible préprod. Pagination à ajouter si le volume augmente post-V2.

---

## 5️⃣ GPS — Snapshots uniquement

### Règles implémentées

| Règle | Implémentation | Statut |
|-------|---------------|--------|
| GPS au check-in | Automatique | ✅ |
| GPS au check-out | Automatique | ✅ |
| GPS à l'incident | Via `POST /gps` | ✅ |
| GPS manuelle (manager) | `POST /gps/manual` + guard rôle | ✅ |
| Pas de tracking continu | Aucun timer/interval | ✅ |
| GPS indisponible → autorisé | Action continue | ✅ |
| Snapshot "GPS manquant" | `POST /gps/missing` avec `gpsMissing=true` | ✅ |
| Warning UX | Côté mobile-agent | ✅ |

### Risque d'incohérence km/GPS

| Risque | Analyse | Mitigation |
|--------|---------|------------|
| GPS ≠ km réel au compteur | **Attendu.** L'erreur GPS typique est de 2-10% vs compteur | Le km au compteur est saisi manuellement au check-in/check-out |
| GPS indoor imprécis | Parking souterrain = position approximative | Le snapshot "GPS manquant" couvre ce cas |
| km compteur non vérifié | Le client peut tricher | ⚠️ Pas couvert en V2 (nécessiterait photo compteur) |

> **Recommandation** : ✅ Approche suffisante pour V2. Le GPS snapshot est un indicateur, pas une preuve kilométrique. Le km compteur reste la référence contractuelle. Suggestion V3 : ajouter photo obligatoire du compteur au check-in/check-out.

---

## 6️⃣ Notifications (in-app)

### Règles implémentées

| Règle | Implémentation | Statut |
|-------|---------------|--------|
| In-app = source de vérité | `InAppNotification` model | ✅ |
| Cycle | DRAFT → SCHEDULED → SENT → READ | ✅ |
| Facture disponible | Type `INVOICE_AVAILABLE` | ✅ |
| Contrat à signer | Type `CONTRACT_TO_SIGN` | ✅ |
| Retard | Type `BOOKING_LATE` | ✅ |
| Incident | Type `INCIDENT_REPORTED` | ✅ |
| Système | Type `SYSTEM_ALERT` | ✅ |

### Risque de spam/surcharge

| Risque | Analyse |
|--------|---------|
| Pas de déduplication | ⚠️ Actuellement, rien n'empêche 2 notifications identiques |
| Pas de rate limiting | ⚠️ Si un bug envoie 1000 notifs, pas de protection |
| Pour préprod mono-agence | Risque faible (volume bas) |

### Recommandation

> ⚠️ **Ajustement mineur recommandé** : Ajouter une déduplication simple (vérifier si une notification du même type + même booking existe dans les 5 dernières minutes). Non bloquant pour la préprod mais fortement recommandé avant production.

---

## 7️⃣ UX Mono-personne (cas majoritaire)

### Modèle analysé

| Aspect | Implémentation |
|--------|---------------|
| Un seul user | ✅ Supporté |
| Rôle COMPANY_ADMIN | ✅ Accès à /company + /agency |
| Une company, une agence | ✅ Cas standard |
| Accès total | ✅ COMPANY_ADMIN voit tout |
| Web + mobile en parallèle | ✅ Même token JWT, même API |
| Offline mobile | ✅ expo-sqlite + sync |

### Faut-il un "mode solo UI" ?

| Option | Analyse |
|--------|---------|
| Mode solo dédié | Surcoût de dev pour un gain UX marginal |
| RBAC actuel | Le COMPANY_ADMIN voit déjà tout (company + agency) |

> **Recommandation** : ✅ **Le RBAC actuel suffit.** Le COMPANY_ADMIN a accès à tout. Le sidebar affiche les menus selon les modules actifs. Pas besoin d'un mode spécial.
>
> **Amélioration UX possible (post-V2)** : Si l'utilisateur est COMPANY_ADMIN avec une seule agence, rediriger automatiquement vers `/agency` plutôt que `/company` pour éviter un clic supplémentaire.

---

## 8️⃣ Unification Frontend (Next.js)

### Validation

| Aspect | Analyse |
|--------|---------|
| Un seul frontend = plus sûr | ✅ Un seul point d'entrée, un seul build, un seul set de tests |
| RBAC + modules suffisent | ✅ Middleware auth + sidebar filtré + backend guards |
| Pas de dette cachée | ✅ Toutes les fonctionnalités migrées et vérifiées |
| Build production | ✅ 40 pages compilées sans erreur |

### Risques analysés

| Risque | Probabilité | Mitigation |
|--------|-------------|------------|
| Bundle trop gros | Faible | Next.js split automatiquement par page |
| Code admin visible par agent | Quasi nul | Code splitting + middleware + API guards |
| Performance sur mobile | Faible | Pages "use client" = SPA behavior |

> **Recommandation** : ✅ **Unification validée.** Aucun risque bloquant identifié.

---

## 9️⃣ Tests & Freeze V2

### Plan de 126 tests

| Aspect | Évaluation |
|--------|-----------|
| Suffisant pour préprod ? | ✅ Oui, couvre auth, modules, pages, API, proxy, sécurité |
| Trop ambitieux ? | Non, c'est du fonctionnel basique |
| Points manquants ? | Voir ci-dessous |

### Points manquants identifiés

| Point | Priorité | Recommandation |
|-------|----------|---------------|
| Test de connexion réelle (login → navigation complète) | 🔴 Haute | Ajouter 1 test E2E login → dashboard → créer booking |
| Test offline mobile-agent | 🟡 Moyenne | Tester sync après coupure réseau |
| Test multi-onglets (même user, 2 onglets) | 🟢 Faible | Vérifier que le token refresh ne crée pas de race condition |

### 3 ajustements recommandés avant préprod

| # | Ajustement | Effort | Impact |
|---|-----------|--------|--------|
| 1 | **Déduplication notifications** : Vérifier doublon type+booking dans les 5 dernières minutes | ~1h | Évite spam en cas de bug |
| 2 | **Mentions contrat PDF** : Ajouter les conditions générales standard (franchise, âge min, clause Maroc) dans le template PDF | ~2h | Crédibilité auprès des testeurs |
| 3 | **Redirection auto mono-agence** : COMPANY_ADMIN avec 1 seule agence → redirect `/agency` | ~30min | UX fluide pour 90% des testeurs |

---

## 🔒 Question finale : Gèle-t-on cette V2 ?

### Notre analyse

| Critère | Verdict |
|---------|---------|
| BookingNumber | ✅ Solide |
| Facturation | ✅ Conforme (séquence à ajuster per-agency si multi-agence post-préprod) |
| Contrat | ✅ Fonctionnel (mentions PDF à enrichir) |
| Journal | ✅ Propre |
| GPS | ✅ Suffisant pour V2 |
| Notifications | ⚠️ Déduplication recommandée |
| UX mono-personne | ✅ OK avec RBAC actuel |
| Frontend unifié | ✅ Validé |
| Tests | ✅ 126 tests couvrent l'essentiel |

### Verdict

> ## ✅ OUI — Gel avec 3 ajustements mineurs
>
> La V2 est **prête pour la préprod** avec les 3 ajustements listés ci-dessus (déduplication notifs, mentions contrat PDF, redirection mono-agence).
>
> Aucun de ces ajustements n'est bloquant pour commencer les tests, mais ils améliorent significativement l'expérience des testeurs réels.
>
> **Aucune nouvelle feature ne doit être ajoutée.** Seuls des bugfix et ajustements UX sont autorisés après ce gel.

---

## 📅 Planning suggéré

| Étape | Durée | Action |
|-------|-------|--------|
| J0 | 2h | Appliquer les 3 ajustements mineurs |
| J0 | 1h | Exécuter les 126 tests |
| J1 | - | Ouvrir la préprod aux testeurs |
| J1-J7 | - | Collecter les retours terrain |
| J8 | - | Analyse retours → décision GO/NO-GO production |
