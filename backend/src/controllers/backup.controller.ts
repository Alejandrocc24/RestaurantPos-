import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { BackupService } from '../services/backup.service.js';

export class BackupController {
    private static backupsDir = path.join(process.cwd(), 'backups');

    private static ensureBackupsDir() {
        if (!fs.existsSync(this.backupsDir)) {
            fs.mkdirSync(this.backupsDir, { recursive: true });
        }
    }

    static async listBackups(req: Request, res: Response) {
        try {
            BackupController.ensureBackupsDir();
            const files = fs.readdirSync(BackupController.backupsDir).filter(f => f.endsWith('.json'));

            const respaldos = files.map((file, index) => {
                const stats = fs.statSync(path.join(BackupController.backupsDir, file));
                return {
                    id: index + 1,
                    nombre: file,
                    descripcion: 'Respaldo manual local',
                    fecha: stats.mtime.toISOString(),
                    tamano: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
                    tipo: 'Local',
                    registros: 0,
                    estado: 'Completado'
                };
            });

            res.status(200).json({ success: true, respaldos });
        } catch (error: any) {
            console.error('Error listando respaldos:', error.message);
            res.status(500).json({ success: false, error: 'Error listando respaldos', details: error.message });
        }
    }

    static async createBackup(req: Request, res: Response) {
        try {
            const { nombre, descripcion, opciones, subirADrive = false } = req.body;

            const result = await BackupService.performBackup(
                nombre || 'manual',
                descripcion || 'Respaldo manual local',
                subirADrive
            );

            res.status(200).json({
                success: true,
                message: 'Respaldo creado con éxito',
                backup: {
                    nombre: result.fileName,
                    ruta: result.filePath,
                    urlDrive: result.fileUrl || null
                }
            });
        } catch (error: any) {
            console.error('Error creando respaldo:', error);
            res.status(500).json({ success: false, error: 'Error al crear', details: error.message });
        }
    }

    static async downloadBackup(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            BackupController.ensureBackupsDir();
            const files = fs.readdirSync(BackupController.backupsDir).filter(f => f.endsWith('.json'));

            if (id > 0 && id <= files.length) {
                const file = files[id - 1];
                res.download(path.join(BackupController.backupsDir, file));
            } else {
                res.status(404).json({ success: false, error: 'Respaldo no encontrado' });
            }
        } catch (error: any) {
            res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    static async deleteBackup(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            BackupController.ensureBackupsDir();
            const files = fs.readdirSync(BackupController.backupsDir).filter(f => f.endsWith('.json'));

            if (id > 0 && id <= files.length) {
                const file = files[id - 1];
                fs.unlinkSync(path.join(BackupController.backupsDir, file));
                res.status(200).json({ success: true, message: 'Eliminado correctamente' });
            } else {
                res.status(404).json({ success: false, error: 'Respaldo no encontrado' });
            }
        } catch (error: any) {
            res.status(500).json({ success: false, error: 'Error interno o de permisos' });
        }
    }
    static async restoreBackup(req: Request, res: Response) {
        try {
            const { backupData } = req.body;

            if (!backupData || !backupData.data) {
                return res.status(400).json({ success: false, error: 'Formato de respaldo inválido' });
            }

            const dbData = backupData.data;
            const tablas_restauradas: string[] = [];

            // Usar una transacción para asegurar integridad total
            await req.prisma.$transaction(async (tx: any) => {
                // 1. ELIMINAR REGISTROS (En orden inverso de dependencias para no violar Foreign Keys)
                await tx.compra.deleteMany();
                await tx.gasto.deleteMany();
                await tx.proveedor.deleteMany();

                await tx.pago.deleteMany();
                await tx.comentario.deleteMany();
                await tx.ordenProducto.deleteMany();
                await tx.venta.deleteMany();
                await tx.orden.deleteMany();
                await tx.mesa.deleteMany();

                await tx.opcionModificador.deleteMany();
                await tx.grupoModificador.deleteMany();
                await tx.producto.deleteMany();
                await tx.subcategoria.deleteMany();
                await tx.categoria.deleteMany();
                await tx.categoriaGasto.deleteMany();

                await tx.caja.deleteMany();

                await tx.usuarioRol.deleteMany();
                await tx.usuario.deleteMany();
                await tx.rol.deleteMany();

                await tx.comentarioPreestablecido.deleteMany();
                await tx.configuracion.deleteMany();

                // 2. CREAR REGISTROS (En orden normal de dependencias)

                // Config general
                if (dbData.configuraciones?.length) { await tx.configuracion.createMany({ data: dbData.configuraciones }); tablas_restauradas.push('configuraciones'); }
                if (dbData.comentariosPreestablecidos?.length) { await tx.comentarioPreestablecido.createMany({ data: dbData.comentariosPreestablecidos }); tablas_restauradas.push('comentariosPreestablecidos'); }

                // Roles & Usuarios
                if (dbData.roles?.length) { await tx.rol.createMany({ data: dbData.roles }); tablas_restauradas.push('roles'); }
                if (dbData.usuarios?.length) { await tx.usuario.createMany({ data: dbData.usuarios }); tablas_restauradas.push('usuarios'); }
                if (dbData.usuarioRoles?.length) { await tx.usuarioRol.createMany({ data: dbData.usuarioRoles }); tablas_restauradas.push('usuarioRoles'); }

                // Cajas y Proveedores
                if (dbData.cajas?.length) { await tx.caja.createMany({ data: dbData.cajas }); tablas_restauradas.push('cajas'); }
                if (dbData.proveedores?.length) { await tx.proveedor.createMany({ data: dbData.proveedores }); tablas_restauradas.push('proveedores'); }
                if (dbData.compras?.length) { await tx.compra.createMany({ data: dbData.compras }); tablas_restauradas.push('compras'); }

                // Categorias & Subcategorias
                if (dbData.categoriaGastos?.length) { await tx.categoriaGasto.createMany({ data: dbData.categoriaGastos }); tablas_restauradas.push('categoriaGastos'); }
                if (dbData.categorias?.length) { await tx.categoria.createMany({ data: dbData.categorias }); tablas_restauradas.push('categorias'); }
                if (dbData.subcategorias?.length) { await tx.subcategoria.createMany({ data: dbData.subcategorias }); tablas_restauradas.push('subcategorias'); }

                // Gastos
                if (dbData.gastos?.length) { await tx.gasto.createMany({ data: dbData.gastos }); tablas_restauradas.push('gastos'); }

                // Productos & Modificadores
                if (dbData.gruposModificadores?.length) { await tx.grupoModificador.createMany({ data: dbData.gruposModificadores }); tablas_restauradas.push('gruposModificadores'); }
                if (dbData.productos?.length) { await tx.producto.createMany({ data: dbData.productos }); tablas_restauradas.push('productos'); }
                if (dbData.opcionesModificador?.length) { await tx.opcionModificador.createMany({ data: dbData.opcionesModificador }); tablas_restauradas.push('opcionesModificador'); }

                // Restaurante: Mesas, Ordenes y Ventas
                if (dbData.mesas?.length) { await tx.mesa.createMany({ data: dbData.mesas }); tablas_restauradas.push('mesas'); }
                if (dbData.ordenes?.length) { await tx.orden.createMany({ data: dbData.ordenes }); tablas_restauradas.push('ordenes'); }
                if (dbData.ventas?.length) { await tx.venta.createMany({ data: dbData.ventas }); tablas_restauradas.push('ventas'); }
                if (dbData.ordenProductos?.length) { await tx.ordenProducto.createMany({ data: dbData.ordenProductos }); tablas_restauradas.push('ordenProductos'); }
                if (dbData.pagos?.length) { await tx.pago.createMany({ data: dbData.pagos }); tablas_restauradas.push('pagos'); }
                if (dbData.comentarios?.length) { await tx.comentario.createMany({ data: dbData.comentarios }); tablas_restauradas.push('comentarios'); }
            }, {
                maxWait: 60000,
                timeout: 300000, // 5 min para inserción masiva
            });

            res.status(200).json({
                success: true,
                message: 'Restauración de base de datos exitosa',
                resultados: {
                    tablas_restauradas: tablas_restauradas,
                    tablas_con_errores: [],
                    total_registros: tablas_restauradas.length
                }
            });
        } catch (error: any) {
            console.error('CRITICAL Error restaurando DB:', error);
            res.status(500).json({ success: false, error: 'Error interno restaurando: ' + error.message, details: error.stack });
        }
    }

    static async getDownloadUrl(req: Request, res: Response) {
        try {
            res.status(200).json({ success: true, url: 'https://ejemplo.com/descarga' });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Incapaz de obtener la URL' });
        }
    }
}
