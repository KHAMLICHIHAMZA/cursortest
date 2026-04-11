import type { Page, TestInfo } from '@playwright/test';

const CREDS = {
  superAdmin: {
    email: process.env.PW_SUPER_ADMIN_EMAIL || 'admin@malocauto.com',
    password: process.env.PW_SUPER_ADMIN_PASSWORD || 'admin123',
  },
  companyAdmin: {
    email: process.env.PW_COMPANY_ADMIN_EMAIL || 'admin@autolocation.fr',
    password: process.env.PW_COMPANY_ADMIN_PASSWORD || 'admin123',
  },
  agencyManager: {
    email: process.env.PW_AGENCY_MANAGER_EMAIL || 'manager1@autolocation.fr',
    password: process.env.PW_AGENCY_MANAGER_PASSWORD || 'manager123',
  },
  agent: {
    email: process.env.PW_AGENT_EMAIL || 'agent1@autolocation.fr',
    password: process.env.PW_AGENT_PASSWORD || 'agent123',
  },
} as const;

/**
 * Connexion web. Sur préprod, les comptes seed peuvent être **inactifs** : dans ce cas,
 * si `testInfo` est fourni, le test est **skipped** avec un message explicite au lieu d’un timeout.
 */
export async function login(
  page: Page,
  email: string,
  password: string,
  expectedPathRegex: RegExp = /\/(admin|company|agency)/,
  testInfo?: TestInfo,
) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  const inactive = page.getByText(/Compte inactif/i).first();

  const race = await Promise.race([
    page
      .waitForURL(
        (url) => expectedPathRegex.test(new URL(url).pathname),
        { timeout: 240_000 },
      )
      .then(() => 'ok' as const),
    inactive.waitFor({ state: 'visible', timeout: 240_000 }).then(() => 'inactive' as const),
  ]).catch(() => 'timeout' as const);

  if (race === 'inactive') {
    const msg = `Compte inactif sur cet environnement (${email}). Activer l’utilisateur en base ou utiliser PW_* (voir e2e/README.md).`;
    if (testInfo) testInfo.skip(true, msg);
    throw new Error(msg);
  }

  if (race !== 'ok') {
    throw new Error(`Login timeout pour ${email} — vérifier l’API et les identifiants.`);
  }
}

export async function logout(page: Page) {
  const btn = page.getByRole('button', { name: /Déconnexion/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForURL(/\/login/, { timeout: 60_000 });
  }
}

export { CREDS };
