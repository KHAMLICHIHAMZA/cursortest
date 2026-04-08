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

if (isPreprod) {
  process.env.PLAYWRIGHT_BASE_URL ??= 'https://v0-cursortest.vercel.app';
  process.env.PLAYWRIGHT_API_URL ??= 'https://malocauto-api.onrender.com/api/v1';
}

/**
 * Local (défaut) : backend + Next locaux.
 *
 * Préprod : `npm run test:e2e:preprod` (ou `E2E_TARGET=preprod`)
 * — front Vercel + API OnRender par défaut, surcharge possible via `.env.e2e.preprod`.
 *
 * Variables :
 * - PLAYWRIGHT_BASE_URL, PLAYWRIGHT_API_URL
 * - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (impersonation)
 * - E2E_AGENT_EMAIL / E2E_AGENT_PASSWORD (terrain agence)
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
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    navigationTimeout: isPreprod ? 60_000 : 30_000,
    actionTimeout: isPreprod ? 30_000 : 15_000,
  },
  projects: [{ name: isPreprod ? 'chromium-preprod' : 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
