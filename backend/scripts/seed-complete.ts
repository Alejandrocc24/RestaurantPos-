import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Iniciando seed completo para Dulce Momento...\n');

    // Limpiar mesas
    await prisma.mesa.deleteMany({});
    console.log('🗑️ Mesas eliminadas');

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

    // Limpiar categorías
    await prisma.categoria.deleteMany({});
    console.log('🗑️ Categorías eliminadas');

    // Crear categorías
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
    console.log(`✅ ${categorias.length} categorías creadas`);

    // Limpiar productos
    await prisma.producto.deleteMany({});
    console.log('🗑️ Productos eliminados');

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
      { nombre: 'Jugo', precio: 4.00, categoriaId: categorias[2].id, descripcion: 'Jugo natural' },
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

    // Crear grupos modificadores
    const gruposModificadores = [
      { nombre: 'Tamaño de taza', descripcion: 'Tamaño para bebidas', requerido: false },
      { nombre: 'Adiciones a bebidas', descripcion: 'Extras para café', requerido: false },
      { nombre: 'Complementos de postre', descripcion: 'Extras para postres', requerido: false }
    ];

    const grupos = [];
    for (const grupo of gruposModificadores) {
      const g = await prisma.grupoModificador.create({
        data: grupo
      });
      grupos.push(g);
    }
    console.log(`✅ ${grupos.length} grupos modificadores creados`);

    // Crear opciones de modificadores
    const opciones = [
      { grupoId: grupos[0].id, nombre: 'Pequeño', precioAdicional: 0 },
      { grupoId: grupos[0].id, nombre: 'Mediano', precioAdicional: 1 },
      { grupoId: grupos[0].id, nombre: 'Grande', precioAdicional: 2 },
      { grupoId: grupos[1].id, nombre: 'Extra shot de café', precioAdicional: 0.5 },
      { grupoId: grupos[1].id, nombre: 'Espuma extra', precioAdicional: 0 },
      { grupoId: grupos[2].id, nombre: 'Crema chantilly', precioAdicional: 1 },
      { grupoId: grupos[2].id, nombre: 'Frutos secos', precioAdicional: 1.5 }
    ];

    for (const opcion of opciones) {
      await prisma.opcionModificador.create({
        data: opcion
      });
    }
    console.log(`✅ ${opciones.length} opciones de modificadores creadas`);

    console.log('\n✅ Base de datos poblada correctamente para Dulce Momento 🍰');

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
