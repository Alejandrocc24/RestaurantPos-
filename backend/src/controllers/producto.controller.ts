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
          include: { 
            categoria: true
          },
          orderBy: { nombre: 'asc' },
        }),
        req.prisma.producto.count(),
      ]);

      // Parsear comentarios y campos especiales JSON para cada producto
      const productosConComentarios = productos.map((p: any) => ({
        ...p,
        comentarios: p.comentarios ? JSON.parse(p.comentarios) : [],
        gruposModificadores: p.gruposModificadores ? JSON.parse(p.gruposModificadores) : [],
        configuracionGrupos: p.configuracionGrupos ? JSON.parse(p.configuracionGrupos) : []
      }));

      res.json({
        success: true,
        message: 'Productos obtenidos',
        data: productosConComentarios,
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
        include: {
          categoria: true
        },
      });

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado',
        });
      }

      // Parsear comentarios y campos especiales JSON
      const productoConComentarios = {
        ...producto,
        comentarios: producto.comentarios ? JSON.parse(producto.comentarios) : [],
        gruposModificadores: producto.gruposModificadores ? JSON.parse(producto.gruposModificadores) : [],
        configuracionGrupos: producto.configuracionGrupos ? JSON.parse(producto.configuracionGrupos) : []
      };

      res.json({
        success: true,
        message: 'Producto obtenido',
        data: productoConComentarios,
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
      const { nombre, descripcion, precio, categoriaId, imagen, especial, gruposModificadores, configuracionGrupos, comentarios } = req.body;

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
          especial: especial || false,
          gruposModificadores: gruposModificadores ? JSON.stringify(gruposModificadores) : '[]',
          configuracionGrupos: configuracionGrupos ? JSON.stringify(configuracionGrupos) : '[]',
          comentarios: comentarios ? JSON.stringify(comentarios) : '[]',
        },
        include: { categoria: true },
      });

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: {
          ...producto,
          comentarios: producto.comentarios ? JSON.parse(producto.comentarios) : [],
          gruposModificadores: producto.gruposModificadores ? JSON.parse(producto.gruposModificadores) : [],
          configuracionGrupos: producto.configuracionGrupos ? JSON.parse(producto.configuracionGrupos) : []
        },
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
        especial,
        gruposModificadores,
        configuracionGrupos,
        comentarios
      } = req.body;

      console.log('📦 Valores a guardar:');
      console.log('   gruposModificadores:', gruposModificadores);
      console.log('   configuracionGrupos:', configuracionGrupos);
      console.log('   comentarios:', comentarios);

      const producto = await req.prisma.producto.update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(descripcion && { descripcion }),
          ...(precio && { precio: parseFloat(precio) }),
          // Usar la syntaxis de relación para categoriaId
          ...(categoriaId && { categoria: { connect: { id: categoriaId } } }),
          ...(subcategoria && { subcategoria }),
          ...(activo !== undefined && { activo }),
          ...(imagen && { imagen }),
          ...(especial !== undefined && { especial }),
          ...(gruposModificadores !== undefined && { gruposModificadores: JSON.stringify(gruposModificadores) }),
          ...(configuracionGrupos !== undefined && { configuracionGrupos: JSON.stringify(configuracionGrupos) }),
          ...(comentarios !== undefined && { comentarios: JSON.stringify(comentarios) }),
        },
        include: { 
          categoria: true,
        },
      });

      console.log('✅ Producto guardado:');
      console.log('   gruposModificadores (raw):', producto.gruposModificadores);
      console.log('   configuracionGrupos (raw):', producto.configuracionGrupos);
      console.log('   comentarios (raw):', producto.comentarios);

      res.json({
        success: true,
        message: 'Producto actualizado',
        data: {
          ...producto,
          comentarios: producto.comentarios ? JSON.parse(producto.comentarios) : [],
          gruposModificadores: producto.gruposModificadores ? JSON.parse(producto.gruposModificadores) : [],
          configuracionGrupos: producto.configuracionGrupos ? JSON.parse(producto.configuracionGrupos) : []
        },
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
   * Eliminar un producto (soft delete) y limpiar referencias
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Primero, desconectar el producto de todos los grupos modificadores
      await req.prisma.grupoModificador.updateMany({
        where: {
          productos: {
            some: { id }
          }
        },
        data: {
          productos: {
            disconnect: { id }
          }
        }
      });

      // Luego marcar el producto como inactivo
      await req.prisma.producto.update({
        where: { id },
        data: { activo: false },
      });

      res.json({
        success: true,
        message: 'Producto eliminado y referencias limpias',
      });
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
