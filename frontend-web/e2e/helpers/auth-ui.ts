import type { Page } from '@playwright/test';
import { agentCredentials } from './api';

export async function loginAsAgent(page: Page): Promise<void> {
  const { email, password } = agentCredentials();
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/\/(agency|admin|company)(\/|$)/, { timeout: 25_000 });
}
