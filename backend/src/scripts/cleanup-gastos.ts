import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('🗑️ Eliminando gastos sin proveedor...');
  
  const resultado = await prisma.gasto.deleteMany({
    where: {
      AND: [
        { proveedorId: null },
        { proveedorPersonalizado: null }
      ]
    }
  });

  console.log(`✅ ${resultado.count} gastos eliminados`);

  await prisma.$disconnect();
}

main().catch(console.error);
