import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        company: { select: { id: true, name: true } },
        userAgencies: {
          select: {
            agency: { select: { id: true, name: true } },
            permission: true,
          },
        },
      },
      orderBy: { email: 'asc' },
    });

    if (!users.length) {
      console.log('No users found.');
      return;
    }

    for (const u of users) {
      const agencies = (u.userAgencies || []).map(
        (ua) => `${ua.agency.name} (${ua.permission})`,
      );
      console.log(
        [
          `email=${u.email}`,
          `role=${u.role}`,
          `active=${u.isActive}`,
          `company=${u.company?.name || 'NONE'}`,
          `agencies=${agencies.length ? agencies.join(', ') : 'NONE'}`,
        ].join(' | '),
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

