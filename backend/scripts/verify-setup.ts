import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener usuario desarrollador
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'desarrollador@dulcemomento' },
      include: {
        roles: {
          include: {
            rol: true
          }
        }
      }
    });

    if (!usuario) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('\n👤 USUARIO:');
    console.log(`  Email: ${usuario.email}`);
    console.log(`  Nombre: ${usuario.nombre}`);
    console.log(`  ID: ${usuario.id}`);
    console.log(`  Activo: ${usuario.activo}`);

    console.log('\n👥 ROLES ASIGNADOS:');
    if (usuario.roles.length === 0) {
      console.log('  ❌ No hay roles asignados');
    } else {
      usuario.roles.forEach((r) => {
        console.log(`  ✅ ${r.rol.nombre}`);
      });
    }

    // Verificar permisos del rol Administrador
    const admin = await prisma.rol.findUnique({
      where: { nombre: 'Administrador' }
    });

    if (admin) {
      const permisos = JSON.parse(JSON.stringify(admin.permisos)) as string[];
      console.log(`\n🔑 PERMISOS DE ADMINISTRADOR: ${permisos.length} permisos`);
      console.log(`  ${permisos.join('\n  ')}`);
    }

    // Contar registros en tabla UsuarioRol
    const usuarioRolCount = await prisma.usuarioRol.count();
    console.log(`\n📊 Total UsuarioRol: ${usuarioRolCount}`);

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
