import { test, expect } from '@playwright/test';
import {
  loginAccessToken,
  findConfirmedBookingEligibleForCheckIn,
  findConfirmedWithDepositEligible,
  findInProgressBookingId,
  findFirstBookingIdByStatus,
  fetchBooking,
  apiBaseUrl,
} from './helpers/api';
import { loginAsAgent } from './helpers/auth-ui';
import { drawSignatureStroke } from './helpers/signature';
import { ensureOnePixelPng } from './helpers/fixtures';
import {
  uploadCheckInVehiclePhotos,
  uploadCheckInLicense,
  uploadCheckOutVehiclePhotos,
  depositCollectedIfVisible,
  setControlledNumberAsInvalidText,
} from './helpers/page-flows';

/**
 * Suite séquentielle : une réservation CONFIRMED principale (`confirmedId`) pour le
 * parcours jusqu’au check-out final ; validations supplémentaires sur d’autres IDs
 * quand la base les fournit (caution, RETURNED, IN_PROGRESS).
 */
test.describe.serial('Agence — terrain (check-in / check-out)', () => {
  test.setTimeout(240_000);

  let confirmedId: string | null = null;
  let depositBookingId: string | null = null;
  let inProgressId: string | null = null;
  let returnedId: string | null = null;
  let lateId: string | null = null;
  let checkInOdometer = '12000';

  test.beforeAll(async ({ request }) => {
    const token = await loginAccessToken(request);
    if (!token) return;
    confirmedId = await findConfirmedBookingEligibleForCheckIn(request, token);
    depositBookingId = await findConfirmedWithDepositEligible(request, token);
    inProgressId = await findInProgressBookingId(request, token);
    returnedId = await findFirstBookingIdByStatus(request, token, 'RETURNED');
    lateId = await findFirstBookingIdByStatus(request, token, 'LATE');
    if (confirmedId) {
      const full = await fetchBooking(request, token, confirmedId);
      if (full?.vehicle?.mileage != null && Number.isFinite(Number(full.vehicle.mileage))) {
        checkInOdometer = String(Math.max(0, Number(full.vehicle.mileage)));
      }
    }
  });

  test('check-in : erreur si les quatre photos véhicule manquent', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!confirmedId, 'Aucune réservation CONFIRMED éligible (permis)');

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-in`);
    await expect(page.getByRole('heading', { name: 'Check-in terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await depositCollectedIfVisible(page);
    await page.getByTestId('check-in-submit').click();
    await expect(page.getByText(/Quatre photos véhicule avant départ/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('check-in : erreur si tout sauf la signature', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!confirmedId, 'Aucune réservation CONFIRMED éligible');

    const fixture = ensureOnePixelPng();
    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-in`);
    await expect(page.getByRole('heading', { name: 'Check-in terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await depositCollectedIfVisible(page);
    await uploadCheckInVehiclePhotos(page, fixture);
    await uploadCheckInLicense(page, fixture);
    await page.getByTestId('check-in-submit').click();
    await expect(page.getByText(/Signature du conducteur requis/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('check-in : erreur si photo permis manquante', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!confirmedId, 'Aucune réservation CONFIRMED éligible');

    const fixture = ensureOnePixelPng();
    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-in`);
    await expect(page.getByRole('heading', { name: 'Check-in terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await depositCollectedIfVisible(page);
    await uploadCheckInVehiclePhotos(page, fixture);
    await drawSignatureStroke(page);
    await page.getByTestId('check-in-submit').click();
    await expect(page.getByText(/Photo du permis requise/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('check-in : erreur si date expiration permis manquante', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!confirmedId, 'Aucune réservation CONFIRMED éligible');

    const fixture = ensureOnePixelPng();
    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-in`);
    await expect(page.getByRole('heading', { name: 'Check-in terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await depositCollectedIfVisible(page);
    await uploadCheckInVehiclePhotos(page, fixture);
    await uploadCheckInLicense(page, fixture);
    await page.getByTestId('check-in-license-expiry').fill('');
    await drawSignatureStroke(page);
    await page.getByTestId('check-in-submit').click();
    await expect(page.getByText(/Date d’expiration du permis requise/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('check-in : erreur si kilométrage départ invalide', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!confirmedId, 'Aucune réservation CONFIRMED éligible');

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-in`);
    await expect(page.getByRole('heading', { name: 'Check-in terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await depositCollectedIfVisible(page);
    await page.getByTestId('check-in-odometer').fill('-1');
    await page.getByTestId('check-in-submit').click();
    await expect(page.getByText(/Kilométrage départ invalide/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('check-out refusé tant que la réservation est encore confirmée', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!confirmedId, 'Aucune réservation CONFIRMED');

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(
      page.getByText(/Le check-out nécessite une location en cours/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('check-out refusé sur réservation déjà retournée', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!returnedId, 'Aucune réservation RETURNED en base pour ce compte');

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${returnedId}/check-out`);
    await expect(
      page.getByText(/Le check-out nécessite une location en cours/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('check-in refusé si la réservation est déjà en cours', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!inProgressId, 'Aucune réservation IN_PROGRESS en base pour ce compte');

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${inProgressId}/check-in`);
    await expect(
      page.getByText(/Le check-in n’est possible que pour une réservation confirmée/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('check-in refusé si la réservation est en retard (LATE)', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!lateId, 'Aucune réservation LATE en base pour ce compte');

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${lateId}/check-in`);
    await expect(
      page.getByText(/Le check-in n’est possible que pour une réservation confirmée/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('check-in : dommage déclaré sans photo dommage', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!confirmedId, 'Aucune réservation CONFIRMED éligible');

    const fixture = ensureOnePixelPng();
    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-in`);
    await expect(page.getByRole('heading', { name: 'Check-in terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await depositCollectedIfVisible(page);
    await page.getByTestId('check-in-odometer').fill(checkInOdometer);
    await uploadCheckInVehiclePhotos(page, fixture);
    await uploadCheckInLicense(page, fixture);
    await page.getByTestId('terrain-damage-add').click();
    await drawSignatureStroke(page);
    await page.getByTestId('check-in-submit').click();
    await expect(
      page.getByText(/Chaque dommage déclaré doit avoir au moins une photo/i).first(),
    ).toBeVisible({ timeout: 5000 });

    await page.getByTestId('terrain-damage-remove-0').click();
  });

  test('check-in : caution encore « en attente » bloque la soumission', async ({ page, request }) => {
    const token = await loginAccessToken(request);
    test.skip(!token, `Login API échoue (${apiBaseUrl()})`);
    test.skip(!depositBookingId, 'Aucune réservation CONFIRMED avec caution en base pour ce compte');

    const fixture = ensureOnePixelPng();
    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${depositBookingId}/check-in`);
    await expect(page.getByRole('heading', { name: 'Check-in terrain' })).toBeVisible({
      timeout: 15_000,
    });

    const deposit = page.getByTestId('check-in-deposit-status');
    await expect(deposit).toBeVisible();
    await deposit.selectOption('PENDING');

    await page.getByTestId('check-in-odometer').fill(checkInOdometer);
    await uploadCheckInVehiclePhotos(page, fixture);
    await uploadCheckInLicense(page, fixture);
    await drawSignatureStroke(page);
    await page.getByTestId('check-in-submit').click();
    await expect(
      page.getByText(/La caution doit être indiquée comme collectée/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('check-in complet (uploads + signature) → fiche réservation', async ({ page, request }) => {
    test.skip(!confirmedId, 'Aucune réservation CONFIRMED éligible');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const fixture = ensureOnePixelPng();
    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-in`);
    await expect(page.getByRole('heading', { name: 'Check-in terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId('check-in-odometer').fill(checkInOdometer);
    await depositCollectedIfVisible(page);
    await uploadCheckInVehiclePhotos(page, fixture);
    await uploadCheckInLicense(page, fixture);
    await drawSignatureStroke(page);
    await page.getByTestId('check-in-submit').click();
    await expect(page).toHaveURL(new RegExp(`/agency/bookings/${confirmedId}$`), { timeout: 30_000 });
  });

  test('check-out : erreur si les quatre photos retour manquent', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours après check-in',
    );

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    const vehicleMileage =
      full?.vehicle?.mileage != null ? Number(full.vehicle.mileage) : Number(checkInOdometer);
    await page.getByTestId('check-out-odometer').fill(String(Math.max(vehicleMileage, Number(checkInOdometer))));

    await page.getByTestId('check-out-submit').click();
    await expect(page.getByText(/Quatre photos véhicule au retour/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('check-out : erreur sans signature', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours',
    );

    const fixture = ensureOnePixelPng();
    const vehicleMileage =
      full?.vehicle?.mileage != null ? Number(full.vehicle.mileage) : Number(checkInOdometer);

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByTestId('check-out-odometer')
      .fill(String(Math.max(vehicleMileage, Number(checkInOdometer))));
    await uploadCheckOutVehiclePhotos(page, fixture);
    await page.getByTestId('check-out-submit').click();
    await expect(page.getByText(/Signature retour requis/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('check-out : erreur encaissement espèces coché sans montant', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours',
    );

    const fixture = ensureOnePixelPng();
    const vehicleMileage =
      full?.vehicle?.mileage != null ? Number(full.vehicle.mileage) : Number(checkInOdometer);

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByTestId('check-out-odometer')
      .fill(String(Math.max(vehicleMileage, Number(checkInOdometer))));
    await uploadCheckOutVehiclePhotos(page, fixture);
    await page.getByTestId('check-out-cash-collected').check();
    await drawSignatureStroke(page);
    await page.getByTestId('check-out-submit').click();
    await expect(page.getByText(/Montant espèces requis si encaissement coché/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('check-out : erreur frais supplémentaires invalides', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours',
    );

    const fixture = ensureOnePixelPng();
    const vehicleMileage =
      full?.vehicle?.mileage != null ? Number(full.vehicle.mileage) : Number(checkInOdometer);

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByTestId('check-out-odometer')
      .fill(String(Math.max(vehicleMileage, Number(checkInOdometer))));
    await uploadCheckOutVehiclePhotos(page, fixture);
    await setControlledNumberAsInvalidText(page, 'check-out-extra-fees', 'abc');
    await drawSignatureStroke(page);
    await page.getByTestId('check-out-submit').click();
    await expect(page.getByText(/Frais supplémentaires invalides/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('check-out : erreur frais dégâts invalides', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours',
    );

    const fixture = ensureOnePixelPng();
    const vehicleMileage =
      full?.vehicle?.mileage != null ? Number(full.vehicle.mileage) : Number(checkInOdometer);

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByTestId('check-out-odometer')
      .fill(String(Math.max(vehicleMileage, Number(checkInOdometer))));
    await uploadCheckOutVehiclePhotos(page, fixture);
    await setControlledNumberAsInvalidText(page, 'check-out-damage-fee', 'xyz');
    await drawSignatureStroke(page);
    await page.getByTestId('check-out-submit').click();
    await expect(page.getByText(/Frais dégâts invalides/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('check-out : erreur kilométrage retour < kilométrage départ', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours',
    );

    const fixture = ensureOnePixelPng();

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    const tooLow = String(Math.max(0, Number(checkInOdometer) - 5000));
    await page.getByTestId('check-out-odometer').fill(tooLow);
    await uploadCheckOutVehiclePhotos(page, fixture);
    await drawSignatureStroke(page);
    await page.getByTestId('check-out-submit').click();
    await expect(
      page.getByText(/kilométrage de fin.*kilométrage de début|doit être supérieur ou égal au kilométrage de début/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('check-out : dommage déclaré sans photo dommage', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours',
    );

    const fixture = ensureOnePixelPng();
    const vehicleMileage =
      full?.vehicle?.mileage != null ? Number(full.vehicle.mileage) : Number(checkInOdometer);

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByTestId('check-out-odometer')
      .fill(String(Math.max(vehicleMileage, Number(checkInOdometer)) + 50));
    await uploadCheckOutVehiclePhotos(page, fixture);
    await page.getByTestId('terrain-damage-add').click();
    await drawSignatureStroke(page);
    await page.getByTestId('check-out-submit').click();
    await expect(
      page.getByText(/Chaque dommage déclaré doit avoir au moins une photo/i).first(),
    ).toBeVisible({ timeout: 5000 });
    await page.getByTestId('terrain-damage-remove-0').click();
  });

  test('check-out : kilométrage retour invalide (≤ 0)', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    const full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours',
    );

    const fixture = ensureOnePixelPng();

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId('check-out-odometer').fill('-1');
    await uploadCheckOutVehiclePhotos(page, fixture);
    await drawSignatureStroke(page);
    await page.getByTestId('check-out-submit').click();
    await expect(page.getByText(/Kilométrage retour invalide/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('check-out complet → fiche réservation', async ({ page, request }) => {
    test.skip(!confirmedId, 'Booking manquant');
    const token = await loginAccessToken(request);
    test.skip(!token, 'Login API échoue');

    let full = await fetchBooking(request, token, confirmedId);
    test.skip(
      full?.status !== 'IN_PROGRESS' && full?.status !== 'LATE',
      'Pas de location en cours pour finaliser le check-out',
    );

    const fixture = ensureOnePixelPng();
    let odoEnd = String(
      Math.max(
        full?.vehicle?.mileage != null ? Number(full.vehicle.mileage) : 0,
        Number(checkInOdometer),
      ) + 250,
    );

    await loginAsAgent(page);
    await page.goto(`/agency/bookings/${confirmedId}/check-out`);
    await expect(page.getByRole('heading', { name: 'Check-out terrain' })).toBeVisible({
      timeout: 15_000,
    });

    full = await fetchBooking(request, token, confirmedId);
    if (full?.vehicle?.mileage != null) {
      odoEnd = String(Math.max(Number(full.vehicle.mileage), Number(checkInOdometer)) + 250);
    }
    await page.getByTestId('check-out-odometer').fill(odoEnd);
    await uploadCheckOutVehiclePhotos(page, fixture);
    await drawSignatureStroke(page);
    await page.getByTestId('check-out-submit').click();
    await expect(page).toHaveURL(new RegExp(`/agency/bookings/${confirmedId}$`), { timeout: 30_000 });
  });
});
