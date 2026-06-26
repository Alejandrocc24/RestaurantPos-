import { Request, Response } from 'express';
import { SocketService } from '../services/socket.service.js';

export class OrdenController {
  /**
   * GET /api/ordenes
   * Listar todas las órdenes con paginación
   */
  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;
      const soloActivos = req.query.soloActivos === 'true';

      const where: any = {};

      if (soloActivos) {
        where.visibleCocina = true;
        where.estado = { in: ['PENDIENTE', 'EN_CURSO', 'COMPLETADA'] };
      }

      const ordenes = await req.prisma.orden.findMany({
        skip,
        take,
        where,
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
   * GET /api/ordenes/mesa/:mesaId/activa
   * Obtener la orden activa (PENDIENTE) de una mesa
   */
  static async getActiveForMesa(req: Request, res: Response) {
    try {
      const { mesaId } = req.params;

      console.log(`🚀 [SP] obtener_orden_activa_mesa ${mesaId}`);
      const t0 = Date.now();

      const result: any[] = await req.prisma.$queryRawUnsafe(
        `SELECT obtener_orden_activa_mesa($1::text) as data`,
        mesaId
      );

      const orden = result[0]?.data;
      console.log(`✅ [SP] Orden activa obtenida en ${Date.now() - t0}ms`);

      if (!orden) {
        return res.status(200).json({
          success: true,
          message: 'No hay orden activa para esta mesa',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Orden activa obtenida',
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

      const t0 = Date.now();

      // Todo en una sola transacción interactiva (1 round-trip)
      const ordenActualizada = await req.prisma.$transaction(async (tx: any) => {
        // Crear la orden
        const orden = await tx.orden.create({
          data: {
            mesaId: mesaId || null,
            usuarioId,
            estado: 'PENDIENTE',
            total: 0,
          },
        });

        // Si hay productos, agregarlos y calcular total
        if (productos && Array.isArray(productos) && productos.length > 0) {
          const productosData = productos.map((prod: any) => ({
            ordenId: orden.id,
            productoId: prod.productoId,
            cantidad: prod.cantidad || 1,
            precioUnitario: prod.precioUnitario || 0,
            subtotal: (prod.cantidad || 1) * (prod.precioUnitario || 0),
            notas: prod.notas || null,
          }));

          await tx.ordenProducto.createMany({ data: productosData });

          const total = productosData.reduce((acc: number, op: any) => acc + op.subtotal, 0);
          await tx.orden.update({
            where: { id: orden.id },
            data: { total },
          });
        }

        // Obtener la orden completa
        return tx.orden.findUnique({
          where: { id: orden.id },
          include: {
            mesa: true,
            usuario: { select: { id: true, nombre: true, email: true } },
            productos: { include: { producto: true } },
            pagos: true,
          },
        });
      });

      console.log(`✅ Orden creada en ${Date.now() - t0}ms`);

      SocketService.emitGlobal('ordenCreada', ordenActualizada);

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

      // Si la cocina marca la orden como COMPLETADA, marcar todos sus productos activos como COMPLETADA
      // y actualizar la orden en una sola transacción
      const orden = await req.prisma.$transaction(async (tx: any) => {
        if (estado === 'COMPLETADA') {
          await tx.ordenProducto.updateMany({
            where: { ordenId: id, estado: { notIn: ['COMPLETADA', 'completado'] } },
            data: { estado: 'COMPLETADA' },
          });
        }

        return tx.orden.update({
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
      });

      SocketService.emitGlobal('ordenActualizada', orden);

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
   * PATCH /api/ordenes/:ordenId/item/:itemId/estado
   * Actualiza el estado de un producto específico en una orden
   */
  static async updateItemEstado(req: Request, res: Response) {
    try {
      const { ordenId, itemId } = req.params;
      const { estado } = req.body;

      const orden = await req.prisma.$transaction(async (tx: any) => {
        await tx.ordenProducto.update({
          where: { id: itemId },
          data: { estado }
        });

        // Verificar si todos los productos están completados
        const productosTotales = await tx.ordenProducto.count({
          where: { ordenId }
        });
        
        const productosCompletados = await tx.ordenProducto.count({
          where: { 
            ordenId, 
            estado: { in: ['COMPLETADA', 'completado', 'COMPLETADO'] } 
          }
        });

        // Si todos los productos están completados, completar la orden automáticamente
        if (productosTotales > 0 && productosTotales === productosCompletados) {
          await tx.orden.update({
            where: { id: ordenId },
            data: { estado: 'COMPLETADA' }
          });
        } else if (estado === 'EN_CURSO' || estado === 'EN_PROGRESO') {
          // Si al menos un producto está en curso, la orden está en curso
          await tx.orden.update({
            where: { id: ordenId },
            data: { estado: 'EN_CURSO' }
          });
        }

        return tx.orden.findUnique({
          where: { id: ordenId },
          include: {
            mesa: true,
            usuario: { select: { id: true, nombre: true, email: true } },
            productos: { include: { producto: true } },
            pagos: true,
          },
        });
      });

      SocketService.emitGlobal('ordenActualizada', orden);

      res.json({
        success: true,
        message: 'Estado de producto actualizado',
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

      SocketService.emitGlobal('ordenEliminada', { id });

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

  static async createForMesa(req: Request, res: Response) {
    try {
      const { mesaId } = req.params;
      const { notas, items } = req.body;
      const usuarioId = req.userId;

      if (!usuarioId) {
        return res.status(400).json({ success: false, message: 'usuarioId no encontrado en el token' });
      }
      if (!mesaId) {
        return res.status(400).json({ success: false, message: 'mesaId es requerido' });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'items es requerido y debe ser un array' });
      }

      console.log(`🚀 [SP] crear_orden_mesa para mesa ${mesaId} con ${items.length} item(s)`);
      const t0 = Date.now();

      // UN SOLO viaje de red al servidor PostgreSQL
      const result: any[] = await req.prisma.$queryRawUnsafe(
        `SELECT crear_orden_mesa($1::text, $2::text, $3::text, $4::jsonb) as data`,
        mesaId,
        usuarioId,
        notas || null,
        JSON.stringify(items)
      );

      const ordenActualizada = result[0]?.data;
      console.log(`✅ [SP] Orden procesada en ${Date.now() - t0}ms. Total: ${ordenActualizada?.total}`);

      // Emitir evento de orden actualizada (para cocina y productos de mesa)
      SocketService.emitGlobal('ordenMesaActualizada', ordenActualizada);
      // También emitir mesaActualizada porque el SP cambia el estado de la mesa a OCUPADA
      SocketService.emitGlobal('mesaActualizada', { id: mesaId, estado: 'OCUPADA' });

      res.json({
        success: true,
        message: 'Orden creada/actualizada exitosamente',
        data: ordenActualizada,
      });
    } catch (error: any) {
      console.error('Error creando orden para mesa:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear la orden',
      });
    }
  }

  /**
   * PATCH /api/ordenes/:ordenId/cantidades
   * Actualizar cantidades de productos en una orden (para cierre de cuenta)
   */
  static async updateCantidades(req: Request, res: Response) {
    try {
      const { ordenId } = req.params;
      const { productos } = req.body;

      if (!ordenId) {
        return res.status(400).json({ success: false, message: 'ordenId es requerido' });
      }
      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ success: false, message: 'productos es requerido y debe ser un array' });
      }

      const esCobro = req.query.esCobro === 'true';
      const todosCero = productos.length > 0 && productos.every((p: any) => p.cantidad === 0);

      console.log(`🚀 [SP] updateCantidades orden ${ordenId} | esCobro=${esCobro} todosCero=${todosCero}`);
      const t0 = Date.now();

      if (esCobro && todosCero) {
        // COBRO TOTAL: UN SOLO viaje de red
        const result: any[] = await req.prisma.$queryRawUnsafe(
          `SELECT cobrar_orden_total($1::text) as data`,
          ordenId
        );

        const ordenActualizada = result[0]?.data;
        console.log(`✅ [SP] Cobro total en ${Date.now() - t0}ms`);

        SocketService.emitGlobal('cantidadesOrdenActualizadas', ordenActualizada);

        return res.json({
          success: true,
          message: 'Cobro total procesado, comanda preservada en cocina',
          data: ordenActualizada,
          pedidoCerrado: true,
          productosRestantes: 0,
          pedido: ordenActualizada,
        });
      }

      // COBRO PARCIAL o edición: UN SOLO viaje de red
      const result: any[] = await req.prisma.$queryRawUnsafe(
        `SELECT actualizar_cantidades_orden($1::text, $2::jsonb) as data`,
        ordenId,
        JSON.stringify(productos)
      );

      const data = result[0]?.data;
      console.log(`✅ [SP] Cantidades actualizadas en ${Date.now() - t0}ms`);

      SocketService.emitGlobal('cantidadesOrdenActualizadas', data);

      res.json({
        success: true,
        message: 'Cantidades actualizadas exitosamente',
        data: data,
        pedidoCerrado: data?.pedidoCerrado || false,
        productosRestantes: data?.productosRestantes || 0,
        pedido: data,
      });
    } catch (error: any) {
      console.error('Error actualizando cantidades:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar cantidades',
      });
    }
  }

  /**
   * POST /api/ordenes/ocultar-cocina
   * Ocultar órdenes completadas de la pantalla de cocina
   */
  static async ocultarPedidosCocina(req: Request, res: Response) {
    try {
      const { ids } = req.body; // Array de {id} o ids

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un arreglo de IDs',
        });
      }

      await req.prisma.orden.updateMany({
        where: { id: { in: ids } },
        data: { visibleCocina: false },
      });

      SocketService.emitGlobal('ordenesOcultadas', { ids });

      res.json({
        success: true,
        message: 'Órdenes ocultadas de cocina',
      });
    } catch (error: any) {
      console.error('Error ocultando órdenes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al ocultar órdenes',
      });
    }
  }

  /**
   * POST /api/ordenes/transferir
   * Transferir productos de una mesa a otra
   */
  static async transferirProductos(req: Request, res: Response) {
    try {
      const { mesaOrigenId, mesaDestinoId, productos } = req.body;
      const usuarioId = req.userId;

      if (!mesaOrigenId || !mesaDestinoId || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'mesaOrigenId, mesaDestinoId y productos son requeridos',
        });
      }

      if (!usuarioId) {
        return res.status(400).json({ success: false, message: 'usuarioId no encontrado en el token' });
      }

      const detalleIds = productos.map((p: any) => p.detalleId).filter(Boolean);

      console.log(`🔄 [SP] Transfiriendo ${detalleIds.length} producto(s) de mesa ${mesaOrigenId} a mesa ${mesaDestinoId}`);
      const t0 = Date.now();

      const result: any[] = await req.prisma.$queryRawUnsafe(
        `SELECT transferir_productos_mesa($1::text, $2::text, $3::text, $4::jsonb) as data`,
        mesaOrigenId,
        mesaDestinoId,
        usuarioId,
        JSON.stringify(detalleIds)
      );

      const data = result[0]?.data;
      console.log(`✅ [SP] Transferencia completada en ${Date.now() - t0}ms`);

      SocketService.emitGlobal('ordenMesaActualizada', { mesaOrigenId, mesaDestinoId });
      // Both tables may have changed state (origin freed, destination occupied)
      SocketService.emitGlobal('mesaActualizada', { id: mesaOrigenId });
      SocketService.emitGlobal('mesaActualizada', { id: mesaDestinoId });

      res.json({
        success: true,
        message: 'Productos transferidos exitosamente',
        data,
      });
    } catch (error: any) {
      console.error('Error transfiriendo productos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al transferir productos',
      });
    }
  }
}

