import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BASE_URL = "http://127.0.0.1:3000/api/v1";
const ADMIN_EMAIL = "khamlichihamza@outlook.fr";
const ADMIN_PASSWORD = "admin123";
const AGENT_PASSWORD = "Agent123!";

const now = new Date();
const ts = Date.now();

function iso(d) {
  return new Date(d).toISOString();
}

function plusDays(days) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d;
}

function plusHours(hours) {
  const d = new Date(now);
  d.setHours(d.getHours() + hours);
  return d;
}

function photo(seed) {
  return `https://picsum.photos/seed/${seed}/1200/800`;
}

async function api(path, method = "GET", token, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(
      `${method} ${path} failed (${res.status}): ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`,
    );
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

async function main() {
  console.log("1) Login as company admin...");
  const login = await api("/auth/login", "POST", null, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const adminToken = login.access_token || login.accessToken;
  const me = await api("/auth/me", "GET", adminToken);
  const agencyId = me.agencyIds?.[0];
  const companyId = me.companyId;
  if (!agencyId || !companyId) {
    throw new Error("Admin account missing agency/company scope");
  }

  console.log("2) Create AGENT user...");
  const agentEmail = `agent.sim.${ts}@example.com`;
  const agentUser = await api("/users", "POST", adminToken, {
    email: agentEmail,
    name: `Agent Simulation ${ts}`,
    role: "AGENT",
    companyId,
    agencyIds: [agencyId],
  });

  console.log("3) Force known password for AGENT (test only)...");
  const hashed = await bcrypt.hash(AGENT_PASSWORD, 10);
  await prisma.user.update({
    where: { id: agentUser.id },
    data: { password: hashed },
  });

  console.log("4) Create dedicated client/vehicle/booking for agent cycle...");
  const client = await api("/clients", "POST", adminToken, {
    firstName: "Agent",
    lastName: "Scenario",
    email: `client.agent.${ts}@example.com`,
    phone: "+212611000111",
    agencyId,
    dateOfBirth: "1992-05-17",
    address: "Casablanca - Sidi Maarouf",
    licenseNumber: `AGT-LIC-${ts}`,
    licenseType: "B",
    licenseImageUrl: photo(`agent-license-${ts}`),
    isMoroccan: true,
    countryOfOrigin: "Maroc",
    licenseExpiryDate: "2032-12-31",
    idCardType: "CIN",
    idCardNumber: `AG${String(ts).slice(-6)}`,
    idCardExpiryDate: "2033-07-15",
  });

  const vehicle = await api("/vehicles", "POST", adminToken, {
    brand: "Peugeot",
    model: "208",
    registrationNumber: `AGT-${String(ts).slice(-4)}-X`,
    agencyId,
    year: 2022,
    color: "Noir",
    mileage: 31000,
    fuel: "ESSENCE",
    gearbox: "AUTO",
    dailyRate: 480,
    depositAmount: 5500,
    status: "AVAILABLE",
    imageUrl: photo(`agent-vehicle-${ts}`),
    financingType: "CASH",
    purchasePrice: 220000,
    acquisitionDate: "2023-01-10",
    amortizationYears: 5,
  });

  const booking = await api("/bookings", "POST", adminToken, {
    agencyId,
    vehicleId: vehicle.id,
    clientId: client.id,
    startDate: iso(plusHours(2)),
    endDate: iso(plusDays(1)),
    totalPrice: 480,
    status: "CONFIRMED",
    depositRequired: true,
    depositAmount: 5500,
    depositDecisionSource: "AGENCY",
  });

  console.log("5) Login as AGENT...");
  const agentLogin = await api("/auth/login", "POST", null, {
    email: agentEmail,
    password: AGENT_PASSWORD,
  });
  const agentToken = agentLogin.access_token || agentLogin.accessToken;

  console.log("6) Agent reads missions (bookings list)...");
  const bookings = await api("/bookings", "GET", agentToken);
  const seen = Array.isArray(bookings)
    ? bookings.some((b) => b.id === booking.id)
    : false;

  console.log("7) Agent tries forbidden action: create booking...");
  let forbiddenCreateBooking = false;
  try {
    await api("/bookings", "POST", agentToken, {
      agencyId,
      vehicleId: vehicle.id,
      clientId: client.id,
      startDate: iso(plusDays(3)),
      endDate: iso(plusDays(4)),
      totalPrice: 480,
      status: "PENDING",
      depositRequired: false,
    });
  } catch (e) {
    if (e.status === 403) forbiddenCreateBooking = true;
  }

  console.log("8) Agent performs check-in with full payload...");
  await api(`/bookings/${booking.id}/checkin`, "POST", agentToken, {
    odometerStart: 31120,
    fuelLevelStart: "FULL",
    photosBefore: [
      photo(`agt-checkin-${ts}-1`),
      photo(`agt-checkin-${ts}-2`),
      photo(`agt-checkin-${ts}-3`),
      photo(`agt-checkin-${ts}-4`),
    ],
    notesStart: "Contrôle complet avant départ, aucun défaut majeur.",
    existingDamages: [
      {
        zone: "FRONT",
        type: "SCRATCH",
        severity: "LOW",
        description: "Micro rayure pare-choc avant",
        photos: [photo(`agt-checkin-damage-${ts}-1`)],
      },
    ],
    driverLicensePhoto: photo(`agt-driver-license-${ts}`),
    driverLicenseExpiry: "2032-12-31",
    identityDocument: photo(`agt-id-doc-${ts}`),
    extractionStatus: "OK",
    depositRequired: true,
    depositAmount: 5500,
    depositType: "CASH",
    depositDate: iso(now),
    depositStatusCheckIn: "COLLECTED",
    depositReference: `AGT-DEP-${ts}`,
    depositDocument: photo(`agt-deposit-${ts}`),
    signature:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z2xQAAAAASUVORK5CYII=",
  });

  console.log("9) Agent performs check-out with full payload...");
  await api(`/bookings/${booking.id}/checkout`, "POST", agentToken, {
    odometerEnd: 31300,
    fuelLevelEnd: "THREE_QUARTERS",
    photosAfter: [
      photo(`agt-checkout-${ts}-1`),
      photo(`agt-checkout-${ts}-2`),
      photo(`agt-checkout-${ts}-3`),
      photo(`agt-checkout-${ts}-4`),
    ],
    notesEnd: "Retour confirmé, véhicule globalement bon état.",
    newDamages: [
      {
        zone: "RIGHT",
        type: "DENT",
        severity: "MEDIUM",
        description: "Petit enfoncement porte passager",
        photos: [photo(`agt-checkout-damage-${ts}-1`)],
      },
    ],
    extraFees: 180,
    damageFee: 250,
    cashCollected: true,
    cashAmount: 430,
    cashReceipt: photo(`agt-cash-receipt-${ts}`),
    returnSignature:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z2xQAAAAASUVORK5CYII=",
  });

  const bookingAfter = await api(`/bookings/${booking.id}`, "GET", agentToken);

  console.log("\n=== AGENT MODE E2E completed ===");
  console.log(
    JSON.stringify(
      {
        agent: {
          id: agentUser.id,
          email: agentEmail,
          passwordForTest: AGENT_PASSWORD,
        },
        dedicatedData: {
          clientId: client.id,
          vehicleId: vehicle.id,
          bookingId: booking.id,
        },
        checks: {
          agentCanSeeBooking: seen,
          agentCreateBookingForbidden: forbiddenCreateBooking,
          bookingFinalStatus: bookingAfter.status,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error("AGENT MODE E2E failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
