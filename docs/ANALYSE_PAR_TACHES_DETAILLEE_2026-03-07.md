# Analyse detaillee par taches - Livraison 2026-03-07

## 1) Performance et coherence de donnees (React Query)

### Objectif
Garantir une mise a jour immediate de l'UI apres mutation, sans penaliser fortement les performances.

### Changements cles
- Configuration globale React Query (`staleTime`, `refetchOnMount`) pour limiter les donnees obsoletes.
- Invalidation ciblee des requetes liees aux reservations et factures apres mutation.

### Resultat attendu
- Les listes et details se rafraichissent sans rechargement manuel.
- Diminution des incoherences "action faite mais UI non rafraichie".

---

## 2) Module Charges & Depenses - modelisation metier

### Objectif
Passer d'une logique "vehicule uniquement" a une logique multi-portee et multi-centre de cout.

### Changements cles
- Ajout de `scope` (`VEHICLE`, `AGENCY`, `COMPANY`) et `costCenter` au modele de charge.
- Validation stricte categorie vs portee vs centre de cout.
- Prise en compte de categories non-vehicule explicites (`SALARY`, `OFFICE_RENT`, etc.).
- KPI enrichi avec repartition par centre de cout.
- Allocation proportionnelle des charges partagees vers la rentabilite vehicule.

### Resultat attendu
- Saisie plus fiable (moins d'erreurs metier).
- Lecture KPI plus exploitable pour pilotage financier.

---

## 3) UX Charges - filtres intelligents et export

### Objectif
Rendre la page charges plus claire, guidee et exploitable au quotidien.

### Changements cles
- Filtres dynamiques selon `Portee` / `Centre de cout`.
- Select de periodicite explicite (`NONE`, `MONTHLY`, `QUARTERLY`, `YEARLY`) sans checkbox cachee.
- Export CSV robuste (BOM UTF-8, CRLF Windows, nettoyage date/montant, feedback utilisateur).

### Resultat attendu
- Moins d'erreurs de saisie.
- Export exploitable directement dans Excel.

---

## 4) Permissions booking et separation des responsabilites

### Objectif
Reserver la gestion metier des reservations aux roles managers.

### Changements cles
- Blocage `AGENT` sur create/update/delete reservation (`403` attendu).
- Maintien des actions check-in/check-out pour l'AGENT.
- Cloture financiere reservee aux roles agence autorises.

### Resultat attendu
- Gouvernance metier renforcee.
- Reduction des modifications non autorisees.

---

## 5) Notification de cloture financiere en attente

### Objectif
Informer automatiquement les responsables d'agence apres check-out.

### Changements cles
- Emission d'une notification in-app "cloture en attente" post check-out.
- Deduplication pour eviter les doublons sur meme booking/receveur.

### Resultat attendu
- Visibilite operationnelle amelioree.
- Pas de spam notification.

---

## 6) Onboarding et profil obligatoire (roles agence)

### Objectif
Uniformiser l'activation et la completion de profil pour roles operationnels.

### Changements cles
- Envoi d'email d'activation aux `AGENT` et `AGENCY_MANAGER`.
- Verrouillage de navigation tant que le profil requis n'est pas complete (hors super admin).

### Resultat attendu
- Donnees profil plus fiables.
- Processus d'onboarding standardise.

---

## 7) Correctifs mobile (check-in/check-out)

### Objectif
Assurer la continuite fonctionnelle entre check-in et check-out.

### Changements cles
- Suppression d'un alias Babel qui cassait le WebView natif sur mobile.
- Hydratation des donnees de depart (`odometer`, `fuel`, `notes`) depuis payload check-in.

### Resultat attendu
- Signature mobile operationnelle.
- Plus de "kilometrage depart non defini" au check-out.

---

## 8) Industrialisation des tests fonctionnels

### Objectif
Pouvoir rejouer rapidement des scenarios riches de bout en bout.

### Changements cles
- Script de simulation de cycles complets (clients, vehicules, maintenance, reservations, check-in/out).
- Script E2E role AGENT pour verification de permissions et flux autorises.

### Resultat attendu
- Validation plus rapide avant UAT/preprod.
- Regressions detectees plus tot.
