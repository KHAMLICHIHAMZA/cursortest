import { test, expect } from '@playwright/test';
import {
  apiBaseUrl,
  loginAdminAccessToken,
  fetchUsersLight,
  firstUserByRole,
  type UserLightRow,
} from './helpers/api';
import { loginAsAdmin } from './helpers/auth-ui';
import {
  goToAdminUsersAndImpersonateByEmail,
  stopImpersonationAndExpectAdminUsers,
} from './helpers/admin-impersonation';

/**
 * Super Admin : impersonation UI puis « Revenir en Super Admin ».
 * Prérequis : `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (sinon defaults),
 * API joignable (`PLAYWRIGHT_API_URL`), Next `PLAYWRIGHT_BASE_URL`.
 */
test.describe('Admin — impersonation aller-retour', () => {
  test.setTimeout(180_000);

  let adminToken: string | null = null;
  let usersLight: UserLightRow[] = [];

  test.beforeAll(async ({ request }) => {
    adminToken = await loginAdminAccessToken(request);
    if (!adminToken) return;
    usersLight = await fetchUsersLight(request, adminToken);
  });

  test('API : login admin + liste utilisateurs', async () => {
    expect(adminToken, `Login admin refusé — vérifiez ${apiBaseUrl()} et E2E_ADMIN_*`).toBeTruthy();
    expect(usersLight.length, 'Aucun utilisateur dans /users/light').toBeGreaterThan(0);
  });

  test('round-trip COMPANY_ADMIN', async ({ page }) => {
    test.skip(!adminToken, 'Pas de token admin');
    const u = firstUserByRole(usersLight, 'COMPANY_ADMIN');
    test.skip(!u, 'Aucun COMPANY_ADMIN dans les résultats API');

    await loginAsAdmin(page);
    await goToAdminUsersAndImpersonateByEmail(page, u.email);
    await expect(page).toHaveURL(/\/company(\/|$)/);
    await stopImpersonationAndExpectAdminUsers(page);
  });

  test('round-trip AGENCY_MANAGER', async ({ page }) => {
    test.skip(!adminToken, 'Pas de token admin');
    const u = firstUserByRole(usersLight, 'AGENCY_MANAGER');
    test.skip(!u, 'Aucun AGENCY_MANAGER dans les résultats API');

    await loginAsAdmin(page);
    await goToAdminUsersAndImpersonateByEmail(page, u.email);
    await expect(page).toHaveURL(/\/agency(\/|$)/);
    await stopImpersonationAndExpectAdminUsers(page);
  });

  test('round-trip AGENT', async ({ page }) => {
    test.skip(!adminToken, 'Pas de token admin');
    const u = firstUserByRole(usersLight, 'AGENT');
    test.skip(!u, 'Aucun AGENT dans les résultats API');

    await loginAsAdmin(page);
    await goToAdminUsersAndImpersonateByEmail(page, u.email);
    await expect(page).toHaveURL(/\/agency(\/|$)/);
    await stopImpersonationAndExpectAdminUsers(page);
  });
});
