import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/** Charge `frontend-web/.env.e2e.preprod` si présent (non commité). */
function loadOptionalE2EPreprodEnv(): void {
  const full = path.resolve(__dirname, '.env.e2e.preprod');
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"'))
      || (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadOptionalE2EPreprodEnv();

const isPreprod = process.env.E2E_TARGET === 'preprod';
/** Préprod sans mot de passe agent : globalSetup admin → impersonation + storageState pour les specs agence uniquement. */
const usePreprodAgentBootstrap = isPreprod && !process.env.E2E_AGENT_PASSWORD;

if (isPreprod) {
  process.env.PLAYWRIGHT_BASE_URL ??= 'https://v0-cursortest.vercel.app';
  process.env.PLAYWRIGHT_API_URL ??= 'https://malocauto-api.onrender.com/api/v1';
}

const preprodAgentStorage = path.join(__dirname, 'e2e', '.auth', 'preprod-agent.json');

/**
 * Local (défaut) : backend + Next locaux.
 *
 * Préprod : `npm run test:e2e:preprod` (ou `E2E_TARGET=preprod`)
 * — front Vercel + API OnRender par défaut, surcharge possible via `.env.e2e.preprod`.
 *
 * Variables :
 * - PLAYWRIGHT_BASE_URL, PLAYWRIGHT_API_URL
 * - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (impersonation ; sans E2E_AGENT_PASSWORD,
 *   globalSetup complète le profil agent via PATCH /users/me puis écrit storageState)
 * - E2E_AGENT_EMAIL / E2E_AGENT_PASSWORD (optionnel ; sinon bootstrap admin ci-dessus)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: isPreprod ? 180_000 : 30_000,
  expect: {
    timeout: isPreprod ? 25_000 : 5_000,
  },
  globalSetup: usePreprodAgentBootstrap ? './e2e/global-setup-preprod-agent.ts' : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    navigationTimeout: isPreprod ? 60_000 : 30_000,
    actionTimeout: isPreprod ? 30_000 : 15_000,
  },
  projects: usePreprodAgentBootstrap
    ? [
        {
          name: 'chromium-preprod-impersonation',
          testMatch: /impersonation-roundtrip\.spec\.ts/,
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'chromium-preprod-agency',
          testMatch: /agency-.*\.spec\.ts/,
          use: {
            ...devices['Desktop Chrome'],
            storageState: preprodAgentStorage,
          },
        },
      ]
    : [
        {
          name: isPreprod ? 'chromium-preprod' : 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ],
});
