const { PrismaClient, AgencyStatus, Role } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting cleanup for deleted agencies and orphaned users...');

    const deletedAgencyIds = await prisma.agency.findMany({
      where: {
        OR: [{ deletedAt: { not: null } }, { status: AgencyStatus.DELETED }],
      },
      select: { id: true },
    });

    const agencyIds = deletedAgencyIds.map((a) => a.id);

    // Normalize status for soft-deleted agencies.
    const normalizedAgencies = await prisma.agency.updateMany({
      where: {
        deletedAt: { not: null },
        NOT: { status: AgencyStatus.DELETED },
      },
      data: { status: AgencyStatus.DELETED },
    });

    let removedUserAgencyLinks = { count: 0 };
    if (agencyIds.length > 0) {
      removedUserAgencyLinks = await prisma.userAgency.deleteMany({
        where: {
          agencyId: { in: agencyIds },
        },
      });
    }

    // Deactivate agency staff with no active agency assignment left.
    const orphanUsers = await prisma.user.findMany({
      where: {
        role: { in: [Role.AGENCY_MANAGER, Role.AGENT] },
        isActive: true,
        deletedAt: null,
        userAgencies: {
          none: {
            agency: {
              deletedAt: null,
              status: AgencyStatus.ACTIVE,
            },
          },
        },
      },
      select: { id: true, email: true, role: true },
    });

    let deactivatedUsers = { count: 0 };
    if (orphanUsers.length > 0) {
      deactivatedUsers = await prisma.user.updateMany({
        where: {
          id: { in: orphanUsers.map((u) => u.id) },
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    }

    console.log('Cleanup complete.');
    console.log(`- Agencies normalized to DELETED: ${normalizedAgencies.count}`);
    console.log(`- UserAgency links removed: ${removedUserAgencyLinks.count}`);
    console.log(`- Users deactivated: ${deactivatedUsers.count}`);

    if (orphanUsers.length > 0) {
      console.log('Deactivated users:');
      orphanUsers.forEach((u) => {
        console.log(`  - ${u.email} (${u.role})`);
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
