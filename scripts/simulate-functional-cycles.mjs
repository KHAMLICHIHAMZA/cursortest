const BASE_URL = "http://127.0.0.1:3000/api/v1";
const ADMIN_EMAIL = "khamlichihamza@outlook.fr";
const ADMIN_PASSWORD = "admin123";

const now = new Date();
const ts = Date.now();

function iso(date) {
  return new Date(date).toISOString();
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
    throw new Error(
      `${method} ${path} failed (${res.status}): ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`,
    );
  }
  return data;
}

async function main() {
  console.log("1) Login admin...");
  const login = await api("/auth/login", "POST", null, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const token = login.access_token || login.accessToken;
  if (!token) throw new Error("No access token returned");

  const me = await api("/auth/me", "GET", token);
  const companyId = me.companyId;
  const agencyId = me.agencyIds?.[0];
  if (!companyId || !agencyId) {
    throw new Error("Missing companyId/agencyId for admin account");
  }
  console.log(`   companyId=${companyId} agencyId=${agencyId}`);

  console.log("2) Create manager...");
  const managerEmail = `manager.sim.${ts}@example.com`;
  const manager = await api("/users", "POST", token, {
    email: managerEmail,
    name: `Manager Simulation ${ts}`,
    role: "AGENCY_MANAGER",
    companyId,
    agencyIds: [agencyId],
  });

  console.log("3) Create clients...");
  const clientsPayload = [
    {
      firstName: "Youssef",
      lastName: "Bennani",
      email: `client.youssef.${ts}@example.com`,
      phone: "+212600100001",
      agencyId,
      dateOfBirth: "1990-06-14",
      address: "Casablanca - Maarif",
      licenseNumber: `LIC-${ts}-01`,
      licenseType: "B",
      licenseImageUrl: photo(`license-${ts}-1`),
      isMoroccan: true,
      countryOfOrigin: "Maroc",
      licenseExpiryDate: "2031-12-31",
      isForeignLicense: false,
      idCardType: "CIN",
      idCardNumber: `BK${String(ts).slice(-6)}1`,
      idCardExpiryDate: "2032-05-10",
      note: "Client premium simulation",
    },
    {
      firstName: "Salma",
      lastName: "Alaoui",
      email: `client.salma.${ts}@example.com`,
      phone: "+212600100002",
      agencyId,
      dateOfBirth: "1994-03-21",
      address: "Rabat - Hay Riad",
      licenseNumber: `LIC-${ts}-02`,
      licenseType: "B",
      licenseImageUrl: photo(`license-${ts}-2`),
      isMoroccan: true,
      countryOfOrigin: "Maroc",
      licenseExpiryDate: "2030-09-30",
      idCardType: "CIN",
      idCardNumber: `BK${String(ts).slice(-6)}2`,
      idCardExpiryDate: "2031-10-10",
    },
    {
      firstName: "Karim",
      lastName: "El Idrissi",
      email: `client.karim.${ts}@example.com`,
      phone: "+212600100003",
      agencyId,
      dateOfBirth: "1987-11-02",
      address: "Marrakech - Guéliz",
      licenseNumber: `LIC-${ts}-03`,
      licenseType: "B",
      licenseImageUrl: photo(`license-${ts}-3`),
      isMoroccan: false,
      countryOfOrigin: "France",
      licenseExpiryDate: "2033-01-15",
      isForeignLicense: true,
      passportNumber: `P${String(ts).slice(-7)}3`,
      passportExpiryDate: "2034-02-02",
    },
    {
      firstName: "Nadia",
      lastName: "Rami",
      email: `client.nadia.${ts}@example.com`,
      phone: "+212600100004",
      agencyId,
      dateOfBirth: "1998-07-30",
      address: "Tanger - Malabata",
      licenseNumber: `LIC-${ts}-04`,
      licenseType: "B",
      licenseImageUrl: photo(`license-${ts}-4`),
      isMoroccan: true,
      countryOfOrigin: "Maroc",
      licenseExpiryDate: "2030-06-20",
      idCardType: "CIN",
      idCardNumber: `BK${String(ts).slice(-6)}4`,
      idCardExpiryDate: "2032-03-03",
    },
  ];
  const clients = [];
  for (const payload of clientsPayload) {
    clients.push(await api("/clients", "POST", token, payload));
  }

  console.log("4) Create vehicles...");
  const vehiclesPayload = [
    {
      brand: "Dacia",
      model: "Logan",
      registrationNumber: `SIM-${String(ts).slice(-4)}-A`,
      agencyId,
      year: 2021,
      color: "Blanc",
      mileage: 42000,
      fuel: "DIESEL",
      gearbox: "MANUAL",
      dailyRate: 350,
      depositAmount: 4000,
      status: "AVAILABLE",
      imageUrl: photo(`vehicle-${ts}-1`),
      purchasePrice: 165000,
      acquisitionDate: "2022-02-15",
      amortizationYears: 5,
      financingType: "CASH",
    },
    {
      brand: "Renault",
      model: "Clio 5",
      registrationNumber: `SIM-${String(ts).slice(-4)}-B`,
      agencyId,
      year: 2023,
      color: "Gris",
      mileage: 18000,
      fuel: "ESSENCE",
      gearbox: "AUTO",
      dailyRate: 520,
      depositAmount: 6000,
      status: "AVAILABLE",
      imageUrl: photo(`vehicle-${ts}-2`),
      purchasePrice: 235000,
      acquisitionDate: "2023-09-01",
      amortizationYears: 5,
      financingType: "MIXED",
      downPayment: 70000,
      monthlyPayment: 4200,
      financingDurationMonths: 48,
      creditStartDate: "2023-09-10",
    },
    {
      brand: "Hyundai",
      model: "i20",
      registrationNumber: `SIM-${String(ts).slice(-4)}-C`,
      agencyId,
      year: 2022,
      color: "Bleu",
      mileage: 27000,
      fuel: "ESSENCE",
      gearbox: "MANUAL",
      dailyRate: 430,
      depositAmount: 5000,
      status: "AVAILABLE",
      imageUrl: photo(`vehicle-${ts}-3`),
      purchasePrice: 210000,
      acquisitionDate: "2022-11-20",
      amortizationYears: 6,
      financingType: "CREDIT",
      monthlyPayment: 3800,
      financingDurationMonths: 60,
      creditStartDate: "2022-12-01",
    },
  ];
  const vehicles = [];
  for (const payload of vehiclesPayload) {
    vehicles.push(await api("/vehicles", "POST", token, payload));
  }

  console.log("5) Create maintenance operations...");
  const maintA = await api("/maintenance", "POST", token, {
    agencyId,
    vehicleId: vehicles[0].id,
    description: "Vidange + filtres (préventif)",
    plannedAt: iso(plusDays(2)),
    cost: 850,
    status: "PLANNED",
    documentUrl: photo(`maintenance-${ts}-1`),
  });
  const maintB = await api("/maintenance", "POST", token, {
    agencyId,
    vehicleId: vehicles[1].id,
    description: "Diagnostic freinage",
    plannedAt: iso(plusDays(1)),
    cost: 1200,
    status: "IN_PROGRESS",
    documentUrl: photo(`maintenance-${ts}-2`),
  });
  const maintC = await api("/maintenance", "POST", token, {
    agencyId,
    vehicleId: vehicles[2].id,
    description: "Remplacement pneus",
    plannedAt: iso(plusDays(-3)),
    cost: 2600,
    status: "COMPLETED",
    documentUrl: photo(`maintenance-${ts}-3`),
  });
  const maintD = await api("/maintenance", "POST", token, {
    agencyId,
    vehicleId: vehicles[0].id,
    description: "Révision climatisation",
    plannedAt: iso(plusDays(5)),
    cost: 900,
    status: "CANCELLED",
    documentUrl: photo(`maintenance-${ts}-4`),
  });
  await api(`/maintenance/${maintA.id}`, "PATCH", token, {
    status: "IN_PROGRESS",
    cost: 980,
  });
  await api(`/maintenance/${maintB.id}`, "PATCH", token, {
    status: "COMPLETED",
    cost: 1350,
  });

  console.log("6) Create reservations across lifecycle...");
  const bookingConfirmed = await api("/bookings", "POST", token, {
    agencyId,
    vehicleId: vehicles[2].id,
    clientId: clients[0].id,
    startDate: iso(plusHours(1)),
    endDate: iso(plusDays(1)),
    totalPrice: 430,
    status: "CONFIRMED",
    depositRequired: true,
    depositAmount: 4000,
    depositDecisionSource: "AGENCY",
  });
  const bookingPending = await api("/bookings", "POST", token, {
    agencyId,
    vehicleId: vehicles[1].id,
    clientId: clients[1].id,
    startDate: iso(plusDays(3)),
    endDate: iso(plusDays(6)),
    totalPrice: 1560,
    status: "PENDING",
    depositRequired: true,
    depositAmount: 6000,
    depositDecisionSource: "COMPANY",
  });
  const bookingCancelled = await api("/bookings", "POST", token, {
    agencyId,
    vehicleId: vehicles[1].id,
    clientId: clients[2].id,
    startDate: iso(plusDays(7)),
    endDate: iso(plusDays(8)),
    totalPrice: 520,
    status: "CANCELLED",
    depositRequired: false,
  });
  const bookingNoShow = await api("/bookings", "POST", token, {
    agencyId,
    vehicleId: vehicles[1].id,
    clientId: clients[3].id,
    startDate: iso(plusDays(9)),
    endDate: iso(plusDays(10)),
    totalPrice: 520,
    status: "NO_SHOW",
    depositRequired: false,
  });

  console.log("7) Perform full check-in / check-out cycle...");
  await api(`/bookings/${bookingConfirmed.id}/checkin`, "POST", token, {
    odometerStart: 42200,
    fuelLevelStart: "FULL",
    photosBefore: [
      photo(`checkin-${ts}-1`),
      photo(`checkin-${ts}-2`),
      photo(`checkin-${ts}-3`),
      photo(`checkin-${ts}-4`),
    ],
    notesStart: "Véhicule propre, remise avec plein carburant.",
    existingDamages: [
      {
        zone: "REAR",
        type: "SCRATCH",
        severity: "LOW",
        description: "Micro-rayure pare-choc arrière",
        photos: [photo(`checkin-damage-${ts}-1`)],
      },
    ],
    driverLicensePhoto: photo(`driver-license-${ts}`),
    driverLicenseExpiry: "2031-12-31",
    identityDocument: photo(`id-doc-${ts}`),
    extractionStatus: "OK",
    depositRequired: true,
    depositAmount: 4000,
    depositType: "CASH",
    depositDate: iso(now),
    depositStatusCheckIn: "COLLECTED",
    depositReference: `DEP-${ts}`,
    depositDocument: photo(`deposit-doc-${ts}`),
    signature:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z2xQAAAAASUVORK5CYII=",
  });

  await api(`/bookings/${bookingConfirmed.id}/checkout`, "POST", token, {
    odometerEnd: 42480,
    fuelLevelEnd: "THREE_QUARTERS",
    photosAfter: [
      photo(`checkout-${ts}-1`),
      photo(`checkout-${ts}-2`),
      photo(`checkout-${ts}-3`),
      photo(`checkout-${ts}-4`),
    ],
    notesEnd: "Retour sans incident majeur, intérieur propre.",
    newDamages: [
      {
        zone: "LEFT",
        type: "SCRATCH",
        severity: "LOW",
        description: "Rayure légère porte arrière gauche",
        photos: [photo(`checkout-damage-${ts}-1`)],
      },
    ],
    extraFees: 150,
    damageFee: 200,
    cashCollected: true,
    cashAmount: 350,
    cashReceipt: photo(`cash-receipt-${ts}`),
    returnSignature:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z2xQAAAAASUVORK5CYII=",
  });

  console.log("8) Create second booking and check-in only (IN_PROGRESS)...");
  const bookingInProgress = await api("/bookings", "POST", token, {
    agencyId,
    vehicleId: vehicles[1].id,
    clientId: clients[1].id,
    startDate: iso(plusDays(11)),
    endDate: iso(plusDays(13)),
    totalPrice: 1560,
    status: "CONFIRMED",
    depositRequired: true,
    depositAmount: 6000,
    depositDecisionSource: "COMPANY",
  });
  await api(`/bookings/${bookingInProgress.id}/checkin`, "POST", token, {
    odometerStart: 18250,
    fuelLevelStart: "FULL",
    photosBefore: [
      photo(`checkin2-${ts}-1`),
      photo(`checkin2-${ts}-2`),
      photo(`checkin2-${ts}-3`),
      photo(`checkin2-${ts}-4`),
    ],
    notesStart: "Départ client pro, état impeccable.",
    driverLicensePhoto: photo(`driver-license-2-${ts}`),
    driverLicenseExpiry: "2030-09-30",
    identityDocument: photo(`id-doc-2-${ts}`),
    extractionStatus: "OK",
    depositRequired: true,
    depositAmount: 6000,
    depositType: "CARD_HOLD",
    depositStatusCheckIn: "COLLECTED",
    signature:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z2xQAAAAASUVORK5CYII=",
  });

  console.log("\n=== Simulation completed successfully ===");
  console.log(
    JSON.stringify(
      {
        manager: { id: manager.id, email: manager.email, role: manager.role },
        clients: clients.map((c) => ({ id: c.id, email: c.email })),
        vehicles: vehicles.map((v) => ({
          id: v.id,
          reg: v.registrationNumber,
          model: `${v.brand} ${v.model}`,
        })),
        maintenance: [maintA.id, maintB.id, maintC.id, maintD.id],
        bookings: {
          fullCycleReturned: bookingConfirmed.id,
          pending: bookingPending.id,
          cancelled: bookingCancelled.id,
          noShow: bookingNoShow.id,
          inProgress: bookingInProgress.id,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("Simulation failed:", err.message);
  process.exit(1);
});
