import { Request, Response } from 'express';
import { SocketService } from '../services/socket.service.js';

export class VentaController {
  /**
   * GET /api/ventas
   * Listar todas las ventas con paginación
   */
  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      let take: number | undefined = parseInt(req.query.take as string) || 50;
      const fechaInicio = req.query.fechaInicio as string;
      const fechaFin = req.query.fechaFin as string;

      const where: any = {};

      if (fechaInicio || fechaFin) {
        where.fecha = {};
        if (fechaInicio) {
          where.fecha.gte = new Date(fechaInicio + 'T00:00:00.000Z');
        }
        if (fechaFin) {
          where.fecha.lte = new Date(fechaFin + 'T23:59:59.999Z');
        }
        // Si hay un rango de fechas explícito, removemos el límite implícito
        take = parseInt(req.query.take as string) || undefined;
      }

      const ventas = await req.prisma.venta.findMany({
        skip,
        ...(take !== undefined ? { take } : {}),
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          mesa: { select: { id: true, numero: true } },
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
          mesa: { select: { id: true, numero: true } },
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
        cantidad_productos,
        productos_json,
      } = req.body;

      console.log('📥 [VentaController.create] Payload recibido:', {
        mesa_id, usuario_id, orden_id, total, estado, metodo_pago, fecha, cantidad_productos
      });

      // Validar campos requeridos
      if (!usuario_id || total === undefined || !metodo_pago) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: usuario_id, total, metodo_pago',
        });
      }

      if (!req.prisma) {
        return res.status(500).json({
          success: false,
          message: 'Prisma client no inicializado',
        });
      }

      const t0 = Date.now();

      // UN SOLO viaje de red al servidor PostgreSQL (casts explícitos para evitar mismatch de tipos)
      const result: any[] = await req.prisma.$queryRawUnsafe(
        `SELECT crear_venta($1::text, $2::text, $3::text, $4::float8, $5::text, $6::text, $7::timestamp, $8::int, $9::text) as data`,
        mesa_id || null,
        usuario_id,
        orden_id || null,
        parseFloat(total),
        estado,
        metodo_pago,
        fecha ? new Date(fecha) : new Date(),
        parseInt(cantidad_productos) || 0,
        productos_json ? JSON.stringify(productos_json) : null
      );

      const venta = result[0]?.data;
      console.log(`✅ [SP] Venta creada en ${Date.now() - t0}ms:`, venta?.id);

      SocketService.emitGlobal('ventaCreada', venta);

      res.status(201).json({
        success: true,
        message: 'Venta creada exitosamente',
        data: [venta],
      });
    } catch (error: any) {
      console.error('❌ [VentaController.create] Error:', error.message);
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

      SocketService.emitGlobal('ventaActualizada', venta);

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

      SocketService.emitGlobal('ventaEliminada', { id });

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
          mesa: { select: { id: true, numero: true } },
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
