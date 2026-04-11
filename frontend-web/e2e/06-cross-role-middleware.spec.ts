import { test, expect } from '@playwright/test';
import { login, CREDS } from './helpers/auth';

test.describe('Middleware RBAC', () => {
  test('COMPANY_ADMIN accédant à /admin est renvoyé vers /company', async ({ page }) => {
    await login(page, CREDS.companyAdmin.email, CREDS.companyAdmin.password, /\/company/);
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page).toHaveURL(/\/company/);
  });

  test('AGENCY_MANAGER accédant à /admin est renvoyé vers /agency', async ({ page }) => {
    await login(page, CREDS.agencyManager.email, CREDS.agencyManager.password, /\/agency/);
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page).toHaveURL(/\/agency/);
  });

  test('SUPER_ADMIN peut ouvrir /company et /agency', async ({ page }) => {
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password, /\/admin/);
    await page.goto('/company', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page).toHaveURL(/\/company/);
    await page.goto('/agency', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page).toHaveURL(/\/agency/);
  });
});
