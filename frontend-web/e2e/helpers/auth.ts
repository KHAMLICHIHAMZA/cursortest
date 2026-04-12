import type { Page } from '@playwright/test';

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
 * Connexion web. Compte inactif → **échec explicite** (pas de skip), pour une suite qui va au bout.
 */
export async function login(
  page: Page,
  email: string,
  password: string,
  expectedPathRegex: RegExp = /\/(admin|company|agency)/,
) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  const inactive = page.getByText(/Compte inactif/i).first();
  /** Message d’erreur sous le formulaire (`app/login/page.tsx`, `setError`). */
  const formError = page.locator('form .text-error').first();

  type RaceOk = 'ok' | 'inactive' | { refused: string };
  const race = await Promise.race<RaceOk | 'timeout'>([
    page
      .waitForURL(
        (url) => expectedPathRegex.test(new URL(url).pathname),
        { timeout: 240_000 },
      )
      .then(() => 'ok' as const),
    inactive.waitFor({ state: 'visible', timeout: 240_000 }).then(() => 'inactive' as const),
    formError.waitFor({ state: 'visible', timeout: 240_000 }).then(async () => ({
      refused: (await formError.textContent())?.trim() || '',
    })),
  ]).catch(() => 'timeout' as const);

  if (race === 'inactive') {
    throw new Error(
      `Compte inactif sur cet environnement (${email}). Activer l’utilisateur en base ou définir PW_* (voir e2e/README.md).`,
    );
  }

  if (typeof race === 'object' && race !== null && 'refused' in race) {
    throw new Error(
      `Login refusé (${email}) : ${race.refused || 'voir la page de connexion'}. Mot de passe préprod différent ? Définir PW_*_PASSWORD.`,
    );
  }

  if (race !== 'ok') {
    throw new Error(
      `Login timeout pour ${email} (≈4 min) : l’URL n’est pas passée à ${expectedPathRegex}, sans message d’erreur visible. ` +
        `Souvent : API Render en veille / injoignable depuis la machine qui lance Playwright, ou ` +
        `NEXT_PUBLIC_API_URL incorrect sur le front (bannière ambre sur /login). Pas une variable « obligatoire » manquante : vérifier réseau, URL API, et PW_* si les mots de passe préprod ≠ défauts.`,
    );
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
