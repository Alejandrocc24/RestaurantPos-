import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('🔍 Usuarios en BD:');
  const usuarios = await prisma.usuario.findMany({
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
  });

  usuarios.forEach(u => {
    console.log(`  - ID: ${u.id}`);
    console.log(`    Email: ${u.email}`);
    console.log(`    Nombre: ${u.nombre}`);
    console.log(`    Activo: ${u.activo}`);
    console.log(`    Roles: ${u.roles.map(r => r.rol.nombre).join(', ')}`);
    console.log('');
  });

  console.log(`\nTotal: ${usuarios.length} usuarios`);

  // Verificar que las categorías de gasto existen
  console.log('\n🔍 Categorías de Gasto:');
  const categorias = await prisma.categoriaGasto.findMany();
  categorias.forEach(c => {
    console.log(`  - ID: ${c.id} | Nombre: ${c.nombre}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
