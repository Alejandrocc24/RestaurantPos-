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

      const timezoneOffset = parseInt(req.query.timezoneOffset as string) || 0;

      if (fechaInicio || fechaFin) {
        where.fecha = {};
        if (fechaInicio) {
          // Adjust fechaInicio (YYYY-MM-DD) to UTC based on client's timezoneOffset
          const startUtc = new Date(fechaInicio + 'T00:00:00.000Z');
          where.fecha.gte = new Date(startUtc.getTime() + (timezoneOffset * 60000));
        }
        if (fechaFin) {
          // Adjust fechaFin (YYYY-MM-DD) to UTC based on client's timezoneOffset
          const endUtc = new Date(fechaFin + 'T23:59:59.999Z');
          where.fecha.lte = new Date(endUtc.getTime() + (timezoneOffset * 60000));
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
      // Si la venta está asociada a una mesa, notificar que la mesa cambió (se libera)
      if (mesa_id) {
        SocketService.emitGlobal('mesaActualizada', { id: mesa_id, estado: 'DISPONIBLE' });
      }

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

      // Prisma lanzará P2025 si no existe, ahorrando un round-trip
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
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Venta no encontrada' });
      }
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

      // Prisma lanzará P2025 si no existe, ahorrando un round-trip
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
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Venta no encontrada' });
      }
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
      const timezoneOffset = parseInt(req.query.timezoneOffset as string) || 0;
      const now = new Date(); // Actual UTC now
      
      // Calculate start of today in client's local time, expressed in UTC
      // JS timezone offset is positive for West (e.g., COT -05:00 is +300)
      // clientLocalTime = now - (offset * 60000)
      const clientLocalNow = new Date(now.getTime() - (timezoneOffset * 60000));
      
      // Create a date for the start of the client's local day in UTC
      // we use Year, Month, Day from client perspective
      const year = clientLocalNow.getUTCFullYear();
      const month = clientLocalNow.getUTCMonth();
      const day = clientLocalNow.getUTCDate();
      
      const localStartOfDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      
      // Convert that local start back to absolute UTC
      // AbsoluteUTC = LocalStart + offset
      const hoyStart = new Date(localStartOfDayUTC.getTime() + (timezoneOffset * 60000));
      const mañanaStart = new Date(hoyStart.getTime() + 24 * 60 * 60 * 1000);

      console.log(`🔍 getHoy: Offset=${timezoneOffset}, now=${now.toISOString()}, hoyStart=${hoyStart.toISOString()}, mañanaStart=${mañanaStart.toISOString()}`);

      const ventas = await req.prisma.venta.findMany({
        where: {
          fecha: {
            gte: hoyStart,
            lt: mañanaStart,
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
  /**
   * POST /api/ventas/cobrar
   * Endpoint de alto rendimiento para validar caja, actualizar cantidades y crear venta en una sola llamada de red.
   */
  static async cobrarMesa(req: Request, res: Response) {
    try {
      const { 
        mesa_id, 
        usuario_id, 
        orden_id, 
        total, 
        metodo_pago, 
        productos_json, 
        cantidad_productos, 
        productosActualizados 
      } = req.body;

      if (!req.prisma) {
        return res.status(500).json({ success: false, message: 'Prisma client no inicializado' });
      }

      // 1. Verificación en milisegundos de caja
      const tStart = Date.now();
      const cajaAbierta = await req.prisma.caja.findFirst({
        where: { estado: 'abierta' }
      });

      if (!cajaAbierta) {
        return res.status(400).json({ 
          success: false, 
          error_code: 'CAJA_CERRADA',
          message: 'Debes abrir la caja antes de poder registrar un cobro.' 
        });
      }

      const esCobroTotal = productosActualizados && productosActualizados.length > 0 && productosActualizados.every((p: any) => p.cantidad === 0);

      let ordenData = null;
      let pedidoCerrado = false;
      let productosRestantes = 0;

      // 2. Modificar mesa/orden
      if (esCobroTotal) {
        const result: any[] = await req.prisma.$queryRawUnsafe(
          `SELECT cobrar_orden_total($1) as data`,
          orden_id
        );
        ordenData = result[0]?.data;
        pedidoCerrado = true;
      } else {
        const result: any[] = await req.prisma.$queryRawUnsafe(
          `SELECT actualizar_cantidades_orden($1, $2::jsonb) as data`,
          orden_id,
          JSON.stringify(productosActualizados)
        );
        ordenData = result[0]?.data;
        pedidoCerrado = ordenData?.pedidoCerrado || false;
        productosRestantes = ordenData?.productosRestantes || 0;
      }

      // 3. Crear venta
      const resultVenta: any[] = await req.prisma.$queryRawUnsafe(
        `SELECT crear_venta($1::text, $2::text, $3::text, $4::float8, $5::text, $6::text, $7::timestamp, $8::int, $9::text) as data`,
        mesa_id || null,
        usuario_id,
        orden_id || null,
        parseFloat(total),
        'completada',
        metodo_pago,
        new Date(), // usar fecha en el backend
        parseInt(cantidad_productos) || 0,
        productos_json ? JSON.stringify(productos_json) : null
      );
      
      const ventaData = resultVenta[0]?.data;
      console.log(`✅ [VentaController] Todo el ciclo de cobro completado en ${Date.now() - tStart}ms`);

      // 4. Emitir eventos sincrónicos
      SocketService.emitGlobal('cantidadesOrdenActualizadas', ordenData);
      SocketService.emitGlobal('ventaCreada', ventaData);
      
      if (pedidoCerrado && mesa_id) {
        SocketService.emitGlobal('mesaActualizada', { id: mesa_id, estado: 'DISPONIBLE' });
      }

      // Respuesta rápida y consolidada
      return res.status(200).json({
        success: true,
        message: 'Cuenta cerrada/cobrada exitosamente.',
        pedidoCerrado,
        productosRestantes,
        pedido: ordenData,
        data: ventaData // retornar la venta procesada a nivel componente
      });

    } catch (error: any) {
      console.error('❌ [VentaController.cobrarMesa] Error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
