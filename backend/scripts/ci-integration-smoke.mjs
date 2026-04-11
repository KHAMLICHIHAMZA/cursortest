#!/usr/bin/env node
/**
 * Smoke d'intégration pour CI : API déjà démarrée (localhost).
 *   node scripts/ci-integration-smoke.mjs
 * Variables :
 *   SMOKE_API_BASE (défaut http://localhost:3000/api/v1)
 *   SMOKE_LOGIN_EMAIL (défaut admin@malocauto.com — compte seed)
 *   SMOKE_LOGIN_PASSWORD (défaut admin123)
 */

const base = (process.env.SMOKE_API_BASE || "http://localhost:3000/api/v1").replace(
  /\/$/,
  "",
);
const loginEmail = process.env.SMOKE_LOGIN_EMAIL || "admin@malocauto.com";
const loginPassword = process.env.SMOKE_LOGIN_PASSWORD || "admin123";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(maxAttempts = 45, delayMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const r = await fetch(`${base}/health`);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await sleep(delayMs);
  }
  throw new Error(
    `API non joignable après ${maxAttempts}s sur ${base}/health`,
  );
}

async function main() {
  await waitForServer();

  const health = await fetch(`${base}/health`);
  if (!health.ok) throw new Error(`GET /health → ${health.status}`);
  const healthJson = await health.json();
  console.log("health:", healthJson);

  const ready = await fetch(`${base}/ready`);
  const readyJson = await ready.json();
  if (!ready.ok || readyJson.status !== "ready") {
    throw new Error(
      `GET /ready → ${ready.status} ${JSON.stringify(readyJson)}`,
    );
  }
  console.log("ready:", readyJson);

  const loginRes = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: loginEmail, password: loginPassword }),
  });
  const loginText = await loginRes.text();
  if (!loginRes.ok) {
    throw new Error(`POST /auth/login → ${loginRes.status}: ${loginText.slice(0, 500)}`);
  }
  const loginJson = JSON.parse(loginText);
  if (!loginJson.access_token) {
    throw new Error("POST /auth/login : pas d'access_token dans la réponse");
  }
  console.log(
    "login OK:",
    loginJson.user?.email || loginEmail,
    `(${loginJson.user?.role || "?"})`,
  );
  console.log("ci-integration-smoke: OK");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
