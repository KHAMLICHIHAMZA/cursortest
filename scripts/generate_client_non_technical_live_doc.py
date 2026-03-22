from __future__ import annotations

from datetime import date
from pathlib import Path


ROOT = Path("C:/Projects/MALOC")
BASE = ROOT / "docs" / "evidence" / "live-role-screens"
OUTPUT = ROOT / "docs" / "MALOC_PRESENTATION_CLIENT_TOUTES_VERSIONS_2026-03-07.md"


SECTION_CONFIG = [
    ("public", "Version Publique"),
    ("super_admin", "Version Admin (Super Admin)"),
    ("company_admin", "Version Company (Direction Entreprise)"),
    ("agency_manager", "Version Agence (Manager)"),
    ("agent", "Version Agent (Terrain)"),
]


LABELS = {
    "home": "Accueil",
    "login": "Connexion",
    "forgot-password": "Mot de passe oublie",
    "reset-password": "Reinitialisation mot de passe",
    "admin": "Dashboard Admin",
    "admin_companies": "Gestion des entreprises",
    "admin_agencies": "Gestion des agences",
    "admin_users": "Gestion des utilisateurs",
    "admin_subscriptions": "Gestion des abonnements",
    "admin_plans": "Gestion des offres",
    "admin_settings": "Parametres plateforme",
    "admin_company-health": "Sante des entreprises",
    "admin_notifications": "Notifications globales",
    "admin_profile": "Profil administrateur",
    "company": "Dashboard entreprise",
    "company_agencies": "Agences de l'entreprise",
    "company_users": "Utilisateurs de l'entreprise",
    "company_analytics": "Analyse et performance",
    "company_planning": "Planning entreprise",
    "company_notifications": "Notifications entreprise",
    "company_profile": "Profil entreprise",
    "agency": "Dashboard agence",
    "agency_bookings": "Reservations",
    "agency_clients": "Clients",
    "agency_vehicles": "Vehicules",
    "agency_maintenance": "Maintenance",
    "agency_planning": "Planning agence",
    "agency_fines": "Amendes",
    "agency_invoices": "Factures",
    "agency_contracts": "Contrats",
    "agency_charges": "Charges et depenses",
    "agency_kpi": "KPI de pilotage",
    "agency_gps": "Suivi GPS",
    "agency_gps-kpi": "KPI GPS",
    "agency_journal": "Journal d'activite",
    "agency_notifications": "Notifications agence",
    "agency_profile": "Profil utilisateur",
}


def friendly(stem: str) -> str:
    if stem in LABELS:
        return LABELS[stem]
    return stem.replace("_", " ").replace("-", " ").title()


def write_doc() -> None:
    with OUTPUT.open("w", encoding="utf-8") as f:
        f.write("# MALOC - Presentation Client (Toutes Versions)\n\n")
        f.write("![Logo MALOC](../mobile-agent/assets/icon.png)\n\n")
        f.write(f"Date: {date.today().isoformat()}\n\n")
        f.write("## Objectif du document\n\n")
        f.write(
            "Ce document est volontairement simple et non technique. "
            "Il montre les ecrans de l'application MALOC par type d'utilisateur, "
            "avec une presentation claire orientee metier.\n\n"
        )

        total = 0
        for key, _ in SECTION_CONFIG:
            total += len([p for p in (BASE / key).glob("*.png")])

        f.write("## Couverture visuelle\n\n")
        f.write(f"- Captures live integrees: **{total}**\n")
        f.write("- Versions couvertes: Public, Admin, Company, Agence Manager, Agent.\n")
        f.write("- Focus: ecrans, modules, parcours utilisateur.\n\n")

        f.write("## Lecture rapide de la valeur\n\n")
        f.write("- Version Admin: pilotage global de la plateforme SAAS.\n")
        f.write("- Version Company: gouvernance de l'entreprise et de ses agences.\n")
        f.write("- Version Agence: operations quotidiennes et performance locale.\n")
        f.write("- Version Agent: execution terrain rapide et guidee.\n\n")

        for idx, (key, title) in enumerate(SECTION_CONFIG, start=1):
            folder = BASE / key
            images = sorted([p for p in folder.glob("*.png") if p.is_file()])
            f.write(f"## {idx}) {title}\n\n")
            if not images:
                f.write("- Aucune capture disponible pour cette version.\n\n")
                continue

            f.write(f"Nombre d'ecrans presentes: **{len(images)}**\n\n")
            for i, image in enumerate(images, start=1):
                rel = image.relative_to(ROOT / "docs").as_posix()
                f.write(f"### {idx}.{i} {friendly(image.stem)}\n\n")
                f.write("Description client:\n")
                f.write(
                    f"- Cet ecran fait partie du module **{friendly(image.stem)}**.\n"
                    "- Il permet une utilisation simple, rapide et orientee resultat.\n"
                    "- L'interface privilegie la clarte pour reduire les erreurs.\n\n"
                )
                f.write(f"![{image.stem}]({rel})\n\n")

        f.write("## Version Mobile\n\n")
        f.write(
            "Les captures mobiles doivent etre ajoutees depuis device reel "
            "(Android/iOS) pour finaliser le dossier client complet.\n\n"
        )
        f.write("Ecrans attendus:\n")
        f.write("- Connexion mobile\n")
        f.write("- Liste des reservations\n")
        f.write("- Detail reservation\n")
        f.write("- Check-in\n")
        f.write("- Check-out\n")
        f.write("- Parametres\n\n")

        f.write("## Conclusion client\n\n")
        f.write(
            "MALOC propose une couverture fonctionnelle complete, avec des interfaces "
            "adaptees a chaque profil et un parcours clair sur web et mobile.\n"
        )


if __name__ == "__main__":
    write_doc()
    print(f"Generated {OUTPUT}")
