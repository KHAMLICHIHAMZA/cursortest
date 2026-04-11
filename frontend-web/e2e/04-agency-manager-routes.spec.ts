import { test, expect } from '@playwright/test';
import { login, CREDS } from './helpers/auth';
import { gotoAndAssertLoads } from './helpers/assert';
import { AGENCY_PATHS } from './routes';

test.describe.configure({ mode: 'serial' });

test.describe('Agency Manager — routes agence', () => {
  test('parcours complet (une seule session)', async ({ page }, testInfo) => {
    await login(page, CREDS.agencyManager.email, CREDS.agencyManager.password, /\/agency/, testInfo);

    for (const path of AGENCY_PATHS) {
      await gotoAndAssertLoads(page, path);
      expect(new URL(page.url()).pathname).toBe(path);
    }
  });
});
