import { test, expect } from '@playwright/test';
import { login, CREDS } from './helpers/auth';
import { gotoAndAssertLoads } from './helpers/assert';

test.describe.configure({ mode: 'serial' });

test.describe('Agent — accès agence & restrictions middleware', () => {
  test('parcours complet (une session)', async ({ page }) => {
    await login(page, CREDS.agent.email, CREDS.agent.password, /\/agency/);

    await gotoAndAssertLoads(page, '/agency');
    await gotoAndAssertLoads(page, '/agency/bookings');
    await gotoAndAssertLoads(page, '/agency/vehicles');
    await gotoAndAssertLoads(page, '/agency/clients');

    await page.goto('/agency/invoices', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    expect(new URL(page.url()).pathname).toBe('/agency');

    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page).toHaveURL(/\/agency/);

    await page.goto('/company', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page).toHaveURL(/\/agency/);
  });
});
