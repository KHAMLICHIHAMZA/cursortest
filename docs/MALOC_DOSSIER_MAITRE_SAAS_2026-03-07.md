# MALOC - Dossier Maitre SAAS (Consolide)

![Logo MALOC](../mobile-agent/assets/icon.png)

Version: 2026-03-07  
Auteur: Equipe Produit / Technique  
Statut: Document consolide de reference (fonctionnel + technique + exploitation)

---

## 1. Objet du document

Ce dossier maitre regroupe, structure et harmonise la documentation du projet SAAS MALOC dans un format unique et lisible pour:

- Direction / sponsors
- Produit / metier
- Equipes techniques (backend, frontend web, mobile)
- QA / UAT / exploitation

Il couvre la presentation globale, les specifications fonctionnelles et techniques, l'architecture, le cahier de charges consolide, le manuel d'utilisation, les points de securite, l'exploitation, les tests et les annexes.

---

## 2. Presentation du projet

### 2.1 Vision

MALOC est une plateforme SAAS de gestion de location (multi-entites) orientee operations agence, pilotage financier, gouvernance des droits et execution terrain (web + mobile).

### 2.2 Objectifs metier

- Centraliser les processus de reservation, check-in, check-out et cloture.
- Fiabiliser les donnees client/vehicule/contrat/facturation.
- Donner une vue de pilotage via KPI (revenu, charges, rentabilite).
- Controler les permissions par role pour reduire le risque operationnel.
- Supporter l'usage terrain mobile pour les agents.

### 2.3 Perimetre applicatif

- Backoffice admin (SAAS settings, plans, companies, subscriptions)
- Espace company (agences, analytics, users)
- Espace agence (bookings, clients, vehicles, maintenance, fines, charges, KPI, notifications)
- Application mobile agent (processus terrain)

---

## 3. Architecture consolidee

### 3.1 Vue d'ensemble

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend web**: Next.js + React + TypeScript + React Query
- **Mobile**: React Native / Expo
- **Notifications**: in-app + email (selon flux)
- **Fichiers**: uploads backend (vehicules, licences, maintenance, amendes, etc.)

### 3.2 Couches principales

- **Presentation**: pages web, composants UI, ecrans mobile
- **API / Controleurs**: endpoints REST modules metier
- **Service metier**: regles de gestion, validations, orchestration
- **Persistance**: Prisma models, migrations/schema, indexation
- **Integration**: mail, outbox/events, generation documents

### 3.3 Modules metier majeurs

- Auth / users / roles / permissions
- Company / agency
- Bookings / planning
- Vehicles / maintenance
- Fines / invoices / contracts / payments
- Charges & depenses / KPI
- Notifications

---

## 4. Specifications fonctionnelles consolidees

### 4.1 Gestion des reservations

- Creation, edition, suppression (restreintes selon role)
- Controle de disponibilite vehicule/periode
- Check-in / check-out avec parametres terrain
- Alertes metier (validite permis, horaires agence, etc.)
- Cloture financiere post checkout

### 4.2 Gestion clients et vehicules

- Fiches completes clients (adresse structuree, permis)
- Gestion flotte et images
- Maintenance preventive/corrective
- Regles de coherence lors des operations

### 4.3 Charges & depenses (version avancee)

- Portee de charge: `VEHICLE`, `AGENCY`, `COMPANY`
- Centre de cout optionnel selon portee
- Categorie autorisee selon contexte (portee + centre)
- Periodicite explicite: `NONE`, `MONTHLY`, `QUARTERLY`, `YEARLY`
- Export CSV par filtres actifs
- KPI: charges par centre de cout + allocation proportionnelle

### 4.4 Facturation, amendes et contrats

- Generation facture liee reservation
- Amendes rattachees a des bookings actifs (regles controlees)
- Pieces jointes optionnelles pour amendes
- Contrats et documents associes

### 4.5 Notifications et workflows

- Notifications in-app pour actions en attente
- Exemple cle: reminder de cloture financiere apres checkout
- Deduplication pour eviter les doublons

### 4.6 Onboarding et profil

- Activation des comptes par email (roles cibles)
- Obligation de completion de profil au premier usage (hors super admin)

---

## 5. Specifications techniques consolidees

### 5.1 Backend (NestJS/Prisma)

- DTO + validation + guards + interceptors
- Controle d'acces via JWT + roles + permissions/modules
- Services metier avec validations fortes
- Requetes Prisma optimizees (filtres, select, index, aggregate)

### 5.2 Frontend web (Next.js)

- Pages modulaires par domaine
- React Query pour cache, invalidation, coherence UI
- Formulaires dynamiques et validations Zod
- UX ciblee metier (guidage, erreurs explicites, toasts)

### 5.3 Mobile (Expo)

- App agent pour check-in/check-out
- Capture signature via WebView natif
- Hydratation donnees check-in au checkout
- Gestion d'etat et synchronisation API

### 5.4 Observabilite et qualite

- Endpoints health/ready (selon configuration)
- Metriques HTTP (latence, erreurs)
- Scripts de simulation fonctionnelle et E2E role-based

---

## 6. Cahier des charges consolide (exigences)

### 6.1 Exigences fonctionnelles

- Multi-role strict (admin/company/agence/agent)
- Reservation lifecycle complet
- Charges multi-portee + centres de cout + export
- KPI orientes pilotage
- Mobile agent pleinement operationnel

### 6.2 Exigences non fonctionnelles

- Securite d'acces (auth + autorisation)
- Cohesion des donnees (validations metier)
- Performance acceptable sur listes et KPI
- Exploitabilite (docs, checklists, scripts)
- Traçabilite des actions critiques

### 6.3 Contraintes

- Compatibilite environnement Windows de dev
- Gestion de verrouillages process (Prisma engine)
- Homogeneite entre dev/preprod/prod

---

## 7. Manuel d'utilisation (synthese operationnelle)

### 7.1 Profil AGENT

- Consulte reservations
- Execute check-in/check-out
- Ne cree/edite/supprime pas de reservation

### 7.2 Profil AGENCY_MANAGER

- Gere reservations
- Recoit notifications de cloture en attente
- Execute cloture financiere

### 7.3 Utilisation Charges

- Choisir portee
- Choisir centre de cout si necessaire
- Selectionner categorie autorisee
- Definir periodicite
- Exporter la liste filtree

### 7.4 Bonnes pratiques

- Verifier les messages de validation avant soumission
- Controler les filtres actifs avant export CSV
- En mobile, finaliser un check-in complet avant check-out

---

## 8. Securite et conformite

- JWT + guards roles/permissions/modules
- Separation des responsabilites par role
- Validation serveur des regles metier critiques
- Limitation des actions sensibles selon profil
- Recommandation: revue periodique des droits et comptes

---

## 9. Strategie tests et validation

### 9.1 Niveaux de test

- Tests unitaires (services/guards)
- Tests integration API
- Tests fonctionnels web/mobile
- UAT scenario-driven (checklist dediee)

### 9.2 Scripts et outillage

- Simulation de cycles fonctionnels complets
- E2E role AGENT (permissions + flux autorises)
- Preuves via captures d'ecran et rapports

### 9.3 Criteres de sortie

- Zero blocant
- Regles role-based conformes
- Flux critiques verifies (booking, charges, mobile)

---

## 10. Exploitation, deploiement, runbook

- Verifier variables d'environnement et secrets
- Regenerer Prisma client si schema change
- Redemarrer backend apres changements Prisma
- Controler endpoints de sante et logs d'erreur
- Suivre checklist preprod avant mise en production

---

## 11. Gouvernance documentaire

Ce dossier maitre est la porte d'entree.  
Les documents source restent la reference detaillee par domaine et doivent etre maintenus.

Regles de mise a jour recommandees:

- Mise a jour dossier maitre a chaque lot majeur
- Ajout d'un changelog documentaire
- Lien explicite vers evidences UAT et captures

---

## 12. Annexes - Inventaire documentaire du projet

### 12.1 Documents racine projet (strategie, guides, preprod)

> **Note (mars 2026)** : certains fichiers listés à l’origine ont été retirés du dépôt après livraison (ex. audit d’unification, rapports de test ponctuels). Voir `README.md` et `CONTEXT_CHATGPT.md` pour l’état actuel.

- `AGENTS.md`
- `APPLICATIONS_DETAILS.md`
- `CHECKLIST_SECRETS.md`
- `CONTEXT_CHATGPT.md`
- `docs/archive/CR_PREPRODUCTION_V2.1.md`
- `GUIDE_CONFIGURATION_SMTP.md`
- `GUIDE_PILOTE_1_BACKEND.md`
- `docs/archive/GUIDE_PILOTE_2_FRONTEND_AGENCY.md`
- `docs/archive/GUIDE_PILOTE_3_FRONTEND_ADMIN.md`
- `GUIDE_PILOTE_4_MOBILE_AGENT.md`
- `PORTS_APPLICATIONS.md`
- `PREPROD_CHECKLIST.md`
- `QUESTIONS_PREPROD_V2.md`
- `README.md`
- `docs/archive/README_LANCEMENT.md`
- `RELEASE_NOTES_V2.md`
- `docs/archive/REPONSES_QUESTIONS_V1.md`
- `SETUP_ENV.md`
- `SPECIFICATIONS_FONCTIONNELLES.md`
- `CURRENT_STATUS.md` (alias `STATUT_PREPROD.md`)
- `TESTS_V2_ET_UNIFICATION.md`
- `docs/archive/TUTORIEL_LANCEMENT_SAAS.md`

### 12.2 Documents backend

- `backend/DEBUG_404.md`
- `backend/FIX_SHADOW_DATABASE.md`
- `backend/IMPLEMENTATION_RULES_METIER_RECAP.md`
- `backend/README.md`
- `backend/README_NESTJS.md`
- `backend/REDEMARRER_BACKEND.md`
- `backend/RESERVATIONS_TEST_MOBILE.md`
- `backend/SCHEMA_DB_FINAL.md`
- `backend/SECURITE_JWT.md`
- `backend/SECURITY_AUDIT.md`
- `backend/SEED_SAAS_SUMMARY.md`
- `backend/SETUP.md`
- `backend/TACHES_COMPLETEES.md`
- `backend/TEST_WEB.md`
- `backend/VALIDATIONS_BACKEND_RULES_METIER.md`
- `backend/VERIFIER_CORS.md`

### 12.3 Documents frontend web

- `frontend-web/DESIGN_SYSTEM.md`
- `frontend-web/README.md`
- `frontend-web/SETUP.md`
- `frontend-web/TESTS_COMPLETE_SUMMARY.md`
- `frontend-web/TESTS_SETUP.md`

### 12.4 Documents dossier `docs`

- `docs/specs.md`
- `docs/ANALYSE_PAR_TACHES_DETAILLEE_2026-03-07.md`
- `docs/DOSSIER_FONCTIONNEL_2026-03-07.md`
- `docs/DOSSIER_TECHNIQUE_2026-03-07.md`
- `docs/MANUEL_UTILISATEUR_2026-03-07.md`
- `docs/UAT_CHECKLIST_FUNCTIONAL_CYCLES_2026-03-07.md`
- `docs/PLAN_CAPTURES_ECRAN_2026-03-07.md`
- `docs/PRESENTATION_LIVRAISON_2026-03-07.pptx`

---

## 13. Plan de conversion en PDF (option)

Sur ta machine actuelle, aucun convertisseur PDF CLI standard n'est disponible par defaut (`pandoc` absent).  
Le present fichier est donc livre en format Markdown, pret a convertir en PDF avec un des outils suivants:

- VS Code/ Cursor: "Markdown: Export (PDF)"
- Pandoc + moteur PDF (wkhtmltopdf/xelatex)
- Word (ouvrir le `.md` puis exporter en PDF)

Le rendu pro est preserve si tu gardes:

- Le logo en couverture
- Les titres numerotes
- La table des annexes
- Les sauts de page entre sections majeures

