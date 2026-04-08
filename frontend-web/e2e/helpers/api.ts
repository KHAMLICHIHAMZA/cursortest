import type { APIRequestContext } from '@playwright/test';

export function apiBaseUrl(): string {
  return process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000/api/v1';
}

/** Render / préprod : cold start souvent > 30 s. */
export function e2eApiTimeoutMs(): number {
  return process.env.E2E_TARGET === 'preprod' ? 120_000 : 60_000;
}

export function agentCredentials(): { email: string; password: string } {
  return {
    email: process.env.E2E_AGENT_EMAIL ?? 'agent1@autolocation.fr',
    password: process.env.E2E_AGENT_PASSWORD ?? 'agent123',
  };
}

export function adminCredentials(): { email: string; password: string } {
  return {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@malocauto.com',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'admin123',
  };
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
