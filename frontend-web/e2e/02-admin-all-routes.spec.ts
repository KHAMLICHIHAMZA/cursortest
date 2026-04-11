import { test, expect } from '@playwright/test';
import { login, CREDS } from './helpers/auth';
import { gotoAndAssertLoads, expectNoFatalServerError } from './helpers/assert';
import { ADMIN_PATHS } from './routes';

test.describe.configure({ mode: 'serial' });

test.describe('Super Admin — toutes les routes statiques', () => {
  test('parcours complet (une seule session)', async ({ page }, testInfo) => {
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password, /\/admin/, testInfo);

    for (const path of ADMIN_PATHS) {
      await gotoAndAssertLoads(page, path);
      expect(new URL(page.url()).pathname).toBe(path);
    }

    await gotoAndAssertLoads(page, '/admin/companies');
    const voir = page.getByRole('link', { name: /^Voir$/i }).first();
    if (await voir.isVisible().catch(() => false)) {
      await voir.click();
      await page.waitForURL(/\/admin\/companies\/[^/]+/, { timeout: 60_000 });
      await expectNoFatalServerError(page);
    }
  });
});
