import { Request, Response } from 'express';

// Función auxiliar para convertir string de fecha (YYYY-MM-DD) a Date en zona horaria local
function parseFechaLocal(fechaString?: string): Date {
  if (!fechaString) {
    // Si no hay fecha, retornar hoy en hora local
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  }

  // Si viene como string YYYY-MM-DD, parsear directamente sin UTC
  const [year, month, day] = fechaString.split('-').map(x => parseInt(x, 10));
  return new Date(year, month - 1, day);
}

export class GastoController {
  /**
   * GET /api/gastos
   * Listar gastos con filtros
   */
  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;
      const { categoriaId, fechaInicio, fechaFin } = req.query;

      // Construir filtro de fecha
      const where: any = { activo: true };
      if (fechaInicio || fechaFin) {
        where.fecha = {};
        if (fechaInicio) {
          // Convertir string YYYY-MM-DD a Date sin asumir UTC
          const [year, month, day] = (fechaInicio as string).split('-').map(x => parseInt(x, 10));
          const inicioDate = new Date(year, month - 1, day);
          where.fecha.gte = inicioDate;
        }
        if (fechaFin) {
          // Convertir string YYYY-MM-DD a Date sin asumir UTC, y sumar un día completo
          const [year, month, day] = (fechaFin as string).split('-').map(x => parseInt(x, 10));
          const finDate = new Date(year, month - 1, day, 23, 59, 59, 999);
          where.fecha.lte = finDate;
        }
      }
      if (categoriaId) where.categoriaId = categoriaId;

      const [gastos, total] = await Promise.all([
        req.prisma.gasto.findMany({
          where,
          skip,
          take,
          include: {
            categoria: true,
            usuario: { select: { id: true, nombre: true } },
            proveedor: { select: { id: true, nombre: true } },
          },
          orderBy: { fecha: 'desc' },
        }),
        req.prisma.gasto.count({ where }),
      ]);

      // Formatear respuesta para que categoría y proveedor sean strings
      const gastosFormateados = gastos.map((g: any) => ({
        ...g,
        categoria: g.categoria?.nombre || '',
        proveedor: g.proveedor?.nombre || g.proveedorPersonalizado || '',
      }));

      res.json({
        success: true,
        message: 'Gastos obtenidos',
        data: gastosFormateados,
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
   * POST /api/gastos
   * Crear nuevo gasto
   */
  static async create(req: Request, res: Response) {
    try {
      const { descripcion, monto, categoriaId, fecha, recibo, observaciones, salio_de_caja, proveedor, proveedor_personalizado } = req.body;

      if (!descripcion || !monto || !categoriaId) {
        return res.status(400).json({
          success: false,
          message: 'Descripción, monto y categoriaId son requeridos',
        });
      }

      console.log('📝 [GastoController.create] req.userId:', req.userId);

      // Procesar proveedor
      let proveedorId: string | null = null;
      let proveedorPersonalizado: string | null = null;

      if (proveedor_personalizado) {
        // Si es un proveedor personalizado
        proveedorPersonalizado = proveedor_personalizado;
      } else if (proveedor) {
        // Si es un proveedor de la BD, buscar su ID
        const proveedorEncontrado = await req.prisma.proveedor.findUnique({
          where: { nombre: proveedor },
        });
        if (proveedorEncontrado) {
          proveedorId = proveedorEncontrado.id;
        }
      }

      const gasto = await req.prisma.gasto.create({
        data: {
          descripcion,
          monto: parseFloat(monto),
          categoriaId,
          usuarioId: req.userId!,
          proveedorId,
          proveedorPersonalizado,
          recibo,
          observaciones,
          salio_de_caja: salio_de_caja !== undefined ? Boolean(salio_de_caja) : true,
          fecha: parseFechaLocal(fecha),
        },
        include: {
          categoria: true,
          usuario: { select: { id: true, nombre: true } },
          proveedor: { select: { id: true, nombre: true } },
        },
      });

      // Formatear respuesta para que categoría y proveedor sean strings
      const gastoFormateado = {
        ...gasto,
        categoria: gasto.categoria?.nombre || '',
        proveedor: gasto.proveedor?.nombre || gasto.proveedorPersonalizado || '',
      };

      res.status(201).json({
        success: true,
        message: 'Gasto creado exitosamente',
        data: gastoFormateado,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/gastos/:id
   * Obtener un gasto por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const gasto = await req.prisma.gasto.findUnique({
        where: { id },
        include: {
          categoria: true,
          usuario: { select: { id: true, nombre: true } },
          proveedor: { select: { id: true, nombre: true } },
        },
      });

      if (!gasto) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado',
        });
      }

      // Formatear respuesta para que categoría y proveedor sean strings
      const gastoFormateado = {
        ...gasto,
        categoria: gasto.categoria?.nombre || '',
        proveedor: gasto.proveedor?.nombre || gasto.proveedorPersonalizado || '',
      };

      res.json({
        success: true,
        message: 'Gasto obtenido',
        data: gastoFormateado,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PATCH /api/gastos/:id
   * Actualizar un gasto
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { descripcion, monto, categoriaId, fecha, recibo, observaciones, salio_de_caja, proveedor, proveedor_personalizado } = req.body;

      // Verificar que el gasto existe
      const gastoExistente = await req.prisma.gasto.findUnique({
        where: { id },
      });

      if (!gastoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado',
        });
      }

      // Procesar proveedor
      let proveedorId: string | null = gastoExistente.proveedorId;
      let proveedorPersonalizado: string | null = gastoExistente.proveedorPersonalizado;

      if (proveedor_personalizado !== undefined) {
        proveedorPersonalizado = proveedor_personalizado;
        proveedorId = null;
      } else if (proveedor !== undefined) {
        proveedorPersonalizado = null;
        const proveedorEncontrado = await req.prisma.proveedor.findUnique({
          where: { nombre: proveedor },
        });
        if (proveedorEncontrado) {
          proveedorId = proveedorEncontrado.id;
        }
      }

      const gasto = await req.prisma.gasto.update({
        where: { id },
        data: {
          descripcion: descripcion !== undefined ? descripcion : gastoExistente.descripcion,
          monto: monto !== undefined ? parseFloat(monto) : gastoExistente.monto,
          categoriaId: categoriaId !== undefined ? categoriaId : gastoExistente.categoriaId,
          fecha: fecha !== undefined ? parseFechaLocal(fecha) : gastoExistente.fecha,
          proveedorId,
          proveedorPersonalizado,
          recibo: recibo !== undefined ? recibo : gastoExistente.recibo,
          observaciones: observaciones !== undefined ? observaciones : gastoExistente.observaciones,
          salio_de_caja: salio_de_caja !== undefined ? Boolean(salio_de_caja) : gastoExistente.salio_de_caja,
        },
        include: {
          categoria: true,
          usuario: { select: { id: true, nombre: true } },
          proveedor: { select: { id: true, nombre: true } },
        },
      });

      // Formatear respuesta para que categoría y proveedor sean strings
      const gastoFormateado = {
        ...gasto,
        categoria: gasto.categoria?.nombre || '',
        proveedor: gasto.proveedor?.nombre || gasto.proveedorPersonalizado || '',
      };

      res.json({
        success: true,
        message: 'Gasto actualizado exitosamente',
        data: gastoFormateado,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/gastos/:id
   * Eliminar un gasto (soft delete)
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await req.prisma.gasto.update({
        where: { id },
        data: { activo: false },
      });

      res.json({
        success: true,
        message: 'Gasto eliminado',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
