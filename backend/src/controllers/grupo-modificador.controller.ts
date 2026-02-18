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
                        where: { activo: true }
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
                    opciones: true
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
            const { nombre, descripcion, requerido, opciones } = req.body;

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
                    opciones: opciones && Array.isArray(opciones) ? {
                        create: opciones.map((op: any) => ({
                            nombre: op.nombre,
                            precioAdicional: op.precioAdicional || 0,
                            activo: true
                        }))
                    } : undefined
                },
                include: {
                    opciones: true
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

            // Actualizar solo el grupo, las opciones se manejan por separado o requerirían lógica compleja de upsert
            // Por ahora, actualizamos datos básicos del grupo
            const grupo = await req.prisma.grupoModificador.update({
                where: { id },
                data: data,
                include: {
                    opciones: true
                }
            });

            res.json({
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
