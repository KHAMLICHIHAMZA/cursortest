import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function expectNoFatalServerError(page: Page) {
  const body = page.locator('body');
  await expect(body).not.toContainText('502 Bad Gateway');
  await expect(body).not.toContainText('503 Service Unavailable');
  await expect(body).not.toContainText('Internal Server Error');
}

export async function gotoAndAssertLoads(page: Page, path: string) {
  const res = await page.goto(path, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  if (res) {
    expect(res.status(), `HTTP status for ${path}`).toBeLessThan(500);
  }
  await expectNoFatalServerError(page);
}
