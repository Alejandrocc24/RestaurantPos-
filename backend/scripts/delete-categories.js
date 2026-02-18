const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteCategories() {
  try {
    console.log('🗑️  Eliminando subcategorías...');
    await prisma.subcategoria.deleteMany({});
    
    console.log('🗑️  Eliminando categorías...');
    await prisma.categoria.deleteMany({});
    
    console.log('✅ Todas las categorías y subcategorías han sido eliminadas');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCategories();
