import { test, expect } from '@playwright/test';
import { resolveE2EAgentApiToken, apiBaseUrl } from './helpers/api';
import { loginAsAgent } from './helpers/auth-ui';

/**
 * Sans réservation métier : vérifie seulement login agent + écran Locations.
 * Pour agency-terrain.spec.ts en préprod : définir E2E_AGENT_EMAIL / E2E_AGENT_PASSWORD
 * et disposer d’au moins une réservation CONFIRMED éligible (permis).
 */
test('agent : login API + UI et liste des locations', async ({ page, request }) => {
  const token = await resolveE2EAgentApiToken(request);
  test.skip(!token, `Token agent API absent (${apiBaseUrl()}) — préprod : mot de passe E2E_AGENT_PASSWORD ou globalSetup admin/impersonate.`);

  await loginAsAgent(page);
  await page.goto('/agency/bookings');
  await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible({
    timeout: 30_000,
  });
});
