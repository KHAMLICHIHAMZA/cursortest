import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { agentCredentials, adminCredentials } from './api';

export async function loginAsAgent(page: Page): Promise<void> {
  const skipPath = path.join(process.cwd(), 'e2e', '.auth', 'skip-agent-login');
  if (fs.existsSync(skipPath)) {
    await page.goto('/agency/bookings');
    await page.waitForURL(/\/agency\//, { timeout: 25_000 });
    return;
  }
  const { email, password } = agentCredentials();
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/\/(agency|admin|company)(\/|$)/, { timeout: 25_000 });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = adminCredentials();
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 35_000 });
}
