import { test, expect } from '@playwright/test';
import { login, CREDS } from './helpers/auth';
import { gotoAndAssertLoads } from './helpers/assert';
import { COMPANY_PATHS } from './routes';

test.describe.configure({ mode: 'serial' });

test.describe('Company Admin — routes statiques', () => {
  test('parcours complet (une seule session)', async ({ page }) => {
    await login(page, CREDS.companyAdmin.email, CREDS.companyAdmin.password, /\/company/);

    for (const path of COMPANY_PATHS) {
      await gotoAndAssertLoads(page, path);
      expect(new URL(page.url()).pathname).toBe(path);
    }
  });
});
