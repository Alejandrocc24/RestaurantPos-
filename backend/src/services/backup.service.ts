import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './google-drive.service.js';

const prisma = new PrismaClient();
const driveService = new GoogleDriveService();

export class BackupService {
    private static backupsDir = path.join(process.cwd(), 'backups');

    static init() {
        if (!fs.existsSync(this.backupsDir)) {
            fs.mkdirSync(this.backupsDir, { recursive: true });
        }

        // Programar el backup automático cada día a las 2 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('Iniciando respaldo automático...');
            try {
                await this.performBackup('Automático Diario', 'Respaldo automático del sistema a las 2 AM');
                console.log('Respaldo automático completado.');
            } catch (error) {
                console.error('Error durante el respaldo automático:', error);
            }
        });
    }

    static async performBackup(nombre: string, descripcion: string, subirADrive: boolean = true) {
        try {
            const fileName = `backup-${Date.now()}-${nombre.replace(/\s+/g, '_')}.json`;
            const filePath = path.join(this.backupsDir, fileName);

            // Obtener todos los datos usando Prisma (Extraído del BackupController)
            const dbData = {
                usuarios: await prisma.usuario.findMany(),
                roles: await prisma.rol.findMany(),
                usuarioRoles: await prisma.usuarioRol.findMany(),
                categorias: await prisma.categoria.findMany(),
                subcategorias: await prisma.subcategoria.findMany(),
                categoriaGastos: await prisma.categoriaGasto.findMany(),
                productos: await prisma.producto.findMany(),
                gruposModificadores: await prisma.grupoModificador.findMany(),
                opcionesModificador: await prisma.opcionModificador.findMany(),
                mesas: await prisma.mesa.findMany(),
                ordenes: await prisma.orden.findMany(),
                ordenProductos: await prisma.ordenProducto.findMany(),
                pagos: await prisma.pago.findMany(),
                ventas: await prisma.venta.findMany(),
                comentarios: await prisma.comentario.findMany(),
                comentariosPreestablecidos: await prisma.comentarioPreestablecido.findMany(),
                gastos: await prisma.gasto.findMany(),
                cajas: await prisma.caja.findMany(),
                proveedores: await prisma.proveedor.findMany(),
                compras: await prisma.compra.findMany(),
                configuraciones: await prisma.configuracion.findMany(),
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
}
