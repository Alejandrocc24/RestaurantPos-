import { Request, Response } from 'express';

export class CategoriaController {

    static async getCategorias(req: Request, res: Response) {
        try {
            const { skip, take, search } = req.query;

            const where: any = {
                activo: true
            };

            if (search) {
                where.nombre = { contains: String(search), mode: 'insensitive' };
            }

            const categorias = await req.prisma.categoria.findMany({
                where,
                skip: skip ? Number(skip) : undefined,
                take: take ? Number(take) : undefined,
                orderBy: { nombre: 'asc' },
                include: {
                    subcategorias: {
                        where: { activo: true },
                        orderBy: { nombre: 'asc' }
                    }
                }
            });

            res.json({
                success: true,
                data: categorias
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getCategoriaById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const categoria = await req.prisma.categoria.findUnique({
                where: { id },
                include: {
                    subcategorias: {
                        where: { activo: true },
                        orderBy: { nombre: 'asc' }
                    }
                }
            });

            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }

            res.json({
                success: true,
                data: categoria
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async createCategoria(req: Request, res: Response) {
        try {
            const { nombre, descripcion, subcategorias } = req.body;

            console.log('🔵 [Categoria Create] Recibido:', { nombre, descripcion, subcategorias });

            if (!nombre || !nombre.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre es obligatorio'
                });
            }

            const nombreLimpio = nombre.trim();
            const dataToCreate: any = {
                nombre: nombreLimpio,
                descripcion: descripcion?.trim() || '',
                activo: true
            };

            // Preparar subcategorías si existen
            if (Array.isArray(subcategorias) && subcategorias.length > 0) {
                const subCategoriasValidas = subcategorias.filter(sub => sub && `${sub}`.trim() !== '');

                if (subCategoriasValidas.length > 0) {
                    console.log('📝 [Categoria Create] Subcategorías a crear:', subCategoriasValidas);
                    dataToCreate.subcategorias = {
                        create: subCategoriasValidas.map(subNombre => ({
                            nombre: `${subNombre}`.trim(),
                            descripcion: `Subcategoría de ${nombreLimpio}`,
                            activo: true
                        }))
                    };
                }
            }

            // Crear categoría (y subcategorías si existen) en una sola transacción/operación
            const categoriaConSubs = await req.prisma.categoria.create({
                data: dataToCreate,
                include: {
                    subcategorias: true
                }
            });

            console.log('✅ [Categoria Create] Respuesta final (ID):', categoriaConSubs.id);

            res.status(201).json({
                success: true,
                data: categoriaConSubs
            });
        } catch (error: any) {
            console.error('❌ [Categoria Create] Error completo:', error);

            // Manejar errores de validación de Prisma
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: `La categoría "${error.meta?.target?.[0] || 'nombre'}" ya existe`
                });
            }

            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear la categoría'
            });
        }
    }

    static async updateCategoria(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = { ...req.body };

            if (data.nombre) {
                data.nombre = data.nombre.trim();
            }
            if (data.descripcion !== undefined) {
                data.descripcion = data.descripcion?.trim() || '';
            }

            let subcategoriasUpdate: any;
            if (data.subcategorias !== undefined) {
                const subCategoriasValidas = Array.isArray(data.subcategorias)
                    ? data.subcategorias.filter((s: any) => s && `${s}`.trim() !== '')
                    : [];

                subcategoriasUpdate = {
                    deleteMany: {}, // Delete all existing to replace them
                };

                if (subCategoriasValidas.length > 0) {
                    subcategoriasUpdate.create = subCategoriasValidas.map((s: any) => ({
                        nombre: `${s}`.trim(),
                        descripcion: `Subcategoría de ${data.nombre || 'categoría'}`,
                        activo: true
                    }));
                }
                
                delete data.subcategorias; // Eliminar para que Prisma no se queje
            }

            const categoria = await req.prisma.categoria.update({
                where: { id },
                data: {
                    ...data,
                    ...(subcategoriasUpdate && { subcategorias: subcategoriasUpdate })
                },
                include: {
                    subcategorias: true
                }
            });

            res.json({
                success: true,
                data: categoria
            });
        } catch (error: any) {
            console.error('❌ [Categoria Update] Error:', error);

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: `La categoría ya existe`
                });
            }

            res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar la categoría'
            });
        }
    }

    static async deleteCategoria(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Hard delete - eliminar completamente la categoría
            // Las subcategorías se eliminarán en cascada por la relación
            // Los productos tendrán su categoriaId seteado a null por la relación
            const categoria = await req.prisma.categoria.delete({
                where: { id }
            });

            console.log('✅ [Categoria Delete] Categoría eliminada:', categoria.nombre);

            res.json({
                success: true,
                message: 'Categoría eliminada correctamente',
                data: categoria
            });
        } catch (error: any) {
            console.error('❌ [Categoria Delete] Error:', error);
            
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success: false,
                    message: 'La categoría no existe'
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Error al eliminar la categoría'
            });
        }
    }
}
