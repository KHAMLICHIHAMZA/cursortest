from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import List


ROOT = Path("C:/Projects/MALOC")
WEB_APP_DIR = ROOT / "frontend-web" / "app"
WEB_SHOTS_DIR = ROOT / "docs" / "evidence" / "web-local-html"
OUTPUT_FILE = ROOT / "docs" / "MALOC_DOSSIER_MOA_COMMERCIAL_ECRANS_2026-03-07.md"


@dataclass
class RouteDoc:
    route: str
    audience: str
    objective: str
    actions: List[str]
    controls: List[str]
    screenshot_rel: str | None


def route_from_page_file(file_path: Path) -> str:
    rel = file_path.relative_to(WEB_APP_DIR).as_posix()
    route = "/" + rel.replace("/page.tsx", "")
    if route == "/":
        return route
    return route.replace("//", "/")


def screenshot_name_from_route(route: str) -> str:
    if route == "/":
        return "index.png"
    clean = route.strip("/")
    clean = clean.replace("/", "_").replace("[", "").replace("]", "")
    return f"{clean}.png"


def audience_for_route(route: str) -> str:
    if route.startswith("/admin"):
        return "Direction / Super Admin / Backoffice central"
    if route.startswith("/agency"):
        return "Equipe agence (manager + operations + finance locale)"
    if route.startswith("/company"):
        return "Direction company / pilotage multi-agences"
    return "Utilisateur public / authentification"


def objective_for_route(route: str) -> str:
    r = route.lower()
    keyword_map = [
        ("bookings", "Piloter le cycle de reservation de bout en bout."),
        ("charges", "Controler les depenses et la structure des couts."),
        ("kpi", "Suivre la performance et soutenir la decision business."),
        ("clients", "Fiabiliser la base client et la conformite documentaire."),
        ("vehicles", "Gerer le parc vehicule et sa disponibilite."),
        ("maintenance", "Planifier et tracer la maintenance pour limiter les risques."),
        ("fines", "Traiter les amendes avec traçabilite et pieces associees."),
        ("invoices", "Suivre la facturation et les encaissements associes."),
        ("contracts", "Superviser la relation contractuelle avec preuves."),
        ("planning", "Visualiser la charge operationnelle et l'occupation."),
        ("notifications", "Orchestrer les actions en attente via alertes ciblees."),
        ("analytics", "Consolider les indicateurs de pilotage company."),
        ("profile", "Garantir l'exactitude des informations utilisateur."),
        ("users", "Administrer les comptes, roles et habilitations."),
        ("agencies", "Structurer les unites operationnelles et leur gouvernance."),
        ("companies", "Gerer les entites clientes SAAS et leur cycle de vie."),
        ("plans", "Piloter les offres SAAS et regles de montee en charge."),
        ("subscriptions", "Superviser les abonnements et l'etat contractuel."),
        ("settings", "Configurer les parametres structurants de la plateforme."),
        ("company-health", "Evaluer la sante des comptes et risques d'exploitation."),
        ("gps", "Superviser la telemetrie et les informations de deplacement."),
        ("journal", "Assurer la traçabilite des operations metier."),
        ("forgot-password", "Reinitialiser l'acces utilisateur en securite."),
        ("reset-password", "Finaliser la reprise d'acces avec controle."),
        ("login", "Authentifier l'utilisateur et proteger l'entree applicative."),
    ]
    for key, text in keyword_map:
        if key in r:
            return text
    if route == "/":
        return "Point d'entree vers le parcours de connexion et espaces roles."
    return "Donner une vue operationnelle du domaine concerne."


def actions_for_route(route: str) -> List[str]:
    base = [
        "Consulter les donnees et verifier les statuts cles.",
        "Executer l'action metier principale de l'ecran.",
        "Declencher les transitions de workflow selon habilitation.",
    ]
    if "/new" in route:
        base[1] = "Creer un nouvel enregistrement conforme aux regles metier."
    if "[id]" in route:
        base[1] = "Modifier un enregistrement existant avec traçabilite."
    if "kpi" in route or "analytics" in route:
        base[1] = "Analyser les indicateurs et arbitrer les decisions."
    return base


def controls_for_route(route: str) -> List[str]:
    controls = [
        "Controle d'acces par role et permissions.",
        "Validation des donnees cote serveur et cote interface.",
        "Journalisation des actions critiques et erreurs metier.",
    ]
    if "bookings" in route:
        controls.append("Respect des contraintes disponibilite, dates et autorisations.")
    if "charges" in route:
        controls.append("Cohesion portee/centre de cout/categorie avant enregistrement.")
    return controls


def collect_routes() -> List[str]:
    pages = sorted(WEB_APP_DIR.rglob("page.tsx"))
    return [route_from_page_file(p) for p in pages]


def build_route_doc(route: str) -> RouteDoc:
    shot_name = screenshot_name_from_route(route)
    shot_path = WEB_SHOTS_DIR / shot_name
    screenshot_rel = None
    if shot_path.exists():
        screenshot_rel = f"evidence/web-local-html/{shot_name}"
    return RouteDoc(
        route=route,
        audience=audience_for_route(route),
        objective=objective_for_route(route),
        actions=actions_for_route(route),
        controls=controls_for_route(route),
        screenshot_rel=screenshot_rel,
    )


def write_doc(routes: List[RouteDoc]) -> None:
    today = date.today().isoformat()
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        f.write("# MALOC - Dossier MOA / Commercial / Direction (Ecrans)\n\n")
        f.write("![Logo MALOC](../mobile-agent/assets/icon.png)\n\n")
        f.write(f"Date: {today}\n\n")
        f.write("## Positionnement executif\n\n")
        f.write(
            "Ce document est concu pour un usage direction, MOA et commercial. "
            "Il presente la valeur metier du SAAS MALOC, puis detaille chaque ecran "
            "avec objectif, usage, controles et preuve visuelle.\n\n"
        )
        f.write("## Synthese managériale\n\n")
        f.write("- Vision: plateforme SAAS de pilotage complet location, finance et operations.\n")
        f.write("- Valeur business: reduction des erreurs, acceleration des cycles, meilleure gouvernance.\n")
        f.write("- Valeur commerciale: argumentaire clair par role (admin/company/agence/agent).\n")
        f.write("- Valeur MOA: formalisation des besoins, regles, preuves et points de controle.\n\n")

        total = len(routes)
        with_shot = sum(1 for r in routes if r.screenshot_rel)
        without_shot = total - with_shot
        f.write("## Couverture des captures\n\n")
        f.write(f"- Ecrans web inventoried: **{total}**\n")
        f.write(f"- Captures web disponibles automatiquement: **{with_shot}**\n")
        f.write(f"- Captures manquantes (souvent pages dynamiques): **{without_shot}**\n\n")

        f.write("## Catalogue ecran par ecran (Web)\n\n")
        for i, r in enumerate(routes, start=1):
            f.write(f"### {i}. `{r.route}`\n\n")
            f.write(f"- **Public cible:** {r.audience}\n")
            f.write(f"- **Objectif metier:** {r.objective}\n")
            f.write("- **Actions principales:**\n")
            for action in r.actions:
                f.write(f"  - {action}\n")
            f.write("- **Controles et conformite:**\n")
            for control in r.controls:
                f.write(f"  - {control}\n")
            if r.screenshot_rel:
                f.write(f"- **Capture:** `{r.screenshot_rel}`\n\n")
                f.write(f"![Screen {r.route}]({r.screenshot_rel})\n\n")
            else:
                f.write("- **Capture:** A completer (ecran dynamique / contexte connecte requis).\n\n")

        f.write("## Parcours mobile - ecrans de reference\n\n")
        mobile_screens = [
            "LanguageSelectionScreen",
            "LoginScreen",
            "ForgotPasswordScreen",
            "BookingsScreen",
            "BookingDetailsScreen",
            "CheckInScreen",
            "CheckOutScreen",
            "CreateBookingScreen",
            "SettingsScreen",
        ]
        for screen in mobile_screens:
            f.write(f"- `{screen}`: capture et commentaire metier a joindre dans `docs/evidence/mobile/`.\n")
        f.write("\n")

        f.write("## Plan d'action final pour un dossier client-ready\n\n")
        f.write("- Completer les captures manquantes des routes dynamiques `[id]` en session connectee.\n")
        f.write("- Completer les captures mobiles reelles depuis device Expo/Android/iOS.\n")
        f.write("- Ajouter, sous chaque capture, un commentaire de valeur metier et KPI associe.\n")
        f.write("- Exporter ce dossier en PDF avec pagination executive (couverture, sommaire, annexes).\n")


def main() -> None:
    route_docs = [build_route_doc(route) for route in collect_routes()]
    write_doc(route_docs)
    print(f"Generated {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
