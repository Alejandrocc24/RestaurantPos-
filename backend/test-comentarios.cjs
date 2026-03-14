const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log("Checking comentarios format");
    const prods = await prisma.producto.findMany({
        where: { comentarios: { not: "[]" }, activo: true },
        take: 3
    });
    prods.forEach(p => {
        console.log(`Producto: ${p.nombre}`);
        console.log(`Comentarios:`, p.comentarios);
    });
}
main().finally(() => prisma.$disconnect());
