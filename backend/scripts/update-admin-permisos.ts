import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Buscar el rol Administrador
    const adminRol = await prisma.rol.findFirst({
        where: { nombre: 'Administrador' }
    });

    if (!adminRol) {
        console.log('❌ No se encontró el rol Administrador');
        return;
    }

    console.log('📋 Rol encontrado:', adminRol.nombre);
    console.log('📋 Permisos actuales:', adminRol.permisos);

    // Verificar si ya tiene el permiso
    if (adminRol.permisos.includes('mesas.modo_edicion')) {
        console.log('✅ El rol ya tiene el permiso mesas.modo_edicion');
        return;
    }

    // Agregar el permiso
    const nuevosPermisos = [...adminRol.permisos, 'mesas.modo_edicion'];

    await prisma.rol.update({
        where: { id: adminRol.id },
        data: { permisos: nuevosPermisos }
    });

    console.log('✅ Permiso mesas.modo_edicion agregado al rol Administrador');
    console.log('📋 Nuevos permisos:', nuevosPermisos);

    // También actualizar Gerente si existe
    const gerenteRol = await prisma.rol.findFirst({
        where: { nombre: 'Gerente' }
    });

    if (gerenteRol && !gerenteRol.permisos.includes('mesas.modo_edicion')) {
        const nuevosPermisosGerente = [...gerenteRol.permisos, 'mesas.modo_edicion'];
        await prisma.rol.update({
            where: { id: gerenteRol.id },
            data: { permisos: nuevosPermisosGerente }
        });
        console.log('✅ Permiso mesas.modo_edicion agregado al rol Gerente');
    }
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
