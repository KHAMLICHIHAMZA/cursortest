#!/usr/bin/env node
/**
 * Vérification lecture seule contre une API déployée (staging / prod).
 * À lancer sur VOTRE machine ; l’agent CI n’a pas accès à votre prod.
 *
 *   set SMOKE_API_BASE=https://votre-api.onrender.com/api/v1
 *   node scripts/smoke-remote-api.mjs
 *
 * Pour tester le chemin GET /companies/:id (include users → colonnes User.*), ajoutez un JWT super-admin :
 *
 *   set SMOKE_JWT=eyJ...
 *   set SMOKE_COMPANY_ID=clxx...
 *   node scripts/smoke-remote-api.mjs
 */

const base = process.env.SMOKE_API_BASE?.replace(/\/$/, "");
if (!base) {
  console.error(
    "Définissez SMOKE_API_BASE (ex. https://xxx.onrender.com/api/v1)",
  );
  process.exit(1);
}

async function main() {
  const health = await fetch(`${base}/health`);
  if (!health.ok) {
    throw new Error(`GET /health → ${health.status}`);
  }
  console.log("health:", await health.json());

  const ready = await fetch(`${base}/ready`);
  const readyJson = await ready.json();
  if (!ready.ok || readyJson.status !== "ready") {
    throw new Error(`GET /ready → ${ready.status} ${JSON.stringify(readyJson)}`);
  }
  console.log("ready:", readyJson);

  const token = process.env.SMOKE_JWT;
  const companyId = process.env.SMOKE_COMPANY_ID;
  if (token && companyId) {
    const r = await fetch(`${base}/companies/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await r.text();
    if (!r.ok) {
      throw new Error(
        `GET /companies/${companyId} → ${r.status}: ${text.slice(0, 800)}`,
      );
    }
    const data = JSON.parse(text);
    if (!Array.isArray(data.users)) {
      throw new Error("Réponse company sans tableau users");
    }
    console.log(
      `GET /companies/:id OK (${data.users.length} user(s)) — chemin Prisma users inclus.`,
    );
  } else {
    console.log(
      "(Optionnel) SMOKE_JWT + SMOKE_COMPANY_ID pour valider la fiche société après migrate.",
    );
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
