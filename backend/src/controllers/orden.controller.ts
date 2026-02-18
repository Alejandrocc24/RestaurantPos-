import { Request, Response } from 'express';

export class OrdenController {
  /**
   * GET /api/ordenes
   * Listar todas las órdenes con paginación
   */
  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;

      const ordenes = await req.prisma.orden.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          productos: {
            include: { producto: true },
          },
          pagos: true,
        },
      });

      res.json({
        success: true,
        message: 'Órdenes obtenidas',
        data: ordenes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/ordenes/:id
   * Obtener una orden por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const orden = await req.prisma.orden.findUnique({
        where: { id },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          productos: {
            include: { producto: true },
          },
          pagos: true,
        },
      });

      if (!orden) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Orden obtenida',
        data: orden,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/ordenes/mesa/:mesaId
   * Obtener órdenes de una mesa específica
   */
  static async getByMesa(req: Request, res: Response) {
    try {
      const { mesaId } = req.params;

      const ordenes = await req.prisma.orden.findMany({
        where: { mesaId },
        orderBy: { createdAt: 'desc' },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          productos: {
            include: { producto: true },
          },
          pagos: true,
        },
      });

      res.json({
        success: true,
        message: 'Órdenes de la mesa obtenidas',
        data: ordenes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/ordenes
   * Crear una nueva orden
   */
  static async create(req: Request, res: Response) {
    try {
      const { mesaId, usuarioId, productos } = req.body;

      // Validaciones básicas
      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'usuarioId es requerido',
        });
      }

      // Crear la orden
      const orden = await req.prisma.orden.create({
        data: {
          mesaId: mesaId || null,
          usuarioId,
          estado: 'PENDIENTE',
          total: 0,
          // Los productos se agregarán después
        },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          productos: {
            include: { producto: true },
          },
          pagos: true,
        },
      });

      // Si hay productos, agregarlos a la orden
      if (productos && Array.isArray(productos)) {
        for (const prod of productos) {
          await req.prisma.ordenProducto.create({
            data: {
              ordenId: orden.id,
              productoId: prod.productoId,
              cantidad: prod.cantidad || 1,
              precioUnitario: prod.precioUnitario || 0,
              subtotal: (prod.cantidad || 1) * (prod.precioUnitario || 0),
              notas: prod.notas || null,
            },
          });
        }

        // Recalcular el total de la orden
        const ordenConfig = await req.prisma.ordenProducto.findMany({
          where: { ordenId: orden.id },
        });

        const total = ordenConfig.reduce((acc: number, op: any) => acc + op.subtotal, 0);
        await req.prisma.orden.update({
          where: { id: orden.id },
          data: { total },
        });
      }

      // Obtener la orden completa actualizada
      const ordenActualizada = await req.prisma.orden.findUnique({
        where: { id: orden.id },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          productos: {
            include: { producto: true },
          },
          pagos: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Orden creada',
        data: ordenActualizada,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PATCH /api/ordenes/:id
   * Actualizar una orden
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado, descuento, propina } = req.body;

      const estadosValidos = ['PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'PAGADA'];
      if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
        });
      }

      const orden = await req.prisma.orden.update({
        where: { id },
        data: {
          ...(estado && { estado }),
          ...(descuento !== undefined && { descuento }),
          ...(propina !== undefined && { propina }),
        },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          productos: {
            include: { producto: true },
          },
          pagos: true,
        },
      });

      res.json({
        success: true,
        message: 'Orden actualizada',
        data: orden,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/ordenes/:id
   * Eliminar una orden
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await req.prisma.orden.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Orden eliminada',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
