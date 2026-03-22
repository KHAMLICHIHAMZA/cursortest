from __future__ import annotations

from datetime import date
from pathlib import Path


ROOT = Path("C:/Projects/MALOC")
WEB_SHOTS_DIR = ROOT / "docs" / "evidence" / "web-local-html"
LOGIN_SHOTS_DIR = ROOT / "test-screenshots-login-3100"
OUTPUT = ROOT / "docs" / "MALOC_CATALOGUE_VISUEL_CLIENT_2026-03-07.md"


def title_from_name(stem: str) -> str:
    text = stem.replace("-", " ").replace("_", " ").strip()
    text = text.replace("kpi", "KPI").replace("gps", "GPS")
    return text.title()


def grouped_web_images() -> dict[str, list[Path]]:
    groups = {
        "Espace Public": [],
        "Version Admin": [],
        "Version Company": [],
        "Version Agence": [],
        "Autres": [],
    }
    for path in sorted(WEB_SHOTS_DIR.glob("*.png")):
        name = path.stem.lower()
        if name in {"index", "login", "forgot-password", "reset-password"}:
            groups["Espace Public"].append(path)
        elif name.startswith("admin"):
            groups["Version Admin"].append(path)
        elif name.startswith("company"):
            groups["Version Company"].append(path)
        elif name.startswith("agency"):
            groups["Version Agence"].append(path)
        else:
            groups["Autres"].append(path)
    return groups


def login_sequence_images() -> list[Path]:
    if not LOGIN_SHOTS_DIR.exists():
        return []
    return sorted(LOGIN_SHOTS_DIR.glob("*.png"))


def write_catalog() -> None:
    web_groups = grouped_web_images()
    login_images = login_sequence_images()
    total_web = sum(len(v) for v in web_groups.values())

    with OUTPUT.open("w", encoding="utf-8") as f:
        f.write("# MALOC - Catalogue Visuel Client\n\n")
        f.write("![Logo MALOC](../mobile-agent/assets/icon.png)\n\n")
        f.write(f"Date: {date.today().isoformat()}\n\n")
        f.write("## Objectif\n\n")
        f.write(
            "Document de presentation client, non technique, focalise sur les ecrans. "
            "Il montre les modules et composants visibles de l'application par version.\n\n"
        )
        f.write("## Chiffres cles de la galerie\n\n")
        f.write(f"- Captures web integrees: **{total_web}**\n")
        f.write(f"- Sequence connexion integree: **{len(login_images)}**\n")
        f.write("- Format: lecture simple, une capture = un ecran/module\n\n")

        f.write("## 1) Espace Public (authentification)\n\n")
        if login_images:
            for idx, img in enumerate(login_images, start=1):
                # Images outside docs: use explicit relative from docs file
                rel_path = f"../test-screenshots-login-3100/{img.name}"
                f.write(f"### 1.{idx} {title_from_name(img.stem)}\n\n")
                f.write(f"![{img.stem}]({rel_path})\n\n")
        else:
            f.write("- Captures sequence connexion non trouvees.\n\n")

        section_index = 2
        for group_name in ["Version Admin", "Version Company", "Version Agence"]:
            images = web_groups[group_name]
            f.write(f"## {section_index}) {group_name}\n\n")
            if not images:
                f.write("- Aucune capture disponible pour cette section.\n\n")
                section_index += 1
                continue
            for i, img in enumerate(images, start=1):
                rel = img.relative_to(ROOT / "docs").as_posix()
                f.write(f"### {section_index}.{i} {title_from_name(img.stem)}\n\n")
                f.write(f"![{img.stem}]({rel})\n\n")
            section_index += 1

        f.write(f"## {section_index}) Version Mobile (Agent)\n\n")
        f.write(
            "Captures mobiles a completer avec device reel (Android/iOS) pour les ecrans:\n\n"
        )
        mobile_screens = [
            "Login",
            "Liste des reservations",
            "Detail reservation",
            "Check-in",
            "Check-out",
            "Parametres",
        ]
        for screen in mobile_screens:
            f.write(f"- {screen}\n")
        f.write("\n")

        f.write("## Annexes visuelles\n\n")
        f.write("- Dossier captures web: `docs/evidence/web-local-html/`\n")
        f.write("- Dossier captures login: `test-screenshots-login-3100/`\n")
        f.write("- Ce document est volontairement non technique pour usage client/commercial.\n")


if __name__ == "__main__":
    write_catalog()
    print(f"Generated {OUTPUT}")
