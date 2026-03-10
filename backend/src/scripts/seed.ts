import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

/**
 * Script para inicializar la BD con datos base para cada nuevo cliente/entorno.
 * Ejecutar con: npm run seed
 * 
 * Contiene:
 * - 6 Roles (5 visibles + 1 oculto "Desarrollador")
 * - 1 Usuario Desarrollador oculto con rol Desarrollador
 * - 10 Mesas predeterminadas
 * - Configuraciones del negocio
 */
async function main() {
  const prisma = new PrismaClient();

  console.log('🌱 Iniciando seed de datos...');

  try {
    // Limpiar datos existentes (en orden inverso de dependencias)
    await prisma.pago.deleteMany();
    await prisma.comentario.deleteMany();
    await prisma.ordenProducto.deleteMany();
    await prisma.venta.deleteMany();
    await prisma.orden.deleteMany();
    await prisma.compra.deleteMany();
    await prisma.gasto.deleteMany();
    await prisma.caja.deleteMany();
    await prisma.proveedor.deleteMany();
    await prisma.categoriaGasto.deleteMany();
    await prisma.opcionModificador.deleteMany();
    await prisma.grupoModificador.deleteMany();
    await prisma.producto.deleteMany();
    await prisma.subcategoria.deleteMany();
    await prisma.categoria.deleteMany();
    await prisma.comentarioPreestablecido.deleteMany();
    await prisma.configuracion.deleteMany();
    await prisma.usuarioRol.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.rol.deleteMany();

    console.log('✓ Datos previos eliminados');

    // ============================================
    // TODOS LOS PERMISOS DEL SISTEMA
    // ============================================
    const TODOS_LOS_PERMISOS = [
      // Usuarios
      'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
      // Roles
      'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar',
      // Productos
      'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
      // Categorías
      'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
      // Ventas
      'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.anular',
      // Pedidos
      'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cerrar',
      // Mesas
      'mesas.ver', 'mesas.gestionar', 'mesas.transferir', 'mesas.dividir', 'mesas.modo_edicion',
      // Cocina
      'cocina.ver', 'cocina.preparar', 'cocina.completar',
      // Caja
      'caja.ver', 'caja.abrir', 'caja.cerrar',
      // Movimientos y Gastos
      'movimientos.ver', 'movimientos.crear',
      'gastos.ver', 'gastos.crear', 'gastos.editar', 'gastos.eliminar',
      // Proveedores
      'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.eliminar',
      // Dashboard y Reportes
      'dashboard.ver',
      'reportes.ver', 'reportes.ventas', 'reportes.productos', 'reportes.gastos', 'reportes.exportar',
      // Configuración
      'configuracion.ver', 'configuracion.editar', 'configuracion.impresoras',
    ];

    // ============================================
    // ROL OCULTO: DESARROLLADOR (no visible para clientes)
    // ============================================
    const desarrolladorRole = await prisma.rol.create({
      data: {
        nombre: 'Desarrollador',
        descripcion: 'Rol de sistema - acceso total para soporte técnico',
        activo: true,
        permisos: TODOS_LOS_PERMISOS,
      },
    });

    console.log('✓ Rol Desarrollador creado (OCULTO para clientes)');

    // ============================================
    // ROLES VISIBLES (los que ven los clientes)
    // ============================================
    const adminRole = await prisma.rol.create({
      data: {
        nombre: 'Administrador',
        descripcion: 'Acceso completo al sistema con todos los permisos',
        activo: true,
        permisos: TODOS_LOS_PERMISOS,
      },
    });

    const gerenteRole = await prisma.rol.create({
      data: {
        nombre: 'Gerente',
        descripcion: 'Gestión de operaciones y supervisión de personal',
        activo: true,
        permisos: [
          'usuarios.ver', 'usuarios.editar',
          'productos.ver',
          'categorias.ver',
          'ventas.ver', 'ventas.editar', 'ventas.anular',
          'gastos.ver', 'gastos.crear', 'gastos.editar',
          'reportes.ver', 'reportes.exportar',
          'configuracion.ver',
          'mesas.ver', 'mesas.gestionar', 'mesas.modo_edicion',
          'caja.ver', 'caja.cerrar',
        ],
      },
    });

    const cajeroRole = await prisma.rol.create({
      data: {
        nombre: 'Cajero',
        descripcion: 'Operaciones de caja y ventas',
        activo: true,
        permisos: [
          'ventas.ver', 'ventas.crear',
          'gastos.ver',
          'productos.ver',
          'mesas.ver',
          'caja.ver', 'caja.abrir',
        ],
      },
    });

    const cocinaRole = await prisma.rol.create({
      data: {
        nombre: 'Cocina',
        descripcion: 'Preparación de productos y control de orden',
        activo: true,
        permisos: [
          'productos.ver',
          'mesas.ver',
          'cocina.ver', 'cocina.preparar', 'cocina.completar',
        ],
      },
    });

    const vendedorRole = await prisma.rol.create({
      data: {
        nombre: 'Vendedor',
        descripcion: 'Atención al cliente y toma de órdenes',
        activo: true,
        permisos: [
          'productos.ver',
          'categorias.ver',
          'ventas.crear', 'ventas.ver',
          'mesas.ver', 'mesas.gestionar',
        ],
      },
    });

    console.log('✓ Roles visibles creados (Administrador, Gerente, Cajero, Cocina, Vendedor)');

    // ============================================
    // USUARIO DESARROLLADOR (oculto, con rol Desarrollador)
    // ============================================
    const desarrolladorUser = await prisma.usuario.create({
      data: {
        email: 'desarrollador@dulcemomento',
        nombre: 'Alejandro',
        password: await hashPassword('Desarrollo123'),
        activo: true,
        roles: {
          create: [{ rolId: desarrolladorRole.id }],
        },
      },
    });

    console.log('✓ Usuario desarrollador creado (oculto para clientes)');
    console.log('   📧 Email: desarrollador@dulcemomento');
    console.log('   🔑 Contraseña: Desarrollo123');
    console.log('   🛡️  Rol: Desarrollador (oculto)');

    // ============================================
    // CREAR MESAS (10 mesas predeterminadas)
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

    console.log('✓ 10 Mesas predeterminadas creadas');

    console.log(`
╔═══════════════════════════════════════════════════╗
║       ✅ Seed completado exitosamente             ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Roles creados:                                   ║
║  ├── 🛡️  Desarrollador (OCULTO - soporte)        ║
║  ├── Administrador (acceso total)                 ║
║  ├── Gerente (supervisión)                        ║
║  ├── Cajero (caja y ventas)                       ║
║  ├── Cocina (preparación)                         ║
║  └── Vendedor (atención al cliente)               ║
║                                                   ║
║  Usuario Desarrollador (OCULTO):                  ║
║  📧 desarrollador@dulcemomento                    ║
║  🔑 Desarrollo123                                 ║
║  🛡️  Rol: Desarrollador                          ║
║                                                   ║
║  ⚠️  Ni el usuario ni el rol son visibles         ║
║  ⚠️  para los clientes del sistema.               ║
║                                                   ║
║  10 Mesas predeterminadas listas.                 ║
╚═══════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('Error en seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
