import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Generar hash para la contraseña "dulce123"
    const hashedPassword = await bcrypt.hash('dulce123', 10);

    // Obtener el rol Administrador
    const admin = await prisma.rol.findUnique({ where: { nombre: 'Administrador' } });

    if (!admin) {
      console.error('❌ El rol Administrador no existe. Primero ejecuta seed-roles.ts');
      process.exit(1);
    }

    // Limpiar todos los usuarios
    await prisma.usuario.deleteMany({});
    console.log('🗑️ Usuarios eliminados');

    // Crear usuario desarrollador para Dulce Momento
    const desarrollador = await prisma.usuario.create({
      data: {
        email: 'desarrollador@dulcemomento',
        nombre: 'Desarrollador Dulce Momento',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: admin.id
          }
        }
      }
    });

    console.log('✅ Usuario creado exitosamente para Dulce Momento:');
    console.log(`✉️  correo: ${desarrollador.email}`);
    console.log(`🔑 contraseña: dulce123`);
    console.log(`👤 rol: Administrador`);
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
