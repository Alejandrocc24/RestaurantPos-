import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (usuarios.length === 0) {
      console.log('No hay usuarios creados en la base de datos.');
      return;
    }

    console.log('\n📋 USUARIOS EXISTENTES:\n');
    usuarios.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.nombre}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Estado: ${usuario.activo ? '✓ Activo' : '✗ Inactivo'}`);
      console.log(`   Roles: ${usuario.roles.map(ur => ur.rol.nombre).join(', ')}`);
      console.log(`   Creado: ${usuario.createdAt.toLocaleString('es-ES')}`);
      console.log('');
    });

    console.log(`Total de usuarios: ${usuarios.length}`);
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
