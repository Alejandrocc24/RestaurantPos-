import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hash simple para "password123" - en producción usar bcrypt
const hashedPassword = '$2b$10$YJq6NfuBc5KYqYL0GuHhOecQh7hLvM7GV0WZ1k5H5Z5.8kL2Q2Qfm';

async function main() {
  try {
    // Obtener los roles
    const admin = await prisma.rol.findUnique({ where: { nombre: 'Administrador' } });
    const gerente = await prisma.rol.findUnique({ where: { nombre: 'Gerente' } });
    const cajero = await prisma.rol.findUnique({ where: { nombre: 'Cajero' } });
    const cocina = await prisma.rol.findUnique({ where: { nombre: 'Cocina' } });
    const vendedor = await prisma.rol.findUnique({ where: { nombre: 'Vendedor' } });

    if (!admin || !gerente || !cajero || !cocina || !vendedor) {
      console.error('❌ Algunos roles no existen. Primero ejecuta seed-roles.ts');
      process.exit(1);
    }

    // Limpiar usuarios existentes
    await prisma.usuario.deleteMany({});

    // Crear usuarios
    const usuarioAdmin = await prisma.usuario.create({
      data: {
        email: 'admin@restaurant.com',
        nombre: 'Administrador',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: admin.id
          }
        }
      }
    });

    const usuarioGerente1 = await prisma.usuario.create({
      data: {
        email: 'gerente1@restaurant.com',
        nombre: 'Juan Gerente',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: gerente.id
          }
        }
      }
    });

    const usuarioGerente2 = await prisma.usuario.create({
      data: {
        email: 'gerente2@restaurant.com',
        nombre: 'María Gerente',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: gerente.id
          }
        }
      }
    });

    const usuarioCajero1 = await prisma.usuario.create({
      data: {
        email: 'cajero1@restaurant.com',
        nombre: 'Carlos Cajero',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: cajero.id
          }
        }
      }
    });

    const usuarioCajero2 = await prisma.usuario.create({
      data: {
        email: 'cajero2@restaurant.com',
        nombre: 'Laura Cajero',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: cajero.id
          }
        }
      }
    });

    const usuarioCocina = await prisma.usuario.create({
      data: {
        email: 'cocina@restaurant.com',
        nombre: 'Chef Cocina',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: cocina.id
          }
        }
      }
    });

    const usuarioVendedor1 = await prisma.usuario.create({
      data: {
        email: 'vendedor1@restaurant.com',
        nombre: 'Pedro Vendedor',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: vendedor.id
          }
        }
      }
    });

    const usuarioVendedor2 = await prisma.usuario.create({
      data: {
        email: 'vendedor2@restaurant.com',
        nombre: 'Elena Vendedor',
        password: hashedPassword,
        activo: true,
        roles: {
          create: {
            rolId: vendedor.id
          }
        }
      }
    });

    console.log('✅ Usuarios creados exitosamente (contraseña: password123):');
    console.log(`- ${usuarioAdmin.email} (Administrador)`);
    console.log(`- ${usuarioGerente1.email} (Gerente)`);
    console.log(`- ${usuarioGerente2.email} (Gerente)`);
    console.log(`- ${usuarioCajero1.email} (Cajero)`);
    console.log(`- ${usuarioCajero2.email} (Cajero)`);
    console.log(`- ${usuarioCocina.email} (Cocina)`);
    console.log(`- ${usuarioVendedor1.email} (Vendedor)`);
    console.log(`- ${usuarioVendedor2.email} (Vendedor)`);
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
