import { test, expect } from '@playwright/test';
import { login, CREDS } from './helpers/auth';
import { expectNoFatalServerError } from './helpers/assert';

/**
 * Parcours métier (smoke) : login → écrans clés avec assertions sur titres / CTA,
 * en complément des specs « toutes les routes » (02–05).
 */

test.describe('Parcours métier — super admin', () => {
  test('login → dashboard → liste entreprises', async ({ page }) => {
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password, /\/admin/);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /Tableau de bord Admin/i })).toBeVisible({
      timeout: 90_000,
    });

    await page.goto('/admin/companies', { waitUntil: 'domcontentloaded' });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /Entreprises/i })).toBeVisible({ timeout: 90_000 });
  });
});

test.describe('Parcours métier — admin entreprise', () => {
  test('login → cockpit → agences et utilisateurs', async ({ page }) => {
    await login(page, CREDS.companyAdmin.email, CREDS.companyAdmin.password, /\/company/);

    await page.goto('/company', { waitUntil: 'domcontentloaded' });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /Tableau de bord Entreprise/i })).toBeVisible({
      timeout: 90_000,
    });

    await page.goto('/company/agencies', { waitUntil: 'domcontentloaded' });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /^Agences$/i })).toBeVisible({ timeout: 90_000 });

    await page.goto('/company/users', { waitUntil: 'domcontentloaded' });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /^Utilisateurs$/i })).toBeVisible({ timeout: 90_000 });
  });
});

test.describe('Parcours métier — responsable agence', () => {
  test('login → locations → nouvelle réservation (formulaire)', async ({ page }) => {
    await login(page, CREDS.agencyManager.email, CREDS.agencyManager.password, /\/agency/);

    await page.goto('/agency/bookings', { waitUntil: 'domcontentloaded' });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /Locations/i })).toBeVisible({ timeout: 90_000 });

    await page.getByRole('link', { name: /Nouvelle réservation/i }).click();
    await page.waitForURL(/\/agency\/bookings\/new/, { timeout: 90_000 });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /Nouvelle réservation/i })).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByRole('button', { name: /Créer la réservation/i })).toBeVisible();
  });
});

test.describe('Parcours métier — agent', () => {
  test('login → liste locations', async ({ page }) => {
    await login(page, CREDS.agent.email, CREDS.agent.password, /\/agency/);

    await page.goto('/agency/bookings', { waitUntil: 'domcontentloaded' });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /Locations/i })).toBeVisible({ timeout: 90_000 });
  });
});
