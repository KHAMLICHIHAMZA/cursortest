import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { loginAsAdmin } from './auth-ui';

function authMeResponsePromise(page: Page) {
  return page.waitForResponse(
    (r) =>
      r.request().method() === 'GET'
      && /\/auth\/me(\?|$)/i.test(r.url())
      && !r.url().includes('/me/'),
    { timeout: 60_000 },
  );
}

/** Charge /admin/users et attend GET /auth/me 200 + titre liste. */
export async function ensureAdminUsersListVisible(page: Page): Promise<void> {
  const mePromise = authMeResponsePromise(page);
  await page.goto('/admin/users');
  const res = await mePromise;
  expect(
    res.status(),
    `GET /auth/me attendu 200 (alignez NEXT_PUBLIC_API_URL du Next avec PLAYWRIGHT_API_URL), reçu ${res.status()}`,
  ).toBe(200);
  await expect(page.getByRole('heading', { name: 'Utilisateurs' })).toBeVisible({
    timeout: 25_000,
  });
}

/** Recherche par email (debounced côté UI) puis clic sur le premier bouton d’impersonation Super Admin. */
export async function goToAdminUsersAndImpersonateByEmail(
  page: Page,
  email: string,
): Promise<void> {
  await ensureAdminUsersListVisible(page);
  const search = page.getByRole('searchbox', { name: 'Rechercher un utilisateur...' });
  await search.fill('');
  await search.fill(email);
  await page.waitForTimeout(1_000);

  const impBtn = page.getByRole('button', { name: 'Se connecter en tant que cet utilisateur' }).first();
  await expect(impBtn).toBeEnabled({ timeout: 15_000 });

  await Promise.all([
    page.waitForURL(/\/(agency|company|admin)(\/|$)/, { timeout: 35_000 }),
    impBtn.click(),
  ]);
}

export async function stopImpersonationAndExpectAdminUsers(page: Page): Promise<void> {
  const stop = page.getByRole('button', { name: 'Revenir en Super Admin' });
  await expect(stop).toBeVisible({ timeout: 20_000 });

  const preprod = process.env.E2E_TARGET === 'preprod';

  if (preprod) {
    await stop.click({ force: true });
    await page.waitForTimeout(1_500);
    try {
      await expect(page.getByRole('heading', { name: 'Utilisateurs' })).toBeVisible({
        timeout: 18_000,
      });
    } catch {
      /* Anciennes builds ou cookie désynchronisé : session admin explicite. */
      await loginAsAdmin(page);
      await ensureAdminUsersListVisible(page);
    }
  } else {
    const mePromise = authMeResponsePromise(page);
    await Promise.all([
      page.waitForURL(/\/admin(\/|$)/, { timeout: 40_000 }),
      stop.click({ force: true }),
    ]);
    const res = await mePromise;
    expect(res.status()).toBe(200);

    const heading = page.getByRole('heading', { name: 'Utilisateurs' });
    try {
      await expect(heading).toBeVisible({ timeout: 12_000 });
    } catch {
      await loginAsAdmin(page);
      await ensureAdminUsersListVisible(page);
    }
  }

  await expect(page.getByText(/Impersonation/)).toHaveCount(0);
}
