import { test, expect } from '@playwright/test';
import { login, CREDS } from './helpers/auth';
import { gotoAndAssertLoads } from './helpers/assert';

test.describe('Pages publiques', () => {
  test('racine redirige vers /login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login, forgot-password, reset-password accessibles', async ({ page }) => {
    await gotoAndAssertLoads(page, '/login');
    await expect(page.getByText(/MalocAuto/i).first()).toBeVisible();
    await gotoAndAssertLoads(page, '/forgot-password');
    await gotoAndAssertLoads(page, '/reset-password');
  });
});

test.describe('Connexion par rôle (redirection hub)', () => {
  // SUPER_ADMIN est couvert par `02-admin-all-routes` (login + /admin) — évite un double login froid.

  test('COMPANY_ADMIN → /company', async ({ page }) => {
    await login(page, CREDS.companyAdmin.email, CREDS.companyAdmin.password, /\/company/);
    await expect(page).toHaveURL(/\/company/);
  });

  test('AGENCY_MANAGER → /agency', async ({ page }) => {
    await login(page, CREDS.agencyManager.email, CREDS.agencyManager.password, /\/agency/);
    await expect(page).toHaveURL(/\/agency/);
  });

  test('AGENT → /agency', async ({ page }) => {
    await login(page, CREDS.agent.email, CREDS.agent.password, /\/agency/);
    await expect(page).toHaveURL(/\/agency/);
  });
});
