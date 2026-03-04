import { Request, Response } from 'express';

export class VentaController {
  /**
   * GET /api/ventas
   * Listar todas las ventas con paginación
   */
  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;

      const ventas = await req.prisma.venta.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
        },
      });

      res.json({
        success: true,
        message: 'Ventas obtenidas',
        data: ventas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/ventas/:id
   * Obtener una venta por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const venta = await req.prisma.venta.findUnique({
        where: { id },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
        },
      });

      if (!venta) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Venta obtenida',
        data: venta,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/ventas
   * Crear una nueva venta
   */
  static async create(req: Request, res: Response) {
    try {
      const {
        mesa_id,
        usuario_id,
        orden_id,
        total,
        estado = 'completada',
        metodo_pago,
        fecha,
      } = req.body;

      console.log('📥 [VentaController.create] Payload recibido:', {
        mesa_id,
        usuario_id,
        orden_id,
        total,
        estado,
        metodo_pago,
        fecha
      });

      // Validar campos requeridos
      if (!usuario_id || total === undefined || !metodo_pago) {
        console.warn('⚠️ [VentaController.create] Validación fallida: faltan campos requeridos');
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: usuario_id, total, metodo_pago',
        });
      }

      // DEBUG: Verificar req.prisma
      console.log('🔍 [VentaController.create] req.prisma existe?', !!req.prisma, typeof req.prisma);
      if (!req.prisma) {
        console.error('❌ [VentaController.create] req.prisma es undefined!');
        console.error('    req keys:', Object.keys(req).filter(k => !k.startsWith('_')).slice(0, 20));
        return res.status(500).json({
          success: false,
          message: 'Prisma client no inicializado',
        });
      }

      // Crear la venta
      const venta = await req.prisma.venta.create({
        data: {
          mesaId: mesa_id || null,
          usuarioId: usuario_id,
          ordenId: orden_id || null,
          total: parseFloat(total),
          estado,
          metodoPago: metodo_pago,
          fecha: fecha ? new Date(fecha) : new Date(),
        },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
        },
      });

      console.log('✅ [VentaController.create] Venta creada exitosamente:', venta.id);

      res.status(201).json({
        success: true,
        message: 'Venta creada exitosamente',
        data: [venta],
      });
    } catch (error: any) {
      console.error('❌ [VentaController.create] Error:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear venta',
      });
    }
  }

  /**
   * PUT /api/ventas/:id
   * Actualizar una venta
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { mesa_id, usuario_id, orden_id, total, estado, metodo_pago, fecha } =
        req.body;

      // Verificar que la venta existe
      const ventaExistente = await req.prisma.venta.findUnique({
        where: { id },
      });

      if (!ventaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada',
        });
      }

      const venta = await req.prisma.venta.update({
        where: { id },
        data: {
          ...(mesa_id !== undefined && { mesaId: mesa_id }),
          ...(usuario_id && { usuarioId: usuario_id }),
          ...(orden_id !== undefined && { ordenId: orden_id }),
          ...(total !== undefined && { total: parseFloat(total) }),
          ...(estado && { estado }),
          ...(metodo_pago && { metodoPago: metodo_pago }),
          ...(fecha && { fecha: new Date(fecha) }),
        },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
        },
      });

      res.json({
        success: true,
        message: 'Venta actualizada',
        data: venta,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/ventas/:id
   * Eliminar una venta
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar que la venta existe
      const ventaExistente = await req.prisma.venta.findUnique({
        where: { id },
      });

      if (!ventaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada',
        });
      }

      await req.prisma.venta.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Venta eliminada',
        data: null,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/ventas/hoy
   * Obtener ventas del día
   */
  static async getHoy(req: Request, res: Response) {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const ventas = await req.prisma.venta.findMany({
        where: {
          fecha: {
            gte: hoy,
            lt: mañana,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
        },
      });

      const totalVentas = ventas.reduce((sum: number, v: any) => sum + v.total, 0);

      res.json({
        success: true,
        message: 'Ventas del día obtenidas',
        data: ventas,
        total: totalVentas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
