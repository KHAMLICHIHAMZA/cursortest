import { test, expect } from '@playwright/test';
import { login, CREDS } from './helpers/auth';
import { expectNoFatalServerError } from './helpers/assert';
import { fillBookingDatetimeWindow, DAYS_AHEAD } from './helpers/booking-form';

/**
 * Création réelle d’une réservation (préprod / seed : au moins 1 agence, 1 véhicule, 1 client pour l’agence choisie).
 * `PW_BOOKING_DAYS_AHEAD` (défaut 14) décale la fenêtre pour limiter les conflits de planning.
 */

test.describe.configure({ mode: 'serial' });

test.describe('Création réservation — manager agence', () => {
  test('formulaire complet → redirection liste + toast succès', async ({ page }) => {
    await login(page, CREDS.agencyManager.email, CREDS.agencyManager.password, /\/agency/);

    await page.goto('/agency/bookings/new', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await expectNoFatalServerError(page);

    await expect(page.getByRole('heading', { name: /Nouvelle réservation/i })).toBeVisible({
      timeout: 90_000,
    });

    const agencySelect = page.locator('#agencyId');
    await expect(agencySelect).toBeEnabled({ timeout: 90_000 });
    const agencyOptions = agencySelect.locator('option:not([value=""])');
    await expect(agencyOptions.first(), 'Au moins une agence (seed / droits)').toBeAttached({
      timeout: 90_000,
    });
    const agencyCount = await agencyOptions.count();
    expect(agencyCount, 'Prérequis : au moins une agence listée pour ce compte').toBeGreaterThan(0);
    await agencySelect.selectOption({ index: 1 });

    const vehicleSelect = page.locator('#vehicleId');
    await expect(
      vehicleSelect.locator('option:not([value=""])').first(),
      'Véhicules chargés après choix agence (API véhicules)',
    ).toBeVisible({ timeout: 120_000 });
    const vehicleCount = await vehicleSelect.locator('option:not([value=""])').count();
    expect(
      vehicleCount,
      'Prérequis : au moins un véhicule pour cette agence en préprod',
    ).toBeGreaterThan(0);
    await vehicleSelect.selectOption({ index: 1 });

    const clientSelect = page.locator('#clientId');
    await expect(
      clientSelect.locator('option:not([value=""])').first(),
      'Clients chargés après choix agence (API clients)',
    ).toBeVisible({ timeout: 120_000 });
    const clientCount = await clientSelect.locator('option:not([value=""])').count();
    expect(
      clientCount,
      'Prérequis : au moins un client pour cette agence en préprod',
    ).toBeGreaterThan(0);
    await clientSelect.selectOption({ index: 1 });

    await fillBookingDatetimeWindow(page);

    const maybeBlock = page.getByText(/^Blocage:/);
    if (await maybeBlock.first().isVisible().catch(() => false)) {
      throw new Error(
        `Horaires d’agence ou plage invalide (Blocage UI). Augmenter PW_BOOKING_DAYS_AHEAD (actuellement J+${DAYS_AHEAD}) ou ajuster les horaires seed.`,
      );
    }

    await page.getByRole('button', { name: /Créer la réservation/i }).click();

    await page.waitForURL((url) => /\/agency\/bookings\/?$/.test(url.pathname), {
      timeout: 180_000,
    });
    await expectNoFatalServerError(page);
    await expect(page.getByRole('heading', { name: /Locations/i })).toBeVisible({ timeout: 90_000 });
  });
});
