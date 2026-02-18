import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

/**
 * Script para inicializar la BD con datos de ejemplo
 * Ejecutar con: npm run seed
 * 
 * Nota: Para Supabase, usamos una BD única.
 * Para arquitectura multi-tenant con BDs separadas,
 * ejecutar este script múltiples veces con diferentes DATABASE_URLs
 */
async function main() {
  const prisma = new PrismaClient();
  const tenantId = 'tenant-dulcemomento';

  console.log('🌱 Iniciando seed de datos...');

  try {
    // Limpiar datos existentes (en orden inverso de dependencias)
    await prisma.gasto.deleteMany();
    await prisma.categoriaGasto.deleteMany();
    await prisma.orden.deleteMany();
    await prisma.compra.deleteMany();
    await prisma.proveedor.deleteMany();
    await prisma.usuarioRol.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.rol.deleteMany();
    await prisma.permiso.deleteMany();
    await prisma.producto.deleteMany();
    await prisma.categoria.deleteMany();
    await prisma.mesa.deleteMany();
    await prisma.configuracion.deleteMany();

    console.log('✓ Datos previos eliminados');

    // ============================================
    // CREAR ROLES
    // ============================================
    const adminRole = await prisma.rol.create({
      data: {
        nombre: 'admin',
        descripcion: 'Administrador del sistema',
        activo: true,
      },
    });

    const gerenteRole = await prisma.rol.create({
      data: {
        nombre: 'gerente',
        descripcion: 'Gerente del negocio',
        activo: true,
      },
    });

    const cameraRole = await prisma.rol.create({
      data: {
        nombre: 'camarero',
        descripcion: 'Personal de servicio',
        activo: true,
      },
    });

    const cocinaRole = await prisma.rol.create({
      data: {
        nombre: 'cocina',
        descripcion: 'Personal de cocina',
        activo: true,
      },
    });

    const cajaRole = await prisma.rol.create({
      data: {
        nombre: 'caja',
        descripcion: 'Personal de caja',
        activo: true,
      },
    });

    console.log('✓ Roles creados');

    // ============================================
    // CREAR USUARIOS
    // ============================================
    const adminUser = await prisma.usuario.create({
      data: {
        email: 'admin@dulcemomento.com',
        nombre: 'Administrador',
        password: await hashPassword('Admin123'),
        activo: true,
        roles: {
          create: [{ rolId: adminRole.id }],
        },
      },
    });

    const gerenteUser = await prisma.usuario.create({
      data: {
        email: 'gerente@dulcemomento.com',
        nombre: 'Juan Gerente',
        password: await hashPassword('Gerente123'),
        activo: true,
        roles: {
          create: [{ rolId: gerenteRole.id }],
        },
      },
    });

    const cameraUser = await prisma.usuario.create({
      data: {
        email: 'camarero@dulcemomento.com',
        nombre: 'Carlos Camarero',
        password: await hashPassword('Camarero123'),
        activo: true,
        roles: {
          create: [{ rolId: cameraRole.id }],
        },
      },
    });

    console.log('✓ Usuarios creados');

    // ============================================
    // CREAR CATEGORÍAS DE PRODUCTOS
    // ============================================
    const categoria1 = await prisma.categoria.create({
      data: {
        nombre: 'Bebidas',
        descripcion: 'Bebidas calientes y frías',
        activo: true,
      },
    });

    const categoria2 = await prisma.categoria.create({
      data: {
        nombre: 'Platos Principales',
        descripcion: 'Comidas principales',
        activo: true,
      },
    });

    const categoria3 = await prisma.categoria.create({
      data: {
        nombre: 'Postres',
        descripcion: 'Dulces y postres',
        activo: true,
      },
    });

    console.log('✓ Categorías de productos creadas');

    // ============================================
    // CREAR PRODUCTOS
    // ============================================
    await prisma.producto.create({
      data: {
        nombre: 'Café Espresso',
        descripcion: 'Café espresso tradicional',
        precio: 2.5,
        categoriaId: categoria1.id,
        activo: true,
      },
    });

    await prisma.producto.create({
      data: {
        nombre: 'Café con Leche',
        descripcion: 'Café con leche caliente',
        precio: 3.5,
        categoriaId: categoria1.id,
        activo: true,
      },
    });

    await prisma.producto.create({
      data: {
        nombre: 'Sopa del Día',
        descripcion: 'Sopa de verduras',
        precio: 6.0,
        categoriaId: categoria2.id,
        activo: true,
      },
    });

    await prisma.producto.create({
      data: {
        nombre: 'Pechuga de Pollo',
        descripcion: 'Pechuga de pollo a la mantequilla',
        precio: 12.0,
        categoriaId: categoria2.id,
        activo: true,
      },
    });

    await prisma.producto.create({
      data: {
        nombre: 'Tiramisú',
        descripcion: 'Postre italiano clásico',
        precio: 5.5,
        categoriaId: categoria3.id,
        activo: true,
      },
    });

    console.log('✓ Productos creados');

    // ============================================
    // CREAR MESAS
    // ============================================
    for (let i = 1; i <= 10; i++) {
      await prisma.mesa.create({
        data: {
          numero: i,
          capacidad: i <= 4 ? 2 : i <= 7 ? 4 : 6,
          estado: 'DISPONIBLE',
          activo: true,
        },
      });
    }

    console.log('✓ Mesas creadas');

    // ============================================
    // CREAR CATEGORÍAS DE GASTOS
    // ============================================
    const gastoCategoria1 = await prisma.categoriaGasto.create({
      data: {
        nombre: 'Suministros',
        descripcion: 'Suministros de cocina y servicio',
        activo: true,
      },
    });

    const gastoCategoria2 = await prisma.categoriaGasto.create({
      data: {
        nombre: 'Mantenimiento',
        descripcion: 'Mantenimiento del local',
        activo: true,
      },
    });

    async function seedGastos() {
      const gastoCategoria = await prisma.categoriaGasto.findFirst();
      const usuario = await prisma.usuario.findFirst();
      if (gastoCategoria && usuario) {
        await prisma.gasto.create({
          data: {
            descripcion: 'Aceite de cocina 5L',
            monto: 25.0,
            categoriaId: gastoCategoria.id,
            usuarioId: usuario.id,
            activo: true,
          },
        });
      }
    }

    await seedGastos();

    console.log('✓ Categorías de gastos y gastos de ejemplo creados');

    // ============================================
    // CREAR CONFIGURATION
    // ============================================
    await prisma.configuracion.create({
      data: {
        clave: 'NOMBRE_NEGOCIO',
        valor: 'Mi Restaurante Ejemplo',
        tipo: 'string',
      },
    });

    await prisma.configuracion.create({
      data: {
        clave: 'IVA',
        valor: '19',
        tipo: 'number',
      },
    });

    await prisma.configuracion.create({
      data: {
        clave: 'NUMERO_FACTURA',
        valor: '1001',
        tipo: 'number',
      },
    });

    console.log('✓ Configuraciones creadas');

    console.log(`
╔════════════════════════════════════════╗
║      ✓ Seed completado exitosamente   ║
╠════════════════════════════════════════╣
║  Tenant ID: ${tenantId}
║  
║  Usuarios de ejemplo:
║  📧 admin@dulcemomento.com / Admin123
║  📧 gerente@dulcemomento.com / Gerente123
║  📧 camarero@dulcemomento.com / Camarero123
╚════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('Error en seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
