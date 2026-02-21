import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '../src/utils/auth.js';

async function main() {
  const prisma = new PrismaClient();

  try {
    const email = 'desarrollador@dulcemomento';
    const password = 'Desarrollo123';

    console.log('🔍 Buscando usuario...');
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ Usuario NO encontrado en Supabase');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.nombre}`);
    console.log(`   Activo: ${user.activo}`);
    console.log(`   Roles: ${user.roles.map(r => r.rol.nombre).join(', ')}`);
    console.log(`   Hash password: ${user.password.substring(0, 20)}...`);

    console.log('\n🔐 Verificando contraseña...');
    const isPasswordValid = await verifyPassword(password, user.password);
    console.log(`   ¿Contraseña válida?: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('❌ La contraseña no coincide');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
