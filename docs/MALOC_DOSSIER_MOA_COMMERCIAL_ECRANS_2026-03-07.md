# MALOC - Dossier MOA / Commercial / Direction (Ecrans)

![Logo MALOC](../mobile-agent/assets/icon.png)

Date: 2026-03-09

## Positionnement executif

Ce document est concu pour un usage direction, MOA et commercial. Il presente la valeur metier du SAAS MALOC, puis detaille chaque ecran avec objectif, usage, controles et preuve visuelle.

## Synthese managériale

- Vision: plateforme SAAS de pilotage complet location, finance et operations.
- Valeur business: reduction des erreurs, acceleration des cycles, meilleure gouvernance.
- Valeur commerciale: argumentaire clair par role (admin/company/agence/agent).
- Valeur MOA: formalisation des besoins, regles, preuves et points de controle.

## Couverture des captures

- Ecrans web inventoried: **58**
- Captures web disponibles automatiquement: **47**
- Captures manquantes (souvent pages dynamiques): **11**

## Catalogue ecran par ecran (Web)

### 1. `/admin/agencies/[id]`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Structurer les unites operationnelles et leur gouvernance.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 2. `/admin/agencies/new`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Structurer les unites operationnelles et leur gouvernance.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_agencies_new.png`

![Screen /admin/agencies/new](evidence/web-local-html/admin_agencies_new.png)

### 3. `/admin/agencies`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Structurer les unites operationnelles et leur gouvernance.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_agencies.png`

![Screen /admin/agencies](evidence/web-local-html/admin_agencies.png)

### 4. `/admin/companies/[id]`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Gerer les entites clientes SAAS et leur cycle de vie.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 5. `/admin/companies/new`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Gerer les entites clientes SAAS et leur cycle de vie.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_companies_new.png`

![Screen /admin/companies/new](evidence/web-local-html/admin_companies_new.png)

### 6. `/admin/companies/new-validated`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Gerer les entites clientes SAAS et leur cycle de vie.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_companies_new-validated.png`

![Screen /admin/companies/new-validated](evidence/web-local-html/admin_companies_new-validated.png)

### 7. `/admin/companies`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Gerer les entites clientes SAAS et leur cycle de vie.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_companies.png`

![Screen /admin/companies](evidence/web-local-html/admin_companies.png)

### 8. `/admin/company-health`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Evaluer la sante des comptes et risques d'exploitation.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_company-health.png`

![Screen /admin/company-health](evidence/web-local-html/admin_company-health.png)

### 9. `/admin/notifications`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Orchestrer les actions en attente via alertes ciblees.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_notifications.png`

![Screen /admin/notifications](evidence/web-local-html/admin_notifications.png)

### 10. `/admin`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Donner une vue operationnelle du domaine concerne.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin.png`

![Screen /admin](evidence/web-local-html/admin.png)

### 11. `/admin/plans`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Piloter les offres SAAS et regles de montee en charge.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_plans.png`

![Screen /admin/plans](evidence/web-local-html/admin_plans.png)

### 12. `/admin/profile`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Garantir l'exactitude des informations utilisateur.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_profile.png`

![Screen /admin/profile](evidence/web-local-html/admin_profile.png)

### 13. `/admin/settings`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Configurer les parametres structurants de la plateforme.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_settings.png`

![Screen /admin/settings](evidence/web-local-html/admin_settings.png)

### 14. `/admin/subscriptions`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Superviser les abonnements et l'etat contractuel.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_subscriptions.png`

![Screen /admin/subscriptions](evidence/web-local-html/admin_subscriptions.png)

### 15. `/admin/users/[id]`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Administrer les comptes, roles et habilitations.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 16. `/admin/users/new`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Administrer les comptes, roles et habilitations.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_users_new.png`

![Screen /admin/users/new](evidence/web-local-html/admin_users_new.png)

### 17. `/admin/users`

- **Public cible:** Direction / Super Admin / Backoffice central
- **Objectif metier:** Administrer les comptes, roles et habilitations.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/admin_users.png`

![Screen /admin/users](evidence/web-local-html/admin_users.png)

### 18. `/agency/bookings/[id]`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Piloter le cycle de reservation de bout en bout.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
  - Respect des contraintes disponibilite, dates et autorisations.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 19. `/agency/bookings/new`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Piloter le cycle de reservation de bout en bout.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
  - Respect des contraintes disponibilite, dates et autorisations.
- **Capture:** `evidence/web-local-html/agency_bookings_new.png`

![Screen /agency/bookings/new](evidence/web-local-html/agency_bookings_new.png)

### 20. `/agency/bookings`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Piloter le cycle de reservation de bout en bout.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
  - Respect des contraintes disponibilite, dates et autorisations.
- **Capture:** `evidence/web-local-html/agency_bookings.png`

![Screen /agency/bookings](evidence/web-local-html/agency_bookings.png)

### 21. `/agency/charges`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Controler les depenses et la structure des couts.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
  - Cohesion portee/centre de cout/categorie avant enregistrement.
- **Capture:** `evidence/web-local-html/agency_charges.png`

![Screen /agency/charges](evidence/web-local-html/agency_charges.png)

### 22. `/agency/clients/[id]`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Fiabiliser la base client et la conformite documentaire.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 23. `/agency/clients/new`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Fiabiliser la base client et la conformite documentaire.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_clients_new.png`

![Screen /agency/clients/new](evidence/web-local-html/agency_clients_new.png)

### 24. `/agency/clients`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Fiabiliser la base client et la conformite documentaire.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_clients.png`

![Screen /agency/clients](evidence/web-local-html/agency_clients.png)

### 25. `/agency/contracts`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Superviser la relation contractuelle avec preuves.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_contracts.png`

![Screen /agency/contracts](evidence/web-local-html/agency_contracts.png)

### 26. `/agency/fines/[id]`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Traiter les amendes avec traçabilite et pieces associees.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 27. `/agency/fines/new`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Traiter les amendes avec traçabilite et pieces associees.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_fines_new.png`

![Screen /agency/fines/new](evidence/web-local-html/agency_fines_new.png)

### 28. `/agency/fines`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Traiter les amendes avec traçabilite et pieces associees.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_fines.png`

![Screen /agency/fines](evidence/web-local-html/agency_fines.png)

### 29. `/agency/gps`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Superviser la telemetrie et les informations de deplacement.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_gps.png`

![Screen /agency/gps](evidence/web-local-html/agency_gps.png)

### 30. `/agency/gps-kpi`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Suivre la performance et soutenir la decision business.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Analyser les indicateurs et arbitrer les decisions.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_gps-kpi.png`

![Screen /agency/gps-kpi](evidence/web-local-html/agency_gps-kpi.png)

### 31. `/agency/invoices`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Suivre la facturation et les encaissements associes.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_invoices.png`

![Screen /agency/invoices](evidence/web-local-html/agency_invoices.png)

### 32. `/agency/journal`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Assurer la traçabilite des operations metier.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_journal.png`

![Screen /agency/journal](evidence/web-local-html/agency_journal.png)

### 33. `/agency/kpi`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Suivre la performance et soutenir la decision business.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Analyser les indicateurs et arbitrer les decisions.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_kpi.png`

![Screen /agency/kpi](evidence/web-local-html/agency_kpi.png)

### 34. `/agency/maintenance/[id]`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Planifier et tracer la maintenance pour limiter les risques.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 35. `/agency/maintenance/new`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Planifier et tracer la maintenance pour limiter les risques.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_maintenance_new.png`

![Screen /agency/maintenance/new](evidence/web-local-html/agency_maintenance_new.png)

### 36. `/agency/maintenance`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Planifier et tracer la maintenance pour limiter les risques.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_maintenance.png`

![Screen /agency/maintenance](evidence/web-local-html/agency_maintenance.png)

### 37. `/agency/notifications`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Orchestrer les actions en attente via alertes ciblees.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_notifications.png`

![Screen /agency/notifications](evidence/web-local-html/agency_notifications.png)

### 38. `/agency`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Donner une vue operationnelle du domaine concerne.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency.png`

![Screen /agency](evidence/web-local-html/agency.png)

### 39. `/agency/planning`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Visualiser la charge operationnelle et l'occupation.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_planning.png`

![Screen /agency/planning](evidence/web-local-html/agency_planning.png)

### 40. `/agency/profile`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Garantir l'exactitude des informations utilisateur.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_profile.png`

![Screen /agency/profile](evidence/web-local-html/agency_profile.png)

### 41. `/agency/vehicles/[id]`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Gerer le parc vehicule et sa disponibilite.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 42. `/agency/vehicles/new`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Gerer le parc vehicule et sa disponibilite.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_vehicles_new.png`

![Screen /agency/vehicles/new](evidence/web-local-html/agency_vehicles_new.png)

### 43. `/agency/vehicles`

- **Public cible:** Equipe agence (manager + operations + finance locale)
- **Objectif metier:** Gerer le parc vehicule et sa disponibilite.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/agency_vehicles.png`

![Screen /agency/vehicles](evidence/web-local-html/agency_vehicles.png)

### 44. `/company/agencies/[id]`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Structurer les unites operationnelles et leur gouvernance.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 45. `/company/agencies/new`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Structurer les unites operationnelles et leur gouvernance.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company_agencies_new.png`

![Screen /company/agencies/new](evidence/web-local-html/company_agencies_new.png)

### 46. `/company/agencies`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Structurer les unites operationnelles et leur gouvernance.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company_agencies.png`

![Screen /company/agencies](evidence/web-local-html/company_agencies.png)

### 47. `/company/analytics`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Consolider les indicateurs de pilotage company.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Analyser les indicateurs et arbitrer les decisions.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company_analytics.png`

![Screen /company/analytics](evidence/web-local-html/company_analytics.png)

### 48. `/company/notifications`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Orchestrer les actions en attente via alertes ciblees.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company_notifications.png`

![Screen /company/notifications](evidence/web-local-html/company_notifications.png)

### 49. `/company`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Donner une vue operationnelle du domaine concerne.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company.png`

![Screen /company](evidence/web-local-html/company.png)

### 50. `/company/planning`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Visualiser la charge operationnelle et l'occupation.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company_planning.png`

![Screen /company/planning](evidence/web-local-html/company_planning.png)

### 51. `/company/profile`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Garantir l'exactitude des informations utilisateur.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company_profile.png`

![Screen /company/profile](evidence/web-local-html/company_profile.png)

### 52. `/company/users/[id]`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Administrer les comptes, roles et habilitations.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Modifier un enregistrement existant avec traçabilite.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 53. `/company/users/new`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Administrer les comptes, roles et habilitations.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Creer un nouvel enregistrement conforme aux regles metier.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company_users_new.png`

![Screen /company/users/new](evidence/web-local-html/company_users_new.png)

### 54. `/company/users`

- **Public cible:** Direction company / pilotage multi-agences
- **Objectif metier:** Administrer les comptes, roles et habilitations.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/company_users.png`

![Screen /company/users](evidence/web-local-html/company_users.png)

### 55. `/forgot-password`

- **Public cible:** Utilisateur public / authentification
- **Objectif metier:** Reinitialiser l'acces utilisateur en securite.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/forgot-password.png`

![Screen /forgot-password](evidence/web-local-html/forgot-password.png)

### 56. `/login`

- **Public cible:** Utilisateur public / authentification
- **Objectif metier:** Authentifier l'utilisateur et proteger l'entree applicative.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/login.png`

![Screen /login](evidence/web-local-html/login.png)

### 57. `/page.tsx`

- **Public cible:** Utilisateur public / authentification
- **Objectif metier:** Donner une vue operationnelle du domaine concerne.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** A completer (ecran dynamique / contexte connecte requis).

### 58. `/reset-password`

- **Public cible:** Utilisateur public / authentification
- **Objectif metier:** Finaliser la reprise d'acces avec controle.
- **Actions principales:**
  - Consulter les donnees et verifier les statuts cles.
  - Executer l'action metier principale de l'ecran.
  - Declencher les transitions de workflow selon habilitation.
- **Controles et conformite:**
  - Controle d'acces par role et permissions.
  - Validation des donnees cote serveur et cote interface.
  - Journalisation des actions critiques et erreurs metier.
- **Capture:** `evidence/web-local-html/reset-password.png`

![Screen /reset-password](evidence/web-local-html/reset-password.png)

## Parcours mobile - ecrans de reference

- `LanguageSelectionScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.
- `LoginScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.
- `ForgotPasswordScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.
- `BookingsScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.
- `BookingDetailsScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.
- `CheckInScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.
- `CheckOutScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.
- `CreateBookingScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.
- `SettingsScreen`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.

## Plan d'action final pour un dossier client-ready

- Completer les captures manquantes des routes dynamiques `[id]` en session connectee.
- Completer les captures mobiles reelles depuis device Expo/Android/iOS.
- Ajouter, sous chaque capture, un commentaire de valeur metier et KPI associe.
- Exporter ce dossier en PDF avec pagination executive (couverture, sommaire, annexes).
