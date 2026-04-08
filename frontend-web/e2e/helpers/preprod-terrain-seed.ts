/**
 * Préprod E2E : crée au besoin des réservations manquantes pour les scénarios « terrain »
 * (IN_PROGRESS, LATE, RETURNED, CONFIRMED avec / sans caution), visibles par l’agent impersonné.
 * Super Admin appelle POST /bookings — ce sont de vraies lignes en base recette, pas une simulation UI.
 */
type FetchT = (url: string, init: RequestInit) => Promise<Response>;

type VehicleRow = { id: string };
type ClientRow = { id: string; licenseExpiryDate?: string };

type BookingFull = {
  id: string;
  status: string;
  endDate: string;
  depositRequired?: boolean;
  client?: { licenseExpiryDate?: string | null };
};

function daysFromNowUtc(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(10, 0, 0, 0);
  return d;
}

function iso(d: Date): string {
  return d.toISOString();
}

/** Aligné sur e2e/helpers/api.ts (règle check-in terrain). */
function isLicenseValidForCheckIn(booking: BookingFull): boolean {
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

function licenseCoversEnd(licenseYmd: string | undefined, end: Date): boolean {
  if (!new Date(licenseYmd ?? '').getTime()) return false;
  const lic = new Date(licenseYmd!);
  lic.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  return lic > e;
}

async function bookingsLight(
  fetchTimeout: FetchT,
  apiUrl: string,
  token: string,
  status: string,
): Promise<{ id: string }[]> {
  const r = await fetchTimeout(
    `${apiUrl}/bookings/light?status=${encodeURIComponent(status)}&pageSize=50&page=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!r.ok) return [];
  const j = (await r.json()) as { items?: { id: string }[] };
  return j.items ?? [];
}

async function fetchBookingFull(
  fetchTimeout: FetchT,
  apiUrl: string,
  token: string,
  id: string,
): Promise<BookingFull | null> {
  const r = await fetchTimeout(`${apiUrl}/bookings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return (await r.json()) as BookingFull;
}

async function hasEligibleConfirmedForCheckIn(
  fetchTimeout: FetchT,
  apiUrl: string,
  agentToken: string,
): Promise<boolean> {
  const items = await bookingsLight(fetchTimeout, apiUrl, agentToken, 'CONFIRMED');
  for (const row of items) {
    const full = await fetchBookingFull(fetchTimeout, apiUrl, agentToken, row.id);
    if (full?.status === 'CONFIRMED' && isLicenseValidForCheckIn(full)) return true;
  }
  return false;
}

async function hasDepositConfirmed(
  fetchTimeout: FetchT,
  apiUrl: string,
  agentToken: string,
): Promise<boolean> {
  const items = await bookingsLight(fetchTimeout, apiUrl, agentToken, 'CONFIRMED');
  for (const row of items) {
    const full = await fetchBookingFull(fetchTimeout, apiUrl, agentToken, row.id);
    if (full?.status === 'CONFIRMED' && full.depositRequired) return true;
  }
  return false;
}

async function postBookingOnce(
  fetchTimeout: FetchT,
  apiUrl: string,
  adminToken: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const headers = {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  };
  let res = await fetchTimeout(`${apiUrl}/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (res.ok) return { ok: true };
  const text = await res.text();
  if (res.status === 400 && /MANUEL|manuel|numéro de réservation|bookingNumber/i.test(text)) {
    res = await fetchTimeout(`${apiUrl}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, bookingNumber: `E2E${Date.now().toString(36)}` }),
    });
    return { ok: res.ok };
  }
  return { ok: false };
}

async function createOnAnyVehicle(
  fetchTimeout: FetchT,
  apiUrl: string,
  adminToken: string,
  vehicles: VehicleRow[],
  build: (vehicleId: string) => Record<string, unknown>,
  label: string,
): Promise<boolean> {
  let lastErr = '';
  for (const v of vehicles) {
    const { ok } = await postBookingOnce(fetchTimeout, apiUrl, adminToken, build(v.id));
    if (ok) return true;
    lastErr = v.id;
  }
  console.warn('[preprod-terrain-seed] Échec création', label, 'sur tous les véhicules (dernier id', lastErr + ')');
  return false;
}

export async function seedPreprodTerrainBookingsIfNeeded(
  fetchTimeout: FetchT,
  apiUrl: string,
  adminToken: string,
  agencyId: string,
  agentAccessToken: string,
): Promise<void> {
  const h = { Authorization: `Bearer ${adminToken}` };
  const [vRes, cRes] = await Promise.all([
    fetchTimeout(`${apiUrl}/vehicles?agencyId=${encodeURIComponent(agencyId)}`, { headers: h }),
    fetchTimeout(`${apiUrl}/clients?agencyId=${encodeURIComponent(agencyId)}`, { headers: h }),
  ]);
  if (!vRes.ok || !cRes.ok) {
    console.warn('[preprod-terrain-seed] véhicules ou clients illisibles');
    return;
  }
  const vehicles = (await vRes.json()) as VehicleRow[];
  const clients = (await cRes.json()) as ClientRow[];
  if (!vehicles.length || !clients.length) {
    console.warn('[preprod-terrain-seed] pas assez de véhicules ou clients pour l’agence');
    return;
  }

  const endReturned = daysFromNowUtc(-45);
  const endLate = daysFromNowUtc(-13);
  const endInProgress = daysFromNowUtc(10);
  const endDeposit = daysFromNowUtc(28);
  const endPlain = daysFromNowUtc(60);

  const withLicense = clients.filter((c) => c.licenseExpiryDate);
  withLicense.sort(
    (a, b) => new Date(b.licenseExpiryDate!).getTime() - new Date(a.licenseExpiryDate!).getTime(),
  );
  const client = withLicense[0];
  if (!client?.licenseExpiryDate) {
    console.warn('[preprod-terrain-seed] Aucun client avec date de permis');
    return;
  }

  const baseFor = (vehicleId: string) => ({
    agencyId,
    vehicleId,
    clientId: client.id,
    totalPrice: 150,
  });

  const [needReturned, needLate, needInProgress, needDeposit, needPlainConfirmed] = await Promise.all([
    (async () => (await bookingsLight(fetchTimeout, apiUrl, agentAccessToken, 'RETURNED')).length === 0)(),
    (async () => (await bookingsLight(fetchTimeout, apiUrl, agentAccessToken, 'LATE')).length === 0)(),
    (async () => (await bookingsLight(fetchTimeout, apiUrl, agentAccessToken, 'IN_PROGRESS')).length === 0)(),
    (async () => !(await hasDepositConfirmed(fetchTimeout, apiUrl, agentAccessToken)))(),
    (async () => !(await hasEligibleConfirmedForCheckIn(fetchTimeout, apiUrl, agentAccessToken)))(),
  ]);

  let created: string[] = [];

  if (needReturned && licenseCoversEnd(client.licenseExpiryDate, endReturned)) {
    const ok = await createOnAnyVehicle(
      fetchTimeout,
      apiUrl,
      adminToken,
      vehicles,
      (vid) => ({
        ...baseFor(vid),
        startDate: iso(daysFromNowUtc(-55)),
        endDate: iso(endReturned),
        status: 'RETURNED',
      }),
      'RETURNED',
    );
    if (ok) created.push('RETURNED');
  }

  if (needLate && licenseCoversEnd(client.licenseExpiryDate, endLate)) {
    const ok = await createOnAnyVehicle(
      fetchTimeout,
      apiUrl,
      adminToken,
      vehicles,
      (vid) => ({
        ...baseFor(vid),
        startDate: iso(daysFromNowUtc(-22)),
        endDate: iso(endLate),
        status: 'LATE',
      }),
      'LATE',
    );
    if (ok) created.push('LATE');
  }

  if (needInProgress && licenseCoversEnd(client.licenseExpiryDate, endInProgress)) {
    const ok = await createOnAnyVehicle(
      fetchTimeout,
      apiUrl,
      adminToken,
      vehicles,
      (vid) => ({
        ...baseFor(vid),
        startDate: iso(daysFromNowUtc(-3)),
        endDate: iso(endInProgress),
        status: 'IN_PROGRESS',
      }),
      'IN_PROGRESS',
    );
    if (ok) created.push('IN_PROGRESS');
  }

  if (needDeposit && licenseCoversEnd(client.licenseExpiryDate, endDeposit)) {
    const ok = await createOnAnyVehicle(
      fetchTimeout,
      apiUrl,
      adminToken,
      vehicles,
      (vid) => ({
        ...baseFor(vid),
        startDate: iso(daysFromNowUtc(20)),
        endDate: iso(endDeposit),
        status: 'CONFIRMED',
        depositRequired: true,
        depositAmount: 500,
        depositDecisionSource: 'AGENCY',
      }),
      'CONFIRMED+caution',
    );
    if (ok) created.push('CONFIRMED+caution');
  }

  if (needPlainConfirmed && licenseCoversEnd(client.licenseExpiryDate, endPlain)) {
    const ok = await createOnAnyVehicle(
      fetchTimeout,
      apiUrl,
      adminToken,
      vehicles,
      (vid) => ({
        ...baseFor(vid),
        startDate: iso(daysFromNowUtc(45)),
        endDate: iso(endPlain),
        status: 'CONFIRMED',
      }),
      'CONFIRMED (check-in)',
    );
    if (ok) created.push('CONFIRMED');
  }

  if (created.length) {
    console.log('[preprod-terrain-seed] Créé:', created.join(', '));
  }
}
