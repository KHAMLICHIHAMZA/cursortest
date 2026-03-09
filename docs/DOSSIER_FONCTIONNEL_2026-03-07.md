# Dossier fonctionnel - MALOC (mise a jour 2026-03-07)

## Contexte
Cette livraison consolide le module Charges & Depenses, renforce les regles de reservation par role, et fiabilise les flux terrain (web + mobile) autour du check-in/check-out et de la cloture financiere.

## Perimetre fonctionnel couvert

- Charges & Depenses: portee, centre de cout, categories explicites, periodicite visible, export CSV.
- Reservation: droits role-based (AGENT limite), check-in/check-out conserves.
- Cloture financiere: execution restreinte + notification de tache en attente.
- Onboarding: activation email et profil obligatoire pour roles agence.
- Mobile agent: signature et reprise des donnees de depart.

## Regles metier clees

- **Reservations**
  - `AGENT` ne peut pas creer/modifier/supprimer une reservation.
  - `AGENT` peut effectuer check-in/check-out.
  - Cloture financiere reservee aux roles agence autorises.

- **Charges**
  - La categorie autorisee depend de la `Portee` et du `Centre de cout`.
  - Les charges partagees agence/company sont allouees proportionnellement dans la rentabilite vehicule.
  - La periodicite est explicite et non cachee dans le formulaire.

- **Notifications**
  - Apres check-out, une notification signale la cloture financiere en attente.
  - Aucune duplication de notification pour le meme booking/recipient.

- **Onboarding**
  - Les roles agence recoivent un email d'activation.
  - Profil incomplet -> acces restreint jusqu'a completion (hors super admin).

## Cas d'usage principaux

1. **Gestionnaire agence**
   - Gere les reservations.
   - Recoit les notifications de cloture en attente.
   - Execute la cloture financiere.

2. **Agent**
   - Realise check-in/check-out terrain.
   - Ne peut pas modifier la gouvernance booking.

3. **Admin / supervision**
   - Suit KPI avec charges par centre de cout.
   - Controle coherence des charges et exports.

## Criteres d'acceptation

- Les restrictions de droits sont appliquees et testees (`403` sur actions interdites).
- Les notifications de cloture sont emises une seule fois par cas.
- Le module Charges ne propose pas de categories incoherentes.
- Le CSV exporte est lisible directement dans Excel.
- Mobile: signature operationnelle et donnees check-in visibles au check-out.

## Risques residuels

- Donnees historiques non conformes aux nouvelles regles categorie/scope.
- Environment local non relance apres regeneration Prisma.
- Divergence de parametrage entre environnements (dev/preprod/prod).

## Recommandations

- Verifier les profils/roles existants avant mise en production.
- Executer scripts de simulation sur un environnement isole.
- Conserver le checklist UAT comme gate avant release.
