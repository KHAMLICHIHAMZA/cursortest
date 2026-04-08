import { test, expect } from '@playwright/test';
import { loginAccessToken, apiBaseUrl } from './helpers/api';
import { loginAsAgent } from './helpers/auth-ui';

/**
 * Sans réservation métier : vérifie seulement login agent + écran Locations.
 * Pour agency-terrain.spec.ts en préprod : définir E2E_AGENT_EMAIL / E2E_AGENT_PASSWORD
 * et disposer d’au moins une réservation CONFIRMED éligible (permis).
 */
test('agent : login API + UI et liste des locations', async ({ page, request }) => {
  const token = await loginAccessToken(request);
  test.skip(!token, `Login agent API échoue (${apiBaseUrl()}) — renseigner E2E_AGENT_* pour la préprod.`);

  await loginAsAgent(page);
  await page.goto('/agency/bookings');
  await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible({
    timeout: 30_000,
  });
});
