import type { APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_PREPROD_API = 'https://malocauto-api.onrender.com/api/v1';

export function apiBaseUrl(): string {
  return process.env.PLAYWRIGHT_API_URL ?? DEFAULT_PREPROD_API;
}

/** API distante (OnRender) : cold start souvent élevé. */
export function e2eApiTimeoutMs(): number {
  return 120_000;
}

export function agentCredentials(): { email: string; password: string } {
  return {
    email: process.env.E2E_AGENT_EMAIL?.trim() || 'agent1@autolocation.fr',
    password: process.env.E2E_AGENT_PASSWORD?.trim() || 'agent123',
  };
}

export function adminCredentials(): { email: string; password: string } {
  const email = process.env.E2E_ADMIN_EMAIL?.trim() || 'admin@malocauto.com';
  const fromEnv = process.env.E2E_ADMIN_PASSWORD;
  const password =
    fromEnv !== undefined && fromEnv !== ''
      ? fromEnv
      : process.env.GITHUB_ACTIONS === 'true'
        ? '__E2E_ADMIN_PASSWORD_MISSING__'
        : 'admin123';
  return { email, password };
}

export type UserLightRow = {
  id: string;
  email: string;
  role: string;
  name?: string;
};

export async function loginAdminAccessToken(request: APIRequestContext): Promise<string | null> {
  const { email, password } = adminCredentials();
  const res = await request.post(`${apiBaseUrl()}/auth/login`, {
    data: { email, password },
    timeout: e2eApiTimeoutMs(),
  });
  if (!res.ok()) return null;
  const data = (await res.json()) as { accessToken?: string; access_token?: string };
  return data.accessToken ?? data.access_token ?? null;
}

/** Liste utilisateurs (endpoint paginé admin / société selon le rôle du token). */
export async function fetchUsersLight(
  request: APIRequestContext,
  token: string,
  pageSize = 100,
): Promise<UserLightRow[]> {
  const res = await request.get(`${apiBaseUrl()}/users/light`, {
    params: { page: '1', pageSize: String(pageSize) },
    headers: { Authorization: `Bearer ${token}` },
    timeout: e2eApiTimeoutMs(),
  });
  if (!res.ok()) return [];
  const data = (await res.json()) as { items?: UserLightRow[] };
  return data.items ?? [];
}

export function firstUserByRole(
  items: UserLightRow[],
  role: 'COMPANY_ADMIN' | 'AGENCY_MANAGER' | 'AGENT',
): UserLightRow | undefined {
  return items.find((u) => u.role === role);
}

export async function loginAccessToken(request: APIRequestContext): Promise<string | null> {
  const { email, password } = agentCredentials();
  const res = await request.post(`${apiBaseUrl()}/auth/login`, {
    data: { email, password },
    timeout: e2eApiTimeoutMs(),
  });
  if (!res.ok()) return null;
  const data = (await res.json()) as { accessToken?: string; access_token?: string };
  return data.accessToken ?? data.access_token ?? null;
}

/** Token pour appels API « en tant qu’agent » : mot de passe agent, ou cookie issu du globalSetup préprod. */
export async function resolveE2EAgentApiToken(
  request: APIRequestContext,
): Promise<string | null> {
  if (process.env.E2E_AGENT_PASSWORD) {
    return loginAccessToken(request);
  }
  if (process.env.E2E_TARGET === 'preprod') {
    const fromFile = readPreprodAgentAccessTokenFromStorage();
    if (fromFile) return fromFile;
  }
  return loginAccessToken(request);
}

function readPreprodAgentAccessTokenFromStorage(): string | null {
  try {
    const p = path.join(process.cwd(), 'e2e', '.auth', 'preprod-agent.json');
    if (!fs.existsSync(p)) return null;
    const state = JSON.parse(fs.readFileSync(p, 'utf8')) as {
      cookies?: Array<{ name: string; value: string }>;
    };
    return state.cookies?.find((c) => c.name === 'accessToken')?.value ?? null;
  } catch {
    return null;
  }
}

export type BookingLightItem = { id: string; status?: string };

export async function fetchBookingsLight(
  request: APIRequestContext,
  token: string,
  status: string,
): Promise<BookingLightItem[]> {
  const res = await request.get(`${apiBaseUrl()}/bookings/light`, {
    params: { status, pageSize: '25', page: '1' },
    headers: { Authorization: `Bearer ${token}` },
    timeout: e2eApiTimeoutMs(),
  });
  if (!res.ok()) return [];
  const data = (await res.json()) as { items?: BookingLightItem[] };
  return data.items ?? [];
}

export type BookingDetail = {
  id: string;
  status: string;
  endDate: string;
  depositRequired?: boolean;
  vehicle?: { mileage?: number | null };
  client?: { licenseExpiryDate?: string | null };
};

export async function fetchBooking(
  request: APIRequestContext,
  token: string,
  id: string,
): Promise<BookingDetail | null> {
  const res = await request.get(`${apiBaseUrl()}/bookings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: e2eApiTimeoutMs(),
  });
  if (!res.ok()) return null;
  return (await res.json()) as BookingDetail;
}

/** Règle backend : permis > aujourd'hui et > fin de location (strict). */
export function isLicenseValidForCheckIn(booking: BookingDetail): boolean {
  const raw = booking.client?.licenseExpiryDate;
  if (!raw) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lic = new Date(raw);
  lic.setHours(0, 0, 0, 0);
  const end = new Date(booking.endDate);
  end.setHours(0, 0, 0, 0);
  return lic > today && lic > end;
}

export async function findConfirmedBookingEligibleForCheckIn(
  request: APIRequestContext,
  token: string,
): Promise<string | null> {
  const items = await fetchBookingsLight(request, token, 'CONFIRMED');
  for (const row of items) {
    const full = await fetchBooking(request, token, row.id);
    if (!full || full.status !== 'CONFIRMED') continue;
    if (isLicenseValidForCheckIn(full)) return row.id;
  }
  return null;
}

export async function findInProgressBookingId(
  request: APIRequestContext,
  token: string,
): Promise<string | null> {
  const items = await fetchBookingsLight(request, token, 'IN_PROGRESS');
  return items[0]?.id ?? null;
}

/** Première réservation confirmée avec caution requise + permis éligible. */
export async function findConfirmedWithDepositEligible(
  request: APIRequestContext,
  token: string,
): Promise<string | null> {
  const items = await fetchBookingsLight(request, token, 'CONFIRMED');
  for (const row of items) {
    const full = await fetchBooking(request, token, row.id);
    if (!full || full.status !== 'CONFIRMED' || !full.depositRequired) continue;
    if (isLicenseValidForCheckIn(full)) return row.id;
  }
  return null;
}

export async function findFirstBookingIdByStatus(
  request: APIRequestContext,
  token: string,
  status: string,
): Promise<string | null> {
  const items = await fetchBookingsLight(request, token, status);
  return items[0]?.id ?? null;
}
