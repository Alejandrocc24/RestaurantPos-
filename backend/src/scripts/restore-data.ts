import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

async function main() {
  const prisma = new PrismaClient();

  console.log('🌱 Restaurando datos de prueba...');

  try {
    // Crear Administrador Role
    const adminRole = await prisma.rol.create({
      data: {
        nombre: 'Administrador',
        descripcion: 'Rol con acceso total al sistema',
        permisos: [
          'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
          'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar',
          'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
          'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
          'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.anular',
          'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cerrar',
          'mesas.ver', 'mesas.gestionar', 'mesas.transferir', 'mesas.dividir',
          'cocina.ver', 'cocina.preparar', 'cocina.completar',
          'caja.ver', 'caja.abrir', 'caja.cerrar',
          'movimientos.ver', 'movimientos.crear',
          'gastos.ver', 'gastos.crear', 'gastos.editar', 'gastos.eliminar',
          'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.eliminar',
          'dashboard.ver',
          'reportes.ver', 'reportes.ventas', 'reportes.productos', 'reportes.gastos', 'reportes.exportar',
          'configuracion.ver', 'configuracion.editar', 'configuracion.impresoras',
        ],
        activo: true,
      },
    });

    // Crear usuario Desarrollador
    const hashedPassword = await hashPassword('dulce123');
    const usuario = await prisma.usuario.create({
      data: {
        email: 'desarrollador@dulcemomento',
        nombre: 'Desarrollador Dulce Momento',
        password: hashedPassword,
        activo: true,
      },
    });

    // Asignar rol al usuario
    await prisma.usuarioRol.create({
      data: {
        usuarioId: usuario.id,
        rolId: adminRole.id,
      },
    });

    // Crear Mesas
    for (let i = 1; i <= 6; i++) {
      await prisma.mesa.create({
        data: {
          numero: i,
          capacidad: 4,
          activo: true,
        },
      });
    }

    // Crear Categorías de Productos
    const categorias = ['Bebidas', 'Comidas', 'Postres', 'Snacks'];
    const categoriasCreadas = [];
    for (const nombre of categorias) {
      const cat = await prisma.categoria.create({
        data: {
          nombre,
          descripcion: `Categoría de ${nombre}`,
          activo: true,
        },
      });
      categoriasCreadas.push(cat);
    }

    // Crear Categorías de Gastos
    const categoriasGastos = ['Insumos', 'Equipos', 'Servicios', 'Marketing', 'Otros'];
    for (const nombre of categoriasGastos) {
      await prisma.categoriaGasto.create({
        data: {
          nombre,
          descripcion: `Categoría de gasto: ${nombre}`,
          activo: true,
        },
      });
    }

    // Crear Productos
    const productos = [
      { nombre: 'Café', descripcion: 'Café expreso', precio: 3.5, categoriaId: categoriasCreadas[0].id },
      { nombre: 'Té', descripcion: 'Té surtido', precio: 2.5, categoriaId: categoriasCreadas[0].id },
      { nombre: 'Hamburguesa', descripcion: 'Hamburguesa clásica', precio: 12.0, categoriaId: categoriasCreadas[1].id },
      { nombre: 'Pizza', descripcion: 'Pizza grande', precio: 18.0, categoriaId: categoriasCreadas[1].id },
      { nombre: 'Ensalada', descripcion: 'Ensalada fresca', precio: 8.5, categoriaId: categoriasCreadas[1].id },
      { nombre: 'Helado', descripcion: 'Helado surtido', precio: 5.0, categoriaId: categoriasCreadas[2].id },
      { nombre: 'Brownie', descripcion: 'Brownie de chocolate', precio: 6.0, categoriaId: categoriasCreadas[2].id },
      { nombre: 'Papas Fritas', descripcion: 'Papas fritas crujientes', precio: 4.0, categoriaId: categoriasCreadas[3].id },
    ];

    for (const prod of productos) {
      await prisma.producto.create({
        data: {
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          precio: prod.precio,
          categoriaId: prod.categoriaId,
          activo: true,
        },
      });
    }

    // Crear Proveedores
    const proveedores = [
      { nombre: 'Distribuidor Local', contacto: 'Juan', correo: 'juan@distribuidor.com', telefono: '5551234567' },
      { nombre: 'Proveedor Regional', contacto: 'María', correo: 'maria@regional.com', telefono: '5559876543' },
    ];

    for (const prov of proveedores) {
      await prisma.proveedor.create({
        data: {
          nombre: prov.nombre,
          contacto: prov.contacto,
          correo: prov.correo,
          telefono: prov.telefono,
          direccion: 'Dirección de ejemplo',
          ciudad: 'Ciudad',
          activo: true,
        },
      });
    }

    console.log('✅ Datos restaurados exitosamente');
    console.log('');
    console.log('Credenciales de prueba:');
    console.log('  Email: desarrollador@dulcemomento');
    console.log('  Password: dulce123');
    console.log('  Rol: Administrador');

  } catch (error: any) {
    console.error('❌ Error durante el seed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
