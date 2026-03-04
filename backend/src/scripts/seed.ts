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
  const tenantId = 'dulcemomento';

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
    // await prisma.permiso.deleteMany(); // ❌ Permisos son array en Rol, no modelo separado
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
    // CREAR PERMISOS (como arrays de strings)
    // ============================================
    
    // Definir permisos como arrays
    const permisosAdmin = [
      // Usuarios
      'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
      // Roles
      'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar',
      // Productos
      'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
      // Categorías
      'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
      // Mesas
      'mesas.ver', 'mesas.crear', 'mesas.editar', 'mesas.eliminar',
      // Órdenes
      'ordenes.ver', 'ordenes.crear', 'ordenes.editar', 'ordenes.eliminar',
      // Gastos
      'gastos.ver', 'gastos.crear', 'gastos.editar', 'gastos.eliminar',
      // Categorías de Gastos
      'categoriasGastos.ver', 'categoriasGastos.crear', 'categoriasGastos.editar', 'categoriasGastos.eliminar',
      // Configuración y reportes
      'configuracion.ver', 'configuracion.editar', 'reportes.ver', 'dashboard.ver',
      // Ventas
      'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.anular',
    ];

    const permisosGerente = [
      'productos.ver', 'productos.crear', 'productos.editar',
      'mesas.ver',
      'ordenes.ver', 'ordenes.crear', 'ordenes.editar',
      'gastos.ver', 'gastos.crear', 'gastos.editar',
      'dashboard.ver', 'reportes.ver',
      'ventas.ver', 'ventas.crear',
    ];

    const permisosCamarero = [
      'mesas.ver',
      'ordenes.ver', 'ordenes.crear', 'ordenes.editar',
      'dashboard.ver',
      'ventas.ver',
    ];

    const permisosCocina = [
      'ordenes.ver',
      'productos.ver',
    ];

    const permisosCaja = [
      'ordenes.ver',
      'gastos.ver',
      'dashboard.ver', 'reportes.ver',
      'ventas.ver', 'ventas.crear',
    ];

    // Actualizar roles con permisos
    await prisma.rol.update({
      where: { id: adminRole.id },
      data: { permisos: permisosAdmin }
    });

    await prisma.rol.update({
      where: { id: gerenteRole.id },
      data: { permisos: permisosGerente }
    });

    console.log('✓ Permisos asignados a roles');


    // ============================================
    // CREAR USUARIOS
    // ============================================
    const desarrolladorUser = await prisma.usuario.create({
      data: {
        email: 'desarrollador@dulcemomento',
        nombre: 'Desarrollador',
        password: await hashPassword('Desarrollo123'),
        activo: true,
        roles: {
          create: [{ rolId: adminRole.id }],
        },
      },
    });

    console.log('✓ Usuario predeterminado creado');
    console.log('   Email: desarrollador@dulcemomento');
    console.log('   Contraseña: Desarrollo123');

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
║  Usuario Predeterminado:
║  📧 desarrollador@dulcemomento
║  🔑 Contraseña: Desarrollo123
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
