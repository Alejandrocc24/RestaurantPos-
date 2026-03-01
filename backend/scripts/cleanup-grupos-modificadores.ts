import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Limpiando productos inactivos de grupos modificadores...\n');

    // Obtener todos los grupos modificadores con sus productos
    const grupos = await prisma.grupoModificador.findMany({
      include: { productos: true }
    });

    let productosLimpiados = 0;

    for (const grupo of grupos) {
      // Filtrar productos inactivos
      const productosInactivos = grupo.productos.filter(p => !p.activo);
      
      if (productosInactivos.length > 0) {
        console.log(`\n📋 Grupo: ${grupo.nombre}`);
        console.log(`   Productos inactivos encontrados: ${productosInactivos.length}`);
        
        // Desconectar los productos inactivos
        for (const producto of productosInactivos) {
          await prisma.grupoModificador.update({
            where: { id: grupo.id },
            data: {
              productos: {
                disconnect: { id: producto.id }
              }
            }
          });
          console.log(`   ✓ Desconectado: ${producto.nombre}`);
          productosLimpiados++;
        }
      }
    }

    console.log(`\n✅ Limpieza completada: ${productosLimpiados} referencias removidas`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
