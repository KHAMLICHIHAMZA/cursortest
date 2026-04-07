import type { Page } from '@playwright/test';

/** Trace un trait sur le canvas de signature (SimpleSignaturePad). */
export async function drawSignatureStroke(page: Page): Promise<void> {
  const canvas = page.getByLabel('Zone de signature');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Signature canvas introuvable');
  const x0 = box.x + box.width * 0.15;
  const y0 = box.y + box.height * 0.55;
  const x1 = box.x + box.width * 0.85;
  const y1 = box.y + box.height * 0.4;
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  await page.mouse.move(x1, y1, { steps: 20 });
  await page.mouse.up();
}
