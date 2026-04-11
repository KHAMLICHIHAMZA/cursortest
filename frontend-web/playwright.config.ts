import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contre le déploiement (préprod par défaut).
 * Surcharge : PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e
 */
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() ||
  'https://v0-cursortest.vercel.app';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Cold start Render / réseau : un retry évite les faux négatifs.
  retries: process.env.PW_NO_RETRIES ? 0 : 2,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 60_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 90_000,
    navigationTimeout: 120_000,
    ignoreHTTPSErrors: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
