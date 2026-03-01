import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Iniciando limpieza completa...\n');

    // Limpiar en orden correcto (respetando dependencias)
    try {
      await prisma.gasto.deleteMany({});
      console.log('🗑️ Gastos eliminados');
    } catch (e) {
      // Puede no existir aún
    }

    try {
      await prisma.producto.deleteMany({});
      console.log('🗑️ Productos eliminados');
    } catch (e) {
      // Puede no existir aún
    }

    try {
      await prisma.subcategoria.deleteMany({});
      console.log('🗑️ Subcategorías eliminadas');
    } catch (e) {
      // Puede no existir aún
    }

    try {
      await prisma.categoria.deleteMany({});
      console.log('🗑️ Categorías de productos eliminadas');
    } catch (e) {
      // Puede no existir aún
    }

    try {
      await prisma.categoriaGasto.deleteMany({});
      console.log('🗑️ Categorías de gastos eliminadas');
    } catch (e) {
      // Puede no existir aún
    }

    try {
      await prisma.mesa.deleteMany({});
      console.log('🗑️ Mesas eliminadas');
    } catch (e) {
      // Puede no existir aún
    }

    console.log('\n🌱 Iniciando seed con datos reales...\n');

    // Crear mesas (6 mesas para una pastelería pequeña)
    const mesas = [];
    for (let i = 1; i <= 6; i++) {
      const mesa = await prisma.mesa.create({
        data: {
          numero: i,
          capacidad: 4,
          estado: 'DISPONIBLE',
          activo: true
        }
      });
      mesas.push(mesa);
    }
    console.log('✅ 6 mesas creadas');

    // Crear categorías de productos
    const categoriaData = [
      { nombre: 'Pasteles', descripcion: 'Pasteles y tortas elaboradas' },
      { nombre: 'Postres', descripcion: 'Postres y desserts variados' },
      { nombre: 'Bebidas', descripcion: 'Bebidas calientes y frías' },
      { nombre: 'Café', descripcion: 'Bebidas de café especiales' },
      { nombre: 'Repostería', descripcion: 'Galletas y productos de repostería' },
      { nombre: 'Chocolate', descripcion: 'Chocolates y bebidas de chocolate' }
    ];

    const categorias = [];
    for (const cat of categoriaData) {
      const categoria = await prisma.categoria.create({
        data: cat
      });
      categorias.push(categoria);
    }
    console.log(`✅ ${categorias.length} categorías de productos creadas`);

    // Crear productos
    const productos = [
      // Pasteles
      { nombre: 'Torta de Chocolate', precio: 25.00, categoriaId: categorias[0].id, descripcion: 'Torta de chocolate belga' },
      { nombre: 'Torta de Fresas', precio: 28.00, categoriaId: categorias[0].id, descripcion: 'Torta con fresas frescas' },
      { nombre: 'Torta de Vainilla', precio: 22.00, categoriaId: categorias[0].id, descripcion: 'Torta clásica de vainilla' },
      // Postres
      { nombre: 'Cheesecake', precio: 12.00, categoriaId: categorias[1].id, descripcion: 'Cheesecake de NY' },
      { nombre: 'Brownie', precio: 8.00, categoriaId: categorias[1].id, descripcion: 'Brownie de chocolate' },
      { nombre: 'Flan', precio: 6.00, categoriaId: categorias[1].id, descripcion: 'Flan casero' },
      // Bebidas
      { nombre: 'Agua', precio: 2.00, categoriaId: categorias[2].id, descripcion: 'Agua mineral' },
      { nombre: 'Refresco', precio: 3.00, categoriaId: categorias[2].id, descripcion: 'Refresco variado' },
      { nombre: 'Jugo Natural', precio: 4.00, categoriaId: categorias[2].id, descripcion: 'Jugo natural' },
      // Café
      { nombre: 'Espresso', precio: 3.50, categoriaId: categorias[3].id, descripcion: 'Café espresso' },
      { nombre: 'Cappuccino', precio: 5.00, categoriaId: categorias[3].id, descripcion: 'Cappuccino cremoso' },
      { nombre: 'Latte', precio: 5.50, categoriaId: categorias[3].id, descripcion: 'Café con leche' },
      // Repostería
      { nombre: 'Galleta de Mantequilla', precio: 2.50, categoriaId: categorias[4].id, descripcion: 'Galletas caseras' },
      { nombre: 'Croissant', precio: 4.00, categoriaId: categorias[4].id, descripcion: 'Croissant francés' },
      { nombre: 'Muffin', precio: 3.50, categoriaId: categorias[4].id, descripcion: 'Muffin de blueberry' },
      // Chocolate
      { nombre: 'Hot Chocolate', precio: 4.50, categoriaId: categorias[5].id, descripcion: 'Chocolate caliente' },
      { nombre: 'Chocolate con Leche', precio: 5.00, categoriaId: categorias[5].id, descripcion: 'Chocolate artesanal' }
    ];

    for (const prod of productos) {
      await prisma.producto.create({
        data: {
          ...prod,
          activo: true
        }
      });
    }
    console.log(`✅ ${productos.length} productos creados`);

    console.log('\n✨ Seed completado exitosamente');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
