import type { Page } from '@playwright/test';

const DAYS_AHEAD = Math.max(1, parseInt(process.env.PW_BOOKING_DAYS_AHEAD || '14', 10) || 14);

/**
 * Remplit les dates dans le fuseau du navigateur : un jour à +DAYS_AHEAD, 10:00 → 18:00
 * (réduit le risque de chevauchement et reste dans des horaires d’ouverture courants).
 */
export async function fillBookingDatetimeWindow(page: Page) {
  const { start, end } = await page.evaluate((daysAhead) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(10, 0, 0, 0);
    const e = new Date(d);
    e.setHours(18, 0, 0, 0);
    const fmt = (x: Date) =>
      `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
    return { start: fmt(d), end: fmt(e) };
  }, DAYS_AHEAD);

  await page.locator('#startDate').fill(start);
  await page.locator('#endDate').fill(end);
}

export { DAYS_AHEAD };
