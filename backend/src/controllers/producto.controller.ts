import { Request, Response } from 'express';

export class ProductoController {
  /**
   * GET /api/productos
   * Listar todos los productos con paginación
   */
  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;

      const [productos, total] = await Promise.all([
        req.prisma.producto.findMany({
          skip,
          take,
          include: { categoria: true },
          orderBy: { nombre: 'asc' },
        }),
        req.prisma.producto.count(),
      ]);

      res.json({
        success: true,
        message: 'Productos obtenidos',
        data: productos,
        pagination: { skip, take, total },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/productos/:id
   * Obtener un producto por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const producto = await req.prisma.producto.findUnique({
        where: { id },
        include: { categoria: true },
      });

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Producto obtenido',
        data: producto,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/productos
   * Crear nuevo producto
   */
  static async create(req: Request, res: Response) {
    try {
      const { nombre, descripcion, precio, categoriaId, imagen } = req.body;

      if (!nombre || !precio || !categoriaId) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, precio y categoriaId son requeridos',
        });
      }

      const producto = await req.prisma.producto.create({
        data: {
          nombre,
          descripcion,
          precio: parseFloat(precio),
          categoriaId,
          imagen,
        },
        include: { categoria: true },
      });

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: producto,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/productos/:id
   * Actualizar un producto
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log('🔧 [ProductoController.update] Intentando actualizar producto:', id);
      console.log('   Body recibido:', req.body);
      const { 
        nombre, 
        descripcion, 
        precio, 
        categoriaId, 
        subcategoria,
        activo, 
        imagen,
        gruposModificadores = []
      } = req.body;

      const producto = await req.prisma.producto.update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(descripcion && { descripcion }),
          ...(precio && { precio: parseFloat(precio) }),
          // Usar la syntaxis de relación para categoriaId
          ...(categoriaId && { categoria: { connect: { id: categoriaId } } }),
          ...(subcategoria !== undefined && { subcategoria: subcategoria || null }),
          ...(activo !== undefined && { activo }),
          ...(imagen && { imagen }),
          // Manejar grupos modificadores si se proporciona el array
          ...(gruposModificadores && gruposModificadores.length > 0 && {
            modificadores: {
              set: gruposModificadores.map((id: string) => ({ id }))
            }
          }),
        },
        include: { 
          categoria: true,
          modificadores: true,
        },
      });

      res.json({
        success: true,
        message: 'Producto actualizado',
        data: producto,
      });
    } catch (error: any) {
      console.error('❌ Error actualizando producto:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/productos/:id
   * Eliminar un producto (soft delete)
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await req.prisma.producto.update({
        where: { id },
        data: { activo: false },
      });

      res.json({
        success: true,
        message: 'Producto eliminado',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
