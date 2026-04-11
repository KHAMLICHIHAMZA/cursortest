import { request } from '@playwright/test';

/**
 * Réveille le front préprod (cold start Vercel) avant la suite — réduit les timeouts sur le 1er login.
 * Optionnel : PLAYWRIGHT_API_WARMUP_URL=https://votre-api.onrender.com/api/v1
 */
export default async function globalSetup() {
  const base =
    process.env.PLAYWRIGHT_BASE_URL?.trim() ||
    'https://v0-cursortest.vercel.app';
  const apiWarm = process.env.PLAYWRIGHT_API_WARMUP_URL?.trim();

  const ctx = await request.newContext({ timeout: 120_000 });
  for (let i = 0; i < 2; i++) {
    await ctx.get(`${base.replace(/\/$/, '')}/login`).catch(() => undefined);
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (apiWarm) {
    const root = apiWarm.replace(/\/$/, '');
    await ctx.get(`${root}/health`).catch(() => undefined);
    await ctx.get(`${root}/ready`).catch(() => undefined);
  }
  await ctx.dispose();
}
