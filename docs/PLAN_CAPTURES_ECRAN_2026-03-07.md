# Plan captures d'ecran - dossier de preuve (2026-03-07)

## Convention de nommage

`[module]_[scenario]_[etat]_[date].png`

Exemples:
- `booking_agent_create_forbidden_2026-03-07.png`
- `charges_filter_scope_costcenter_2026-03-07.png`

## Captures obligatoires

### A. Permissions booking
- Ecran tentative creation reservation par AGENT + message d'erreur.
- Ecran tentative modification reservation par AGENT + message d'erreur.
- Ecran check-in reussi par AGENT.
- Ecran check-out reussi par AGENT.

### B. Cloture financiere et notifications
- Ecran bouton cloture financiere visible pour AGENCY_MANAGER.
- Ecran refus acces cloture pour AGENT.
- Ecran centre notifications montrant "cloture en attente".
- Ecran preuve absence de doublon de notification pour meme booking.

### C. Charges & Depenses
- Ecran formulaire avec scope `VEHICLE` et categories limitees vehicule.
- Ecran formulaire avec scope `AGENCY` + centre de cout et categories associees.
- Ecran periodicite avec options `NONE/MONTHLY/QUARTERLY/YEARLY`.
- Ecran liste avec filtres intelligents actifs.

### D. Export
- Ecran action bouton `Exporter`.
- Ecran/preuve fichier CSV genere.
- Ecran ouverture CSV dans Excel avec caracteres corrects.

### E. Mobile
- Ecran signature mobile fonctionnelle.
- Ecran check-out avec `odometerStart/fuelStart/notesStart` hydratés.

## Organisation recommandees des preuves

- Dossier local: `docs/evidence/2026-03-07/`
- Sous-dossiers:
  - `permissions/`
  - `notifications/`
  - `charges/`
  - `export/`
  - `mobile/`

## Statut

- Plan de captures: PRET.
- Inserer les captures finales de l'environnement cible (UAT/preprod) avant diffusion externe.
