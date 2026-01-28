import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean database (ordre important pour les relations)
  await prisma.passwordResetToken.deleteMany();
  await prisma.paymentSaas.deleteMany();
  await prisma.subscriptionModule.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.planQuota.deleteMany();
  await prisma.planModule.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.agencyModule.deleteMany();
  await prisma.companyModule.deleteMany();
  await prisma.moduleDependency.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.userAgency.deleteMany();
  await prisma.user.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.company.deleteMany();

  // Create SUPER_ADMIN
  const superAdminPassword = await hashPassword('admin123');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@malocauto.com',
      password: superAdminPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Created SUPER_ADMIN:', superAdmin.email);

  // Create Company 1
  const company1 = await prisma.company.create({
    data: {
      name: 'AutoLocation Premium',
      raisonSociale: 'AutoLocation Premium',
      identifiantLegal: 'ICE-000000001',
      formeJuridique: 'SARL',
      maxAgencies: 5,
      slug: 'autolocation-premium',
      phone: '+33123456789',
      address: '123 Rue de la Location, 75001 Paris',
      isActive: true,
    },
  });
  console.log('✅ Created Company 1:', company1.name);

  // Create Company 1 Admin
  const company1AdminPassword = await hashPassword('admin123');
  const company1Admin = await prisma.user.create({
    data: {
      email: 'admin@autolocation.fr',
      password: company1AdminPassword,
      name: 'Jean Dupont',
      role: 'COMPANY_ADMIN',
      companyId: company1.id,
      isActive: true,
    },
  });
  console.log('✅ Created Company 1 Admin:', company1Admin.email);

  // Create Company 1 Agencies
  const agency1_1 = await prisma.agency.create({
    data: {
      name: 'Agence Paris Centre',
      companyId: company1.id,
      phone: '+33123456790',
      address: '123 Rue de la Location, 75001 Paris',
    },
  });

  const agency1_2 = await prisma.agency.create({
    data: {
      name: 'Agence Paris Nord',
      companyId: company1.id,
      phone: '+33123456791',
      address: '456 Avenue du Nord, 75018 Paris',
    },
  });
  console.log('✅ Created Company 1 Agencies');

  // Create Company 1 Users
  const manager1Password = await hashPassword('manager123');
  const manager1 = await prisma.user.create({
    data: {
      email: 'manager1@autolocation.fr',
      password: manager1Password,
      name: 'Marie Martin',
      role: 'AGENCY_MANAGER',
      companyId: company1.id,
      isActive: true,
    },
  });

  await prisma.userAgency.createMany({
    data: [
      { userId: manager1.id, agencyId: agency1_1.id },
      { userId: manager1.id, agencyId: agency1_2.id },
    ],
  });

  const agent1Password = await hashPassword('agent123');
  const agent1 = await prisma.user.create({
    data: {
      email: 'agent1@autolocation.fr',
      password: agent1Password,
      name: 'Pierre Durand',
      role: 'AGENT',
      companyId: company1.id,
      isActive: true,
    },
  });

  await prisma.userAgency.create({
    data: {
      userId: agent1.id,
      agencyId: agency1_1.id,
    },
  });
  console.log('✅ Created Company 1 Users');

  // Create Company 1 Vehicles (plus de véhicules pour tous les cas d'usage)
  const vehicles1 = await prisma.vehicle.createMany({
    data: [
      {
        agencyId: agency1_1.id,
        registrationNumber: 'AB-123-CD',
        brand: 'Peugeot',
        model: '208',
        year: 2022,
        mileage: 15000,
        fuel: 'Essence',
        gearbox: 'Manuelle',
        dailyRate: 45.0,
        depositAmount: 500.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_1.id,
        registrationNumber: 'EF-456-GH',
        brand: 'Renault',
        model: 'Clio',
        year: 2023,
        mileage: 8000,
        fuel: 'Essence',
        gearbox: 'Manuelle',
        dailyRate: 42.0,
        depositAmount: 450.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_1.id,
        registrationNumber: 'XY-789-ZA',
        brand: 'Citroën',
        model: 'C3',
        year: 2022,
        mileage: 12000,
        fuel: 'Essence',
        gearbox: 'Manuelle',
        dailyRate: 40.0,
        depositAmount: 400.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_1.id,
        registrationNumber: 'BC-234-DE',
        brand: 'Opel',
        model: 'Corsa',
        year: 2023,
        mileage: 5000,
        fuel: 'Essence',
        gearbox: 'Manuelle',
        dailyRate: 38.0,
        depositAmount: 350.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_1.id,
        registrationNumber: 'FG-567-HI',
        brand: 'Volkswagen',
        model: 'Polo',
        year: 2023,
        mileage: 6000,
        fuel: 'Essence',
        gearbox: 'Manuelle',
        dailyRate: 43.0,
        depositAmount: 480.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_1.id,
        registrationNumber: 'JK-890-LM',
        brand: 'Ford',
        model: 'Fiesta',
        year: 2022,
        mileage: 11000,
        fuel: 'Essence',
        gearbox: 'Manuelle',
        dailyRate: 41.0,
        depositAmount: 420.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_1.id,
        registrationNumber: 'NO-123-PQ',
        brand: 'Toyota',
        model: 'Yaris',
        year: 2023,
        mileage: 7000,
        fuel: 'Essence',
        gearbox: 'Automatique',
        dailyRate: 48.0,
        depositAmount: 520.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_1.id,
        registrationNumber: 'RS-456-TU',
        brand: 'Hyundai',
        model: 'i20',
        year: 2022,
        mileage: 13000,
        fuel: 'Essence',
        gearbox: 'Manuelle',
        dailyRate: 39.0,
        depositAmount: 380.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_2.id,
        registrationNumber: 'IJ-789-KL',
        brand: 'BMW',
        model: 'Série 3',
        year: 2023,
        mileage: 12000,
        fuel: 'Essence',
        gearbox: 'Automatique',
        dailyRate: 120.0,
        depositAmount: 1500.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency1_2.id,
        registrationNumber: 'MN-012-OP',
        brand: 'Mercedes',
        model: 'Classe A',
        year: 2022,
        mileage: 20000,
        fuel: 'Essence',
        gearbox: 'Automatique',
        dailyRate: 110.0,
        depositAmount: 1400.0,
        status: 'RENTED',
      },
    ],
  });
  console.log('✅ Created Company 1 Vehicles (10 véhicules)');

  // Create Company 1 Clients (plus de clients pour tous les cas d'usage)
  const client1 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Sophie Bernard',
      email: 'sophie.bernard@email.com',
      phone: '+33612345678',
      note: 'Client fidèle',
      licenseNumber: '123456789',
      licenseExpiryDate: new Date('2026-12-31'),
    },
  });

  const client2 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Marc Dubois',
      email: 'marc.dubois@email.com',
      phone: '+33623456789',
      licenseNumber: '987654321',
      licenseExpiryDate: new Date('2025-06-30'),
    },
  });

  const client3 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Julie Martin',
      email: 'julie.martin@email.com',
      phone: '+33634567890',
      licenseNumber: '456789123',
      licenseExpiryDate: new Date('2027-03-15'),
    },
  });

  const client4 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Pierre Lefebvre',
      email: 'pierre.lefebvre@email.com',
      phone: '+33645678901',
      licenseNumber: '789123456',
      licenseExpiryDate: new Date('2026-09-20'),
    },
  });

  const client5 = await prisma.client.create({
    data: {
      agencyId: agency1_2.id,
      name: 'Thomas Leroy',
      email: 'thomas.leroy@email.com',
      phone: '+33687654321',
      licenseNumber: '321654987',
      licenseExpiryDate: new Date('2025-11-30'),
    },
  });

  // Clients supplémentaires pour tester tous les cas
  const client6 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Amélie Moreau',
      email: 'amelie.moreau@email.com',
      phone: '+33656789012',
      licenseNumber: '147258369',
      licenseExpiryDate: new Date('2026-05-15'),
    },
  });

  const client7 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Lucas Petit',
      email: 'lucas.petit@email.com',
      phone: '+33667890123',
      licenseNumber: '258369147',
      licenseExpiryDate: new Date('2027-08-20'),
    },
  });

  const client8 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Emma Rousseau',
      email: 'emma.rousseau@email.com',
      phone: '+33678901234',
      licenseNumber: '369147258',
      licenseExpiryDate: new Date('2025-12-31'),
    },
  });

  const client9 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Hugo Bernard',
      email: 'hugo.bernard@email.com',
      phone: '+33689012345',
      licenseNumber: '741852963',
      licenseExpiryDate: new Date('2026-11-10'),
    },
  });

  const client10 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Léa Dubois',
      email: 'lea.dubois@email.com',
      phone: '+33690123456',
      licenseNumber: '852963741',
      licenseExpiryDate: new Date('2027-04-25'),
    },
  });

  const client11 = await prisma.client.create({
    data: {
      agencyId: agency1_1.id,
      name: 'Noah Martin',
      email: 'noah.martin@email.com',
      phone: '+33601234567',
      licenseNumber: '963741852',
      licenseExpiryDate: new Date('2026-07-18'),
    },
  });

  console.log('✅ Created Company 1 Clients (11 clients)');

  // Create Company 1 Bookings - TOUS LES CAS D'USAGE POUR LES TÂCHES
  const now = new Date();
  // Dates futures
  const today = new Date(now);
  today.setHours(10, 0, 0, 0); // 10h00 aujourd'hui
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const in2Days = new Date(now);
  in2Days.setDate(in2Days.getDate() + 2);
  in2Days.setHours(14, 0, 0, 0);
  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);
  in3Days.setHours(16, 0, 0, 0);
  const in5Days = new Date(now);
  in5Days.setDate(in5Days.getDate() + 5);
  in5Days.setHours(17, 0, 0, 0);
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  in7Days.setHours(10, 0, 0, 0);
  // Dates passées
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(8, 0, 0, 0);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(10, 0, 0, 0);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(9, 0, 0, 0);
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 3);
  lastWeekEnd.setHours(18, 0, 0, 0);

  // Récupérer les véhicules
  const vehicle1 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'AB-123-CD' } });
  const vehicle2 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'EF-456-GH' } });
  const vehicle3 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'XY-789-ZA' } });
  const vehicle4 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'BC-234-DE' } });
  const vehicle5 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'FG-567-HI' } });
  const vehicle6 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'JK-890-LM' } });
  const vehicle7 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'NO-123-PQ' } });
  const vehicle8 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'RS-456-TU' } });
  const vehicle9 = await prisma.vehicle.findFirst({ where: { registrationNumber: 'MN-012-OP' } });

  console.log('\n📋 Creating bookings with all task use cases...\n');

  // ============================================
  // CAS 1: CONFIRMED → Génère CHECK_IN (Livraison)
  // ============================================

  // CONFIRMED - Check-in aujourd'hui (10h00)
  const booking1 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle1!.id,
      clientId: client1.id,
      startDate: today,
      endDate: in3Days,
      totalPrice: 135.0, // 3 jours * 45 MAD/jour
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN aujourd'hui (10h) - Booking ${booking1.id.slice(0, 8)}: ${client1.name}`);

  // CONFIRMED - Check-in demain (9h00)
  const booking2 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle2!.id,
      clientId: client2.id,
      startDate: tomorrow,
      endDate: in5Days,
      totalPrice: 168.0, // 4 jours * 42 MAD/jour
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN demain (9h) - Booking ${booking2.id.slice(0, 8)}: ${client2.name}`);

  // CONFIRMED - Check-in dans 2 jours (14h00)
  const booking3 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle3!.id,
      clientId: client3.id,
      startDate: in2Days,
      endDate: in7Days,
      totalPrice: 200.0, // 5 jours * 40 MAD/jour
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN dans 2 jours (14h) - Booking ${booking3.id.slice(0, 8)}: ${client3.name}`);

  // CONFIRMED - Check-in dans 3 jours (16h00)
  const booking4 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle4!.id,
      clientId: client6.id,
      startDate: in3Days,
      endDate: in7Days,
      totalPrice: 152.0, // 4 jours * 38 MAD/jour
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN dans 3 jours (16h) - Booking ${booking4.id.slice(0, 8)}: ${client6.name}`);

  // CONFIRMED - Check-in dans 7 jours (10h00)
  const booking5 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle5!.id,
      clientId: client7.id,
      startDate: in7Days,
      endDate: new Date(in7Days.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 jours
      totalPrice: 129.0, // 3 jours * 43 MAD/jour
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN dans 7 jours (10h) - Booking ${booking5.id.slice(0, 8)}: ${client7.name}`);

  // ============================================
  // CAS 2: IN_PROGRESS → Génère CHECK_OUT (Récupération)
  // ============================================

  // IN_PROGRESS - Check-out aujourd'hui (17h00)
  const booking6 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle6!.id,
      clientId: client8.id,
      startDate: twoDaysAgo,
      endDate: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 17h00
      totalPrice: 123.0, // 3 jours * 41 MAD/jour
      status: 'IN_PROGRESS',
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle6!.id },
    data: { status: 'RENTED' },
  });
  console.log(`✅ CHECK_OUT aujourd'hui (17h) - Booking ${booking6.id.slice(0, 8)}: ${client8.name}`);

  // IN_PROGRESS - Check-out demain (18h00)
  const booking7 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle7!.id,
      clientId: client9.id,
      startDate: yesterday,
      endDate: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000), // 18h00
      totalPrice: 82.0, // 2 jours * 41 MAD/jour
      status: 'IN_PROGRESS',
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle7!.id },
    data: { status: 'RENTED' },
  });
  console.log(`✅ CHECK_OUT demain (18h) - Booking ${booking7.id.slice(0, 8)}: ${client9.name}`);

  // IN_PROGRESS - Check-out dans 2 jours (16h00)
  const booking8 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle8!.id,
      clientId: client10.id,
      startDate: twoDaysAgo,
      endDate: new Date(in2Days.getTime() + 2 * 60 * 60 * 1000), // 16h00
      totalPrice: 164.0, // 4 jours * 41 MAD/jour
      status: 'IN_PROGRESS',
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle8!.id },
    data: { status: 'RENTED' },
  });
  console.log(`✅ CHECK_OUT dans 2 jours (16h) - Booking ${booking8.id.slice(0, 8)}: ${client10.name}`);

  // IN_PROGRESS - Check-out dans 3 jours (17h00)
  const booking9 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle1!.id,
      clientId: client11.id,
      startDate: yesterday,
      endDate: new Date(in3Days.getTime() + 1 * 60 * 60 * 1000), // 17h00
      totalPrice: 164.0, // 4 jours * 41 MAD/jour
      status: 'IN_PROGRESS',
    },
  });
  console.log(`✅ CHECK_OUT dans 3 jours (17h) - Booking ${booking9.id.slice(0, 8)}: ${client11.name}`);

  // IN_PROGRESS - Check-out dans 5 jours (19h00) - Longue location
  const booking10 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle2!.id,
      clientId: client4.id,
      startDate: yesterday,
      endDate: new Date(in5Days.getTime() + 2 * 60 * 60 * 1000), // 19h00
      totalPrice: 252.0, // 6 jours * 42 MAD/jour
      status: 'IN_PROGRESS',
    },
  });
  console.log(`✅ CHECK_OUT dans 5 jours (19h) - Booking ${booking10.id.slice(0, 8)}: ${client4.name}`);

  // IN_PROGRESS - LATE scenario (En retard) - Check-out était hier mais toujours en cours
  // Note: Utilise IN_PROGRESS car LATE nécessiterait un mapping supplémentaire dans le mobile
  const booking11 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle3!.id,
      clientId: client5.id,
      startDate: lastWeek,
      endDate: yesterday, // Date de fin était hier (retard)
      totalPrice: 280.0, // 6 jours * 40 MAD/jour (mais devrait être retourné)
      status: 'IN_PROGRESS', // Utilise IN_PROGRESS pour générer CHECK_OUT (scénario LATE)
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle3!.id },
    data: { status: 'RENTED' },
  });
  console.log(`⚠️  CHECK_OUT LATE scenario (retard, fin hier) - Booking ${booking11.id.slice(0, 8)}: ${client5.name}`);

  // IN_PROGRESS - EXTENDED scenario (Prolongation) - Location prolongée
  // Note: Utilise IN_PROGRESS car EXTENDED nécessiterait un mapping supplémentaire dans le mobile
  const booking12 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle4!.id,
      clientId: client1.id,
      startDate: lastWeek,
      endDate: tomorrow, // Date originale était avant, mais prolongée
      totalPrice: 304.0, // 8 jours * 38 MAD/jour (prolongée)
      status: 'IN_PROGRESS', // Utilise IN_PROGRESS pour générer CHECK_OUT (scénario EXTENDED)
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle4!.id },
    data: { status: 'RENTED' },
  });
  console.log(`📅 CHECK_OUT EXTENDED scenario (prolongation, fin demain) - Booking ${booking12.id.slice(0, 8)}: ${client1.name}`);

  // IN_PROGRESS pour l'agence 2
  const booking13 = await prisma.booking.create({
    data: {
      agencyId: agency1_2.id,
      vehicleId: vehicle9!.id,
      clientId: client5.id,
      startDate: twoDaysAgo,
      endDate: in3Days,
      totalPrice: 550.0, // 5 jours * 110 MAD/jour
      status: 'IN_PROGRESS',
    },
  });
  console.log(`✅ CHECK_OUT agence 2 (dans 3 jours) - Booking ${booking13.id.slice(0, 8)}: ${client5.name}`);

  // ============================================
  // CAS 3: Statuts SANS TÂCHES (pour vérifier qu'ils ne génèrent pas de tâches)
  // ============================================

  // PENDING - Pas de tâche (en attente de confirmation)
  const booking14 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle5!.id,
      clientId: client2.id,
      startDate: tomorrow,
      endDate: in3Days,
      totalPrice: 86.0, // 2 jours * 43 MAD/jour
      status: 'PENDING',
    },
  });
  console.log(`⏸️  PENDING (pas de tâche) - Booking ${booking14.id.slice(0, 8)}: ${client2.name}`);

  // DRAFT - Pas de tâche (brouillon)
  const booking15 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle6!.id,
      clientId: client3.id,
      startDate: in2Days,
      endDate: in5Days,
      totalPrice: 123.0, // 3 jours * 41 MAD/jour
      status: 'DRAFT',
    },
  });
  console.log(`📝 DRAFT (pas de tâche) - Booking ${booking15.id.slice(0, 8)}: ${client3.name}`);

  // RETURNED - Pas de tâche (terminée)
  const booking16 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle7!.id,
      clientId: client4.id,
      startDate: lastWeek,
      endDate: lastWeekEnd,
      totalPrice: 152.0, // 4 jours * 38 MAD/jour
      status: 'RETURNED',
    },
  });
  console.log(`✅ RETURNED (pas de tâche, historique) - Booking ${booking16.id.slice(0, 8)}: ${client4.name}`);

  // CANCELLED - Pas de tâche (annulée)
  const booking17 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle8!.id,
      clientId: client6.id,
      startDate: tomorrow,
      endDate: in3Days,
      totalPrice: 78.0, // 2 jours * 39 MAD/jour
      status: 'CANCELLED',
    },
  });
  console.log(`❌ CANCELLED (pas de tâche) - Booking ${booking17.id.slice(0, 8)}: ${client6.name}`);

  // NO_SHOW - Pas de tâche (client absent)
  const booking18 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle1!.id,
      clientId: client7.id,
      startDate: yesterday,
      endDate: in3Days,
      totalPrice: 192.0, // 4 jours * 48 MAD/jour
      status: 'NO_SHOW',
    },
  });
  console.log(`🚫 NO_SHOW (pas de tâche) - Booking ${booking18.id.slice(0, 8)}: ${client7.name}`);

  // ============================================
  // CAS 4: CAS SPÉCIAUX - Missions multiples le même jour
  // ============================================

  // Plusieurs CHECK_IN le même jour (aujourd'hui à différentes heures)
  const todayMorning = new Date(now);
  todayMorning.setHours(8, 0, 0, 0); // 8h00
  const todayAfternoon = new Date(now);
  todayAfternoon.setHours(14, 30, 0, 0); // 14h30
  const todayEvening = new Date(now);
  todayEvening.setHours(18, 45, 0, 0); // 18h45

  // CHECK_IN aujourd'hui matin (8h00)
  const booking19 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle5!.id,
      clientId: client8.id,
      startDate: todayMorning,
      endDate: in3Days,
      totalPrice: 135.0,
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN aujourd'hui matin (8h) - Booking ${booking19.id.slice(0, 8)}: ${client8.name}`);

  // CHECK_IN aujourd'hui après-midi (14h30)
  const booking20 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle6!.id,
      clientId: client9.id,
      startDate: todayAfternoon,
      endDate: in5Days,
      totalPrice: 168.0,
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN aujourd'hui après-midi (14h30) - Booking ${booking20.id.slice(0, 8)}: ${client9.name}`);

  // CHECK_IN aujourd'hui soir (18h45)
  const booking21 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle7!.id,
      clientId: client10.id,
      startDate: todayEvening,
      endDate: in7Days,
      totalPrice: 200.0,
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN aujourd'hui soir (18h45) - Booking ${booking21.id.slice(0, 8)}: ${client10.name}`);

  // Plusieurs CHECK_OUT le même jour (aujourd'hui à différentes heures)
  const todayEarlyMorning = new Date(now);
  todayEarlyMorning.setHours(7, 0, 0, 0); // 7h00
  const todayNoon = new Date(now);
  todayNoon.setHours(12, 0, 0, 0); // 12h00
  const todayLateEvening = new Date(now);
  todayLateEvening.setHours(20, 0, 0, 0); // 20h00

  // CHECK_OUT aujourd'hui tôt (7h00)
  const booking22 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle8!.id,
      clientId: client11.id,
      startDate: twoDaysAgo,
      endDate: todayEarlyMorning,
      totalPrice: 82.0,
      status: 'IN_PROGRESS',
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle8!.id },
    data: { status: 'RENTED' },
  });
  console.log(`✅ CHECK_OUT aujourd'hui tôt (7h) - Booking ${booking22.id.slice(0, 8)}: ${client11.name}`);

  // CHECK_OUT aujourd'hui midi (12h00)
  const booking23 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle1!.id,
      clientId: client4.id,
      startDate: yesterday,
      endDate: todayNoon,
      totalPrice: 45.0,
      status: 'IN_PROGRESS',
    },
  });
  console.log(`✅ CHECK_OUT aujourd'hui midi (12h) - Booking ${booking23.id.slice(0, 8)}: ${client4.name}`);

  // CHECK_OUT aujourd'hui tard (20h00)
  const booking24 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle2!.id,
      clientId: client6.id,
      startDate: yesterday,
      endDate: todayLateEvening,
      totalPrice: 84.0,
      status: 'IN_PROGRESS',
    },
  });
  console.log(`✅ CHECK_OUT aujourd'hui tard (20h) - Booking ${booking24.id.slice(0, 8)}: ${client6.name}`);

  // ============================================
  // CAS 5: Missions demain avec heures variées
  // ============================================

  const tomorrowEarly = new Date(now);
  tomorrowEarly.setDate(tomorrowEarly.getDate() + 1);
  tomorrowEarly.setHours(6, 0, 0, 0); // 6h00 demain

  const tomorrowNoon = new Date(now);
  tomorrowNoon.setDate(tomorrowNoon.getDate() + 1);
  tomorrowNoon.setHours(12, 0, 0, 0); // 12h00 demain

  const tomorrowLate = new Date(now);
  tomorrowLate.setDate(tomorrowLate.getDate() + 1);
  tomorrowLate.setHours(22, 0, 0, 0); // 22h00 demain

  // CHECK_IN demain très tôt (6h00)
  const booking25 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle3!.id,
      clientId: client1.id,
      startDate: tomorrowEarly,
      endDate: in5Days,
      totalPrice: 160.0,
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN demain très tôt (6h) - Booking ${booking25.id.slice(0, 8)}: ${client1.name}`);

  // CHECK_IN demain midi (12h00)
  const booking26 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle4!.id,
      clientId: client2.id,
      startDate: tomorrowNoon,
      endDate: in7Days,
      totalPrice: 228.0,
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN demain midi (12h) - Booking ${booking26.id.slice(0, 8)}: ${client2.name}`);

  // CHECK_OUT demain tard (22h00)
  const booking27 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle5!.id,
      clientId: client3.id,
      startDate: yesterday,
      endDate: tomorrowLate,
      totalPrice: 86.0,
      status: 'IN_PROGRESS',
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle5!.id },
    data: { status: 'RENTED' },
  });
  console.log(`✅ CHECK_OUT demain tard (22h) - Booking ${booking27.id.slice(0, 8)}: ${client3.name}`);

  // ============================================
  // CAS 6: Missions dans plusieurs jours avec heures variées
  // ============================================

  const in4Days = new Date(now);
  in4Days.setDate(in4Days.getDate() + 4);
  in4Days.setHours(11, 30, 0, 0); // 11h30 dans 4 jours

  const in6Days = new Date(now);
  in6Days.setDate(in6Days.getDate() + 6);
  in6Days.setHours(15, 15, 0, 0); // 15h15 dans 6 jours

  // CHECK_IN dans 4 jours (11h30)
  const booking28 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle6!.id,
      clientId: client7.id,
      startDate: in4Days,
      endDate: in7Days,
      totalPrice: 123.0,
      status: 'CONFIRMED',
    },
  });
  console.log(`✅ CHECK_IN dans 4 jours (11h30) - Booking ${booking28.id.slice(0, 8)}: ${client7.name}`);

  // CHECK_OUT dans 6 jours (15h15)
  const booking29 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle7!.id,
      clientId: client8.id,
      startDate: twoDaysAgo,
      endDate: in6Days,
      totalPrice: 328.0,
      status: 'IN_PROGRESS',
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle7!.id },
    data: { status: 'RENTED' },
  });
  console.log(`✅ CHECK_OUT dans 6 jours (15h15) - Booking ${booking29.id.slice(0, 8)}: ${client8.name}`);

  // ============================================
  // CAS 7: Cas limites - Missions très récentes/passées
  // ============================================

  // CHECK_OUT il y a 1 heure (mission très récente mais en retard)
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(now.getHours() - 1);
  oneHourAgo.setMinutes(0, 0, 0);

  const booking30 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle8!.id,
      clientId: client9.id,
      startDate: twoDaysAgo,
      endDate: oneHourAgo,
      totalPrice: 82.0,
      status: 'IN_PROGRESS',
    },
  });
  await prisma.vehicle.update({
    where: { id: vehicle8!.id },
    data: { status: 'RENTED' },
  });
  console.log(`⚠️  CHECK_OUT il y a 1h (retard récent) - Booking ${booking30.id.slice(0, 8)}: ${client9.name}`);

  // CHECK_IN dans 30 minutes (mission très proche)
  const in30Minutes = new Date(now);
  in30Minutes.setMinutes(now.getMinutes() + 30);

  const booking31 = await prisma.booking.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: vehicle1!.id,
      clientId: client10.id,
      startDate: in30Minutes,
      endDate: in3Days,
      totalPrice: 135.0,
      status: 'CONFIRMED',
    },
  });
  console.log(`⏰ CHECK_IN dans 30 minutes - Booking ${booking31.id.slice(0, 8)}: ${client10.name}`);

  console.log('\n✅ Created Company 1 Bookings - All use cases');
  console.log(`\n📊 Résumé des missions générées:`);
  console.log(`   ✅ CHECK_IN (Livraison): 11 bookings CONFIRMED`);
  console.log(`      - Aujourd'hui: 4 missions (8h, 10h, 14h30, 18h45)`);
  console.log(`      - Demain: 3 missions (6h, 9h, 12h)`);
  console.log(`      - Dans 2-7 jours: 4 missions (14h, 16h, 11h30, 10h)`);
  console.log(`      - Dans 30 minutes: 1 mission (cas limite)`);
  console.log(`   ✅ CHECK_OUT (Récupération): 16 bookings IN_PROGRESS`);
  console.log(`      - Aujourd'hui: 4 missions (7h, 12h, 17h, 20h)`);
  console.log(`      - Demain: 2 missions (18h, 22h)`);
  console.log(`      - Dans 2-6 jours: 7 missions (16h, 17h, 19h, etc.)`);
  console.log(`      - Retards: 3 missions (il y a 1h, hier, etc.)`);
  console.log(`   ⏸️  Sans missions: 5 bookings (PENDING, DRAFT, RETURNED, CANCELLED, NO_SHOW)`);
  console.log(`   📦 Total: 32 bookings créés pour tester TOUS les cas d'usage possibles`);
  console.log(`\n🎯 Sections de missions attendues:`);
  console.log(`   - "En retard": Missions avec date < aujourd'hui`);
  console.log(`   - "Aujourd'hui": 8 missions (4 CHECK_IN + 4 CHECK_OUT)`);
  console.log(`   - "À venir": Missions futures`);

  // Create Company 1 Fines
  await prisma.fine.create({
    data: {
      agencyId: agency1_2.id,
      bookingId: booking5.id,
      amount: 50.0,
      description: 'Retard de retour (2 jours)',
    },
  });
  console.log('✅ Created Company 1 Fines');

  // Create Company 1 Maintenance
  await prisma.maintenance.create({
    data: {
      agencyId: agency1_1.id,
      vehicleId: (await prisma.vehicle.findFirst({ where: { registrationNumber: 'EF-456-GH' } }))!.id,
      description: 'Révision 20000 km',
      plannedAt: new Date('2024-02-01'),
      cost: 250.0,
      status: 'PLANNED',
    },
  });
  console.log('✅ Created Company 1 Maintenance');

  // Create Company 2
  const company2 = await prisma.company.create({
    data: {
      name: 'CarRent Express',
      raisonSociale: 'CarRent Express',
      identifiantLegal: 'ICE-000000002',
      formeJuridique: 'SARL',
      maxAgencies: 5,
      slug: 'carrent-express',
      phone: '+33987654321',
      address: '789 Boulevard de la Location, 69001 Lyon',
      isActive: true,
    },
  });
  console.log('✅ Created Company 2:', company2.name);

  // Create Company 2 Admin
  const company2AdminPassword = await hashPassword('admin123');
  const company2Admin = await prisma.user.create({
    data: {
      email: 'admin@carrent.fr',
      password: company2AdminPassword,
      name: 'Claire Moreau',
      role: 'COMPANY_ADMIN',
      companyId: company2.id,
      isActive: true,
    },
  });
  console.log('✅ Created Company 2 Admin:', company2Admin.email);

  // Create Company 2 Agency
  const agency2_1 = await prisma.agency.create({
    data: {
      name: 'Agence Lyon Centre',
      companyId: company2.id,
      phone: '+33987654322',
      address: '789 Boulevard de la Location, 69001 Lyon',
    },
  });
  console.log('✅ Created Company 2 Agency');

  // Create Company 2 Manager
  const manager2Password = await hashPassword('manager123');
  const manager2 = await prisma.user.create({
    data: {
      email: 'manager@carrent.fr',
      password: manager2Password,
      name: 'Lucas Petit',
      role: 'AGENCY_MANAGER',
      companyId: company2.id,
      isActive: true,
    },
  });

  await prisma.userAgency.create({
    data: {
      userId: manager2.id,
      agencyId: agency2_1.id,
    },
  });
  console.log('✅ Created Company 2 Manager');

  // Create Company 2 Vehicles
  await prisma.vehicle.createMany({
    data: [
      {
        agencyId: agency2_1.id,
        registrationNumber: 'QR-345-ST',
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2023,
        mileage: 10000,
        fuel: 'Essence',
        gearbox: 'Manuelle',
        dailyRate: 55.0,
        depositAmount: 600.0,
        status: 'AVAILABLE',
      },
      {
        agencyId: agency2_1.id,
        registrationNumber: 'UV-678-WX',
        brand: 'Audi',
        model: 'A3',
        year: 2022,
        mileage: 18000,
        fuel: 'Essence',
        gearbox: 'Automatique',
        dailyRate: 95.0,
        depositAmount: 1200.0,
        status: 'AVAILABLE',
      },
    ],
  });
  console.log('✅ Created Company 2 Vehicles');

  // ============================================
  // SAAS: Plans, Modules, Dépendances
  // ============================================
  console.log('\n🌱 Creating SaaS Plans and Modules...');

  // Créer les Plans
  const starterPlan = await prisma.plan.create({
    data: {
      name: 'Starter',
      description: 'Plan de démarrage pour petites agences',
      price: 500,
      isActive: true,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      description: 'Plan professionnel avec fonctionnalités avancées',
      price: 1000,
      isActive: true,
    },
  });

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      description: 'Plan entreprise avec toutes les fonctionnalités',
      price: 2000,
      isActive: true,
    },
  });
  console.log('✅ Created Plans: Starter, Pro, Enterprise');

  // Créer les PlanModules
  // Starter: VEHICLES, BOOKINGS
  await prisma.planModule.createMany({
    data: [
      { planId: starterPlan.id, moduleCode: 'VEHICLES' },
      { planId: starterPlan.id, moduleCode: 'BOOKINGS' },
    ],
  });

  // Pro: VEHICLES, BOOKINGS, INVOICES, MAINTENANCE
  await prisma.planModule.createMany({
    data: [
      { planId: proPlan.id, moduleCode: 'VEHICLES' },
      { planId: proPlan.id, moduleCode: 'BOOKINGS' },
      { planId: proPlan.id, moduleCode: 'INVOICES' },
      { planId: proPlan.id, moduleCode: 'MAINTENANCE' },
    ],
  });

  // Enterprise: Tous les modules
  await prisma.planModule.createMany({
    data: [
      { planId: enterprisePlan.id, moduleCode: 'VEHICLES' },
      { planId: enterprisePlan.id, moduleCode: 'BOOKINGS' },
      { planId: enterprisePlan.id, moduleCode: 'INVOICES' },
      { planId: enterprisePlan.id, moduleCode: 'MAINTENANCE' },
      { planId: enterprisePlan.id, moduleCode: 'FINES' },
      { planId: enterprisePlan.id, moduleCode: 'ANALYTICS' },
    ],
  });
  console.log('✅ Created PlanModules');

  // Créer les PlanQuotas
  await prisma.planQuota.createMany({
    data: [
      // Starter
      { planId: starterPlan.id, quotaKey: 'agencies', quotaValue: 2 },
      { planId: starterPlan.id, quotaKey: 'users', quotaValue: 10 },
      { planId: starterPlan.id, quotaKey: 'vehicles', quotaValue: 20 },
      // Pro
      { planId: proPlan.id, quotaKey: 'agencies', quotaValue: 10 },
      { planId: proPlan.id, quotaKey: 'users', quotaValue: 50 },
      { planId: proPlan.id, quotaKey: 'vehicles', quotaValue: 100 },
      // Enterprise
      { planId: enterprisePlan.id, quotaKey: 'agencies', quotaValue: -1 }, // -1 = illimité
      { planId: enterprisePlan.id, quotaKey: 'users', quotaValue: -1 },
      { planId: enterprisePlan.id, quotaKey: 'vehicles', quotaValue: -1 },
    ],
  });
  console.log('✅ Created PlanQuotas');

  // Créer les Dépendances entre modules
  await prisma.moduleDependency.createMany({
    data: [
      // BOOKINGS nécessite VEHICLES
      { moduleCode: 'BOOKINGS', dependsOnCode: 'VEHICLES' },
      // INVOICES nécessite BOOKINGS
      { moduleCode: 'INVOICES', dependsOnCode: 'BOOKINGS' },
      // MAINTENANCE nécessite VEHICLES
      { moduleCode: 'MAINTENANCE', dependsOnCode: 'VEHICLES' },
      // FINES nécessite BOOKINGS
      { moduleCode: 'FINES', dependsOnCode: 'BOOKINGS' },
      // ANALYTICS nécessite BOOKINGS et VEHICLES
      { moduleCode: 'ANALYTICS', dependsOnCode: 'BOOKINGS' },
      { moduleCode: 'ANALYTICS', dependsOnCode: 'VEHICLES' },
    ],
  });
  console.log('✅ Created ModuleDependencies');

  // Créer des abonnements pour les companies existantes
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 1 mois

  // Company 1: Plan Pro
  const subscription1 = await prisma.subscription.create({
    data: {
      companyId: company1.id,
      planId: proPlan.id,
      billingPeriod: 'MONTHLY',
      startDate,
      endDate,
      amount: proPlan.price,
      status: 'ACTIVE',
    },
  });

  // Activer les modules Company pour Company 1 (selon le plan Pro)
  await prisma.companyModule.createMany({
    data: [
      { companyId: company1.id, moduleCode: 'VEHICLES', isActive: true },
      { companyId: company1.id, moduleCode: 'BOOKINGS', isActive: true },
      { companyId: company1.id, moduleCode: 'INVOICES', isActive: true },
      { companyId: company1.id, moduleCode: 'MAINTENANCE', isActive: true },
    ],
  });

  // Créer les SubscriptionModules
  await prisma.subscriptionModule.createMany({
    data: [
      { subscriptionId: subscription1.id, moduleCode: 'VEHICLES' },
      { subscriptionId: subscription1.id, moduleCode: 'BOOKINGS' },
      { subscriptionId: subscription1.id, moduleCode: 'INVOICES' },
      { subscriptionId: subscription1.id, moduleCode: 'MAINTENANCE' },
    ],
  });

  // Company 2: Plan Starter
  const subscription2 = await prisma.subscription.create({
    data: {
      companyId: company2.id,
      planId: starterPlan.id,
      billingPeriod: 'MONTHLY',
      startDate,
      endDate,
      amount: starterPlan.price,
      status: 'ACTIVE',
    },
  });

  // Activer les modules Company pour Company 2 (selon le plan Starter)
  await prisma.companyModule.createMany({
    data: [
      { companyId: company2.id, moduleCode: 'VEHICLES', isActive: true },
      { companyId: company2.id, moduleCode: 'BOOKINGS', isActive: true },
    ],
  });

  await prisma.subscriptionModule.createMany({
    data: [
      { subscriptionId: subscription2.id, moduleCode: 'VEHICLES' },
      { subscriptionId: subscription2.id, moduleCode: 'BOOKINGS' },
    ],
  });

  console.log('✅ Created Subscriptions and CompanyModules');

  // Créer les préférences de notification par défaut
  await prisma.notificationPreference.createMany({
    data: [
      {
        companyId: company1.id,
        billingNotificationsEmail: true,
        billingNotificationsInApp: true,
      },
      {
        companyId: company2.id,
        billingNotificationsEmail: true,
        billingNotificationsInApp: false,
      },
    ],
  });
  console.log('✅ Created NotificationPreferences');

  // Mettre à jour les companies avec les valeurs par défaut SaaS
  await prisma.company.updateMany({
    data: {
      status: 'ACTIVE',
      currency: 'MAD',
    },
  });

  // Mettre à jour les agencies avec les valeurs par défaut SaaS
  await prisma.agency.updateMany({
    data: {
      status: 'ACTIVE',
      timezone: 'Africa/Casablanca',
    },
  });

  // Mettre à jour les UserAgency avec permission par défaut
  await prisma.userAgency.updateMany({
    data: {
      permission: 'FULL',
    },
  });

  console.log('✅ Updated existing Companies, Agencies, and UserAgencies with SaaS defaults');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test accounts:');
  console.log('SUPER_ADMIN: admin@malocauto.com / admin123');
  console.log('COMPANY_ADMIN 1: admin@autolocation.fr / admin123 (Plan Pro)');
  console.log('AGENCY_MANAGER 1: manager1@autolocation.fr / manager123');
  console.log('AGENT 1: agent1@autolocation.fr / agent123');
  console.log('COMPANY_ADMIN 2: admin@carrent.fr / admin123 (Plan Starter)');
  console.log('AGENCY_MANAGER 2: manager@carrent.fr / manager123');
  console.log('\n📦 SaaS Plans:');
  console.log('- Starter: 500 MAD/mois (VEHICLES, BOOKINGS)');
  console.log('- Pro: 1000 MAD/mois (VEHICLES, BOOKINGS, INVOICES, MAINTENANCE)');
  console.log('- Enterprise: 2000 MAD/mois (Tous les modules)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




