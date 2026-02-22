import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.rol.findUnique({
      where: { nombre: 'Administrador' }
    });

    if (!admin) {
      console.error('❌ Rol Administrador no encontrado');
      process.exit(1);
    }

    console.log('✅ Rol Administrador encontrado');
    console.log(`📋 Total de permisos: ${admin.permisos.length}`);
    console.log('\n🔑 Permisos asignados:');
    
    admin.permisos.forEach((permiso, index) => {
      console.log(`  ${index + 1}. ${permiso}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error fatal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
