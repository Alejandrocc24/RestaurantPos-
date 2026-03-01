import { Request, Response } from 'express';

export class GrupoModificadorController {

    static async getGrupos(req: Request, res: Response) {
        try {
            const { skip, take, search } = req.query;

            const where: any = {
                activo: true
            };

            if (search) {
                where.nombre = { contains: String(search), mode: 'insensitive' };
            }

            const grupos = await req.prisma.grupoModificador.findMany({
                where,
                include: {
                    opciones: {
                        where: { activo: true },
                        include: { producto: true }  // Incluir datos del producto
                    }
                },
                skip: skip ? Number(skip) : undefined,
                take: take ? Number(take) : undefined,
                orderBy: { nombre: 'asc' }
            });

            res.json({
                success: true,
                data: grupos
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getGrupoById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const grupo = await req.prisma.grupoModificador.findUnique({
                where: { id },
                include: {
                    opciones: {
                        include: { producto: true }  // Incluir datos del producto
                    }
                }
            });

            if (!grupo) {
                return res.status(404).json({
                    success: false,
                    message: 'Grupo de modificadores no encontrado'
                });
            }

            res.json({
                success: true,
                data: grupo
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async createGrupo(req: Request, res: Response) {
        try {
            const { nombre, descripcion, requerido, cobrar_precio, opciones } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre es obligatorio'
                });
            }

            // Crear grupo con opciones si vienen incluidas
            const grupo = await req.prisma.grupoModificador.create({
                data: {
                    nombre,
                    descripcion,
                    requerido: requerido || false,
                    cobrar_precio: cobrar_precio || false,
                    opciones: opciones && Array.isArray(opciones) ? {
                        create: opciones.map((op: any) => ({
                            nombre: op.nombre,
                            precioAdicional: op.precioAdicional || 0,
                            productoId: op.productoId || null,  // Ahora soporta relación con producto
                            activo: true
                        }))
                    } : undefined
                },
                include: {
                    opciones: {
                        include: { producto: true }  // Incluir datos del producto
                    }
                }
            });

            res.status(201).json({
                success: true,
                data: grupo
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async updateGrupo(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { opciones, ...data } = req.body;

            console.log('🔍 [GrupoModificadorController.updateGrupo] ID:', id);
            console.log('📦 [GrupoModificadorController.updateGrupo] Body recibido:', JSON.stringify(req.body, null, 2));
            console.log('📦 [GrupoModificadorController.updateGrupo] Data a actualizar:', JSON.stringify(data, null, 2));
            console.log('📦 [GrupoModificadorController.updateGrupo] Opciones:', opciones);

            // Si vienen opciones, realizamos replace: eliminamos las opciones anteriores y creamos las nuevas
            let updateData: any = { ...data };
            if (opciones && Array.isArray(opciones)) {
                console.log('✅ [GrupoModificadorController.updateGrupo] Reemplazando opciones. Cantidad:', opciones.length);
                updateData.opciones = {
                    deleteMany: {},
                    create: opciones.map((op: any) => ({
                        nombre: op.nombre,
                        precioAdicional: op.precioAdicional || 0,
                        productoId: op.productoId || null,  // Ahora soporta relación con producto
                        activo: typeof op.activo === 'boolean' ? op.activo : true
                    }))
                };
            } else {
                console.log('⚠️ [GrupoModificadorController.updateGrupo] Sin opciones en el body');
            }

            console.log('📤 [GrupoModificadorController.updateGrupo] UpdateData final:', JSON.stringify(updateData, null, 2));

            const grupo = await req.prisma.grupoModificador.update({
                where: { id },
                data: {
                    ...updateData,
                    // Permitir actualización de cobrar_precio si viene en el body
                    ...(data.cobrar_precio !== undefined && { cobrar_precio: data.cobrar_precio })
                },
                include: {
                    opciones: {
                        include: { producto: true }  // Incluir datos del producto
                    }
                }
            });

            console.log('✅ [GrupoModificadorController.updateGrupo] Actualización exitosa');
            res.json({
                success: true,
                data: grupo
            });
        } catch (error: any) {
            console.error('❌ [GrupoModificadorController.updateGrupo] Error:', error.name, error.message);
            console.error('   Stack:', error.stack);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async deleteGrupo(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Soft delete
            await req.prisma.grupoModificador.update({
                where: { id },
                data: { activo: false }
            });

            res.json({
                success: true,
                message: 'Grupo eliminado correctamente'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
