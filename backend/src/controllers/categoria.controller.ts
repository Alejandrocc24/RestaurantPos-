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

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre es obligatorio'
                });
            }

            // Verificar si la categoría ya existe
            const categoriaExistente = await req.prisma.categoria.findUnique({
                where: { nombre: nombre.trim() }
            });

            if (categoriaExistente) {
                return res.status(409).json({
                    success: false,
                    message: `La categoría "${nombre}" ya existe`
                });
            }

            // Crear categoría padre
            const categoria = await req.prisma.categoria.create({
                data: {
                    nombre: nombre.trim(),
                    descripcion: descripcion?.trim() || '',
                    activo: true
                }
            });

            console.log('✅ [Categoria Create] Categoría padre creada:', categoria.id);

            // Crear subcategorías si existen
            if (Array.isArray(subcategorias) && subcategorias.length > 0) {
                const subCategoriasValidas = subcategorias
                    .filter(sub => sub && `${sub}`.trim() !== '');

                console.log('📝 [Categoria Create] Subcategorías a crear:', subCategoriasValidas);

                if (subCategoriasValidas.length > 0) {
                    try {
                        await Promise.all(
                            subCategoriasValidas.map(subNombre =>
                                req.prisma.subcategoria.create({
                                    data: {
                                        nombre: `${subNombre}`.trim(),
                                        descripcion: `Subcategoría de ${nombre}`,
                                        categoriaId: categoria.id,
                                        activo: true
                                    }
                                })
                            )
                        );
                        console.log('✅ [Categoria Create] Subcategorías creadas correctamente');
                    } catch (subError) {
                        console.error('❌ [Categoria Create] Error creando subcategorías:', subError);
                        throw subError;
                    }
                }
            }

            // Obtener categoría con subcategorías incluidas
            const categoriaConSubs = await req.prisma.categoria.findUnique({
                where: { id: categoria.id },
                include: {
                    subcategorias: true
                }
            });

            console.log('✅ [Categoria Create] Respuesta final:', categoriaConSubs);

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
            const data = req.body;

            // Si se intenta cambiar el nombre, verificar que no exista otro con ese nombre
            if (data.nombre) {
                const categoriaExistente = await req.prisma.categoria.findFirst({
                    where: {
                        nombre: data.nombre.trim(),
                        NOT: { id } // Excluir la categoría actual
                    }
                });

                if (categoriaExistente) {
                    return res.status(409).json({
                        success: false,
                        message: `La categoría "${data.nombre}" ya existe`
                    });
                }

                data.nombre = data.nombre.trim();
            }

            const categoria = await req.prisma.categoria.update({
                where: { id },
                data,
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
                    message: 'Una categoría con ese nombre ya existe'
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
