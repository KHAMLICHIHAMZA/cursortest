import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des réservations et agences...\n');

  // Vérifier l'utilisateur agent1
  const user = await prisma.user.findUnique({
    where: { email: 'agent1@autolocation.fr' },
    include: {
      userAgencies: {
        include: {
          agency: true,
        },
      },
    },
  });

  if (!user) {
    console.error('❌ Utilisateur agent1@autolocation.fr non trouvé');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé: ${user.email}`);
  console.log(`   Rôle: ${user.role}`);
  console.log(`   Agences associées:`);
  user.userAgencies.forEach((ua) => {
    console.log(`   - ${ua.agency.name} (ID: ${ua.agency.id})`);
  });

  // Vérifier toutes les réservations
  const bookings = await prisma.booking.findMany({
    include: {
      agency: true,
      client: true,
      vehicle: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`\n📦 Réservations dans la base de données: ${bookings.length}`);
  
  if (bookings.length === 0) {
    console.log('⚠️  Aucune réservation trouvée. Exécutez le script add-test-bookings.ts');
  } else {
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Réservation ${booking.id.slice(0, 8)}`);
      console.log(`   - Agence: ${booking.agency.name} (ID: ${booking.agency.id})`);
      console.log(`   - Client: ${booking.client.name}`);
      console.log(`   - Véhicule: ${booking.vehicle.brand} ${booking.vehicle.model}`);
      console.log(`   - Statut: ${booking.status}`);
      console.log(`   - Dates: ${new Date(booking.startDate).toLocaleDateString('fr-FR')} → ${new Date(booking.endDate).toLocaleDateString('fr-FR')}`);
      console.log(`   - Prix: ${booking.totalPrice} MAD`);
    });
  }

  // Vérifier si les réservations correspondent aux agences de l'utilisateur
  const userAgencyIds = user.userAgencies.map((ua) => ua.agency.id);
  const matchingBookings = bookings.filter((b) => userAgencyIds.includes(b.agencyId));

  console.log(`\n🎯 Réservations accessibles par agent1: ${matchingBookings.length}`);
  
  if (matchingBookings.length === 0 && bookings.length > 0) {
    console.log('⚠️  PROBLÈME: Les réservations existent mais ne sont pas dans les agences de l\'utilisateur!');
    console.log(`   Agences de l'utilisateur: ${userAgencyIds.join(', ')}`);
    console.log(`   Agences des réservations: ${[...new Set(bookings.map(b => b.agencyId))].join(', ')}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




