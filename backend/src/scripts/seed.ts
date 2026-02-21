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
    // CREAR PERMISOS
    // ============================================
    const permisos = await Promise.all([
      // Permisos de Usuarios
      prisma.permiso.create({ data: { nombre: 'usuarios.ver', descripcion: 'Ver lista de usuarios' } }),
      prisma.permiso.create({ data: { nombre: 'usuarios.crear', descripcion: 'Crear nuevos usuarios' } }),
      prisma.permiso.create({ data: { nombre: 'usuarios.editar', descripcion: 'Editar usuarios existentes' } }),
      prisma.permiso.create({ data: { nombre: 'usuarios.eliminar', descripcion: 'Eliminar usuarios' } }),
      
      // Permisos de Roles
      prisma.permiso.create({ data: { nombre: 'roles.ver', descripcion: 'Ver lista de roles' } }),
      prisma.permiso.create({ data: { nombre: 'roles.crear', descripcion: 'Crear nuevos roles' } }),
      prisma.permiso.create({ data: { nombre: 'roles.editar', descripcion: 'Editar roles existentes' } }),
      prisma.permiso.create({ data: { nombre: 'roles.eliminar', descripcion: 'Eliminar roles' } }),
      
      // Permisos de Productos
      prisma.permiso.create({ data: { nombre: 'productos.ver', descripcion: 'Ver lista de productos' } }),
      prisma.permiso.create({ data: { nombre: 'productos.crear', descripcion: 'Crear nuevos productos' } }),
      prisma.permiso.create({ data: { nombre: 'productos.editar', descripcion: 'Editar productos existentes' } }),
      prisma.permiso.create({ data: { nombre: 'productos.eliminar', descripcion: 'Eliminar productos' } }),
      
      // Permisos de Categorías
      prisma.permiso.create({ data: { nombre: 'categorias.ver', descripcion: 'Ver lista de categorías' } }),
      prisma.permiso.create({ data: { nombre: 'categorias.crear', descripcion: 'Crear nuevas categorías' } }),
      prisma.permiso.create({ data: { nombre: 'categorias.editar', descripcion: 'Editar categorías existentes' } }),
      prisma.permiso.create({ data: { nombre: 'categorias.eliminar', descripcion: 'Eliminar categorías' } }),
      
      // Permisos de Mesas
      prisma.permiso.create({ data: { nombre: 'mesas.ver', descripcion: 'Ver lista de mesas' } }),
      prisma.permiso.create({ data: { nombre: 'mesas.crear', descripcion: 'Crear nuevas mesas' } }),
      prisma.permiso.create({ data: { nombre: 'mesas.editar', descripcion: 'Editar mesas existentes' } }),
      prisma.permiso.create({ data: { nombre: 'mesas.eliminar', descripcion: 'Eliminar mesas' } }),
      
      // Permisos de Órdenes
      prisma.permiso.create({ data: { nombre: 'ordenes.ver', descripcion: 'Ver list de órdenes' } }),
      prisma.permiso.create({ data: { nombre: 'ordenes.crear', descripcion: 'Crear nuevas órdenes' } }),
      prisma.permiso.create({ data: { nombre: 'ordenes.editar', descripcion: 'Editar órdenes existentes' } }),
      prisma.permiso.create({ data: { nombre: 'ordenes.eliminar', descripcion: 'Eliminar órdenes' } }),
      
      // Permisos de Gastos
      prisma.permiso.create({ data: { nombre: 'gastos.ver', descripcion: 'Ver lista de gastos' } }),
      prisma.permiso.create({ data: { nombre: 'gastos.crear', descripcion: 'Crear nuevos gastos' } }),
      prisma.permiso.create({ data: { nombre: 'gastos.editar', descripcion: 'Editar gastos existentes' } }),
      prisma.permiso.create({ data: { nombre: 'gastos.eliminar', descripcion: 'Eliminar gastos' } }),
      
      // Permisos de Categorías de Gastos
      prisma.permiso.create({ data: { nombre: 'categoriasGastos.ver', descripcion: 'Ver categorías de gastos' } }),
      prisma.permiso.create({ data: { nombre: 'categoriasGastos.crear', descripcion: 'Crear categorías de gastos' } }),
      prisma.permiso.create({ data: { nombre: 'categoriasGastos.editar', descripcion: 'Editar categorías de gastos' } }),
      prisma.permiso.create({ data: { nombre: 'categoriasGastos.eliminar', descripcion: 'Eliminar categorías de gastos' } }),
      
      // Permisos de Configuración
      prisma.permiso.create({ data: { nombre: 'configuracion.ver', descripcion: 'Ver configuración' } }),
      prisma.permiso.create({ data: { nombre: 'configuracion.editar', descripcion: 'Editar configuración' } }),
      
      // Permisos generales
      prisma.permiso.create({ data: { nombre: 'reportes.ver', descripcion: 'Ver reportes' } }),
      prisma.permiso.create({ data: { nombre: 'dashboard.ver', descripcion: 'Ver dashboard' } }),
    ]);

    console.log('✓ Permisos creados (53 permisos)');

    // Asignar todos los permisos al rol admin
    await prisma.rol.update({
      where: { id: adminRole.id },
      data: {
        permisos: {
          connect: permisos.map(p => ({ id: p.id }))
        }
      }
    });

    // Asignar permisos específicos al rol gerente
    const permisosGerenteIds = permisos
      .filter(p => 
        p.nombre.includes('productos') ||
        p.nombre.includes('mesas') ||
        p.nombre.includes('ordenes') ||
        p.nombre.includes('gastos') ||
        p.nombre.includes('dashboard') ||
        p.nombre.includes('reportes')
      )
      .map(p => ({ id: p.id }));

    await prisma.rol.update({
      where: { id: gerenteRole.id },
      data: {
        permisos: {
          connect: permisosGerenteIds
        }
      }
    });

    // Asignar permisos específicos al rol camarero
    const permisosCamareroIds = permisos
      .filter(p => 
        p.nombre.includes('mesas') ||
        p.nombre.includes('ordenes.ver') ||
        p.nombre.includes('ordenes.crear') ||
        p.nombre.includes('ordenes.editar') ||
        p.nombre.includes('dashboard')
      )
      .map(p => ({ id: p.id }));

    await prisma.rol.update({
      where: { id: cameraRole.id },
      data: {
        permisos: {
          connect: permisosCamareroIds
        }
      }
    });

    // Asignar permisos específicos al rol cocina
    const permisosCocinaIds = permisos
      .filter(p => 
        p.nombre.includes('ordenes.ver') ||
        p.nombre.includes('productos.ver')
      )
      .map(p => ({ id: p.id }));

    await prisma.rol.update({
      where: { id: cocinaRole.id },
      data: {
        permisos: {
          connect: permisosCocinaIds
        }
      }
    });

    // Asignar permisos específicos al rol caja
    const permisosBoxIds = permisos
      .filter(p => 
        p.nombre.includes('ordenes.ver') ||
        p.nombre.includes('gastos') ||
        p.nombre.includes('dashboard') ||
        p.nombre.includes('reportes')
      )
      .map(p => ({ id: p.id }));

    await prisma.rol.update({
      where: { id: cajaRole.id },
      data: {
        permisos: {
          connect: permisosBoxIds
        }
      }
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
