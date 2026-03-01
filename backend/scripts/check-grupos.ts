import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📋 Analizando grupos modificadores...\n');

    const grupos = await prisma.grupoModificador.findMany({
      include: { 
        productos: true,
        opciones: true
      }
    });

    console.log(`Total de grupos: ${grupos.length}\n`);

    for (const grupo of grupos) {
      console.log(`\n🔹 Grupo: ${grupo.nombre}`);
      console.log(`   ID: ${grupo.id}`);
      console.log(`   Activo: ${grupo.activo}`);
      console.log(`   Productos asociados: ${grupo.productos.length}`);
      
      if (grupo.productos.length > 0) {
        grupo.productos.forEach(p => {
          console.log(`     - ${p.nombre} (${p.id}) - Activo: ${p.activo}`);
        });
      }
      
      console.log(`   Opciones: ${grupo.opciones.length}`);
      if (grupo.opciones.length > 0) {
        grupo.opciones.forEach(o => {
          console.log(`     - ${o.nombre} (+$${o.precioAdicional})`);
        });
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
