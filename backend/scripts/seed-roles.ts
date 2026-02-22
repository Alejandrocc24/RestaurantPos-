import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpiar roles existentes
  await prisma.rol.deleteMany({});

  // Crear roles con permisos
  const administrador = await prisma.rol.create({
    data: {
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema con todos los permisos',
      permisos: [
        // Usuarios y Roles
        'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
        'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar',
        // Productos y Categorías
        'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
        'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
        // Ventas y Pedidos
        'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.anular',
        'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cerrar',
        // Mesas
        'mesas.ver', 'mesas.gestionar', 'mesas.transferir', 'mesas.dividir',
        // Cocina
        'cocina.ver', 'cocina.preparar', 'cocina.completar',
        // Caja y Movimientos
        'caja.ver', 'caja.abrir', 'caja.cerrar',
        'movimientos.ver', 'movimientos.crear',
        // Gastos
        'gastos.ver', 'gastos.crear', 'gastos.editar', 'gastos.eliminar',
        // Proveedores
        'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.eliminar',
        // Reportes y Dashboard
        'dashboard.ver',
        'reportes.ver', 'reportes.ventas', 'reportes.productos', 'reportes.gastos', 'reportes.exportar',
        // Configuración
        'configuracion.ver', 'configuracion.editar', 'configuracion.impresoras'
      ],
      activo: true
    }
  });

  const gerente = await prisma.rol.create({
    data: {
      nombre: 'Gerente',
      descripcion: 'Gestión de operaciones y supervisión de personal',
      permisos: [
        'usuarios.ver', 'usuarios.editar',
        'productos.ver',
        'categorias.ver',
        'ventas.ver', 'ventas.editar', 'ventas.anular',
        'gastos.ver', 'gastos.crear', 'gastos.editar',
        'reportes.ver', 'reportes.exportar',
        'configuracion.ver',
        'mesas.ver', 'mesas.gestionar',
        'caja.ver', 'caja.cerrar'
      ],
      activo: true
    }
  });

  const cajero = await prisma.rol.create({
    data: {
      nombre: 'Cajero',
      descripcion: 'Operaciones de caja y ventas',
      permisos: [
        'ventas.ver', 'ventas.crear',
        'gastos.ver',
        'productos.ver',
        'mesas.ver',
        'caja.ver', 'caja.abrir'
      ],
      activo: true
    }
  });

  const cocina = await prisma.rol.create({
    data: {
      nombre: 'Cocina',
      descripcion: 'Preparación de productos y control de orden',
      permisos: [
        'productos.ver',
        'mesas.ver',
        'cocina.ver', 'cocina.preparar', 'cocina.completar'
      ],
      activo: true
    }
  });

  const vendedor = await prisma.rol.create({
    data: {
      nombre: 'Vendedor',
      descripcion: 'Atención al cliente y toma de órdenes',
      permisos: [
        'productos.ver',
        'categorias.ver',
        'ventas.crear', 'ventas.ver',
        'mesas.ver', 'mesas.gestionar'
      ],
      activo: true
    }
  });

  console.log('✅ Roles creados exitosamente:');
  console.log('- Administrador');
  console.log('- Gerente');
  console.log('- Cajero');
  console.log('- Cocina');
  console.log('- Vendedor');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
