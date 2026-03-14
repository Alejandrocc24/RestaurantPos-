const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const data = await prisma.$queryRawUnsafe("SELECT cargar_datos_iniciales() as data");
    const result = data[0].data;
    const grupos = result.gruposModificadores || result.grupos_modificadores || [];
    let hasCategories = false;
    for (const g of grupos) {
        if (g.opciones) {
            for (const op of g.opciones) {
                if (op.categoria) {
                    console.log(`Grupo ${g.nombre} -> Opcion ${op.nombre} -> Categoria ${op.categoria}`);
                    hasCategories = true;
                }
            }
        }
    }
    if (!hasCategories) {
        console.log("No categories found in any modifier option from stored procedure!");
        
        // Let's verify if the database has them on the tables directly
        const rawOpciones = await prisma.opcionModificador.findMany({
            where: { categoria: { not: null } }
        });
        console.log(`Direct query found ${rawOpciones.length} options with categoria directly in DB.`);
        if (rawOpciones.length > 0) {
            console.log(rawOpciones[0]);
        }
    }
}
main().finally(() => prisma.$disconnect());
