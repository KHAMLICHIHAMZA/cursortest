import { PrismaClient } from '@prisma/client';
import { comparePassword } from '../src/utils/bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des utilisateurs et mots de passe...\n');

  const testUsers = [
    { email: 'agent1@autolocation.fr', password: 'agent123' },
    { email: 'manager1@autolocation.fr', password: 'manager123' },
    { email: 'admin@autolocation.fr', password: 'admin123' },
  ];

  for (const testUser of testUsers) {
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
      include: {
        userAgencies: {
          include: {
            agency: true,
          },
        },
        company: true,
      },
    });

    if (!user) {
      console.log(`❌ ${testUser.email}: Utilisateur non trouvé`);
      continue;
    }

    console.log(`✅ ${testUser.email}:`);
    console.log(`   - Rôle: ${user.role}`);
    console.log(`   - Actif: ${user.isActive}`);
    console.log(`   - Company: ${user.company?.name || 'N/A'}`);
    console.log(`   - Agences: ${user.userAgencies.map(ua => ua.agency.name).join(', ') || 'Aucune'}`);

    // Tester le mot de passe
    const passwordMatch = await comparePassword(testUser.password, user.password);
    if (passwordMatch) {
      console.log(`   - ✅ Mot de passe correct`);
    } else {
      console.log(`   - ❌ Mot de passe incorrect!`);
      console.log(`   - Le mot de passe stocké ne correspond pas à "${testUser.password}"`);
    }
    console.log('');
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




