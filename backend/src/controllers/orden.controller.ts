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
   * GET /api/ordenes/mesa/:mesaId/activa
   * Obtener la orden activa (PENDIENTE) de una mesa
   */
  static async getActiveForMesa(req: Request, res: Response) {
    try {
      const { mesaId } = req.params;

      // Buscar la orden activa (que no esté CANCELADA, PAGADA o COMPLETADA)
      const orden = await req.prisma.orden.findFirst({
        where: {
          mesaId,
          estado: {
            in: ['PENDIENTE', 'EN_CURSO']
          }
        },
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

  static async createForMesa(req: Request, res: Response) {
    try {
      const { mesaId } = req.params;
      const { notas, items } = req.body;
      const usuarioId = req.userId; // Obtener del token autenticado

      // Validaciones básicas
      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'usuarioId no encontrado en el token',
        });
      }

      if (!mesaId) {
        return res.status(400).json({
          success: false,
          message: 'mesaId es requerido',
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'items es requerido y debe ser un array',
        });
      }

      // Buscar si ya existe una orden activa para esta mesa
      let orden = await req.prisma.orden.findFirst({
        where: {
          mesaId,
          estado: {
            in: ['PENDIENTE', 'EN_CURSO']
          }
        },
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

      // Si no existe orden activa, crear una nueva
      if (!orden) {
        console.log(`📝 Creando nueva orden para mesa ${mesaId}`);
        orden = await req.prisma.orden.create({
          data: {
            mesaId,
            usuarioId: usuarioId as string,
            estado: 'PENDIENTE',
            total: 0,
            notas: notas || null,
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
      } else {
        console.log(`🔄 Usando orden activa existente para mesa ${mesaId}: ${orden.id}`);
        // Actualizar notas si se proporcionan
        if (notas !== null && notas !== undefined) {
          orden = await req.prisma.orden.update({
            where: { id: orden.id },
            data: { notas },
            include: {
              mesa: true,
              usuario: { select: { id: true, nombre: true, email: true } },
              productos: {
                include: { producto: true },
              },
              pagos: true,
            },
          });
        }
      }

      // Agregar nuevos productos a la orden (existente o recién creada)
      console.log(`➕ Agregando ${items.length} producto(s) a orden ${orden.id}`);
      let totalAdelante = orden.total || 0;
      
      for (const item of items) {
        const ordenProducto = await req.prisma.ordenProducto.create({
          data: {
            ordenId: orden.id,
            productoId: item.productoId,
            cantidad: item.cantidad || 1,
            precioUnitario: item.precioUnitario || 0,
            subtotal: (item.cantidad || 1) * (item.precioUnitario || 0),
            notas: item.notas || null,
            comentario: item.comentario || null,
          },
        });
        totalAdelante += ordenProducto.subtotal;
        console.log(`  ✅ Producto agregado: ${item.productoId} x${item.cantidad}`);
      }

      // Actualizar total de la orden con los nuevos productos
      const ordenActualizada = await req.prisma.orden.update({
        where: { id: orden.id },
        data: { total: totalAdelante },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          productos: {
            include: { producto: true },
          },
          pagos: true,
        },
      });

      console.log(`✅ Orden actualizada. Total: ${totalAdelante}, Productos: ${ordenActualizada.productos?.length || 0}`);

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
      const { productos } = req.body; // Array de {productoId, cantidad, ...}

      if (!ordenId) {
        return res.status(400).json({
          success: false,
          message: 'ordenId es requerido',
        });
      }

      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'productos es requerido y debe ser un array',
        });
      }

      console.log(`📝 Actualizando cantidades para orden ${ordenId}`);
      console.log(`   Productos: ${productos.length}`);

      // Actualizar cada producto
      let totalOrden = 0;
      for (const item of productos) {
        const { productoId, cantidad, precioUnitario } = item;

        if (!productoId || cantidad === undefined) {
          console.warn(`⚠️ Producto sin ID o cantidad: ${JSON.stringify(item)}`);
          continue;
        }

        const subtotal = cantidad * (precioUnitario || 0);

        // Actualizar cantidad
        await req.prisma.ordenProducto.updateMany({
          where: {
            ordenId,
            productoId,
          },
          data: {
            cantidad,
            subtotal,
          },
        });

        totalOrden += subtotal;
        console.log(`  ✅ Actualizado: ${productoId} -> cantidad: ${cantidad}, subtotal: ${subtotal}`);
      }

      // Eliminar productos con cantidad = 0
      await req.prisma.ordenProducto.deleteMany({
        where: {
          ordenId,
          cantidad: 0,
        },
      });

      // Actualizar total de la orden
      const ordenActualizada = await req.prisma.orden.update({
        where: { id: ordenId },
        data: { total: totalOrden },
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          productos: {
            include: { producto: true },
          },
          pagos: true,
        },
      });

      console.log(`✅ Orden ${ordenId} actualizada. Total: ${totalOrden}, Productos restantes: ${ordenActualizada.productos?.length || 0}`);

      res.json({
        success: true,
        message: 'Cantidades actualizadas exitosamente',
        data: ordenActualizada,
        pedidoCerrado: (ordenActualizada.productos?.length || 0) === 0,
        productosRestantes: ordenActualizada.productos?.length || 0,
        pedido: ordenActualizada,
      });
    } catch (error: any) {
      console.error('Error actualizando cantidades:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar cantidades',
      });
    }
  }
}

