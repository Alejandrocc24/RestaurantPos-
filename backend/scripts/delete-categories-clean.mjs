import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteCategories() {
  try {
    // Primero eliminar productos que usan estas categorías
    console.log('🗑️  Eliminando productos...');
    await prisma.$executeRaw`DELETE FROM "Producto"`;
    
    console.log('🗑️  Eliminando subcategorías con SQL...');
    await prisma.$executeRaw`DELETE FROM "Subcategoria"`;
    
    console.log('🗑️  Eliminando categorías con SQL...');
    await prisma.$executeRaw`DELETE FROM "Categoria"`;
    
    console.log('✅ Todas las categorías, subcategorías y productos han sido eliminados');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCategories();
