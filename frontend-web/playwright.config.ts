import { defineConfig, devices } from '@playwright/test';

/**
 * Prérequis locaux : backend (ex. http://127.0.0.1:3000) + Next (ex. :3001)
 * avec NEXT_PUBLIC_API_URL pointant sur l’API.
 *
 *   cd frontend-web && npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
