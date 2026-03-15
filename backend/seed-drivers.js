// backend/seed-drivers.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: 'DRIVER' },
    data: { isAvailable: false },
  });
  console.log(`Updated ${result.count} driver(s) with isAvailable = false`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });