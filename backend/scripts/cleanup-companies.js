const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
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
    console.log('OK: companies and related data deleted');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
