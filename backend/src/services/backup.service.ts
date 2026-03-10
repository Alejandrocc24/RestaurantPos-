import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './google-drive.service.js';
import { config } from '../config/index.js';
import { getPrismaClient } from '../config/prisma.js';

const defaultPrisma = new PrismaClient();
const driveService = new GoogleDriveService();

export class BackupService {
    private static backupsDir = path.join(process.cwd(), 'backups');

    static init() {
        if (!fs.existsSync(this.backupsDir)) {
            fs.mkdirSync(this.backupsDir, { recursive: true });
        }

        // Programar el backup automático cada día a las 2 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('Iniciando respaldo automático multi-tenant...');
            try {
                // Descubrir todas las DB de tenants creadas (segun el prefijo de DATABASE_URL)
                const baseUrl = config.databaseUrl;
                if (!baseUrl) throw new Error('DATABASE_URL no definida');

                const urlObj = new URL(baseUrl);
                const dbName = urlObj.pathname.substring(1);
                const pattern = `${dbName}_%`;

                // Consulta cruda para listar bases de datos multi-tenant en PostgreSQL
                const result: any[] = await defaultPrisma.$queryRaw`
                    SELECT datname 
                    FROM pg_database 
                    WHERE datname LIKE ${pattern};
                `;

                if (result.length === 0) {
                    console.log('No se encontraron BDs de tenants. Respaldando la base de datos por defecto (posiblemente entorno single-tenant)...');
                    await this.performBackup(defaultPrisma, 'principal', 'Automático Diario', 'Respaldo de BD principal');
                } else {
                    for (const db of result) {
                        const datname = db.datname;
                        const isUnderScore = datname.startsWith(`${dbName}_`);
                        const tenantId = isUnderScore ? datname.substring(dbName.length + 1) : datname;

                        console.log(`\n--- Creando respaldo automático para tenant: ${tenantId}...`);

                        const tenantPrisma = getPrismaClient(tenantId);
                        try {
                            await this.performBackup(tenantPrisma, tenantId, 'Automático Diario', `Respaldo automático del tenant ${tenantId}`);
                            console.log(`[EXITO] Respaldo automático de tenant: ${tenantId} completado.`);
                        } catch (error) {
                            console.error(`[ERROR] Fallo el respaldo automático para tenant ${tenantId}:`, error);
                        }
                    }
                }

                console.log('\n=======================================');
                console.log('Respaldo automático global finalizado.');
                console.log('=======================================');
            } catch (error) {
                console.error('Error durante el escaneo y respaldo automático multi-tenant:', error);
            }
        });
    }

    static async performBackup(prismaClient: PrismaClient, tenantId: string, nombre: string, descripcion: string, subirADrive: boolean = true) {
        try {
            // Asegurar un directorio individual para este tenant
            const tenantBackupsDir = path.join(this.backupsDir, tenantId);
            if (!fs.existsSync(tenantBackupsDir)) {
                fs.mkdirSync(tenantBackupsDir, { recursive: true });
            }

            const fileName = `backup-${tenantId}-${Date.now()}-${nombre.replace(/\s+/g, '_')}.json`;
            const filePath = path.join(tenantBackupsDir, fileName);

            // Obtener todos los datos usando el PrismaClient instanciado de este Tenant
            const dbData = {
                usuarios: await prismaClient.usuario.findMany(),
                roles: await prismaClient.rol.findMany(),
                usuarioRoles: await prismaClient.usuarioRol.findMany(),
                categorias: await prismaClient.categoria.findMany(),
                subcategorias: await prismaClient.subcategoria.findMany(),
                categoriaGastos: await prismaClient.categoriaGasto.findMany(),
                productos: await prismaClient.producto.findMany(),
                gruposModificadores: await prismaClient.grupoModificador.findMany(),
                opcionesModificador: await prismaClient.opcionModificador.findMany(),
                mesas: await prismaClient.mesa.findMany(),
                ordenes: await prismaClient.orden.findMany(),
                ordenProductos: await prismaClient.ordenProducto.findMany(),
                pagos: await prismaClient.pago.findMany(),
                ventas: await prismaClient.venta.findMany(),
                comentarios: await prismaClient.comentario.findMany(),
                comentariosPreestablecidos: await prismaClient.comentarioPreestablecido.findMany(),
                gastos: await prismaClient.gasto.findMany(),
                cajas: await prismaClient.caja.findMany(),
                proveedores: await prismaClient.proveedor.findMany(),
                compras: await prismaClient.compra.findMany(),
                configuraciones: await prismaClient.configuracion.findMany(),
            };

            const backupData = {
                metadata: {
                    fecha: new Date().toISOString(),
                    nombre: nombre,
                    descripcion: descripcion
                },
                data: dbData
            };

            // Guardar localmente
            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

            let fileUrl = '';

            // Subir a Drive si esta configurado para ello
            if (subirADrive) {
                // Checar si el archivo service-account.json existe
                const saPath = path.join(process.cwd(), 'service-account.json');
                if (fs.existsSync(saPath)) {
                    fileUrl = await driveService.uploadFile(filePath);
                } else {
                    console.warn('Advertencia: service-account.json no encontrado, omitiendo subida a Google Drive.');
                }
            }

            return { fileName, filePath, fileUrl };
        } catch (error: any) {
            console.error('Error creando el backup interno:', error);
            throw error;
        }
    }

    static async wipeData(prismaClient: PrismaClient, currentUserId: string, categories?: string[]) {
        try {
            // Si no se pasan categorías, borrar todo (comportamiento legacy)
            const borrarTodo = !categories || categories.length === 0;
            const borrarEstadisticas = borrarTodo || categories!.includes('estadisticas');
            const borrarGastos = borrarTodo || categories!.includes('gastos');
            const borrarCarta = borrarTodo || categories!.includes('carta');
            const borrarUsuarios = borrarTodo || categories!.includes('usuarios');

            // Buscar el usuario desarrollador para protegerlo
            const devUser = await prismaClient.usuario.findFirst({
                where: { email: config.devEmail }
            });
            // IDs a proteger: el usuario actual + el usuario desarrollador
            const protectedIds = [currentUserId];
            if (devUser && !protectedIds.includes(devUser.id)) {
                protectedIds.push(devUser.id);
            }

            const borrados: string[] = [];

            await prismaClient.$transaction(async (tx: any) => {
                // 1. Estadísticas: Ventas, Ordenes, Pagos, Comentarios, Cajas
                if (borrarEstadisticas) {
                    await tx.pago.deleteMany();
                    await tx.comentario.deleteMany();
                    await tx.ordenProducto.deleteMany();
                    await tx.venta.deleteMany();
                    await tx.orden.deleteMany();
                    await tx.caja.deleteMany();
                    borrados.push('estadisticas');
                }

                // 2. Gastos, Compras, Proveedores, Categorías de Gasto
                if (borrarGastos) {
                    await tx.compra.deleteMany();
                    await tx.gasto.deleteMany();
                    await tx.proveedor.deleteMany();
                    await tx.categoriaGasto.deleteMany();
                    borrados.push('gastos');
                }

                // 3. Carta: Productos, Categorías, Subcategorías, Modificadores
                if (borrarCarta) {
                    // Si no se borran estadísticas, hay que borrar primero las dependencias de productos en órdenes
                    if (!borrarEstadisticas) {
                        await tx.pago.deleteMany();
                        await tx.comentario.deleteMany();
                        await tx.ordenProducto.deleteMany();
                        await tx.venta.deleteMany();
                        await tx.orden.deleteMany();
                        borrados.push('estadisticas (requerido por carta)');
                    }
                    await tx.opcionModificador.deleteMany();
                    await tx.grupoModificador.deleteMany();
                    await tx.producto.deleteMany();
                    await tx.subcategoria.deleteMany();
                    await tx.categoria.deleteMany();
                    borrados.push('carta');
                }

                // 4. Usuarios: borramos roles asignados y usuarios a excepción de los protegidos
                if (borrarUsuarios) {
                    await tx.usuarioRol.deleteMany({
                        where: {
                            usuarioId: { notIn: protectedIds }
                        }
                    });
                    await tx.usuario.deleteMany({
                        where: {
                            id: { notIn: protectedIds }
                        }
                    });
                    borrados.push('usuarios');
                }
            }, {
                maxWait: 60000,
                timeout: 120000, // 2 min para este proceso
            });
            console.log(`[EXITO] Datos borrados: [${borrados.join(', ')}]. Usuarios protegidos: ${protectedIds.join(', ')}`);
            return borrados;
        } catch (error: any) {
            console.error('Error al borrar datos:', error);
            throw error;
        }
    }
}
