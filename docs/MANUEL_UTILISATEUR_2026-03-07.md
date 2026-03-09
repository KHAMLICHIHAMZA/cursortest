# Manuel utilisateur - Operations agence (2026-03-07)

## 1. Connexion et profil

- Connectez-vous avec vos identifiants recus par email d'activation.
- Si le profil est incomplet, completez les champs obligatoires avant de poursuivre.
- Les super admins ne sont pas bloques par ce verrouillage.

## 2. Reservations - selon votre role

### AGENT
- Peut consulter les reservations.
- Peut faire check-in/check-out.
- Ne peut pas creer, modifier, supprimer une reservation.

### AGENCY_MANAGER
- Peut gerer (creer/modifier/supprimer) les reservations.
- Peut executer la cloture financiere.
- Recoit les notifications de cloture en attente.

## 3. Check-in / Check-out

### Check-in
- Renseigner kilometrage depart, niveau carburant, notes, photos/signature.
- Valider et enregistrer.

### Check-out
- Verifier que les informations de depart sont bien affichees.
- Saisir les donnees de retour.
- Finaliser la reservation.
- Si une cloture financiere est necessaire, une notification est creee pour le manager.

## 4. Charges & depenses

- Selectionner la **Portee** (Vehicule/Agence/Company).
- Selectionner le **Centre de cout** si necessaire.
- La **Categorie** disponible s'ajuste automatiquement.
- Choisir la **Periodicite** (`Aucune`, `Mensuelle`, `Trimestrielle`, `Annuelle`).
- Enregistrer la charge.

## 5. Filtres et export CSV

- Appliquer les filtres souhaites (dates, portee, centre de cout, categorie, vehicule).
- Cliquer **Exporter** pour generer un CSV selon les filtres actifs.
- Ouvrir le fichier dans Excel (format UTF-8 compatible).

## 6. KPI

- Consulter les charges par centre de cout.
- Verifier l'allocation des charges partagees dans la rentabilite vehicule.

## 7. Erreurs frequentes et solutions

- **403 sur reservation**: verifier votre role.
- **Donnees non a jour**: recharger la page, puis verifier si la mutation a bien ete enregistree.
- **Signature mobile indisponible**: verifier version app/mobile build et permissions.
- **Kilometrage depart absent au check-out**: refaire un check-in complet puis synchroniser.
