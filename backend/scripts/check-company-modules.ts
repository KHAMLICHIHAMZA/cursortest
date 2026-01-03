import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification de la company et des modules...\n');

  const company = await prisma.company.findFirst({
    where: {
      name: {
        contains: 'AutoLocation',
      },
    },
    include: {
      companyModules: true,
      subscriptions: {
        include: {
          plan: true,
          subscriptionModules: true,
        },
      },
    },
  });

  if (!company) {
    console.log('❌ Company non trouvée');
    return;
  }

  console.log(`✅ Company: ${company.name}`);
  console.log(`   - isActive: ${company.isActive}`);
  console.log(`   - status: ${company.status || 'N/A'}`);
  console.log(`   - Modules activés: ${company.companyModules.length}`);
  
  company.companyModules.forEach((cm) => {
    console.log(`     - ${cm.moduleCode}: ${cm.isActive ? '✅ Actif' : '❌ Inactif'}`);
  });

  console.log(`\n   - Abonnements: ${company.subscriptions.length}`);
  company.subscriptions.forEach((sub) => {
    console.log(`     - Plan: ${sub.plan.name} (${sub.status})`);
    console.log(`       Modules: ${sub.subscriptionModules.map(sm => sm.moduleCode).join(', ')}`);
  });

  // Vérifier les agences
  const agencies = await prisma.agency.findMany({
    where: {
      companyId: company.id,
    },
  });

  console.log(`\n   - Agences: ${agencies.length}`);
  agencies.forEach((agency) => {
    console.log(`     - ${agency.name}: ${agency.status || 'N/A'} (isActive: ${agency.isActive !== false})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




