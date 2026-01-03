import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Ajout de 4 réservations de test pour mobile...\n');

  // Récupérer l'agence et les données nécessaires
  const agency = await prisma.agency.findFirst({
    where: {
      company: {
        name: {
          contains: 'AutoLocation',
        },
      },
    },
    include: {
      company: true,
    },
  });

  if (!agency) {
    console.error('❌ Aucune agence trouvée. Exécutez d\'abord le seed.');
    process.exit(1);
  }

  console.log(`✅ Agence trouvée: ${agency.name} (${agency.company.name})\n`);

  // Récupérer les véhicules disponibles
  const vehicles = await prisma.vehicle.findMany({
    where: {
      agencyId: agency.id,
    },
    take: 4,
  });

  if (vehicles.length < 4) {
    console.log(`⚠️  Seulement ${vehicles.length} véhicule(s) trouvé(s). Utilisation des véhicules disponibles.`);
  }

  // Récupérer les clients
  const clients = await prisma.client.findMany({
    where: {
      agencyId: agency.id,
    },
    take: 4,
  });

  if (clients.length < 4) {
    console.log(`⚠️  Seulement ${clients.length} client(s) trouvé(s). Utilisation des clients disponibles.`);
  }

  // Utiliser les véhicules et clients disponibles (réutiliser si nécessaire)
  const vehiclesToUse = [];
  const clientsToUse = [];
  
  for (let i = 0; i < 4; i++) {
    vehiclesToUse.push(vehicles[i % vehicles.length]);
    clientsToUse.push(clients[i % clients.length]);
  }

  // Dates pour les réservations
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);
  
  const in5Days = new Date(now);
  in5Days.setDate(in5Days.getDate() + 5);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 3);

  // 1. Réservation PENDING (à confirmer)
  const booking1 = await prisma.booking.create({
    data: {
      agencyId: agency.id,
      vehicleId: vehiclesToUse[0].id,
      clientId: clientsToUse[0].id,
      startDate: tomorrow,
      endDate: in3Days,
      totalPrice: 450.0,
      status: 'PENDING',
    },
    include: {
      vehicle: true,
      client: true,
    },
  });
  console.log(`✅ Réservation 1 créée: PENDING`);
  console.log(`   - Client: ${booking1.client.name}`);
  console.log(`   - Véhicule: ${booking1.vehicle.brand} ${booking1.vehicle.model} (${booking1.vehicle.registrationNumber})`);
  console.log(`   - Dates: ${tomorrow.toLocaleDateString('fr-FR')} → ${in3Days.toLocaleDateString('fr-FR')}`);
  console.log(`   - Prix: ${booking1.totalPrice} MAD\n`);

  // 2. Réservation CONFIRMED (prête pour check-in)
  const booking2 = await prisma.booking.create({
    data: {
      agencyId: agency.id,
      vehicleId: vehiclesToUse[1].id,
      clientId: clientsToUse[1].id,
      startDate: tomorrow,
      endDate: in5Days,
      totalPrice: 750.0,
      status: 'CONFIRMED',
    },
    include: {
      vehicle: true,
      client: true,
    },
  });
  console.log(`✅ Réservation 2 créée: CONFIRMED`);
  console.log(`   - Client: ${booking2.client.name}`);
  console.log(`   - Véhicule: ${booking2.vehicle.brand} ${booking2.vehicle.model} (${booking2.vehicle.registrationNumber})`);
  console.log(`   - Dates: ${tomorrow.toLocaleDateString('fr-FR')} → ${in5Days.toLocaleDateString('fr-FR')}`);
  console.log(`   - Prix: ${booking2.totalPrice} MAD\n`);

  // 3. Réservation IN_PROGRESS (en cours, prête pour check-out)
  const booking3 = await prisma.booking.create({
    data: {
      agencyId: agency.id,
      vehicleId: vehiclesToUse[2].id,
      clientId: clientsToUse[2].id,
      startDate: yesterday,
      endDate: in5Days,
      totalPrice: 900.0,
      status: 'IN_PROGRESS',
    },
    include: {
      vehicle: true,
      client: true,
    },
  });
  
  // Mettre le véhicule en RENTED
  await prisma.vehicle.update({
    where: { id: vehiclesToUse[2].id },
    data: { status: 'RENTED' },
  });
  
  console.log(`✅ Réservation 3 créée: IN_PROGRESS`);
  console.log(`   - Client: ${booking3.client.name}`);
  console.log(`   - Véhicule: ${booking3.vehicle.brand} ${booking3.vehicle.model} (${booking3.vehicle.registrationNumber})`);
  console.log(`   - Dates: ${yesterday.toLocaleDateString('fr-FR')} → ${in5Days.toLocaleDateString('fr-FR')}`);
  console.log(`   - Prix: ${booking3.totalPrice} MAD\n`);

  // 4. Réservation RETURNED (terminée, pour historique)
  const booking4 = await prisma.booking.create({
    data: {
      agencyId: agency.id,
      vehicleId: vehiclesToUse[3].id,
      clientId: clientsToUse[3].id,
      startDate: lastWeek,
      endDate: lastWeekEnd,
      totalPrice: 600.0,
      status: 'RETURNED',
    },
    include: {
      vehicle: true,
      client: true,
    },
  });
  
  // Remettre le véhicule en AVAILABLE
  await prisma.vehicle.update({
    where: { id: vehiclesToUse[3].id },
    data: { status: 'AVAILABLE' },
  });
  
  console.log(`✅ Réservation 4 créée: RETURNED`);
  console.log(`   - Client: ${booking4.client.name}`);
  console.log(`   - Véhicule: ${booking4.vehicle.brand} ${booking4.vehicle.model} (${booking4.vehicle.registrationNumber})`);
  console.log(`   - Dates: ${lastWeek.toLocaleDateString('fr-FR')} → ${lastWeekEnd.toLocaleDateString('fr-FR')}`);
  console.log(`   - Prix: ${booking4.totalPrice} MAD\n`);

  console.log('✅ 4 réservations de test créées avec succès !');
  console.log('\nRésumé:');
  console.log('- 1 réservation PENDING (à confirmer)');
  console.log('- 1 réservation CONFIRMED (prête pour check-in)');
  console.log('- 1 réservation IN_PROGRESS (prête pour check-out)');
  console.log('- 1 réservation RETURNED (historique)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
