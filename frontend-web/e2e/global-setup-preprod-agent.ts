/**
 * Préprod sans E2E_AGENT_PASSWORD : login admin API + impersonation du premier AGENT
 * (ou AGENCY_MANAGER) puis écriture de storageState + fichier skip-agent-login.
 */
import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_TIMEOUT_MS = 120_000;

async function fetchTimeout(url: string, init: RequestInit): Promise<Response> {
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(tid);
  }
}

type AuthMeRow = {
  id: string;
  email: string;
  name?: string;
  role: string;
  companyId?: string;
  agencyIds?: string[];
  profileCompletionRequired?: boolean;
};

async function authMe(apiUrl: string, accessToken: string): Promise<AuthMeRow | null> {
  const r = await fetchTimeout(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) return null;
  return (await r.json()) as AuthMeRow;
}

/** Évite le modal « Compléter votre profil » (z-[120]) qui bloque les tests UI. */
async function ensureAgentProfileComplete(apiUrl: string, accessToken: string): Promise<void> {
  const me = await authMe(apiUrl, accessToken);
  if (!me?.profileCompletionRequired) return;
  const patchRes = await fetchTimeout(`${apiUrl}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: me.name?.trim() || 'E2E Préprod Agent',
      phone: '+212600000001',
      addressDetails: {
        line1: '1 rue E2E',
        city: 'Casablanca',
        postalCode: '20000',
        country: 'Maroc',
      },
      dateOfBirth: '1990-06-15T00:00:00.000Z',
    }),
  });
  if (!patchRes.ok) {
    console.warn(
      '[globalSetup preprod agent] PATCH /users/me:',
      patchRes.status,
      await patchRes.text(),
    );
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  if (process.env.E2E_TARGET !== 'preprod') return;
  if (process.env.E2E_AGENT_PASSWORD) return;

  const origin = (
    process.env.PLAYWRIGHT_BASE_URL?.trim() || 'https://v0-cursortest.vercel.app'
  ).replace(/\/$/, '');
  /** Playwright exige scheme + host + path pour addCookies. */
  const cookieUrl = `${origin}/`;
  const apiUrl =
    process.env.PLAYWRIGHT_API_URL?.trim() || 'https://malocauto-api.onrender.com/api/v1';
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@malocauto.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'admin123';

  const authDir = path.join(process.cwd(), 'e2e', '.auth');
  const skipFlag = path.join(authDir, 'skip-agent-login');
  const storagePath = path.join(authDir, 'preprod-agent.json');
  try {
    if (fs.existsSync(skipFlag)) fs.unlinkSync(skipFlag);
    if (fs.existsSync(storagePath)) fs.unlinkSync(storagePath);
  } catch {
    // ignore
  }

  const loginRes = await fetchTimeout(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  if (!loginRes.ok) {
    console.warn('[globalSetup preprod agent] Login admin échoué :', loginRes.status, await loginRes.text());
    return;
  }
  const loginData = (await loginRes.json()) as { accessToken?: string; access_token?: string };
  const adminToken = loginData.accessToken ?? loginData.access_token;
  if (!adminToken) return;

  const usersRes = await fetchTimeout(`${apiUrl}/users/light?page=1&pageSize=100`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!usersRes.ok) {
    console.warn('[globalSetup preprod agent] users/light échoué :', usersRes.status);
    return;
  }
  const usersData = (await usersRes.json()) as { items?: Array<{ id: string; role: string }> };
  const items = usersData.items ?? [];
  const target =
    items.find((u) => u.role === 'AGENT') ?? items.find((u) => u.role === 'AGENCY_MANAGER');
  if (!target) {
    console.warn('[globalSetup preprod agent] Aucun AGENT ni AGENCY_MANAGER dans /users/light.');
    return;
  }

  const impRes = await fetchTimeout(`${apiUrl}/auth/impersonate/${target.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!impRes.ok) {
    console.warn('[globalSetup preprod agent] Impersonate échoué :', impRes.status, await impRes.text());
    return;
  }
  const imp = (await impRes.json()) as {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: string;
      companyId?: string;
      agencyIds?: string[];
    };
  };

  await ensureAgentProfileComplete(apiUrl, imp.access_token);
  const meRow = await authMe(apiUrl, imp.access_token);
  if (!meRow) {
    console.warn('[globalSetup preprod agent] GET /auth/me après impersonate échoué.');
    return;
  }
  const userCookie = JSON.stringify({
    id: meRow.id,
    email: meRow.email,
    name: (meRow.name || meRow.email).trim(),
    role: meRow.role,
    companyId: meRow.companyId,
    agencyIds: meRow.agencyIds ?? [],
  });

  fs.mkdirSync(authDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const sessionStart = String(Date.now());
  await context.addCookies([
    {
      name: 'accessToken',
      value: imp.access_token,
      url: cookieUrl,
      sameSite: 'Lax',
      secure: true,
    },
    {
      name: 'refreshToken',
      value: imp.refresh_token,
      url: cookieUrl,
      sameSite: 'Lax',
      secure: true,
    },
    {
      name: 'user',
      value: userCookie,
      url: cookieUrl,
      sameSite: 'Lax',
      secure: true,
    },
    {
      name: 'authSessionStartedAt',
      value: sessionStart,
      url: cookieUrl,
      sameSite: 'Lax',
      secure: true,
    },
  ]);
  await context.storageState({ path: storagePath });
  await browser.close();

  fs.writeFileSync(skipFlag, '1', 'utf8');
  console.log('[globalSetup preprod agent] Session', meRow.email, meRow.role, '→', storagePath);
}
