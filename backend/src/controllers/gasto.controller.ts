import { Request, Response } from 'express';

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
        if (fechaInicio) where.fecha.gte = new Date(fechaInicio as string);
        if (fechaFin) where.fecha.lte = new Date(fechaFin as string);
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
          },
          orderBy: { fecha: 'desc' },
        }),
        req.prisma.gasto.count({ where }),
      ]);

      res.json({
        success: true,
        message: 'Gastos obtenidos',
        data: gastos,
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
      const { descripcion, monto, categoriaId, recibo, observaciones } = req.body;

      if (!descripcion || !monto || !categoriaId) {
        return res.status(400).json({
          success: false,
          message: 'Descripción, monto y categoriaId son requeridos',
        });
      }

      const gasto = await req.prisma.gasto.create({
        data: {
          descripcion,
          monto: parseFloat(monto),
          categoriaId,
          usuarioId: req.userId!,
          recibo,
          observaciones,
          fecha: new Date(),
        },
        include: {
          categoria: true,
          usuario: { select: { id: true, nombre: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Gasto creado exitosamente',
        data: gasto,
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
