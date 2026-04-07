import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function uploadCheckInVehiclePhotos(page: Page, fixture: string): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await page.getByTestId(`check-in-photo-${i}`).setInputFiles(fixture);
    await expect(page.getByText(`Photo ${i + 1} téléchargée`).first()).toBeVisible({
      timeout: 25_000,
    });
  }
}

export async function uploadCheckInLicense(page: Page, fixture: string): Promise<void> {
  await page.getByTestId('check-in-license').setInputFiles(fixture);
  await expect(page.getByText('Photo permis enregistrée').first()).toBeVisible({ timeout: 25_000 });
}

export async function uploadCheckOutVehiclePhotos(page: Page, fixture: string): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await page.getByTestId(`check-out-photo-${i}`).setInputFiles(fixture);
    await expect(page.getByText(`Photo ${i + 1} téléchargée`).first()).toBeVisible({
      timeout: 25_000,
    });
  }
}

export async function depositCollectedIfVisible(page: Page): Promise<void> {
  const deposit = page.getByTestId('check-in-deposit-status');
  if (await deposit.isVisible()) {
    await deposit.selectOption('COLLECTED');
  }
}

/** Saisie « invalide » sur un input type=number (React contrôlé) : passage temporaire en text. */
export async function setControlledNumberAsInvalidText(
  page: Page,
  testId: string,
  raw: string,
): Promise<void> {
  const loc = page.getByTestId(testId);
  await loc.evaluate((el) => {
    (el as HTMLInputElement).type = 'text';
  });
  await loc.fill(raw);
}
