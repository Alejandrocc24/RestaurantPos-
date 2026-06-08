import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      email: true,
      nombre: true,
      activo: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(usuarios, null, 2));
}

await main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
