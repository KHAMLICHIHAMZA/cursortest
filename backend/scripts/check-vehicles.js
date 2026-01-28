const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const envPath = path.join(__dirname, '..', '.env');
const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
for (const line of envLines) {
  if (!line || line.startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx <= 0) continue;
  const key = line.slice(0, idx).trim();
  let value = line.slice(idx + 1).trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  if (key === 'DATABASE_URL') {
    process.env.DATABASE_URL = value;
  }
}

const prisma = new PrismaClient();

async function main() {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      registrationNumber: { in: ['AK-204-PA', 'AK-204-PQ'] },
    },
    select: {
      id: true,
      registrationNumber: true,
      brand: true,
      model: true,
      imageUrl: true,
    },
  });

  console.log(JSON.stringify(vehicles, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
