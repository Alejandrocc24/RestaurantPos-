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

            // Crear categoría padre
            const categoria = await req.prisma.categoria.create({
                data: {
                    nombre,
                    descripcion,
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
                                        nombre: `${subNombre}`,
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
            res.status(400).json({
                success: false,
                message: error.message,
                error: error.toString()
            });
        }
    }

    static async updateCategoria(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;

            const categoria = await req.prisma.categoria.update({
                where: { id },
                data
            });

            res.json({
                success: true,
                data: categoria
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async deleteCategoria(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Soft delete
            await req.prisma.categoria.update({
                where: { id },
                data: { activo: false }
            });

            res.json({
                success: true,
                message: 'Categoría eliminada correctamente'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
